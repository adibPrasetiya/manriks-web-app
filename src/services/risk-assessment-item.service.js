import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
  verifyWorksheetExists,
  verifyAssessmentExists,
  checkAssessmentEditable,
  checkAssessmentOwnership,
} from "../utils/risk-assessment.utils.js";
import {
  getRiskLevelFromMatrix,
  validateLikelihoodImpact,
  verifyRiskCategoryExists,
  verifyAssetExists,
} from "../utils/risk-calculation.utils.js";
import {
  unitKerjaIdSchema,
  worksheetIdSchema,
} from "../validations/risk-assessment.validation.js";
import {
  createRiskAssessmentItemSchema,
  updateRiskAssessmentItemSchema,
  searchRiskAssessmentItemSchema,
  assessmentIdSchema,
  itemIdSchema,
} from "../validations/risk-assessment-item.validation.js";

const itemSelect = {
  id: true,
  riskCode: true,
  riskName: true,
  riskDescription: true,
  assetId: true,
  riskCategoryId: true,
  inherentLikelihood: true,
  inherentImpact: true,
  inherentRiskLevel: true,
  existingControls: true,
  controlEffectiveness: true,
  residualLikelihood: true,
  residualImpact: true,
  residualRiskLevel: true,
  treatmentOption: true,
  treatmentRationale: true,
  order: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Generate risk code - Format: R{SEQUENCE}
 */
const generateRiskCode = async (assessmentId) => {
  const count = await prismaClient.riskAssessmentItem.count({
    where: { assessmentId },
  });
  const sequence = String(count + 1).padStart(3, "0");
  return `R${sequence}`;
};

const create = async (unitKerjaId, worksheetId, assessmentId, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const assessmentParams = validate(assessmentIdSchema, { assessmentId });
  assessmentId = assessmentParams.assessmentId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists
  const worksheet = await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(assessmentId, worksheetId);

  // Check if editable
  checkAssessmentEditable(assessment);

  // Check ownership
  checkAssessmentOwnership(assessment, user.userId, "menambah item risiko");

  // Validate request body
  reqBody = validate(createRiskAssessmentItemSchema, reqBody);

  const matrixSize = worksheet.konteks.matrixSize;
  const konteksId = worksheet.konteks.id;

  // Validate likelihood and impact values
  validateLikelihoodImpact(matrixSize, reqBody.inherentLikelihood, reqBody.inherentImpact);
  validateLikelihoodImpact(matrixSize, reqBody.residualLikelihood, reqBody.residualImpact);

  // Verify risk category
  await verifyRiskCategoryExists(reqBody.riskCategoryId, konteksId);

  // Verify asset if provided
  if (reqBody.assetId) {
    await verifyAssetExists(reqBody.assetId, unitKerjaId);
  }

  // Calculate risk levels
  const inherentRiskLevel = await getRiskLevelFromMatrix(
    konteksId,
    reqBody.inherentLikelihood,
    reqBody.inherentImpact
  );
  const residualRiskLevel = await getRiskLevelFromMatrix(
    konteksId,
    reqBody.residualLikelihood,
    reqBody.residualImpact
  );

  // Generate risk code
  const riskCode = await generateRiskCode(assessmentId);

  // Create item
  const item = await prismaClient.riskAssessmentItem.create({
    data: {
      assessmentId,
      riskCode,
      riskName: reqBody.riskName,
      riskDescription: reqBody.riskDescription || null,
      assetId: reqBody.assetId || null,
      riskCategoryId: reqBody.riskCategoryId,
      inherentLikelihood: reqBody.inherentLikelihood,
      inherentImpact: reqBody.inherentImpact,
      inherentRiskLevel,
      existingControls: reqBody.existingControls || null,
      controlEffectiveness: reqBody.controlEffectiveness || null,
      residualLikelihood: reqBody.residualLikelihood,
      residualImpact: reqBody.residualImpact,
      residualRiskLevel,
      treatmentOption: reqBody.treatmentOption || null,
      treatmentRationale: reqBody.treatmentRationale || null,
      order: reqBody.order,
    },
    select: itemSelect,
  });

  return {
    message: "Item risiko berhasil ditambahkan",
    data: item,
  };
};

const search = async (unitKerjaId, worksheetId, assessmentId, queryParams, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const assessmentParams = validate(assessmentIdSchema, { assessmentId });
  assessmentId = assessmentParams.assessmentId;

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify assessment exists
  await verifyAssessmentExists(assessmentId, worksheetId);

  // Validate query params
  const params = validate(searchRiskAssessmentItemSchema, queryParams);
  const { riskName, riskCategoryId, inherentRiskLevel, residualRiskLevel, page, limit } = params;

  const where = { assessmentId };

  if (riskName) {
    where.riskName = { contains: riskName };
  }

  if (riskCategoryId) {
    where.riskCategoryId = riskCategoryId;
  }

  if (inherentRiskLevel) {
    where.inherentRiskLevel = inherentRiskLevel;
  }

  if (residualRiskLevel) {
    where.residualRiskLevel = residualRiskLevel;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.riskAssessmentItem.count({ where });

  const items = await prismaClient.riskAssessmentItem.findMany({
    where,
    skip,
    take: limit,
    orderBy: { order: "asc" },
    select: itemSelect,
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Item risiko berhasil ditemukan",
    data: items,
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

const getById = async (unitKerjaId, worksheetId, assessmentId, itemId, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const assessmentParams = validate(assessmentIdSchema, { assessmentId });
  assessmentId = assessmentParams.assessmentId;

  const itemParams = validate(itemIdSchema, { itemId });

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify assessment exists
  await verifyAssessmentExists(assessmentId, worksheetId);

  // Get item
  const item = await prismaClient.riskAssessmentItem.findUnique({
    where: { id: itemParams.itemId },
    select: itemSelect,
  });

  if (!item) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  if (item.assessmentId !== assessmentId) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  return {
    message: "Item risiko berhasil ditemukan",
    data: item,
  };
};

const update = async (unitKerjaId, worksheetId, assessmentId, itemId, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const assessmentParams = validate(assessmentIdSchema, { assessmentId });
  assessmentId = assessmentParams.assessmentId;

  const itemParams = validate(itemIdSchema, { itemId });

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify worksheet exists
  const worksheet = await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(assessmentId, worksheetId);

  // Check if editable
  checkAssessmentEditable(assessment);

  // Check ownership
  checkAssessmentOwnership(assessment, user.userId, "mengubah item risiko");

  // Validate request body
  reqBody = validate(updateRiskAssessmentItemSchema, reqBody);

  // Get existing item
  const existingItem = await prismaClient.riskAssessmentItem.findUnique({
    where: { id: itemParams.itemId },
  });

  if (!existingItem) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  if (existingItem.assessmentId !== assessmentId) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  const matrixSize = worksheet.konteks.matrixSize;
  const konteksId = worksheet.konteks.id;

  // Prepare update data
  const updateData = { ...reqBody };

  // Validate and recalculate inherent risk level if likelihood/impact changed
  const inherentLikelihood = reqBody.inherentLikelihood ?? existingItem.inherentLikelihood;
  const inherentImpact = reqBody.inherentImpact ?? existingItem.inherentImpact;

  if (reqBody.inherentLikelihood !== undefined || reqBody.inherentImpact !== undefined) {
    validateLikelihoodImpact(matrixSize, inherentLikelihood, inherentImpact);
    updateData.inherentRiskLevel = await getRiskLevelFromMatrix(
      konteksId,
      inherentLikelihood,
      inherentImpact
    );
  }

  // Validate and recalculate residual risk level if likelihood/impact changed
  const residualLikelihood = reqBody.residualLikelihood ?? existingItem.residualLikelihood;
  const residualImpact = reqBody.residualImpact ?? existingItem.residualImpact;

  if (reqBody.residualLikelihood !== undefined || reqBody.residualImpact !== undefined) {
    validateLikelihoodImpact(matrixSize, residualLikelihood, residualImpact);
    updateData.residualRiskLevel = await getRiskLevelFromMatrix(
      konteksId,
      residualLikelihood,
      residualImpact
    );
  }

  // Verify asset if provided
  if (reqBody.assetId !== undefined && reqBody.assetId !== null) {
    await verifyAssetExists(reqBody.assetId, unitKerjaId);
  }

  // Update item
  const updatedItem = await prismaClient.riskAssessmentItem.update({
    where: { id: itemParams.itemId },
    data: updateData,
    select: itemSelect,
  });

  return {
    message: "Item risiko berhasil diperbarui",
    data: updatedItem,
  };
};

const remove = async (unitKerjaId, worksheetId, assessmentId, itemId, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const assessmentParams = validate(assessmentIdSchema, { assessmentId });
  assessmentId = assessmentParams.assessmentId;

  const itemParams = validate(itemIdSchema, { itemId });

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(assessmentId, worksheetId);

  // Check if editable
  checkAssessmentEditable(assessment);

  // Check ownership
  checkAssessmentOwnership(assessment, user.userId, "menghapus item risiko");

  // Get existing item
  const existingItem = await prismaClient.riskAssessmentItem.findUnique({
    where: { id: itemParams.itemId },
  });

  if (!existingItem) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  if (existingItem.assessmentId !== assessmentId) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  // Delete item
  await prismaClient.riskAssessmentItem.delete({
    where: { id: itemParams.itemId },
  });

  return {
    message: "Item risiko berhasil dihapus",
  };
};

export default {
  create,
  search,
  getById,
  update,
  remove,
};
