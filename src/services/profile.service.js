import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import {
  createNewProfileSchema,
  updateProfileSchema,
} from "../validations/profile.validation.js";
import { userIdSchema } from "../validations/user.validation.js";

const create = async (reqBody, userId) => {
  reqBody = validate(createNewProfileSchema, reqBody);
  userId = validate(userIdSchema, { userId: userId });

  const existingProfile = await prismaClient.profile.findUnique({
    where: {
      userId: userId.userId,
    },
  });

  if (existingProfile) {
    throw new ResponseError(
      409,
      "Gagal membuat profile baru. Profile anda sudah dibuat.",
    );
  }

  const existingUnitKerja = await prismaClient.unitKerja.findUnique({
    where: {
      id: reqBody.unitKerjaId,
    },
  });

  if (!existingUnitKerja) {
    throw new ResponseError(
      404,
      `Unit Kerja dengan ID ${reqBody.unitKerjaId} tidak ditemukan`,
    );
  }

  // Use transaction to create profile and initial verification request
  const [profile, changeRequest] = await prismaClient.$transaction(
    async (tx) => {
      // Create profile with isVerified: false
      const newProfile = await tx.profile.create({
        data: {
          userId: userId.userId,
          jabatan: reqBody.jabatan,
          unitKerjaId: reqBody.unitKerjaId,
          nomorHP:
            reqBody.nomorHP && reqBody.nomorHP.trim() !== ""
              ? reqBody.nomorHP
              : undefined,
          isVerified: false,
        },
        select: {
          id: true,
          userId: true,
          jabatan: true,
          unitKerja: true,
          nomorHP: true,
          isVerified: true,
        },
      });

      // Create initial verification request
      const verificationRequest = await tx.profileChangeRequest.create({
        data: {
          profileId: newProfile.id,
          requestType: "INITIAL_VERIFICATION",
          jabatan: reqBody.jabatan,
          unitKerjaId: reqBody.unitKerjaId,
          nomorHP:
            reqBody.nomorHP && reqBody.nomorHP.trim() !== ""
              ? reqBody.nomorHP
              : null,
          status: "PENDING",
        },
      });

      return [newProfile, verificationRequest];
    },
  );

  return {
    message:
      "Profile berhasil dibuat. Silakan tunggu verifikasi dari administrator.",
    data: {
      profile,
      verificationRequest: {
        id: changeRequest.id,
        status: changeRequest.status,
        requestType: changeRequest.requestType,
      },
    },
  };
};

const update = async (reqBody, userId) => {
  reqBody = validate(updateProfileSchema, reqBody);
  userId = validate(userIdSchema, { userId: userId });

  // Check if user is trying to update restricted fields
  if (reqBody.jabatan || reqBody.unitKerjaId) {
    throw new ResponseError(
      400,
      "Untuk mengubah jabatan atau unit kerja, silakan buat permintaan perubahan melalui endpoint POST /users/me/profile-requests",
    );
  }

  const existingProfile = await prismaClient.profile.findUnique({
    where: {
      userId: userId.userId,
    },
  });

  if (!existingProfile) {
    throw new ResponseError(
      404,
      `Profile dengan User ID ${userId.userId} tidak ditemukan`,
    );
  }

  // Only allow nomorHP update
  const updateData = {};
  if (reqBody.nomorHP !== undefined) {
    updateData.nomorHP =
      reqBody.nomorHP && reqBody.nomorHP.trim() !== "" ? reqBody.nomorHP : null;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ResponseError(400, "Tidak ada data yang perlu diperbarui.");
  }

  const updateProfile = await prismaClient.profile.update({
    where: {
      userId: userId.userId,
    },
    data: updateData,
    select: {
      jabatan: true,
      unitKerja: true,
      nomorHP: true,
      isVerified: true,
    },
  });

  return {
    message: "Profile berhasil diperbarui",
    data: updateProfile,
  };
};

const get = async (user) => {
  let userId = user.userId;
  userId = validate(userIdSchema, { userId: userId });
  const existingProfile = await prismaClient.profile.findUnique({
    where: {
      userId: userId.userId,
    },
    select: {
      nomorHP: true,
      jabatan: true,
      isVerified: true,
      unitKerja: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!existingProfile) {
    throw new ResponseError(404, "Profile tidak ditemukan");
  }

  const profile = {
    username: user.username,
    name: user.name,
    email: user.email,
    roles: user.roles,
    jabatan: existingProfile.jabatan,
    unitKerja: {
      name: existingProfile.unitKerja.name,
      email: existingProfile.unitKerja.email,
    },
    nomorHP: existingProfile.nomorHP,
    isVerified: true,
  };

  return {
    message: "Profile ditemukan",
    data: profile,
  };
};

export default { create, update, get };
