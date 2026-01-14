import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import {
  createLikelihoodScaleSchema,
  updateLikelihoodScaleSchema,
  searchLikelihoodScaleSchema,
  likelihoodScaleIdSchema,
  konteksIdSchema,
} from "../validations/likelihood-scale.validation.js";

const create = async (konteksId, reqBody) => {
  // Validate konteksId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });

  // Validate request body
  reqBody = validate(createLikelihoodScaleSchema, reqBody);

  // Check if konteks exists
  const konteks = await prismaClient.konteks.findUnique({
    where: { id: validatedKonteksId },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  // Check unique constraint (konteksId, level)
  const existingScale = await prismaClient.likelihoodScale.findFirst({
    where: {
      konteksId: validatedKonteksId,
      level: reqBody.level,
    },
  });

  if (existingScale) {
    throw new ResponseError(
      409,
      `Level ${reqBody.level} sudah digunakan dalam konteks ini.`
    );
  }

  // Create likelihood scale
  const likelihoodScale = await prismaClient.likelihoodScale.create({
    data: {
      konteksId: validatedKonteksId,
      level: reqBody.level,
      label: reqBody.label,
      description: reqBody.description,
    },
    select: {
      id: true,
      konteksId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
          isActive: true,
        },
      },
    },
  });

  return {
    message: "Skala kemungkinan berhasil dibuat",
    data: likelihoodScale,
  };
};

const search = async (konteksId, queryParams) => {
  // Validate konteksId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });

  // Validate query parameters
  const params = validate(searchLikelihoodScaleSchema, queryParams);
  const { page, limit } = params;

  // Build where clause with konteksId (required)
  const where = {
    konteksId: validatedKonteksId,
  };

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.likelihoodScale.count({ where });

  const likelihoodScales = await prismaClient.likelihoodScale.findMany({
    where,
    skip,
    take: limit,
    orderBy: { level: "asc" },
    select: {
      id: true,
      konteksId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
          isActive: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Skala kemungkinan berhasil ditemukan",
    data: likelihoodScales,
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

const getById = async (konteksId, id) => {
  // Validate konteksId and id
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { id: validatedId } = validate(likelihoodScaleIdSchema, { id });

  const likelihoodScale = await prismaClient.likelihoodScale.findUnique({
    where: { id: validatedId },
    select: {
      id: true,
      konteksId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
          isActive: true,
        },
      },
    },
  });

  if (!likelihoodScale) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // Verify scale belongs to the specified konteksId (security check)
  if (likelihoodScale.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  return {
    message: "Skala kemungkinan berhasil ditemukan",
    data: likelihoodScale,
  };
};

const update = async (konteksId, id, reqBody) => {
  // Validate konteksId, id, and body
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { id: validatedId } = validate(likelihoodScaleIdSchema, { id });
  reqBody = validate(updateLikelihoodScaleSchema, reqBody);

  // Check if likelihood scale exists
  const existingScale = await prismaClient.likelihoodScale.findUnique({
    where: { id: validatedId },
  });

  if (!existingScale) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // Verify scale belongs to the specified konteksId (security check)
  if (existingScale.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // If level is being updated, check uniqueness
  if (reqBody.level && reqBody.level !== existingScale.level) {
    const levelExists = await prismaClient.likelihoodScale.findFirst({
      where: {
        konteksId: validatedKonteksId,
        level: reqBody.level,
        id: { not: validatedId },
      },
    });

    if (levelExists) {
      throw new ResponseError(
        409,
        `Level ${reqBody.level} sudah digunakan dalam konteks ini.`
      );
    }
  }

  // Update likelihood scale
  const updatedScale = await prismaClient.likelihoodScale.update({
    where: { id: validatedId },
    data: reqBody,
    select: {
      id: true,
      konteksId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
          isActive: true,
        },
      },
    },
  });

  return {
    message: "Skala kemungkinan berhasil diperbarui",
    data: updatedScale,
  };
};

const remove = async (konteksId, id) => {
  // Validate konteksId and id
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { id: validatedId } = validate(likelihoodScaleIdSchema, { id });

  // Check if likelihood scale exists
  const existingScale = await prismaClient.likelihoodScale.findUnique({
    where: { id: validatedId },
  });

  if (!existingScale) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // Verify scale belongs to the specified konteksId (security check)
  if (existingScale.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // Check referential integrity
  // NOTE: Based on current schema, there are no foreign key references to LikelihoodScale
  // If in the future there are tables like RiskMatrix that reference LikelihoodScale,
  // add checks here similar to risk-category.service.js:
  //
  // const riskMatrixCount = await prismaClient.riskMatrix.count({
  //   where: { likelihoodScaleId: validatedId },
  // });
  //
  // if (riskMatrixCount > 0) {
  //   throw new ResponseError(
  //     409,
  //     `Skala kemungkinan tidak dapat dihapus karena masih digunakan dalam ${riskMatrixCount} matriks risiko.`
  //   );
  // }

  // Delete likelihood scale
  await prismaClient.likelihoodScale.delete({
    where: { id: validatedId },
  });

  return {
    message: "Skala kemungkinan berhasil dihapus",
  };
};

export default {
  create,
  search,
  getById,
  update,
  remove,
};
