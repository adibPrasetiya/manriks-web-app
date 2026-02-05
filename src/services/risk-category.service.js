import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import {
  checkKonteksNotActive,
  verifyKonteksExists,
} from "../utils/konteks.utils.js";
import {
  createRiskCategorySchema,
  updateRiskCategorySchema,
  searchRiskCategorySchema,
  riskCategoryIdSchema,
  konteksIdSchema,
} from "../validations/risk-category.validation.js";
import { createServiceLogger, ACTION_TYPES } from "../utils/logger.utils.js";

const serviceLogger = createServiceLogger("RiskCategoryService");

const create = async (konteksId, reqBody) => {
  // Validate konteksId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });

  // Validate request body
  reqBody = validate(createRiskCategorySchema, reqBody);

  // Check if konteks exists
  const konteks = await prismaClient.konteks.findUnique({
    where: { id: validatedKonteksId },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  // Check if konteks is active - prevent modification
  await checkKonteksNotActive(validatedKonteksId, "kategori risiko");

  // Check name uniqueness per konteks
  const existingCategory = await prismaClient.riskCategory.findFirst({
    where: {
      konteksId: validatedKonteksId,
      name: reqBody.name,
    },
  });

  if (existingCategory) {
    throw new ResponseError(
      409,
      `Nama kategori risiko "${reqBody.name}" sudah digunakan dalam konteks ini.`,
    );
  }

  // Check order uniqueness per konteks
  if (reqBody.order !== undefined) {
    const existingOrder = await prismaClient.riskCategory.findFirst({
      where: {
        konteksId: validatedKonteksId,
        order: reqBody.order,
      },
    });

    if (existingOrder) {
      throw new ResponseError(
        409,
        `Order ${reqBody.order} sudah digunakan oleh kategori risiko "${existingOrder.name}" dalam konteks ini.`,
      );
    }
  }

  // Create risk category
  const riskCategory = await prismaClient.riskCategory.create({
    data: {
      konteksId: validatedKonteksId,
      name: reqBody.name,
      description: reqBody.description || null,
      order: reqBody.order || 0,
    },
    select: {
      id: true,
      konteksId: true,
      name: true,
      description: true,
      order: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  serviceLogger.security(ACTION_TYPES.RISK_CATEGORY_CREATED, {
    konteksId: konteksId,
    data: riskCategory,
  });

  return {
    message: "Kategori risiko berhasil dibuat",
    data: riskCategory,
  };
};

const search = async (konteksId, queryParams) => {
  // Validate konteksId
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });

  // cek konteks ada engga
  await verifyKonteksExists(konteksId);

  // Validate query parameters
  const params = validate(searchRiskCategorySchema, queryParams);
  const { name, page, limit } = params;

  // Build where clause with konteksId (required) and name (optional filter)
  const where = {
    konteksId: validatedKonteksId,
  };

  if (name) {
    where.name = {
      contains: name,
    };
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.riskCategory.count({ where });

  const riskCategories = await prismaClient.riskCategory.findMany({
    where,
    skip,
    take: limit,
    orderBy: { order: "asc" },
    select: {
      id: true,
      konteksId: true,
      name: true,
      description: true,
      order: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
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
    message: "Kategori risiko berhasil ditemukan",
    data: riskCategories,
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
  const { id: validatedId } = validate(riskCategoryIdSchema, { id });

  const riskCategory = await prismaClient.riskCategory.findUnique({
    where: { id: validatedId },
    select: {
      id: true,
      konteksId: true,
      name: true,
      description: true,
      order: true,
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

  if (!riskCategory) {
    throw new ResponseError(404, "Kategori risiko tidak ditemukan.");
  }

  // Verify category belongs to the specified konteksId (security check)
  if (riskCategory.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Kategori risiko tidak ditemukan.");
  }

  return {
    message: "Kategori risiko berhasil ditemukan",
    data: riskCategory,
  };
};

const update = async (konteksId, id, reqBody) => {
  // Validate konteksId, id, and body
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { id: validatedId } = validate(riskCategoryIdSchema, { id });
  reqBody = validate(updateRiskCategorySchema, reqBody);

  // Check if risk category exists
  const existingCategory = await prismaClient.riskCategory.findUnique({
    where: { id: validatedId },
  });

  if (!existingCategory) {
    throw new ResponseError(404, "Kategori risiko tidak ditemukan.");
  }

  // Verify category belongs to the specified konteksId (security check)
  if (existingCategory.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Kategori risiko tidak ditemukan.");
  }

  // Check if konteks is active - prevent modification
  await checkKonteksNotActive(validatedKonteksId, "kategori risiko");

  // If name is being updated, check uniqueness per konteks
  if (reqBody.name && reqBody.name !== existingCategory.name) {
    const nameExists = await prismaClient.riskCategory.findFirst({
      where: {
        konteksId: validatedKonteksId,
        name: reqBody.name,
        id: { not: validatedId },
      },
    });

    if (nameExists) {
      throw new ResponseError(
        409,
        `Nama kategori risiko "${reqBody.name}" sudah digunakan dalam konteks ini.`,
      );
    }
  }

  // If order is being updated, check uniqueness per konteks
  if (reqBody.order !== undefined && reqBody.order !== existingCategory.order) {
    const existingOrder = await prismaClient.riskCategory.findFirst({
      where: {
        konteksId: validatedKonteksId,
        order: reqBody.order,
        id: { not: validatedId },
      },
    });

    if (existingOrder) {
      throw new ResponseError(
        409,
        `Order ${reqBody.order} sudah digunakan oleh kategori risiko "${existingOrder.name}" dalam konteks ini.`,
      );
    }
  }

  // Update risk category
  const updatedCategory = await prismaClient.riskCategory.update({
    where: { id: validatedId },
    data: reqBody,
    select: {
      id: true,
      konteksId: true,
      name: true,
      description: true,
      order: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  serviceLogger.security(ACTION_TYPES.RISK_CATEGORY_UPDATED, {
    riskCategoryId: validatedId,
    updatedData: reqBody,
  });

  return {
    message: "Kategori risiko berhasil diperbarui",
    data: updatedCategory,
  };
};

const remove = async (konteksId, id) => {
  // Validate konteksId and id
  const { konteksId: validatedKonteksId } = validate(konteksIdSchema, {
    konteksId,
  });
  const { id: validatedId } = validate(riskCategoryIdSchema, { id });

  // Check if risk category exists
  const existingCategory = await prismaClient.riskCategory.findUnique({
    where: { id: validatedId },
  });

  if (!existingCategory) {
    throw new ResponseError(404, "Kategori risiko tidak ditemukan.");
  }

  // Verify category belongs to the specified konteksId (security check)
  if (existingCategory.konteksId !== validatedKonteksId) {
    throw new ResponseError(404, "Kategori risiko tidak ditemukan.");
  }

  // Check if konteks is active - prevent deletion
  await checkKonteksNotActive(validatedKonteksId, "kategori risiko");

  // Check referential integrity
  // NOTE: Based on current schema, there are no foreign key references to RiskCategory
  // If in the future there are tables like Risk, RiskAssessment, etc. that reference
  // RiskCategory, add checks here similar to unit-kerja.service.js:
  //
  // const riskCount = await prismaClient.risk.count({
  //   where: { riskCategoryId: validatedId },
  // });
  //
  // if (riskCount > 0) {
  //   throw new ResponseError(
  //     409,
  //     `Kategori risiko tidak dapat dihapus karena masih memiliki ${riskCount} risiko yang terkait.`
  //   );
  // }

  // Delete risk category
  await prismaClient.riskCategory.delete({
    where: { id: validatedId },
  });

  serviceLogger.security(ACTION_TYPES.RISK_CATEGORY_DELETED, {
    riskCategoryId: validatedId,
  });

  return {
    message: "Kategori risiko berhasil dihapus",
  };
};

export default {
  create,
  search,
  getById,
  update,
  remove,
};
