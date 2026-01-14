import { validate } from "../utils/validator.utils.js";
import {
  bulkDeleteExpiredSchema,
  searchSessionSchema,
  sessionIdSchema,
  userIdForSessionSchema,
} from "../validations/session.validation.js";
import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";

const search = async (queryParams) => {
  const params = validate(searchSessionSchema, queryParams);

  const {
    username,
    email,
    isActive,
    createdFrom,
    createdTo,
    expiresFrom,
    expiresTo,
    page,
    limit,
  } = params;

  const where = {};

  if (username || email) {
    where.user = {};
    if (username) {
      where.user.username = { contains: username };
    }
    if (email) {
      where.user.email = { contains: email };
    }
  }

  if (isActive !== undefined) {
    const now = new Date();
    where.expiresAt = isActive ? { gt: now } : { lte: now };
  }

  if (createdFrom || createdTo) {
    where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) where.createdAt.lte = new Date(createdTo);
  }

  if (expiresFrom || expiresTo) {
    where.expiresAt = {
      ...(where.expiresAt || {}),
      ...(expiresFrom && { gte: new Date(expiresFrom) }),
      ...(expiresTo && { lte: new Date(expiresTo) }),
    };
  }

  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prismaClient.session.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        // NEVER include refreshToken (security)
        deviceId: true,
        deviceName: true,
        userAgent: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prismaClient.session.count({ where }),
  ]);

  // Add isActive field ke setiap session
  const now = new Date();
  const formattedSessions = sessions.map((session) => ({
    ...session,
    isActive: session.expiresAt > now,
  }));

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);

  return {
    message: "Session berhasil ditemukan",
    data: formattedSessions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const getById = async (sessionId) => {
  validate(sessionIdSchema, { id: sessionId });

  const session = await prismaClient.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      // NEVER include refreshToken
      deviceId: true,
      deviceName: true,
      userAgent: true,
      ipAddress: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    throw new ResponseError(404, "Session tidak ditemukan");
  }

  // Add isActive field
  const now = new Date();
  const formattedSession = {
    ...session,
    isActive: session.expiresAt > now,
  };

  return {
    message: "Session berhasil ditemukan",
    data: formattedSession,
  };
};

const getByUserId = async (userId) => {
  validate(userIdForSessionSchema, { userId });

  // Check apakah user exists
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new ResponseError(404, "User tidak ditemukan");
  }

  // Find sessions for the user (currently max 1 due to unique constraint)
  const sessions = await prismaClient.session.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      // NEVER include refreshToken
      deviceId: true,
      deviceName: true,
      userAgent: true,
      ipAddress: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  // Add isActive field ke setiap session
  const now = new Date();
  const formattedSessions = sessions.map((session) => ({
    ...session,
    isActive: session.expiresAt > now,
  }));

  return {
    message: `Session untuk user ${user.username} berhasil ditemukan`,
    data: formattedSessions,
  };
};

/**
 * Remove session by ID
 * EDGE CASE: Prevent admin from deleting their own session
 */
const removeById = async (sessionId, adminUserId) => {
  validate(sessionIdSchema, { id: sessionId });

  // Find session
  const session = await prismaClient.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!session) {
    throw new ResponseError(404, "Session tidak ditemukan");
  }

  // CRITICAL EDGE CASE: Check if admin is deleting their own session
  if (session.userId === adminUserId) {
    throw new ResponseError(
      400,
      "Anda tidak dapat menghapus session Anda sendiri. Gunakan endpoint logout untuk mengakhiri session Anda."
    );
  }

  // Delete session
  await prismaClient.session.delete({
    where: { id: sessionId },
  });

  return {
    message: `Session untuk user ${session.user.username} berhasil dihapus`,
  };
};

/**
 * Remove all sessions by user ID
 * EDGE CASE: Prevent admin from deleting their own sessions
 */
const removeByUserId = async (userId, adminUserId) => {
  validate(userIdForSessionSchema, { userId });

  // Check apakah user exists
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new ResponseError(404, "User tidak ditemukan");
  }

  // CRITICAL EDGE CASE: Check if admin is deleting their own sessions
  if (userId === adminUserId) {
    throw new ResponseError(
      400,
      "Anda tidak dapat menghapus session Anda sendiri. Gunakan endpoint logout untuk mengakhiri session Anda."
    );
  }

  // Delete all sessions for the user (currently max 1 due to unique constraint)
  const result = await prismaClient.session.deleteMany({
    where: { userId },
  });

  return {
    message: `Semua session untuk user ${user.username} berhasil dihapus`,
    data: {
      deletedCount: result.count,
    },
  };
};

/**
 * Bulk remove expired sessions
 * Requires confirmation untuk prevent accidental deletion
 */
const bulkRemoveExpired = async (reqBody) => {
  reqBody = validate(bulkDeleteExpiredSchema, reqBody);

  const now = new Date();

  // Delete all expired sessions
  const result = await prismaClient.session.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });

  const count = result.count;

  return {
    message: `${count} session kadaluarsa berhasil dihapus`,
    data: {
      deletedCount: count,
    },
  };
};

export default {
  search,
  getById,
  getByUserId,
  removeById,
  removeByUserId,
  bulkRemoveExpired,
};
