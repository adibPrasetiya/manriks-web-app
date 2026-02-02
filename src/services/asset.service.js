import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { ROLES, ASSET_STATUSES } from "../config/constant.js";
import {
  createAssetSchema,
  updateAssetSchema,
  searchAssetSchema,
  searchAllAssetSchema,
  unitKerjaIdSchema,
  assetIdSchema,
} from "../validations/asset.validation.js";

/**
 * Check if user has access to the specified unit kerja
 * ADMINISTRATOR and KOMITE_PUSAT can access any unit kerja
 * PENGELOLA_RISIKO_UKER can only access their own unit kerja
 */
const checkUnitKerjaAccess = (user, unitKerjaId, options = {}) => {
  const { allowKomitePusat = false } = options;
  const isAdmin = user.roles.includes(ROLES.ADMINISTRATOR);
  const isKomitePusat = user.roles.includes(ROLES.KOMITE_PUSAT);

  // ADMINISTRATOR can always access any unit kerja
  if (isAdmin) {
    return;
  }

  // KOMITE_PUSAT can access any unit kerja if allowed
  if (allowKomitePusat && isKomitePusat) {
    return;
  }

  if (user.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(
      403,
      "Akses ditolak. Anda tidak memiliki akses ke unit kerja ini.",
    );
  }
};

/**
 * Verify that the unit kerja exists
 */
const verifyUnitKerjaExists = async (unitKerjaId) => {
  const unitKerja = await prismaClient.unitKerja.findUnique({
    where: { id: unitKerjaId },
  });

  if (!unitKerja) {
    throw new ResponseError(404, "Unit kerja tidak ditemukan.");
  }

  return unitKerja;
};

/**
 * Verify that the category exists
 */
const verifyCategoryExists = async (categoryId) => {
  const category = await prismaClient.assetCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ResponseError(404, "Kategori aset tidak ditemukan.");
  }

  return category;
};

const create = async (unitKerjaId, reqBody, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Validate request body
  reqBody = validate(createAssetSchema, reqBody);

  // Verify category exists
  await verifyCategoryExists(reqBody.categoryId);

  // Check if code already exists in this unit kerja
  const existingCode = await prismaClient.asset.findUnique({
    where: {
      unitKerjaId_code: {
        unitKerjaId: unitKerjaId,
        code: reqBody.code,
      },
    },
  });

  if (existingCode) {
    throw new ResponseError(
      409,
      `Kode aset "${reqBody.code}" sudah digunakan dalam unit kerja ini.`,
    );
  }

  // Create asset
  const asset = await prismaClient.asset.create({
    data: {
      unitKerjaId: unitKerjaId,
      categoryId: reqBody.categoryId,
      name: reqBody.name,
      code: reqBody.code,
      description: reqBody.description || null,
      owner: reqBody.owner || null,
      status: reqBody.status,
      createdBy: user.userId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      owner: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    message: "Aset berhasil dibuat",
    data: asset,
  };
};

const search = async (unitKerjaId, queryParams, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const isAdmin = user.roles.includes(ROLES.ADMINISTRATOR);
  const isKomitePusat = user.roles.includes(ROLES.KOMITE_PUSAT);
  const hasGlobalAccess = isAdmin || isKomitePusat;

  // Check access - allow KOMITE_PUSAT to access any unit kerja
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Validate query params
  const params = validate(searchAssetSchema, queryParams);
  const { name, code, categoryId, status, page, limit } = params;

  // Build where clause
  const where = {};

  // For PENGELOLA_RISIKO_UKER: always filter by their unit kerja
  // For ADMIN and KOMITE_PUSAT: filter by the requested unit kerja
  where.unitKerjaId = unitKerjaId;

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

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.asset.count({ where });

  const assets = await prismaClient.asset.findMany({
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
      description: true,
      owner: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Aset berhasil ditemukan",
    data: assets,
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

const getById = async (unitKerjaId, id, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check access - allow KOMITE_PUSAT to access any unit kerja
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Validate asset ID
  const idParams = validate(assetIdSchema, { id });

  const asset = await prismaClient.asset.findUnique({
    where: {
      id: idParams.id,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      owner: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
      unitKerja: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!asset) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Verify asset belongs to the specified unit kerja
  if (asset.unitKerja.id !== unitKerjaId) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  return {
    message: "Aset berhasil ditemukan",
    data: asset,
  };
};

const update = async (unitKerjaId, id, reqBody, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate asset ID
  const idParams = validate(assetIdSchema, { id });

  // Validate request body
  reqBody = validate(updateAssetSchema, reqBody);

  // Check if asset exists
  const existingAsset = await prismaClient.asset.findUnique({
    where: {
      id: idParams.id,
    },
  });

  if (!existingAsset) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Verify asset belongs to the specified unit kerja
  if (existingAsset.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // If categoryId is being updated, verify category exists
  if (reqBody.categoryId) {
    await verifyCategoryExists(reqBody.categoryId);
  }

  // If code is being updated, check if new code already exists in this unit kerja
  if (reqBody.code && reqBody.code !== existingAsset.code) {
    const codeExists = await prismaClient.asset.findUnique({
      where: {
        unitKerjaId_code: {
          unitKerjaId: unitKerjaId,
          code: reqBody.code,
        },
      },
    });

    if (codeExists) {
      throw new ResponseError(
        409,
        `Kode aset "${reqBody.code}" sudah digunakan oleh aset lain dalam unit kerja ini.`,
      );
    }
  }

  // Update asset
  const updatedAsset = await prismaClient.asset.update({
    where: {
      id: idParams.id,
    },
    data: {
      ...reqBody,
      updatedBy: user.userId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      owner: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    message: "Aset berhasil diperbarui",
    data: updatedAsset,
  };
};

const assetSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  owner: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  unitKerja: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
};

const setActive = async (unitKerjaId, id, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate asset ID
  const idParams = validate(assetIdSchema, { id });

  // Check if asset exists
  const existingAsset = await prismaClient.asset.findUnique({
    where: {
      id: idParams.id,
    },
  });

  if (!existingAsset) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Verify asset belongs to the specified unit kerja
  if (existingAsset.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Check if already active
  if (existingAsset.status === ASSET_STATUSES.ACTIVE) {
    throw new ResponseError(400, "Aset sudah dalam status aktif.");
  }

  // Can't activate if ARCHIVED
  if (existingAsset.status === ASSET_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat mengaktifkan aset yang sudah diarsipkan.",
    );
  }

  const updatedAsset = await prismaClient.asset.update({
    where: { id: idParams.id },
    data: { status: ASSET_STATUSES.ACTIVE, updatedBy: user.userId },
    select: assetSelect,
  });

  return { message: "Aset berhasil diaktifkan", data: updatedAsset };
};

const setInactive = async (unitKerjaId, id, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate asset ID
  const idParams = validate(assetIdSchema, { id });

  // Check if asset exists
  const existingAsset = await prismaClient.asset.findUnique({
    where: {
      id: idParams.id,
    },
  });

  if (!existingAsset) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Verify asset belongs to the specified unit kerja
  if (existingAsset.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Check if already inactive
  if (existingAsset.status === ASSET_STATUSES.INACTIVE) {
    throw new ResponseError(400, "Aset sudah dalam status tidak aktif.");
  }

  // Can't deactivate if ARCHIVED
  if (existingAsset.status === ASSET_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat menonaktifkan aset yang sudah diarsipkan.",
    );
  }

  const updatedAsset = await prismaClient.asset.update({
    where: { id: idParams.id },
    data: { status: ASSET_STATUSES.INACTIVE, updatedBy: user.userId },
    select: assetSelect,
  });

  return { message: "Aset berhasil dinonaktifkan", data: updatedAsset };
};

const archive = async (unitKerjaId, id, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate asset ID
  const idParams = validate(assetIdSchema, { id });

  // Check if asset exists
  const existingAsset = await prismaClient.asset.findUnique({
    where: {
      id: idParams.id,
    },
  });

  if (!existingAsset) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Verify asset belongs to the specified unit kerja
  if (existingAsset.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  // Check if already archived
  if (existingAsset.status === ASSET_STATUSES.ARCHIVED) {
    throw new ResponseError(400, "Aset sudah diarsipkan.");
  }

  // Can't archive if ACTIVE (must deactivate first)
  if (existingAsset.status === ASSET_STATUSES.ACTIVE) {
    throw new ResponseError(
      400,
      "Tidak dapat mengarsipkan aset yang masih aktif. Nonaktifkan terlebih dahulu.",
    );
  }

  // Soft delete - update status to ARCHIVED
  const archivedAsset = await prismaClient.asset.update({
    where: { id: idParams.id },
    data: { status: ASSET_STATUSES.ARCHIVED, updatedBy: user.userId },
    select: assetSelect,
  });

  return { message: "Aset berhasil diarsipkan", data: archivedAsset };
};

export default {
  create,
  search,
  getById,
  update,
  setActive,
  setInactive,
  archive,
};
