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
  getRiskLevelFromMatrix,
  validateLikelihoodImpact,
} from "../utils/risk-calculation.utils.js";
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
  // Proposed Residual Risk
  proposedResidualLikelihood: true,
  proposedResidualImpact: true,
  proposedResidualLikelihoodDescription: true,
  proposedResidualImpactDescription: true,
  proposedResidualRiskLevel: true,
  // Validation
  validationStatus: true,
  validatedAt: true,
  validatedBy: true,
  validator: {
    select: { id: true, name: true, username: true },
  },
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

  // Get konteks for risk level calculation
  const { konteks } = worksheet;
  const { matrixSize } = konteks;

  // Validate proposed residual likelihood and impact
  validateLikelihoodImpact(
    matrixSize,
    reqBody.proposedResidualLikelihood,
    reqBody.proposedResidualImpact,
  );

  // Calculate proposed residual risk level
  const proposedResidualRiskLevel = await getRiskLevelFromMatrix(
    konteks.id,
    reqBody.proposedResidualLikelihood,
    reqBody.proposedResidualImpact,
  );

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
      // Proposed Residual Risk
      proposedResidualLikelihood: reqBody.proposedResidualLikelihood,
      proposedResidualImpact: reqBody.proposedResidualImpact,
      proposedResidualLikelihoodDescription:
        reqBody.proposedResidualLikelihoodDescription || null,
      proposedResidualImpactDescription:
        reqBody.proposedResidualImpactDescription || null,
      proposedResidualRiskLevel,
      createdBy: user.userId,
    },
    select: mitigationSelect,
  });

  serviceLogger.security(ACTION_TYPES.MITIGATION_CREATED, {
    userId: user.userId,
    createdData: mitigation,
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

  // Prepare update data
  const updateData = { ...reqBody };

  // If proposed residual likelihood or impact is being updated, recalculate risk level
  if (
    reqBody.proposedResidualLikelihood !== undefined ||
    reqBody.proposedResidualImpact !== undefined
  ) {
    const { konteks } = worksheet;
    const { matrixSize } = konteks;

    const proposedResidualLikelihood =
      reqBody.proposedResidualLikelihood ??
      existingMitigation.proposedResidualLikelihood;
    const proposedResidualImpact =
      reqBody.proposedResidualImpact ??
      existingMitigation.proposedResidualImpact;

    // Validate proposed residual values
    validateLikelihoodImpact(
      matrixSize,
      proposedResidualLikelihood,
      proposedResidualImpact,
    );

    // Recalculate proposed residual risk level
    updateData.proposedResidualRiskLevel = await getRiskLevelFromMatrix(
      konteks.id,
      proposedResidualLikelihood,
      proposedResidualImpact,
    );
  }

  // Update mitigation
  const mitigation = await prismaClient.riskMitigation.update({
    where: { id: mitigationId },
    data: {
      ...updateData,
      updatedBy: user.userId,
    },
    select: mitigationSelect,
  });

  serviceLogger.security(ACTION_TYPES.MITIGATION_UPDATED, {
    riskMitigationId: mitigationId,
    updatedData: reqBody,
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

  serviceLogger.security(ACTION_TYPES.MITIGATION_DELETED, {
    mitigationId: mitigationId,
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
  if (existingMitigation.validationStatus === "VALIDATED") {
    throw new ResponseError(400, "Mitigasi sudah divalidasi sebelumnya.");
  }

  // chek if already rejection
  if (existingMitigation.validationStatus === "REJECTED") {
    throw new ResponseError(400, "Mitigasi sudah ditolak sebelumnya");
  }

  // Validate request body
  reqBody = validate(validateMitigationSchema, reqBody);

  // Use transaction to:
  // 1. Update mitigation status to VALIDATED
  // 2. Update RiskAssessmentItem residual values from proposed values
  const [mitigation] = await prismaClient.$transaction([
    prismaClient.riskMitigation.update({
      where: { id: mitigationId },
      data: {
        validationStatus: "VALIDATED",
        isValidated: true,
        validatedAt: new Date(),
        validatedBy: user.userId,
        validationNotes: reqBody.validationNotes || null,
        updatedBy: user.userId,
      },
      select: mitigationSelect,
    }),
    prismaClient.riskAssessmentItem.update({
      where: { id: itemId },
      data: {
        residualLikelihood: existingMitigation.proposedResidualLikelihood,
        residualImpact: existingMitigation.proposedResidualImpact,
        residualLikelihoodDescription:
          existingMitigation.proposedResidualLikelihoodDescription,
        residualImpactDescription:
          existingMitigation.proposedResidualImpactDescription,
        residualRiskLevel: existingMitigation.proposedResidualRiskLevel,
        additionalControl: existingMitigation.name,
      },
    }),
  ]);

  serviceLogger.security(ACTION_TYPES.MITIGATION_COMPLETED, {
    validatedBy: user.userId,
    mitigationId,
    itemId,
    residualUpdated: {
      residualLikelihood: existingMitigation.proposedResidualLikelihood,
      residualImpact: existingMitigation.proposedResidualImpact,
      residualRiskLevel: existingMitigation.proposedResidualRiskLevel,
    },
  });

  return {
    message:
      "Mitigasi risiko berhasil divalidasi dan residual risk item diperbarui",
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
  if (existingMitigation.validationStatus === "VALIDATED") {
    throw new ResponseError(
      400,
      "Mitigasi yang sudah divalidasi tidak dapat ditolak.",
    );
  }

  // check if already rejected
  if (existingMitigation.validationStatus === "REJECTED") {
    throw new ResponseError(400, "Mitigasi sudah di tolak tidak bisa ditolak");
  }

  // Validate request body
  reqBody = validate(rejectMitigationSchema, reqBody);

  // Reject mitigation - track WHO and WHEN rejected
  const mitigation = await prismaClient.riskMitigation.update({
    where: { id: mitigationId },
    data: {
      validationStatus: "REJECTED",
      isValidated: false,
      validatedAt: new Date(),
      validatedBy: user.userId,
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
  const { unitKerjaId, priority, validationStatus, page, limit } = params;

  const where = {
    validationStatus: validationStatus || "PENDING",
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

const resubmitMitigation = async (
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

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists and is DRAFT
  await verifyWorksheetExistsAndDraft(worksheetId, unitKerjaId);

  // Verify item exists
  await verifyItemExists(itemId, worksheetId);

  // Verify mitigation exists
  const existingMitigation = await verifyMitigationExists(mitigationId, itemId);

  // Can only resubmit if currently REJECTED
  if (existingMitigation.validationStatus !== "REJECTED") {
    throw new ResponseError(
      400,
      "Hanya mitigasi yang ditolak yang dapat diajukan ulang.",
    );
  }

  // Reset to PENDING status
  const mitigation = await prismaClient.riskMitigation.update({
    where: { id: mitigationId },
    data: {
      validationStatus: "PENDING",
      isValidated: false,
      validatedAt: null,
      validatedBy: null,
      validationNotes: null,
      updatedBy: user.userId,
    },
    select: mitigationSelect,
  });

  serviceLogger.security(ACTION_TYPES.MITIGATION_UPDATED, {
    mitigationId,
    action: "resubmit",
    resubmittedBy: user.userId,
  });

  return {
    message: "Mitigasi risiko berhasil diajukan ulang untuk validasi",
    data: mitigation,
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
  resubmit: resubmitMitigation,
  getPendingValidations,
};
