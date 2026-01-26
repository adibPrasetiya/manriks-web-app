import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
  verifyWorksheetExists,
  verifyWorksheetExistsAndDraft,
  checkWorksheetOwnership,
  generateRiskItemCode,
} from "../utils/risk-assessment.utils.js";
import {
  getRiskLevelFromMatrix,
  validateLikelihoodImpact,
  verifyRiskCategoryExists,
  verifyAssetExists,
  validateTreatmentOption,
} from "../utils/risk-calculation.utils.js";
import {
  unitKerjaIdSchema,
  worksheetIdSchema,
  createRiskAssessmentItemSchema,
  updateRiskAssessmentItemSchema,
  searchRiskAssessmentItemSchema,
  itemIdSchema,
} from "../validations/risk-assessment-item.validation.js";

const itemSelect = {
  id: true,
  worksheetId: true,
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

const create = async (unitKerjaId, worksheetId, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists and status as DRAFT
  const worksheet = await verifyWorksheetExistsAndDraft(
    worksheetId,
    unitKerjaId,
  );

  // Check worksheet ownership
  checkWorksheetOwnership(worksheet, user.userId, "menambah item risiko");

  // Validate request body
  reqBody = validate(createRiskAssessmentItemSchema, reqBody);

  const { konteks, unitKerja } = worksheet;
  const { matrixSize, riskAppetiteLevel } = konteks;

  // Validate likelihood and impact values
  validateLikelihoodImpact(
    matrixSize,
    reqBody.inherentLikelihood,
    reqBody.inherentImpact,
  );
  validateLikelihoodImpact(
    matrixSize,
    reqBody.residualLikelihood,
    reqBody.residualImpact,
  );

  // Verify risk category belongs to konteks
  await verifyRiskCategoryExists(reqBody.riskCategoryId, konteks.id);

  // Verify asset if provided
  if (reqBody.assetId) {
    await verifyAssetExists(reqBody.assetId, unitKerjaId);
  }

  // Calculate risk levels from matrix
  const inherentRiskLevel = await getRiskLevelFromMatrix(
    konteks.id,
    reqBody.inherentLikelihood,
    reqBody.inherentImpact,
  );
  const residualRiskLevel = await getRiskLevelFromMatrix(
    konteks.id,
    reqBody.residualLikelihood,
    reqBody.residualImpact,
  );

  // Validate treatment option against risk appetite
  validateTreatmentOption(
    reqBody.treatmentOption,
    residualRiskLevel,
    riskAppetiteLevel,
  );

  // Generate risk code
  const riskCode = await generateRiskItemCode(worksheetId);

  // Create item
  const item = await prismaClient.riskAssessmentItem.create({
    data: {
      worksheetId,
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

const search = async (unitKerjaId, worksheetId, queryParams, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  //check unit kerja ada
  await verifyUnitKerjaExists(unitKerjaId);

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Validate query params
  const params = validate(searchRiskAssessmentItemSchema, queryParams);
  const {
    riskName,
    riskCategoryId,
    inherentRiskLevel,
    residualRiskLevel,
    page,
    limit,
  } = params;

  const where = { worksheetId };

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

const getById = async (unitKerjaId, worksheetId, itemId, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Get item
  const item = await prismaClient.riskAssessmentItem.findUnique({
    where: { id: itemParams.itemId },
    select: itemSelect,
  });

  if (!item) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  if (item.worksheetId !== worksheetId) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  return {
    message: "Item risiko berhasil ditemukan",
    data: item,
  };
};

const update = async (unitKerjaId, worksheetId, itemId, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify worksheet exists and is ACTIVE
  const worksheet = await verifyWorksheetExistsAndDraft(
    worksheetId,
    unitKerjaId,
  );

  // Check worksheet ownership
  checkWorksheetOwnership(worksheet, user.userId, "mengubah item risiko");

  // Validate request body
  reqBody = validate(updateRiskAssessmentItemSchema, reqBody);

  // Get existing item
  const existingItem = await prismaClient.riskAssessmentItem.findUnique({
    where: { id: itemParams.itemId },
  });

  if (!existingItem) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  if (existingItem.worksheetId !== worksheetId) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  const { konteks } = worksheet;
  const { matrixSize, riskAppetiteLevel } = konteks;

  // Prepare update data
  const updateData = { ...reqBody };

  // Validate and recalculate inherent risk level if likelihood/impact changed
  const inherentLikelihood =
    reqBody.inherentLikelihood ?? existingItem.inherentLikelihood;
  const inherentImpact = reqBody.inherentImpact ?? existingItem.inherentImpact;

  if (
    reqBody.inherentLikelihood !== undefined ||
    reqBody.inherentImpact !== undefined
  ) {
    validateLikelihoodImpact(matrixSize, inherentLikelihood, inherentImpact);
    updateData.inherentRiskLevel = await getRiskLevelFromMatrix(
      konteks.id,
      inherentLikelihood,
      inherentImpact,
    );
  }

  // Validate and recalculate residual risk level if likelihood/impact changed
  const residualLikelihood =
    reqBody.residualLikelihood ?? existingItem.residualLikelihood;
  const residualImpact = reqBody.residualImpact ?? existingItem.residualImpact;

  let residualRiskLevel = existingItem.residualRiskLevel;

  if (
    reqBody.residualLikelihood !== undefined ||
    reqBody.residualImpact !== undefined
  ) {
    validateLikelihoodImpact(matrixSize, residualLikelihood, residualImpact);
    residualRiskLevel = await getRiskLevelFromMatrix(
      konteks.id,
      residualLikelihood,
      residualImpact,
    );
    updateData.residualRiskLevel = residualRiskLevel;
  }

  // Validate treatment option against risk appetite
  const treatmentOption =
    reqBody.treatmentOption ?? existingItem.treatmentOption;
  validateTreatmentOption(
    treatmentOption,
    residualRiskLevel,
    riskAppetiteLevel,
  );

  // Verify risk category if changed
  if (reqBody.riskCategoryId !== undefined) {
    await verifyRiskCategoryExists(reqBody.riskCategoryId, konteks.id);
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

const remove = async (unitKerjaId, worksheetId, itemId, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const itemParams = validate(itemIdSchema, { itemId });

  // Check unit kerja access
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify worksheet exists and is ACTIVE
  const worksheet = await verifyWorksheetExistsAndDraft(
    worksheetId,
    unitKerjaId,
  );

  // Check worksheet ownership
  checkWorksheetOwnership(worksheet, user.userId, "menghapus item risiko");

  // Get existing item
  const existingItem = await prismaClient.riskAssessmentItem.findUnique({
    where: { id: itemParams.itemId },
  });

  if (!existingItem) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  if (existingItem.worksheetId !== worksheetId) {
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
