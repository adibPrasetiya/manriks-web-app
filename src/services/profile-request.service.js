import { prismaClient } from "../apps/database.js";
import { validate } from "../utils/validator.utils.js";
import {
  createChangeRequestSchema,
  rejectRequestSchema,
  searchRequestsSchema,
  requestIdSchema,
} from "../validations/profile-request.validation.js";
import { userIdSchema } from "../validations/user.validation.js";
import { ResponseError } from "../errors/response.error.js";

/**
 * Create a new profile change request (for users)
 */
const create = async (userId, reqBody) => {
  userId = validate(userIdSchema, { userId: userId });
  reqBody = validate(createChangeRequestSchema, reqBody);

  // Get user's profile
  const profile = await prismaClient.profile.findUnique({
    where: { userId: userId.userId },
  });

  if (!profile) {
    throw new ResponseError(
      404,
      "Profile tidak ditemukan. Silakan buat profile terlebih dahulu.",
    );
  }

  // Check if there's already a pending request
  const existingPendingRequest =
    await prismaClient.profileChangeRequest.findFirst({
      where: {
        profileId: profile.id,
        status: "PENDING",
      },
    });

  if (existingPendingRequest) {
    throw new ResponseError(
      409,
      "Anda sudah memiliki permintaan perubahan yang sedang menunggu persetujuan. Batalkan permintaan tersebut atau tunggu sampai diproses.",
    );
  }

  // Validate unitKerjaId if provided
  if (reqBody.unitKerjaId) {
    const unitKerja = await prismaClient.unitKerja.findUnique({
      where: { id: reqBody.unitKerjaId },
    });

    if (!unitKerja) {
      throw new ResponseError(
        404,
        `Unit Kerja dengan ID ${reqBody.unitKerjaId} tidak ditemukan.`,
      );
    }
  }

  // Determine request type
  const requestType = profile.isVerified ? "CHANGE" : "INITIAL_VERIFICATION";

  // Create the change request
  const result = await prismaClient.$transaction(async (tx) => {
    // 1. Update profile → set unverfied
    const updatedProfile = await tx.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        isVerified: false,
        verifiedAt: null,
        verifiedBy: null,
      },
    });

    // 2. Create profile change request
    const changeRequest = await tx.profileChangeRequest.create({
      data: {
        profileId: profile.id,
        requestType: requestType,
        jabatan: reqBody.jabatan || null,
        unitKerjaId: reqBody.unitKerjaId || null,
        nomorHP: reqBody.nomorHP !== undefined ? reqBody.nomorHP : null,
        status: "PENDING",
      },
      include: {
        profile: {
          select: {
            userId: true,
            jabatan: true,
            unitKerja: true,
            nomorHP: true,
            isVerified: true,
          },
        },
        unitKerja: true,
      },
    });

    return {
      updatedProfile,
      changeRequest,
    };
  });

  return {
    message:
      requestType === "INITIAL_VERIFICATION"
        ? "Permintaan verifikasi profile berhasil dibuat. Silakan tunggu persetujuan administrator."
        : "Permintaan perubahan profile berhasil dibuat. Silakan tunggu persetujuan administrator.",
    data: result.changeRequest,
  };
};

/**
 * Get user's own change requests
 */
const getMyRequests = async (userId, queryParams) => {
  userId = validate(userIdSchema, { userId: userId });
  const params = validate(searchRequestsSchema, queryParams);
  const { status, requestType, page, limit } = params;

  // Get user's profile
  const profile = await prismaClient.profile.findUnique({
    where: { userId: userId.userId },
  });

  if (!profile) {
    throw new ResponseError(404, "Profile tidak ditemukan.");
  }

  const where = { profileId: profile.id };

  if (status) {
    where.status = status;
  }

  if (requestType) {
    where.requestType = requestType;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.profileChangeRequest.count({ where });

  const requests = await prismaClient.profileChangeRequest.findMany({
    where,
    skip,
    take: limit,
    orderBy: { requestedAt: "desc" },
    include: {
      unitKerja: true,
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Permintaan perubahan berhasil ditemukan",
    data: requests,
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

/**
 * Get user's specific request by ID
 */
const getMyRequestById = async (userId, requestId) => {
  userId = validate(userIdSchema, { userId: userId });
  const { requestId: id } = validate(requestIdSchema, { requestId });

  // Get user's profile
  const profile = await prismaClient.profile.findUnique({
    where: { userId: userId.userId },
  });

  if (!profile) {
    throw new ResponseError(404, "Profile tidak ditemukan.");
  }

  const request = await prismaClient.profileChangeRequest.findUnique({
    where: { id },
    include: {
      profile: {
        select: {
          userId: true,
          jabatan: true,
          unitKerja: true,
          nomorHP: true,
          isVerified: true,
        },
      },
      unitKerja: true,
    },
  });

  if (!request) {
    throw new ResponseError(404, "Permintaan tidak ditemukan.");
  }

  // Verify the request belongs to the user
  if (request.profileId !== profile.id) {
    throw new ResponseError(
      403,
      "Anda tidak memiliki akses ke permintaan ini.",
    );
  }

  return {
    message: "Permintaan ditemukan",
    data: request,
  };
};

/**
 * Search all change requests (admin only)
 */
const search = async (queryParams) => {
  const params = validate(searchRequestsSchema, queryParams);
  const { status, requestType, unitKerjaId, page, limit } = params;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (requestType) {
    where.requestType = requestType;
  }

  if (unitKerjaId) {
    where.OR = [
      { unitKerjaId: unitKerjaId },
      { profile: { unitKerjaId: unitKerjaId } },
    ];
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.profileChangeRequest.count({ where });

  const requests = await prismaClient.profileChangeRequest.findMany({
    where,
    skip,
    take: limit,
    orderBy: { requestedAt: "desc" },
    include: {
      profile: {
        select: {
          userId: true,
          jabatan: true,
          nomorHP: true,
          isVerified: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          unitKerja: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      unitKerja: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Permintaan perubahan berhasil ditemukan",
    data: requests,
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

/**
 * Get request by ID (admin only)
 */
const getById = async (requestId) => {
  const { requestId: id } = validate(requestIdSchema, { requestId });

  const request = await prismaClient.profileChangeRequest.findUnique({
    where: { id },
    include: {
      profile: {
        select: {
          id: true,
          userId: true,
          jabatan: true,
          nomorHP: true,
          isVerified: true,
          verifiedAt: true,
          verifiedBy: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          unitKerja: {
            select: {
              id: true,
              name: true,
              code: true,
              email: true,
            },
          },
        },
      },
      unitKerja: {
        select: {
          id: true,
          name: true,
          code: true,
          email: true,
        },
      },
    },
  });

  if (!request) {
    throw new ResponseError(404, "Permintaan tidak ditemukan.");
  }

  return {
    message: "Permintaan ditemukan",
    data: request,
  };
};

/**
 * Approve a change request (admin only)
 */
const approve = async (requestId, adminUserId) => {
  const { requestId: id } = validate(requestIdSchema, { requestId });
  adminUserId = validate(userIdSchema, { userId: adminUserId });

  const request = await prismaClient.profileChangeRequest.findUnique({
    where: { id },
    include: {
      profile: true,
    },
  });

  if (!request) {
    throw new ResponseError(404, "Permintaan tidak ditemukan.");
  }

  if (request.status !== "PENDING") {
    throw new ResponseError(
      400,
      `Permintaan ini sudah diproses dengan status ${request.status}.`,
    );
  }

  // Prepare profile update data
  const profileUpdateData = {};

  if (request.jabatan) {
    profileUpdateData.jabatan = request.jabatan;
  }

  if (request.unitKerjaId) {
    profileUpdateData.unitKerjaId = request.unitKerjaId;
  }

  if (request.nomorHP !== null) {
    profileUpdateData.nomorHP = request.nomorHP || null;
  }

  // For initial verification, set isVerified to true
  if (request.requestType === "INITIAL_VERIFICATION") {
    profileUpdateData.isVerified = true;
    profileUpdateData.verifiedAt = new Date();
    profileUpdateData.verifiedBy = adminUserId.userId;
  }

  // Use transaction to update both profile and request
  const [updatedProfile, updatedRequest] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: { id: request.profileId },
      data: profileUpdateData,
      include: {
        unitKerja: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    }),
    prismaClient.profileChangeRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        processedAt: new Date(),
        processedBy: adminUserId.userId,
      },
    }),
  ]);

  return {
    message:
      request.requestType === "INITIAL_VERIFICATION"
        ? "Profile berhasil diverifikasi."
        : "Permintaan perubahan profile berhasil disetujui.",
    data: {
      request: updatedRequest,
      profile: updatedProfile,
    },
  };
};

/**
 * Reject a change request (admin only)
 */
const reject = async (requestId, adminUserId, reqBody) => {
  const { requestId: id } = validate(requestIdSchema, { requestId });
  adminUserId = validate(userIdSchema, { userId: adminUserId });
  reqBody = validate(rejectRequestSchema, reqBody);

  const request = await prismaClient.profileChangeRequest.findUnique({
    where: { id },
    include: {
      profile: true,
    },
  });

  if (!request) {
    throw new ResponseError(404, "Permintaan tidak ditemukan.");
  }

  if (request.status !== "PENDING") {
    throw new ResponseError(
      400,
      `Permintaan ini sudah diproses dengan status ${request.status}.`,
    );
  }

  // Handle berdasarkan request type
  if (request.requestType === "INITIAL_VERIFICATION") {
    // Untuk profile baru yang ditolak: hapus profile dan semua change requests
    await prismaClient.$transaction([
      prismaClient.profileChangeRequest.deleteMany({
        where: { profileId: request.profileId },
      }),
      prismaClient.profile.delete({
        where: { id: request.profileId },
      }),
    ]);

    return {
      message: "Profile ditolak dan dihapus. User dapat membuat profile baru.",
      data: {
        requestId: id,
        rejectionReason: reqBody.rejectionReason,
      },
    };
  } else {
    // Untuk CHANGE request: kembalikan profile ke status terverifikasi

    // Cari data verifikasi awal dari APPROVED INITIAL_VERIFICATION request
    const initialVerification =
      await prismaClient.profileChangeRequest.findFirst({
        where: {
          profileId: request.profileId,
          requestType: "INITIAL_VERIFICATION",
          status: "APPROVED",
        },
        orderBy: { processedAt: "desc" },
      });

    // Update profile dan request dalam transaction
    const [updatedProfile, updatedRequest] = await prismaClient.$transaction([
      prismaClient.profile.update({
        where: { id: request.profileId },
        data: {
          isVerified: true,
          verifiedAt: initialVerification?.processedAt || new Date(),
          verifiedBy: initialVerification?.processedBy || adminUserId.userId,
        },
      }),
      prismaClient.profileChangeRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reqBody.rejectionReason,
          processedAt: new Date(),
          processedBy: adminUserId.userId,
        },
        include: {
          profile: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      message:
        "Permintaan perubahan profile ditolak. Profile dikembalikan ke status terverifikasi.",
      data: updatedRequest,
    };
  }
};

/**
 * Get unverified profiles (admin only)
 */
const getUnverifiedProfiles = async (queryParams) => {
  const params = validate(searchRequestsSchema, queryParams);
  const { unitKerjaId, page, limit } = params;

  const where = { isVerified: false };

  if (unitKerjaId) {
    where.unitKerjaId = unitKerjaId;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.profile.count({ where });

  const profiles = await prismaClient.profile.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          isActive: true,
        },
      },
      unitKerja: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      changeRequests: {
        where: { status: "PENDING" },
        orderBy: { requestedAt: "desc" },
        take: 1,
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Profile yang belum diverifikasi berhasil ditemukan",
    data: profiles,
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

export default {
  create,
  getMyRequests,
  getMyRequestById,
  search,
  getById,
  approve,
  reject,
  getUnverifiedProfiles,
};
