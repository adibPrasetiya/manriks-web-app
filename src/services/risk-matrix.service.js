import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { checkKonteksNotActive } from "../utils/konteks.utils.js";
import {
  createRiskMatrixSchema,
  bulkCreateRiskMatrixSchema,
  updateRiskMatrixSchema,
  searchRiskMatrixSchema,
  riskMatrixIdSchema,
  konteksIdSchema,
} from "../validations/risk-matrix.validation.js";
import { createServiceLogger, ACTION_TYPES } from "../utils/logger.utils.js";

const serviceLogger = createServiceLogger("RiskMatrixService");

const create = async (konteksId, reqBody) => {
  // Validate konteksId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });

  // Validate request body
  reqBody = validate(createRiskMatrixSchema, reqBody);

  // Check if konteks exists
  const konteks = await prismaClient.konteks.findUnique({
    where: { id: validatedKonteksId },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  // Check if konteks is active - prevent modification
  await checkKonteksNotActive(validatedKonteksId, "matriks risiko");

  // Check unique constraint (konteksId, likelihoodLevel, impactLevel)
  const existingMatrix = await prismaClient.riskMatrix.findFirst({
    where: {
      konteksId: validatedKonteksId,
      likelihoodLevel: reqBody.likelihoodLevel,
      impactLevel: reqBody.impactLevel,
    },
  });

  if (existingMatrix) {
    throw new ResponseError(
      409,
      `Matriks risiko dengan likelihood level ${reqBody.likelihoodLevel} dan impact level ${reqBody.impactLevel} sudah ada.`,
    );
  }

  // Create risk matrix
  const riskMatrix = await prismaClient.riskMatrix.create({
    data: {
      konteksId: validatedKonteksId,
      likelihoodLevel: reqBody.likelihoodLevel,
      impactLevel: reqBody.impactLevel,
      riskLevel: reqBody.riskLevel,
    },
    select: {
      id: true,
      konteksId: true,
      likelihoodLevel: true,
      impactLevel: true,
      riskLevel: true,
      createdAt: true,
      updatedAt: true,
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
  });

  return {
    message: "Matriks risiko berhasil dibuat",
    data: riskMatrix,
  };
};

const bulkCreate = async (konteksId, reqBody) => {
  // Validate konteksId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });

  // Validate request body
  reqBody = validate(bulkCreateRiskMatrixSchema, reqBody);

  // Check if konteks exists and get matrixSize
  const konteks = await prismaClient.konteks.findUnique({
    where: { id: validatedKonteksId },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  // Check if konteks is active - prevent modification
  await checkKonteksNotActive(validatedKonteksId, "matriks risiko");

  const matrixSize = konteks.matrixSize;

  // Validate all entries
  const errors = [];
  const seen = new Set();

  for (let i = 0; i < reqBody.matrices.length; i++) {
    const matrix = reqBody.matrices[i];
    const key = `${matrix.likelihoodLevel}-${matrix.impactLevel}`;

    // Check for duplicates within request body
    if (seen.has(key)) {
      errors.push(
        `Index ${i}: Duplikat kombinasi likelihood level ${matrix.likelihoodLevel} dan impact level ${matrix.impactLevel}`,
      );
    }
    seen.add(key);

    // Check level ranges based on matrixSize from konteks
    if (matrix.likelihoodLevel > matrixSize) {
      errors.push(
        `Index ${i}: Likelihood level ${matrix.likelihoodLevel} melebihi ukuran matriks (maksimal ${matrixSize})`,
      );
    }
    if (matrix.impactLevel > matrixSize) {
      errors.push(
        `Index ${i}: Impact level ${matrix.impactLevel} melebihi ukuran matriks (maksimal ${matrixSize})`,
      );
    }
  }

  if (errors.length > 0) {
    throw new ResponseError(400, errors.join("; "));
  }

  // Check for existing matrices in database
  const existingMatrices = await prismaClient.riskMatrix.findMany({
    where: { konteksId: validatedKonteksId },
    select: { likelihoodLevel: true, impactLevel: true },
  });

  const existingKeys = new Set(
    existingMatrices.map((m) => `${m.likelihoodLevel}-${m.impactLevel}`),
  );

  // Check for duplicates against existing data
  const duplicatesInDb = [];
  for (const matrix of reqBody.matrices) {
    const key = `${matrix.likelihoodLevel}-${matrix.impactLevel}`;
    if (existingKeys.has(key)) {
      duplicatesInDb.push(
        `Likelihood ${matrix.likelihoodLevel} x Impact ${matrix.impactLevel}`,
      );
    }
  }

  if (duplicatesInDb.length > 0) {
    throw new ResponseError(
      409,
      `Matriks berikut sudah ada di database: ${duplicatesInDb.join(", ")}`,
    );
  }

  // Bulk create using transaction
  const createdMatrices = await prismaClient.$transaction(
    reqBody.matrices.map((matrix) =>
      prismaClient.riskMatrix.create({
        data: {
          konteksId: validatedKonteksId,
          likelihoodLevel: matrix.likelihoodLevel,
          impactLevel: matrix.impactLevel,
          riskLevel: matrix.riskLevel,
        },
        select: {
          id: true,
          konteksId: true,
          likelihoodLevel: true,
          impactLevel: true,
          riskLevel: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ),
  );

  const expectedTotal = matrixSize * matrixSize;
  const currentTotal = existingMatrices.length + createdMatrices.length;

  return {
    message: `${createdMatrices.length} matriks risiko berhasil dibuat`,
    data: {
      created: createdMatrices,
      createdCount: createdMatrices.length,
      totalInKonteks: currentTotal,
      expectedTotal: expectedTotal,
      isComplete: currentTotal === expectedTotal,
    },
  };
};

const search = async (konteksId, queryParams) => {
  // Validate konteksId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });

  // Validate query parameters
  const params = validate(searchRiskMatrixSchema, queryParams);
  const { page, limit, likelihoodLevel, impactLevel } = params;

  // Build where clause
  const where = {
    konteksId: validatedKonteksId,
  };

  //optional filters
  if (likelihoodLevel !== undefined) {
    where.likelihoodLevel = likelihoodLevel;
  }

  if (impactLevel !== undefined) {
    where.impactLevel = impactLevel;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.riskMatrix.count({ where });

  const riskMatrices = await prismaClient.riskMatrix.findMany({
    where,
    skip,
    take: limit,
    orderBy: [{ likelihoodLevel: "asc" }, { impactLevel: "asc" }],
    select: {
      id: true,
      konteksId: true,
      likelihoodLevel: true,
      impactLevel: true,
      riskLevel: true,
      createdAt: true,
      updatedAt: true,
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
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Matriks risiko berhasil ditemukan",
    data: riskMatrices,
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
  const { id: validatedId } = validate(riskMatrixIdSchema, { id });

  const riskMatrix = await prismaClient.riskMatrix.findUnique({
    where: { id: validatedId },
    select: {
      id: true,
      konteksId: true,
      likelihoodLevel: true,
      impactLevel: true,
      riskLevel: true,
      createdAt: true,
      updatedAt: true,
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
  });

  if (!riskMatrix) {
    throw new ResponseError(404, "Matriks risiko tidak ditemukan.");
  }

  // Verify ownership
  if (riskMatrix.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Matriks risiko tidak ditemukan.");
  }

  return {
    message: "Matriks risiko berhasil ditemukan",
    data: riskMatrix,
  };
};

const update = async (konteksId, id, reqBody) => {
  // Validate
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { id: validatedId } = validate(riskMatrixIdSchema, { id });
  reqBody = validate(updateRiskMatrixSchema, reqBody);

  // Check if risk matrix exists
  const existingMatrix = await prismaClient.riskMatrix.findUnique({
    where: { id: validatedId },
  });

  if (!existingMatrix) {
    throw new ResponseError(404, "Matriks risiko tidak ditemukan.");
  }

  // Verify ownership
  if (existingMatrix.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Matriks risiko tidak ditemukan.");
  }

  // Check if konteks is active - prevent modification
  await checkKonteksNotActive(validatedKonteksId, "matriks risiko");

  // If updating levels, check uniqueness
  const newLikelihood =
    reqBody.likelihoodLevel || existingMatrix.likelihoodLevel;
  const newImpact = reqBody.impactLevel || existingMatrix.impactLevel;

  if (
    reqBody.likelihoodLevel !== undefined ||
    reqBody.impactLevel !== undefined
  ) {
    const duplicateMatrix = await prismaClient.riskMatrix.findFirst({
      where: {
        konteksId: validatedKonteksId,
        likelihoodLevel: newLikelihood,
        impactLevel: newImpact,
        id: { not: validatedId },
      },
    });

    if (duplicateMatrix) {
      throw new ResponseError(
        409,
        `Matriks risiko dengan likelihood level ${newLikelihood} dan impact level ${newImpact} sudah ada.`,
      );
    }
  }

  // Update risk matrix
  const updatedMatrix = await prismaClient.riskMatrix.update({
    where: { id: validatedId },
    data: reqBody,
    select: {
      id: true,
      konteksId: true,
      likelihoodLevel: true,
      impactLevel: true,
      riskLevel: true,
      createdAt: true,
      updatedAt: true,
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
  });

  return {
    message: "Matriks risiko berhasil diperbarui",
    data: updatedMatrix,
  };
};

const remove = async (konteksId, id) => {
  // Validate
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { id: validatedId } = validate(riskMatrixIdSchema, { id });

  // Check if risk matrix exists
  const existingMatrix = await prismaClient.riskMatrix.findUnique({
    where: { id: validatedId },
  });

  if (!existingMatrix) {
    throw new ResponseError(404, "Matriks risiko tidak ditemukan.");
  }

  // Verify ownership
  if (existingMatrix.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Matriks risiko tidak ditemukan.");
  }

  // Check if konteks is active - prevent deletion
  await checkKonteksNotActive(validatedKonteksId, "matriks risiko");

  // Delete risk matrix
  await prismaClient.riskMatrix.delete({
    where: { id: validatedId },
  });

  return {
    message: "Matriks risiko berhasil dihapus",
  };
};

export default {
  create,
  bulkCreate,
  search,
  getById,
  update,
  remove,
};
