import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { checkKonteksNotActive } from "../utils/konteks.utils.js";
import {
  createImpactScaleSchema,
  updateImpactScaleSchema,
  searchImpactScaleSchema,
  impactScaleIdSchema,
  konteksIdSchema,
  riskCategoryIdSchema,
} from "../validations/impact-scale.validation.js";
import { createServiceLogger, ACTION_TYPES } from "../utils/logger.utils.js";

const serviceLogger = createServiceLogger("ImpactScaleService");

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
  reqBody = validate(createImpactScaleSchema, reqBody);

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
  await checkKonteksNotActive(validatedKonteksId, "skala dampak");

  const matrixSize = riskCategory.konteks.matrixSize;

  // Validate level is within matrixSize range
  if (reqBody.level > matrixSize) {
    throw new ResponseError(
      400,
      `Level tidak boleh melebihi ukuran matriks (${matrixSize}).`,
    );
  }

  // Check if total scales would exceed matrixSize
  const currentScalesCount = await prismaClient.impactScale.count({
    where: { riskCategoryId: validatedRiskCategoryId },
  });

  if (currentScalesCount >= matrixSize) {
    throw new ResponseError(
      400,
      `Jumlah impact scale sudah mencapai batas maksimal (${matrixSize}).`,
    );
  }

  // Check unique constraint (riskCategoryId, level)
  const existingScale = await prismaClient.impactScale.findFirst({
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

  // Create impact scale
  const impactScale = await prismaClient.impactScale.create({
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

  serviceLogger.security(ACTION_TYPES.RISK_IMPACT_CREATED, {
    impactId: impactScale.id,
  });

  return {
    message: "Skala dampak berhasil dibuat",
    data: impactScale,
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
  const params = validate(searchImpactScaleSchema, queryParams);
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

  const totalItems = await prismaClient.impactScale.count({ where });

  const impactScales = await prismaClient.impactScale.findMany({
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
    message: "Skala dampak berhasil ditemukan",
    data: impactScales,
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
  const { id: validatedId } = validate(impactScaleIdSchema, { id });

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

  const impactScale = await prismaClient.impactScale.findUnique({
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

  if (!impactScale) {
    throw new ResponseError(404, "Skala dampak tidak ditemukan.");
  }

  // Verify scale belongs to the specified riskCategoryId (security check)
  if (impactScale.riskCategoryId !== validatedRiskCategoryId) {
    throw new ResponseError(404, "Skala dampak tidak ditemukan.");
  }

  return {
    message: "Skala dampak berhasil ditemukan",
    data: impactScale,
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
  const { id: validatedId } = validate(impactScaleIdSchema, { id });
  reqBody = validate(updateImpactScaleSchema, reqBody);

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
  await checkKonteksNotActive(validatedKonteksId, "skala dampak");

  const matrixSize = riskCategory.konteks.matrixSize;

  // Validate level is within matrixSize range if being updated
  if (reqBody.level && reqBody.level > matrixSize) {
    throw new ResponseError(
      400,
      `Level tidak boleh melebihi ukuran matriks (${matrixSize}).`,
    );
  }

  // Check if impact scale exists
  const existingScale = await prismaClient.impactScale.findUnique({
    where: { id: validatedId },
  });

  if (!existingScale) {
    throw new ResponseError(404, "Skala dampak tidak ditemukan.");
  }

  // Verify scale belongs to the specified riskCategoryId (security check)
  if (existingScale.riskCategoryId !== validatedRiskCategoryId) {
    throw new ResponseError(404, "Skala dampak tidak ditemukan.");
  }

  // If level is being updated, check uniqueness
  if (reqBody.level && reqBody.level !== existingScale.level) {
    const levelExists = await prismaClient.impactScale.findFirst({
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

  // Update impact scale
  const updatedScale = await prismaClient.impactScale.update({
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

  serviceLogger.security(ACTION_TYPES.RISK_IMPACT_UPDATED, {
    impactId: validatedId,
    updatedData: reqBody,
  });

  return {
    message: "Skala dampak berhasil diperbarui",
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
  const { id: validatedId } = validate(impactScaleIdSchema, { id });

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
  await checkKonteksNotActive(validatedKonteksId, "skala dampak");

  // Check if impact scale exists
  const existingScale = await prismaClient.impactScale.findUnique({
    where: { id: validatedId },
  });

  if (!existingScale) {
    throw new ResponseError(404, "Skala dampak tidak ditemukan.");
  }

  // Verify scale belongs to the specified riskCategoryId (security check)
  if (existingScale.riskCategoryId !== validatedRiskCategoryId) {
    throw new ResponseError(404, "Skala dampak tidak ditemukan.");
  }

  // Check referential integrity
  // NOTE: Based on current schema, there are no foreign key references to ImpactScale
  // If in the future there are tables like RiskMatrix that reference ImpactScale,
  // add checks here similar to risk-category.service.js:
  //
  // const riskMatrixCount = await prismaClient.riskMatrix.count({
  //   where: { impactScaleId: validatedId },
  // });
  //
  // if (riskMatrixCount > 0) {
  //   throw new ResponseError(
  //     409,
  //     `Skala dampak tidak dapat dihapus karena masih digunakan dalam ${riskMatrixCount} matriks risiko.`
  //   );
  // }

  // Delete impact scale
  await prismaClient.impactScale.delete({
    where: { id: validatedId },
  });

  serviceLogger.security(ACTION_TYPES.RISK_IMPACT_DELETED, {
    impactId: validatedId,
  });

  return {
    message: "Skala dampak berhasil dihapus",
  };
};

export default {
  create,
  search,
  getById,
  update,
  remove,
};
