import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { checkKonteksNotActive } from "../utils/konteks.utils.js";
import {
  createLikelihoodScaleSchema,
  updateLikelihoodScaleSchema,
  searchLikelihoodScaleSchema,
  likelihoodScaleIdSchema,
  konteksIdSchema,
  riskCategoryIdSchema,
} from "../validations/likelihood-scale.validation.js";
import { createServiceLogger, ACTION_TYPES } from "../utils/logger.utils.js";

const serviceLogger = createServiceLogger("LikelihoodScaleService");

const create = async (konteksId, riskCategoryId, reqBody) => {
  // Validate konteksId and riskCategoryId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { riskCategoryId: validatedRiskCategoryId } = validate(
    riskCategoryIdSchema,
    { riskCategoryId },
  );

  // Validate request body
  reqBody = validate(createLikelihoodScaleSchema, reqBody);

  // Check if risk category exists AND belongs to konteks (security check)
  const riskCategory = await prismaClient.riskCategory.findFirst({
    where: {
      id: validatedRiskCategoryId,
      konteksId: validatedKonteksId,
    },
    include: {
      konteks: {
        select: {
          matrixSize: true,
        },
      },
    },
  });

  if (!riskCategory) {
    throw new ResponseError(
      404,
      "Kategori risiko tidak ditemukan dalam konteks ini.",
    );
  }

  // Check if konteks is active - prevent modification
  await checkKonteksNotActive(validatedKonteksId, "skala kemungkinan");

  const matrixSize = riskCategory.konteks.matrixSize;

  // Validate level is within matrixSize range
  if (reqBody.level > matrixSize) {
    throw new ResponseError(
      400,
      `Level tidak boleh melebihi ukuran matriks (${matrixSize}).`,
    );
  }

  // Check if total scales would exceed matrixSize
  const currentScalesCount = await prismaClient.likelihoodScale.count({
    where: { riskCategoryId: validatedRiskCategoryId },
  });

  if (currentScalesCount >= matrixSize) {
    throw new ResponseError(
      400,
      `Jumlah likelihood scale sudah mencapai batas maksimal (${matrixSize}).`,
    );
  }

  // Check unique constraint (riskCategoryId, level)
  const existingScale = await prismaClient.likelihoodScale.findFirst({
    where: {
      riskCategoryId: validatedRiskCategoryId,
      level: reqBody.level,
    },
  });

  if (existingScale) {
    throw new ResponseError(
      409,
      `Level ${reqBody.level} sudah digunakan dalam kategori risiko ini.`,
    );
  }

  // Create likelihood scale
  const likelihoodScale = await prismaClient.likelihoodScale.create({
    data: {
      riskCategoryId: validatedRiskCategoryId,
      level: reqBody.level,
      label: reqBody.label,
      description: reqBody.description,
    },
    select: {
      id: true,
      riskCategoryId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      riskCategory: {
        select: {
          id: true,
          name: true,
          order: true,
          konteks: {
            select: {
              id: true,
              name: true,
              code: true,
              periodStart: true,
              periodEnd: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return {
    message: "Skala kemungkinan berhasil dibuat",
    data: likelihoodScale,
  };
};

const search = async (konteksId, riskCategoryId, queryParams) => {
  // Validate konteksId and riskCategoryId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { riskCategoryId: validatedRiskCategoryId } = validate(
    riskCategoryIdSchema,
    { riskCategoryId },
  );

  // Validate query parameters
  const params = validate(searchLikelihoodScaleSchema, queryParams);
  const { page, limit } = params;

  // Check if risk category exists AND belongs to konteks (security check)
  const riskCategory = await prismaClient.riskCategory.findFirst({
    where: {
      id: validatedRiskCategoryId,
      konteksId: validatedKonteksId,
    },
  });

  if (!riskCategory) {
    throw new ResponseError(
      404,
      "Kategori risiko tidak ditemukan dalam konteks ini.",
    );
  }

  // Build where clause with riskCategoryId (required)
  const where = {
    riskCategoryId: validatedRiskCategoryId,
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
      riskCategoryId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      riskCategory: {
        select: {
          id: true,
          name: true,
          order: true,
          konteks: {
            select: {
              id: true,
              name: true,
              code: true,
              periodStart: true,
              periodEnd: true,
              status: true,
            },
          },
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

const getById = async (konteksId, riskCategoryId, id) => {
  // Validate konteksId, riskCategoryId, and id
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { riskCategoryId: validatedRiskCategoryId } = validate(
    riskCategoryIdSchema,
    { riskCategoryId },
  );
  const { id: validatedId } = validate(likelihoodScaleIdSchema, { id });

  // Check if risk category exists AND belongs to konteks (security check)
  const riskCategory = await prismaClient.riskCategory.findFirst({
    where: {
      id: validatedRiskCategoryId,
      konteksId: validatedKonteksId,
    },
  });

  if (!riskCategory) {
    throw new ResponseError(
      404,
      "Kategori risiko tidak ditemukan dalam konteks ini.",
    );
  }

  const likelihoodScale = await prismaClient.likelihoodScale.findUnique({
    where: { id: validatedId },
    select: {
      id: true,
      riskCategoryId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      riskCategory: {
        select: {
          id: true,
          name: true,
          order: true,
          konteks: {
            select: {
              id: true,
              name: true,
              code: true,
              periodStart: true,
              periodEnd: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!likelihoodScale) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // Verify scale belongs to the specified riskCategoryId (security check)
  if (likelihoodScale.riskCategoryId !== validatedRiskCategoryId) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  return {
    message: "Skala kemungkinan berhasil ditemukan",
    data: likelihoodScale,
  };
};

const update = async (konteksId, riskCategoryId, id, reqBody) => {
  // Validate konteksId, riskCategoryId, id, and body
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { riskCategoryId: validatedRiskCategoryId } = validate(
    riskCategoryIdSchema,
    { riskCategoryId },
  );
  const { id: validatedId } = validate(likelihoodScaleIdSchema, { id });
  reqBody = validate(updateLikelihoodScaleSchema, reqBody);

  // Check if risk category exists AND belongs to konteks (security check)
  const riskCategory = await prismaClient.riskCategory.findFirst({
    where: {
      id: validatedRiskCategoryId,
      konteksId: validatedKonteksId,
    },
    include: {
      konteks: {
        select: {
          matrixSize: true,
        },
      },
    },
  });

  if (!riskCategory) {
    throw new ResponseError(
      404,
      "Kategori risiko tidak ditemukan dalam konteks ini.",
    );
  }

  // Check if konteks is active - prevent modification
  await checkKonteksNotActive(validatedKonteksId, "skala kemungkinan");

  const matrixSize = riskCategory.konteks.matrixSize;

  // Validate level is within matrixSize range if being updated
  if (reqBody.level && reqBody.level > matrixSize) {
    throw new ResponseError(
      400,
      `Level tidak boleh melebihi ukuran matriks (${matrixSize}).`,
    );
  }

  // Check if likelihood scale exists
  const existingScale = await prismaClient.likelihoodScale.findUnique({
    where: { id: validatedId },
  });

  if (!existingScale) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // Verify scale belongs to the specified riskCategoryId (security check)
  if (existingScale.riskCategoryId !== validatedRiskCategoryId) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // If level is being updated, check uniqueness
  if (reqBody.level && reqBody.level !== existingScale.level) {
    const levelExists = await prismaClient.likelihoodScale.findFirst({
      where: {
        riskCategoryId: validatedRiskCategoryId,
        level: reqBody.level,
        id: { not: validatedId },
      },
    });

    if (levelExists) {
      throw new ResponseError(
        409,
        `Level ${reqBody.level} sudah digunakan dalam kategori risiko ini.`,
      );
    }
  }

  // Update likelihood scale
  const updatedScale = await prismaClient.likelihoodScale.update({
    where: { id: validatedId },
    data: reqBody,
    select: {
      id: true,
      riskCategoryId: true,
      level: true,
      label: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      riskCategory: {
        select: {
          id: true,
          name: true,
          order: true,
          konteks: {
            select: {
              id: true,
              name: true,
              code: true,
              periodStart: true,
              periodEnd: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return {
    message: "Skala kemungkinan berhasil diperbarui",
    data: updatedScale,
  };
};

const remove = async (konteksId, riskCategoryId, id) => {
  // Validate konteksId, riskCategoryId, and id
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { riskCategoryId: validatedRiskCategoryId } = validate(
    riskCategoryIdSchema,
    { riskCategoryId },
  );
  const { id: validatedId } = validate(likelihoodScaleIdSchema, { id });

  // Check if risk category exists AND belongs to konteks (security check)
  const riskCategory = await prismaClient.riskCategory.findFirst({
    where: {
      id: validatedRiskCategoryId,
      konteksId: validatedKonteksId,
    },
  });

  if (!riskCategory) {
    throw new ResponseError(
      404,
      "Kategori risiko tidak ditemukan dalam konteks ini.",
    );
  }

  // Check if konteks is active - prevent deletion
  await checkKonteksNotActive(validatedKonteksId, "skala kemungkinan");

  // Check if likelihood scale exists
  const existingScale = await prismaClient.likelihoodScale.findUnique({
    where: { id: validatedId },
  });

  if (!existingScale) {
    throw new ResponseError(404, "Skala kemungkinan tidak ditemukan.");
  }

  // Verify scale belongs to the specified riskCategoryId (security check)
  if (existingScale.riskCategoryId !== validatedRiskCategoryId) {
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
