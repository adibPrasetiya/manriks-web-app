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
  userId = validate(userIdSchema, userId);

  const existingProfile = await prismaClient.profile.findUnique({
    where: {
      userId: userId,
    },
  });

  if (existingProfile) {
    throw new ResponseError(
      409,
      "Gagal membuat profile baru. Profile anda sudah dibuat."
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
      `Unit Kerja dengan ID ${reqBody.unitKerjaId} tidak ditemukan`
    );
  }

  const profile = await prismaClient.profile.create({
    data: {
      userId: userId,
      jabatan: reqBody.jabatan,
      unitKerjaId: reqBody.unitKerjaId,
      nomorHp:
        reqBody.nomorHp && reqBody.nomorHp.trim() !== ""
          ? reqBody.nomorHp
          : undefined,
    },
    select: {
      userId: true,
      jabatan: true,
      unitKerja: true,
      nomorHP: true,
    },
  });

  return {
    message: "Profile berhasil dibuat",
    data: profile,
  };
};

const update = async (reqBody, userId) => {
  reqBody = validate(updateProfileSchema, reqBody);
  userId = validate(userIdSchema, userId);

  const existingProfile = await prismaClient.profile.findUnique({
    where: {
      userId: userId,
    },
  });

  if (!existingProfile) {
    throw new ResponseError(
      404,
      `Profile dengan User ID ${userId} tidak ditemukan`
    );
  }

  const updateProfile = await prismaClient.profile.update({
    where: {
      userId: userId,
    },
    data: reqBody,
    select: {
      jabatan: true,
      unitKerja: true,
      nomorHP: true,
    },
  });

  return {
    message: "Profile berhasil di perbarui",
    data: updateProfile,
  };
};

export default { create, update };
