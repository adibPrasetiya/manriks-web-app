import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { ROLES } from "../config/constant.js";
import {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
  verifyWorksheetExists,
  verifyWorksheetExistsAndDraft,
  checkWorksheetOwnership,
  verifyItemExists,
  verifyMitigationExists,
  checkMitigationModifiable,
  generateMitigationCode,
} from "../utils/risk-mitigation.utils.js";
import {
  unitKerjaIdSchema,
  worksheetIdSchema,
  itemIdSchema,
} from "../validations/risk-assessment-item.validation.js";
import {
  mitigationIdSchema,
  createMitigationSchema,
  updateMitigationSchema,
  searchMitigationSchema,
  validateMitigationSchema,
  rejectMitigationSchema,
  pendingValidationSearchSchema,
} from "../validations/risk-mitigation.validation.js";
import { createServiceLogger, ACTION_TYPES } from "../utils/logger.utils.js";

const serviceLogger = createServiceLogger("RiskMitigationService");

const mitigationSelect = {
  id: true,
  itemId: true,
  code: true,
  name: true,
  description: true,
  priority: true,
  plannedStartDate: true,
  plannedEndDate: true,
  actualStartDate: true,
  actualEndDate: true,
  responsiblePerson: true,
  responsibleUnit: true,
  status: true,
  progressPercentage: true,
  progressNotes: true,
  validatedAt: true,
  validatedBy: true,
  validationNotes: true,
  isValidated: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
};

const create = async (unitKerjaId, worksheetId, itemId, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });
  itemId = itemParams.itemId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists and is DRAFT
  const worksheet = await verifyWorksheetExistsAndDraft(
    worksheetId,
    unitKerjaId,
  );

  // Check worksheet ownership
  // checkWorksheetOwnership(worksheet, user.userId, "menambah mitigasi risiko");

  // Verify item exists and belongs to worksheet
  await verifyItemExists(itemId, worksheetId);

  // Validate request body
  reqBody = validate(createMitigationSchema, reqBody);

  // Generate mitigation code
  const code = await generateMitigationCode(itemId);

  // Create mitigation
  const mitigation = await prismaClient.riskMitigation.create({
    data: {
      itemId,
      code,
      name: reqBody.name,
      description: reqBody.description || null,
      priority: reqBody.priority,
      plannedStartDate: reqBody.plannedStartDate || null,
      plannedEndDate: reqBody.plannedEndDate || null,
      responsiblePerson: reqBody.responsiblePerson || null,
      responsibleUnit: reqBody.responsibleUnit || null,
      createdBy: user.userId,
    },
    select: mitigationSelect,
  });

  return {
    message: "Mitigasi risiko berhasil ditambahkan",
    data: mitigation,
  };
};

const search = async (unitKerjaId, worksheetId, itemId, queryParams, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });
  itemId = itemParams.itemId;

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify item exists
  await verifyItemExists(itemId, worksheetId);

  // Validate query params
  const params = validate(searchMitigationSchema, queryParams);
  const { name, priority, status, isValidated, page, limit } = params;

  const where = { itemId };

  if (name) {
    where.name = { contains: name };
  }

  if (priority) {
    where.priority = priority;
  }

  if (status) {
    where.status = status;
  }

  if (isValidated !== undefined) {
    where.isValidated = isValidated;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.riskMitigation.count({ where });

  const mitigations = await prismaClient.riskMitigation.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "asc" },
    select: mitigationSelect,
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Mitigasi risiko berhasil ditemukan",
    data: mitigations,
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

const getById = async (
  unitKerjaId,
  worksheetId,
  itemId,
  mitigationId,
  user,
) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });
  itemId = itemParams.itemId;

  const mitigationParams = validate(mitigationIdSchema, { mitigationId });
  mitigationId = mitigationParams.mitigationId;

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify item exists
  await verifyItemExists(itemId, worksheetId);

  // Get mitigation
  const mitigation = await prismaClient.riskMitigation.findUnique({
    where: { id: mitigationId },
    select: mitigationSelect,
  });

  if (!mitigation) {
    throw new ResponseError(404, "Mitigasi risiko tidak ditemukan.");
  }

  if (mitigation.itemId !== itemId) {
    throw new ResponseError(404, "Mitigasi risiko tidak ditemukan.");
  }

  return {
    message: "Mitigasi risiko berhasil ditemukan",
    data: mitigation,
  };
};

const update = async (
  unitKerjaId,
  worksheetId,
  itemId,
  mitigationId,
  reqBody,
  user,
) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });
  itemId = itemParams.itemId;

  const mitigationParams = validate(mitigationIdSchema, { mitigationId });
  mitigationId = mitigationParams.mitigationId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists and is DRAFT
  const worksheet = await verifyWorksheetExistsAndDraft(
    worksheetId,
    unitKerjaId,
  );

  // Check worksheet ownership
  // checkWorksheetOwnership(worksheet, user.userId, "mengubah mitigasi risiko");

  // Verify item exists
  await verifyItemExists(itemId, worksheetId);

  // Verify mitigation exists
  const existingMitigation = await verifyMitigationExists(mitigationId, itemId);

  // Check mitigation can be modified
  checkMitigationModifiable(existingMitigation);

  // Validate request body
  reqBody = validate(updateMitigationSchema, reqBody);

  // Update mitigation
  const mitigation = await prismaClient.riskMitigation.update({
    where: { id: mitigationId },
    data: {
      ...reqBody,
      updatedBy: user.userId,
    },
    select: mitigationSelect,
  });

  return {
    message: "Mitigasi risiko berhasil diperbarui",
    data: mitigation,
  };
};

const remove = async (unitKerjaId, worksheetId, itemId, mitigationId, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });
  itemId = itemParams.itemId;

  const mitigationParams = validate(mitigationIdSchema, { mitigationId });
  mitigationId = mitigationParams.mitigationId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists and is DRAFT
  const worksheet = await verifyWorksheetExistsAndDraft(
    worksheetId,
    unitKerjaId,
  );

  // Check worksheet ownership
  checkWorksheetOwnership(worksheet, user.userId, "menghapus mitigasi risiko");

  // Verify item exists
  await verifyItemExists(itemId, worksheetId);

  // Verify mitigation exists
  const existingMitigation = await verifyMitigationExists(mitigationId, itemId);

  // Check mitigation can be modified
  checkMitigationModifiable(existingMitigation);

  // Delete mitigation
  await prismaClient.riskMitigation.delete({
    where: { id: mitigationId },
  });

  return {
    message: "Mitigasi risiko berhasil dihapus",
  };
};

const validateMitigation = async (
  unitKerjaId,
  worksheetId,
  itemId,
  mitigationId,
  reqBody,
  user,
) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });
  itemId = itemParams.itemId;

  const mitigationParams = validate(mitigationIdSchema, { mitigationId });
  mitigationId = mitigationParams.mitigationId;

  // KOMITE_PUSAT only - no unit kerja access check needed
  if (!user.roles.includes(ROLES.KOMITE_PUSAT)) {
    throw new ResponseError(
      403,
      "Akses ditolak. Hanya KOMITE_PUSAT yang dapat memvalidasi mitigasi.",
    );
  }

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify item exists
  await verifyItemExists(itemId, worksheetId);

  // Verify mitigation exists
  const existingMitigation = await verifyMitigationExists(mitigationId, itemId);

  // Check if already validated
  if (existingMitigation.isValidated) {
    throw new ResponseError(400, "Mitigasi sudah divalidasi sebelumnya.");
  }

  // Validate request body
  reqBody = validate(validateMitigationSchema, reqBody);

  // Validate mitigation
  const mitigation = await prismaClient.riskMitigation.update({
    where: { id: mitigationId },
    data: {
      isValidated: true,
      validatedAt: new Date(),
      validatedBy: user.userId,
      validationNotes: reqBody.validationNotes || null,
      updatedBy: user.userId,
    },
    select: mitigationSelect,
  });

  return {
    message: "Mitigasi risiko berhasil divalidasi",
    data: mitigation,
  };
};

const rejectMitigation = async (
  unitKerjaId,
  worksheetId,
  itemId,
  mitigationId,
  reqBody,
  user,
) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });
  itemId = itemParams.itemId;

  const mitigationParams = validate(mitigationIdSchema, { mitigationId });
  mitigationId = mitigationParams.mitigationId;

  // KOMITE_PUSAT only
  if (!user.roles.includes(ROLES.KOMITE_PUSAT)) {
    throw new ResponseError(
      403,
      "Akses ditolak. Hanya KOMITE_PUSAT yang dapat menolak mitigasi.",
    );
  }

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify item exists
  await verifyItemExists(itemId, worksheetId);

  // Verify mitigation exists
  const existingMitigation = await verifyMitigationExists(mitigationId, itemId);

  // Check if already validated
  if (existingMitigation.isValidated) {
    throw new ResponseError(
      400,
      "Mitigasi yang sudah divalidasi tidak dapat ditolak.",
    );
  }

  // Validate request body
  reqBody = validate(rejectMitigationSchema, reqBody);

  // Reject mitigation - keep isValidated as false, set notes
  const mitigation = await prismaClient.riskMitigation.update({
    where: { id: mitigationId },
    data: {
      validationNotes: reqBody.validationNotes,
      updatedBy: user.userId,
    },
    select: mitigationSelect,
  });

  return {
    message: "Mitigasi risiko berhasil ditolak",
    data: mitigation,
  };
};

const getPendingValidations = async (queryParams, user) => {
  // KOMITE_PUSAT only
  if (!user.roles.includes(ROLES.KOMITE_PUSAT)) {
    throw new ResponseError(
      403,
      "Akses ditolak. Hanya KOMITE_PUSAT yang dapat melihat daftar mitigasi pending.",
    );
  }

  // Validate query params
  const params = validate(pendingValidationSearchSchema, queryParams);
  const { unitKerjaId, priority, page, limit } = params;

  const where = {
    isValidated: false,
  };

  if (priority) {
    where.priority = priority;
  }

  // Filter by unit kerja if specified
  if (unitKerjaId) {
    where.item = {
      worksheet: {
        unitKerjaId,
      },
    };
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.riskMitigation.count({ where });

  const mitigations = await prismaClient.riskMitigation.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "asc" },
    select: {
      ...mitigationSelect,
      item: {
        select: {
          id: true,
          riskCode: true,
          riskName: true,
          worksheet: {
            select: {
              id: true,
              name: true,
              unitKerja: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Mitigasi pending validasi berhasil ditemukan",
    data: mitigations,
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

export default {
  create,
  search,
  getById,
  update,
  remove,
  validate: validateMitigation,
  reject: rejectMitigation,
  getPendingValidations,
};
