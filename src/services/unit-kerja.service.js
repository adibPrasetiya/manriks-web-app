import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import {
  createUnitKerjaSchema,
  updateUnitKerjaSchema,
  searchUnitKerjaSchema,
  unitKerjaIdSchema,
} from "../validations/unit-kerja.validation.js";
import { createServiceLogger, ACTION_TYPES } from "../utils/logger.utils.js";

const serviceLogger = createServiceLogger("UnitKerjaService");

const create = async (reqBody) => {
  reqBody = validate(createUnitKerjaSchema, reqBody);

  // Check if code already exists
  const existingCode = await prismaClient.unitKerja.findUnique({
    where: {
      code: reqBody.code,
    },
  });

  if (existingCode) {
    throw new ResponseError(
      409,
      `Kode unit kerja ${reqBody.code} sudah digunakan.`,
    );
  }

  // Create unit kerja
  const unitKerja = await prismaClient.unitKerja.create({
    data: {
      name: reqBody.name,
      code: reqBody.code,
      email: reqBody.email,
    },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  serviceLogger.security(ACTION_TYPES.UNIT_KERJA_CREATED, {
    unitKerjaId: unitKerja.id,
    code: unitKerja.code,
    name: unitKerja.name,
    email: unitKerja.email,
  });

  return {
    message: "Unit kerja berhasil dibuat",
    data: unitKerja,
  };
};

const search = async (queryParams) => {
  const params = validate(searchUnitKerjaSchema, queryParams);
  const { name, code, page, limit } = params;

  const where = {};

  if (name) {
    where.name = {
      contains: name,
    };
  }

  if (code) {
    where.code = {
      contains: code,
    };
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.unitKerja.count({ where });

  const unitKerjas = await prismaClient.unitKerja.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          profiles: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Unit kerja berhasil ditemukan",
    data: unitKerjas,
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

const getById = async (id) => {
  const params = validate(unitKerjaIdSchema, { id });

  const unitKerja = await prismaClient.unitKerja.findUnique({
    where: {
      id: params.id,
    },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          profiles: true,
        },
      },
    },
  });

  if (!unitKerja) {
    throw new ResponseError(404, "Unit kerja tidak ditemukan.");
  }

  return {
    message: "Unit kerja berhasil ditemukan",
    data: unitKerja,
  };
};

const update = async (id, reqBody) => {
  const idParams = validate(unitKerjaIdSchema, { id });
  reqBody = validate(updateUnitKerjaSchema, reqBody);

  // Check if unit kerja exists
  const existingUnitKerja = await prismaClient.unitKerja.findUnique({
    where: {
      id: idParams.id,
    },
  });

  if (!existingUnitKerja) {
    throw new ResponseError(404, "Unit kerja tidak ditemukan.");
  }

  // If code is being updated, check if new code already exists
  if (reqBody.code && reqBody.code !== existingUnitKerja.code) {
    const codeExists = await prismaClient.unitKerja.findUnique({
      where: {
        code: reqBody.code,
      },
    });

    if (codeExists) {
      throw new ResponseError(
        409,
        `Kode unit kerja ${reqBody.code} sudah digunakan oleh unit kerja lain.`,
      );
    }
  }

  // Update unit kerja
  const updatedUnitKerja = await prismaClient.unitKerja.update({
    where: {
      id: idParams.id,
    },
    data: reqBody,
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  serviceLogger.security(ACTION_TYPES.UNIT_KERJA_UPDATED, {
    unitKerjaId: idParams.id,
    updatedData: updatedUnitKerja,
  });

  return {
    message: "Unit kerja berhasil diperbarui",
    data: updatedUnitKerja,
  };
};

const remove = async (id) => {
  const params = validate(unitKerjaIdSchema, { id });

  // Check if unit kerja exists
  const existingUnitKerja = await prismaClient.unitKerja.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!existingUnitKerja) {
    throw new ResponseError(404, "Unit kerja tidak ditemukan.");
  }

  // Check if unit kerja has associated profiles (Restrict constraint)
  const profileCount = await prismaClient.profile.count({
    where: {
      unitKerjaId: params.id,
    },
  });

  if (profileCount > 0) {
    throw new ResponseError(
      409,
      `Unit kerja tidak dapat dihapus karena masih memiliki ${profileCount} profil yang terkait. Silakan hapus atau pindahkan profil terlebih dahulu.`,
    );
  }

  // Delete unit kerja (hard delete)
  await prismaClient.unitKerja.delete({
    where: {
      id: params.id,
    },
  });

  serviceLogger.security(ACTION_TYPES.UNIT_KERJA_DELETED, {
    unitKerjaId: params.id,
  });

  return {
    message: "Unit kerja berhasil dihapus",
  };
};

export default {
  create,
  search,
  getById,
  update,
  remove,
};
