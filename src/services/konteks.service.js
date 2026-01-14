import { prismaClient } from "../apps/database.js";
import { validate } from "../utils/validator.utils.js";
import {
  createKonteksSchema,
  updateKonteksSchema,
  konteksIdSchema,
  searchKonteksSchema,
} from "../validations/konteks.validation.js";
import { ResponseError } from "../errors/response.error.js";

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

  // Check period overlap (optional business rule)
  const overlappingKonteks = await prismaClient.konteks.findFirst({
    where: {
      OR: [
        {
          AND: [
            { periodStart: { lte: reqBody.periodStart } },
            { periodEnd: { gte: reqBody.periodStart } },
          ],
        },
        {
          AND: [
            { periodStart: { lte: reqBody.periodEnd } },
            { periodEnd: { gte: reqBody.periodEnd } },
          ],
        },
      ],
    },
  });

  if (overlappingKonteks) {
    throw new ResponseError(
      409,
      `Periode konteks bertumpukan dengan konteks ${overlappingKonteks.name} (${overlappingKonteks.periodStart}-${overlappingKonteks.periodEnd}).`
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
      riskAppetiteLevel: reqBody.riskAppetiteLevel || null,
      riskAppetiteDescription: reqBody.riskAppetiteDescription || null,
      isActive: reqBody.isActive || false,
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
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      isActive: true,
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
  const { name, code, periodStart, periodEnd, isActive, page, limit } = params;

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

  if (isActive !== undefined) {
    where.isActive = isActive;
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
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
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
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
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

  // Check period overlap if period is being updated
  if (reqBody.periodStart || reqBody.periodEnd) {
    const newPeriodStart = reqBody.periodStart || existingKonteks.periodStart;
    const newPeriodEnd = reqBody.periodEnd || existingKonteks.periodEnd;

    const overlappingKonteks = await prismaClient.konteks.findFirst({
      where: {
        id: { not: id },
        OR: [
          {
            AND: [
              { periodStart: { lte: newPeriodStart } },
              { periodEnd: { gte: newPeriodStart } },
            ],
          },
          {
            AND: [
              { periodStart: { lte: newPeriodEnd } },
              { periodEnd: { gte: newPeriodEnd } },
            ],
          },
        ],
      },
    });

    if (overlappingKonteks) {
      throw new ResponseError(
        409,
        `Periode konteks bertumpukan dengan konteks ${overlappingKonteks.name}.`
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
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      isActive: true,
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

  const konteks = await prismaClient.konteks.findUnique({
    where: { id },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  if (konteks.isActive) {
    throw new ResponseError(400, "Konteks ini sudah aktif.");
  }

  // Use transaction: deactivate all, then activate the selected one
  await prismaClient.$transaction([
    prismaClient.konteks.updateMany({
      where: { isActive: true },
      data: { isActive: false, updatedBy: userId },
    }),
    prismaClient.konteks.update({
      where: { id },
      data: { isActive: true, updatedBy: userId },
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
      isActive: true,
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

  if (!konteks.isActive) {
    throw new ResponseError(400, "Konteks ini sudah tidak aktif.");
  }

  // Simply deactivate this konteks (no mutual exclusion like setActive)
  const deactivatedKonteks = await prismaClient.konteks.update({
    where: { id },
    data: { isActive: false, updatedBy: userId },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      periodStart: true,
      periodEnd: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: "Konteks berhasil dinonaktifkan",
    data: deactivatedKonteks,
  };
};

const remove = async (konteksId) => {
  const { konteksId: id } = validate(konteksIdSchema, { konteksId });

  const konteks = await prismaClient.konteks.findUnique({
    where: { id },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  if (konteks.isActive) {
    throw new ResponseError(
      400,
      "Tidak dapat menghapus konteks yang sedang aktif. Aktifkan konteks lain terlebih dahulu."
    );
  }

  await prismaClient.konteks.delete({
    where: { id },
  });

  return {
    message: "Konteks berhasil dihapus",
  };
};

export default {
  create,
  search,
  getById,
  update,
  setActive,
  deactivate,
  remove,
};
