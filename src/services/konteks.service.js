import { prismaClient } from "../apps/database.js";
import { validate } from "../utils/validator.utils.js";
import {
  createKonteksSchema,
  updateKonteksSchema,
  konteksIdSchema,
  searchKonteksSchema,
} from "../validations/konteks.validation.js";
import { ResponseError } from "../errors/response.error.js";
import { KONTEKS_STATUSES } from "../config/constant.js";

const create = async (reqBody, userId) => {
  reqBody = validate(createKonteksSchema, reqBody);

  // Check code uniqueness
  const existingCode = await prismaClient.konteks.findUnique({
    where: { code: reqBody.code },
  });

  if (existingCode) {
    throw new ResponseError(
      409,
      `Kode konteks ${reqBody.code} sudah digunakan.`
    );
  }

  // Create konteks only - no nested entities
  const konteks = await prismaClient.konteks.create({
    data: {
      name: reqBody.name,
      code: reqBody.code,
      description: reqBody.description || null,
      periodStart: reqBody.periodStart,
      periodEnd: reqBody.periodEnd,
      matrixSize: reqBody.matrixSize,
      riskAppetiteLevel: reqBody.riskAppetiteLevel || null,
      riskAppetiteDescription: reqBody.riskAppetiteDescription || null,
      status: KONTEKS_STATUSES.INACTIVE,
      createdBy: userId,
      updatedBy: userId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      matrixSize: true,
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
    },
  });

  return {
    message: "Konteks berhasil dibuat",
    data: konteks,
  };
};

const search = async (queryParams) => {
  const params = validate(searchKonteksSchema, queryParams);
  const { name, code, periodStart, periodEnd, status, page, limit } = params;

  const where = {};

  if (name) {
    where.name = { contains: name };
  }

  if (code) {
    where.code = { contains: code };
  }

  if (periodStart !== undefined) {
    where.periodStart = { gte: periodStart };
  }

  if (periodEnd !== undefined) {
    where.periodEnd = { lte: periodEnd };
  }

  if (status !== undefined) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.konteks.count({ where });

  const konteksList = await prismaClient.konteks.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      matrixSize: true,
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
      _count: {
        select: {
          riskCategories: true,
          riskMatrices: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Konteks berhasil ditemukan",
    data: konteksList,
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

const getById = async (konteksId) => {
  const { konteksId: id } = validate(konteksIdSchema, { konteksId });

  const konteks = await prismaClient.konteks.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      matrixSize: true,
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
      _count: {
        select: {
          riskCategories: true,
          riskMatrices: true,
        },
      },
    },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  return {
    message: "Konteks berhasil ditemukan",
    data: konteks,
  };
};

const update = async (konteksId, reqBody, userId) => {
  const { konteksId: id } = validate(konteksIdSchema, { konteksId });
  reqBody = validate(updateKonteksSchema, reqBody);

  const existingKonteks = await prismaClient.konteks.findUnique({
    where: { id },
  });

  if (!existingKonteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  // Check if konteks is active - prevent editing active konteks
  if (existingKonteks.status === KONTEKS_STATUSES.ACTIVE) {
    throw new ResponseError(
      403,
      "Tidak dapat mengubah konteks yang sedang aktif. Nonaktifkan konteks terlebih dahulu."
    );
  }

  // Check if konteks is archived - prevent editing archived konteks
  if (existingKonteks.status === KONTEKS_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat mengubah konteks yang sudah diarsipkan."
    );
  }

  // Check if matrixSize is being updated and validate
  if (reqBody.matrixSize && reqBody.matrixSize !== existingKonteks.matrixSize) {
    // Check if there are any scales created
    const scalesCount = await prismaClient.likelihoodScale.count({
      where: {
        riskCategory: {
          konteksId: id,
        },
      },
    });

    const impactScalesCount = await prismaClient.impactScale.count({
      where: {
        riskCategory: {
          konteksId: id,
        },
      },
    });

    if (scalesCount > 0 || impactScalesCount > 0) {
      throw new ResponseError(
        400,
        "Ukuran matriks tidak dapat diubah karena sudah ada likelihood scale atau impact scale yang dibuat."
      );
    }
  }

  const updatedKonteks = await prismaClient.konteks.update({
    where: { id },
    data: {
      ...reqBody,
      updatedBy: userId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      matrixSize: true,
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
    },
  });

  return {
    message: "Konteks berhasil diperbarui",
    data: updatedKonteks,
  };
};

const setActive = async (konteksId, userId) => {
  const { konteksId: id } = validate(konteksIdSchema, { konteksId });

  // Get konteks with all related data for validation
  const konteks = await prismaClient.konteks.findUnique({
    where: { id },
    include: {
      riskCategories: {
        include: {
          likelihoodScales: true,
          impactScales: true,
        },
      },
      riskMatrices: true,
    },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  if (konteks.status === KONTEKS_STATUSES.ACTIVE) {
    throw new ResponseError(400, "Konteks ini sudah aktif.");
  }

  if (konteks.status === KONTEKS_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat mengaktifkan konteks yang sudah diarsipkan."
    );
  }

  // Validate: at least 1 risk category
  if (konteks.riskCategories.length === 0) {
    throw new ResponseError(
      400,
      "Konteks harus memiliki minimal 1 kategori risiko sebelum diaktifkan."
    );
  }

  // Validate: each risk category must have complete scales
  for (const category of konteks.riskCategories) {
    if (category.likelihoodScales.length !== konteks.matrixSize) {
      throw new ResponseError(
        400,
        `Kategori "${category.name}" harus memiliki ${konteks.matrixSize} likelihood scale (saat ini: ${category.likelihoodScales.length}).`
      );
    }
    if (category.impactScales.length !== konteks.matrixSize) {
      throw new ResponseError(
        400,
        `Kategori "${category.name}" harus memiliki ${konteks.matrixSize} impact scale (saat ini: ${category.impactScales.length}).`
      );
    }
  }

  // Validate: risk matrix must be complete
  const expectedMatrixEntries = konteks.matrixSize * konteks.matrixSize;
  if (konteks.riskMatrices.length !== expectedMatrixEntries) {
    throw new ResponseError(
      400,
      `Risk matrix harus lengkap (${expectedMatrixEntries} entries untuk matriks ${konteks.matrixSize}x${konteks.matrixSize}, saat ini: ${konteks.riskMatrices.length}).`
    );
  }

  // Use transaction: deactivate all active konteks, then activate the selected one
  await prismaClient.$transaction([
    prismaClient.konteks.updateMany({
      where: { status: KONTEKS_STATUSES.ACTIVE },
      data: { status: KONTEKS_STATUSES.INACTIVE, updatedBy: userId },
    }),
    prismaClient.konteks.update({
      where: { id },
      data: { status: KONTEKS_STATUSES.ACTIVE, updatedBy: userId },
    }),
  ]);

  const activeKonteks = await prismaClient.konteks.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      matrixSize: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: "Konteks berhasil diaktifkan",
    data: activeKonteks,
  };
};

const deactivate = async (konteksId, userId) => {
  const { konteksId: id } = validate(konteksIdSchema, { konteksId });

  const konteks = await prismaClient.konteks.findUnique({
    where: { id },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  if (konteks.status === KONTEKS_STATUSES.INACTIVE) {
    throw new ResponseError(400, "Konteks ini sudah tidak aktif.");
  }

  if (konteks.status === KONTEKS_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat menonaktifkan konteks yang sudah diarsipkan."
    );
  }

  // Simply deactivate this konteks (no mutual exclusion like setActive)
  const deactivatedKonteks = await prismaClient.konteks.update({
    where: { id },
    data: { status: KONTEKS_STATUSES.INACTIVE, updatedBy: userId },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: "Konteks berhasil dinonaktifkan",
    data: deactivatedKonteks,
  };
};

const archive = async (konteksId, userId) => {
  const { konteksId: id } = validate(konteksIdSchema, { konteksId });

  const konteks = await prismaClient.konteks.findUnique({
    where: { id },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  if (konteks.status === KONTEKS_STATUSES.ACTIVE) {
    throw new ResponseError(
      400,
      "Tidak dapat mengarsipkan konteks yang sedang aktif. Nonaktifkan konteks terlebih dahulu."
    );
  }

  if (konteks.status === KONTEKS_STATUSES.ARCHIVED) {
    throw new ResponseError(400, "Konteks ini sudah diarsipkan.");
  }

  // Soft delete - update status to ARCHIVED
  const archivedKonteks = await prismaClient.konteks.update({
    where: { id },
    data: { status: KONTEKS_STATUSES.ARCHIVED, updatedBy: userId },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: "Konteks berhasil diarsipkan",
    data: archivedKonteks,
  };
};

export default {
  create,
  search,
  getById,
  update,
  setActive,
  deactivate,
  archive,
};
