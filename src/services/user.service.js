import bcrypt from "bcryptjs";
import { prismaClient } from "../apps/database.js";
import { validate } from "../utils/validator.utils.js";
import {
  loginSchema,
  refreshTokenSchema,
  registedNewUserSchema,
  searchUserSchema,
  updatePasswordSchema,
} from "../validations/user.validation.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from "../utils/token.utils.js";
import { generateDeviceId, parseDeviceName } from "../utils/device.utils.js";

const registration = async (reqBody) => {
  reqBody = validate(registedNewUserSchema, reqBody);

  const existingUsername = await prismaClient.user.findUnique({
    where: {
      username: reqBody.username,
    },
  });

  if (existingUsername) {
    throw new ResponseError(
      409,
      `Username ${reqBody.username} sudah digunakan.`
    );
  }

  const existingEmail = await prismaClient.user.findUnique({
    where: {
      email: reqBody.email,
    },
  });

  if (existingEmail) {
    throw new ResponseError(409, `Email ${reqBody.email} sudah digunakan.`);
  }

  const hashedPassword = await bcrypt.hash(reqBody.password, 10);

  const userRole = await prismaClient.role.findUnique({
    where: {
      name: "USER",
    },
  });

  if (!userRole) {
    throw new ResponseError(
      500,
      "Role default USER tidak ditemukan. Silakan seed database terlebih dahulu."
    );
  }

  const user = await prismaClient.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: reqBody.username,
        name: reqBody.name,
        email: reqBody.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.userRole.create({
      data: {
        userId: newUser.id,
        roleId: userRole.id,
      },
    });

    return newUser;
  });

  return {
    message: "Registrasi user berhasil",
    data: user,
  };
};

const login = async (reqBody, userAgent, ipAddress) => {
  reqBody = validate(loginSchema, reqBody);

  const { identifier, password } = reqBody;

  const user = await prismaClient.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
      profile: true,
    },
  });

  if (!user) {
    throw new ResponseError(401, "Username/email atau password salah.");
  }

  if (!user.isActive) {
    throw new ResponseError(
      403,
      "Akun Anda tidak aktif. Silakan hubungi administrator."
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ResponseError(401, "Username/email atau password salah.");
  }

  const roles = user.userRoles.map((ur) => ur.role.name);

  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    roles: roles,
  });

  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashRefreshToken(refreshToken);

  const deviceId = generateDeviceId(userAgent, ipAddress);
  const deviceName = parseDeviceName(userAgent);

  // Upsert session (1 session per user)
  // Jika user login dari device baru, session lama otomatis ter-replace
  await prismaClient.session.upsert({
    where: {
      userId: user.id,
    },
    update: {
      refreshToken: hashedRefreshToken,
      deviceId: deviceId,
      deviceName: deviceName,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: getRefreshTokenExpiry(),
    },
    create: {
      userId: user.id,
      refreshToken: hashedRefreshToken,
      deviceId: deviceId,
      deviceName: deviceName,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    message: "Login berhasil",
    data: {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        isVerified: user.isVerified,
        roles: roles,
        hasProfile: !!user.profile,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  };
};

const updatePassword = async (userId, reqBody) => {
  reqBody = validate(updatePasswordSchema, reqBody);

  const { currentPassword, newPassword } = reqBody;

  const user = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ResponseError(404, "User tidak ditemukan.");
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new ResponseError(401, "Password saat ini salah.");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new ResponseError(
      400,
      "Password baru tidak boleh sama dengan password lama."
    );
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prismaClient.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    });

    await tx.session.deleteMany({
      where: {
        userId: userId,
      },
    });
  });

  return {
    message:
      "Password berhasil diubah. Semua sesi telah diakhiri. Silakan login kembali.",
  };
};

const search = async (queryParams) => {
  const params = validate(searchUserSchema, queryParams);

  const { name, username, role, isActive, isVerified, page, limit } = params;

  const where = {};

  if (name) {
    where.name = {
      contains: name,
    };
  }

  if (username) {
    where.username = {
      contains: username,
    };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (isVerified !== undefined) {
    where.isVerified = isVerified;
  }

  if (role) {
    where.userRoles = {
      some: {
        role: {
          name: role,
        },
      },
    };
  }

  const skip = (page - 1) * limit;

  // Get total count
  const totalItems = await prismaClient.user.count({
    where,
  });

  const users = await prismaClient.user.findMany({
    where,
    skip,
    take: limit,
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedUsers = users.map((user) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    isVerified: user.isVerified,
    roles: user.userRoles.map((ur) => ur.role.name),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "User berhasil ditemukan",
    data: formattedUsers,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const refreshToken = async (reqBody) => {
  reqBody = validate(refreshTokenSchema, reqBody);

  const { refreshToken: token } = reqBody;

  const hashedToken = hashRefreshToken(token);

  const session = await prismaClient.session.findUnique({
    where: {
      refreshToken: hashedToken,
    },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          profile: true,
        },
      },
    },
  });

  if (!session) {
    throw new ResponseError(401, "Refresh token tidak valid.");
  }

  if (new Date() > session.expiresAt) {
    await prismaClient.session.delete({
      where: {
        id: session.id,
      },
    });
    throw new ResponseError(
      401,
      "Refresh token sudah kadaluarsa. Silakan login kembali."
    );
  }

  if (!session.user.isActive) {
    throw new ResponseError(
      403,
      "Akun Anda tidak aktif. Silakan hubungi administrator."
    );
  }

  const roles = session.user.userRoles.map((ur) => ur.role.name);

  const newAccessToken = generateAccessToken({
    userId: session.user.id,
    username: session.user.username,
    email: session.user.email,
    roles: roles,
  });

  return {
    message: "Access token berhasil diperbarui",
    data: {
      user: {
        id: session.user.id,
        username: session.user.username,
        name: session.user.name,
        email: session.user.email,
        isActive: session.user.isActive,
        isVerified: session.user.isVerified,
        roles: roles,
        hasProfile: !!session.user.profile,
      },
      accessToken: newAccessToken,
    },
  };
};

const logout = async (userId) => {
  const existingSession = await prismaClient.session.findUnique({
    where: {
      userId: userId,
    },
  });

  if (!existingSession) {
    throw new ResponseError(
      404,
      "Session tidak ditemukan. Anda mungkin sudah logout sebelumnya."
    );
  }

  await prismaClient.session.delete({
    where: {
      userId: userId,
    },
  });

  return {
    message: "Logout berhasil",
  };
};

export default {
  registration,
  login,
  search,
  updatePassword,
  refreshToken,
  logout,
};
