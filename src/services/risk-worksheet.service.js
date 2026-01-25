import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { RISK_WORKSHEET_STATUSES } from "../config/constant.js";
import {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
  verifyKonteksExistsAndActive,
  checkActiveWorksheetLimit,
  checkWorksheetOwnership,
} from "../utils/risk-worksheet.utils.js";
import {
  createRiskWorksheetSchema,
  updateRiskWorksheetSchema,
  searchRiskWorksheetSchema,
  unitKerjaIdSchema,
  worksheetIdSchema,
} from "../validations/risk-worksheet.validation.js";

const create = async (unitKerjaId, reqBody, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Validate request body
  reqBody = validate(createRiskWorksheetSchema, reqBody);

  // Verify konteks exists and is active
  await verifyKonteksExistsAndActive(reqBody.konteksId);

  // Check unique name per unit kerja per konteks
  const existingName = await prismaClient.riskWorksheet.findFirst({
    where: {
      unitKerjaId,
      konteksId: reqBody.konteksId,
      name: reqBody.name,
    },
  });

  if (existingName) {
    throw new ResponseError(
      409,
      `Nama kertas kerja "${reqBody.name}" sudah digunakan untuk konteks ini.`,
    );
  }

  // If status is ACTIVE, check the limit
  if (reqBody.status === RISK_WORKSHEET_STATUSES.ACTIVE) {
    await checkActiveWorksheetLimit(unitKerjaId, reqBody.konteksId);
  }

  // Create worksheet
  const worksheet = await prismaClient.riskWorksheet.create({
    data: {
      unitKerjaId,
      konteksId: reqBody.konteksId,
      ownerId: user.userId,
      name: reqBody.name,
      description: reqBody.description || null,
      status: reqBody.status,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  return {
    message: "Kertas kerja risiko berhasil dibuat",
    data: worksheet,
  };
};

const search = async (unitKerjaId, queryParams, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Validate query params
  const params = validate(searchRiskWorksheetSchema, queryParams);
  const { name, konteksId, status, page, limit } = params;

  const where = { unitKerjaId };

  if (name) {
    where.name = { contains: name };
  }

  if (konteksId) {
    where.konteksId = konteksId;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.riskWorksheet.count({ where });

  const worksheets = await prismaClient.riskWorksheet.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      konteks: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Kertas kerja risiko berhasil ditemukan",
    data: worksheets,
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

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  const worksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: idParams.id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  if (!worksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Verify worksheet belongs to the specified unit kerja
  if (worksheet.unitKerja.id !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  return {
    message: "Kertas kerja risiko berhasil ditemukan",
    data: worksheet,
  };
};

const update = async (unitKerjaId, id, reqBody, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  // Validate request body
  reqBody = validate(updateRiskWorksheetSchema, reqBody);

  // Check if worksheet exists
  const existingWorksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: idParams.id },
  });

  if (!existingWorksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Verify worksheet belongs to the specified unit kerja
  if (existingWorksheet.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Cannot update archived worksheet
  if (existingWorksheet.status === RISK_WORKSHEET_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat mengubah kertas kerja yang sudah diarsipkan.",
    );
  }

  if (existingWorksheet.status === RISK_WORKSHEET_STATUSES.ACTIVE) {
    throw new ResponseError(
      400,
      "Tidak daya mengubah kertas kerja yang sudah diaktifkan.",
    );
  }

  // If updating name, check uniqueness
  if (reqBody.name && reqBody.name !== existingWorksheet.name) {
    const existingName = await prismaClient.riskWorksheet.findFirst({
      where: {
        unitKerjaId,
        konteksId: existingWorksheet.konteksId,
        name: reqBody.name,
        id: { not: idParams.id },
      },
    });

    if (existingName) {
      throw new ResponseError(
        409,
        `Nama kertas kerja "${reqBody.name}" sudah digunakan untuk konteks ini.`,
      );
    }
  }

  // Update worksheet
  const updatedWorksheet = await prismaClient.riskWorksheet.update({
    where: { id: idParams.id },
    data: reqBody,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  return {
    message: "Kertas kerja risiko berhasil diperbarui",
    data: updatedWorksheet,
  };
};

const setActive = async (unitKerjaId, id, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  // Check if worksheet exists
  const existingWorksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: idParams.id },
  });

  if (!existingWorksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Verify worksheet belongs to the specified unit kerja
  if (existingWorksheet.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Only owner can change status
  checkWorksheetOwnership(
    existingWorksheet,
    user.id,
    "mengaktifkan kertas kerja",
  );

  // Cannot activate archived worksheet
  if (existingWorksheet.status === RISK_WORKSHEET_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat mengaktifkan kertas kerja yang sudah diarsipkan.",
    );
  }

  // Already active
  if (existingWorksheet.status === RISK_WORKSHEET_STATUSES.ACTIVE) {
    throw new ResponseError(400, "Kertas kerja sudah aktif.");
  }

  // Check the limit - only 1 active per konteks per unit kerja
  await checkActiveWorksheetLimit(
    unitKerjaId,
    existingWorksheet.konteksId,
    idParams.id,
  );

  // Update status to ACTIVE
  const updatedWorksheet = await prismaClient.riskWorksheet.update({
    where: { id: idParams.id },
    data: { status: RISK_WORKSHEET_STATUSES.ACTIVE },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  return {
    message: "Kertas kerja risiko berhasil diaktifkan",
    data: updatedWorksheet,
  };
};

const setInactive = async (unitKerjaId, id, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  // Check if worksheet exists
  const existingWorksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: idParams.id },
  });

  if (!existingWorksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Verify worksheet belongs to the specified unit kerja
  if (existingWorksheet.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Only owner can change status
  checkWorksheetOwnership(
    existingWorksheet,
    user.id,
    "menonaktifkan kertas kerja",
  );

  // Cannot deactivate archived worksheet
  if (existingWorksheet.status === RISK_WORKSHEET_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      "Tidak dapat menonaktifkan kertas kerja yang sudah diarsipkan.",
    );
  }

  // Already inactive
  if (existingWorksheet.status === RISK_WORKSHEET_STATUSES.INACTIVE) {
    throw new ResponseError(400, "Kertas kerja sudah tidak aktif.");
  }

  // Update status to INACTIVE
  const updatedWorksheet = await prismaClient.riskWorksheet.update({
    where: { id: idParams.id },
    data: { status: RISK_WORKSHEET_STATUSES.INACTIVE },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  return {
    message: "Kertas kerja risiko berhasil dinonaktifkan",
    data: updatedWorksheet,
  };
};

const archive = async (unitKerjaId, id, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  // Check if worksheet exists
  const existingWorksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: idParams.id },
  });

  if (!existingWorksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Verify worksheet belongs to the specified unit kerja
  if (existingWorksheet.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Only owner can archive
  checkWorksheetOwnership(
    existingWorksheet,
    user.id,
    "mengarsipkan kertas kerja",
  );

  // Already archived
  if (existingWorksheet.status === RISK_WORKSHEET_STATUSES.ARCHIVED) {
    throw new ResponseError(400, "Kertas kerja sudah diarsipkan.");
  }

  // Soft delete - update status to ARCHIVED
  const archivedWorksheet = await prismaClient.riskWorksheet.update({
    where: { id: idParams.id },
    data: { status: RISK_WORKSHEET_STATUSES.ARCHIVED },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  return {
    message: "Kertas kerja risiko berhasil diarsipkan",
    data: archivedWorksheet,
  };
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
