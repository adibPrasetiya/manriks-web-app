import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { RISK_ASSESSMENT_STATUSES } from "../config/constant.js";
import {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
  verifyWorksheetExistsAndActive,
  verifyWorksheetExists,
  verifyAssessmentExists,
  checkAssessmentEditable,
  checkAssessmentOwnership,
  generateAssessmentCode,
  checkKomitePusatRole,
} from "../utils/risk-assessment.utils.js";
import {
  createRiskAssessmentSchema,
  updateRiskAssessmentSchema,
  searchRiskAssessmentSchema,
  unitKerjaIdSchema,
  worksheetIdSchema,
  assessmentIdSchema,
  rejectRiskAssessmentSchema,
  approveRiskAssessmentSchema,
} from "../validations/risk-assessment.validation.js";

const assessmentSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  assessmentDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  submittedAt: true,
  submittedBy: true,
  reviewedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  worksheet: {
    select: {
      id: true,
      name: true,
      konteks: {
        select: {
          id: true,
          name: true,
          code: true,
          matrixSize: true,
          periodStart: true,
          periodEnd: true,
        },
      },
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
    },
  },
  _count: { select: { items: true } },
};

const create = async (unitKerjaId, worksheetId, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  // Check unit kerja access (PENGELOLA_RISIKO_UKER only)
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify unit kerja exists
  await verifyUnitKerjaExists(unitKerjaId);

  // Verify worksheet exists and is ACTIVE
  const worksheet = await verifyWorksheetExistsAndActive(worksheetId, unitKerjaId);

  // Validate request body
  reqBody = validate(createRiskAssessmentSchema, reqBody);

  // Generate assessment code
  const code = await generateAssessmentCode(worksheetId, worksheet.unitKerja.code);

  // Create assessment
  const assessment = await prismaClient.riskAssessment.create({
    data: {
      worksheetId,
      code,
      name: reqBody.name,
      description: reqBody.description || null,
      assessmentDate: reqBody.assessmentDate || new Date(),
      status: RISK_ASSESSMENT_STATUSES.DRAFT,
      createdBy: user.userId,
    },
    select: assessmentSelect,
  });

  return {
    message: "Risk assessment berhasil dibuat",
    data: assessment,
  };
};

const search = async (unitKerjaId, worksheetId, queryParams, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Validate query params
  const params = validate(searchRiskAssessmentSchema, queryParams);
  const { name, status, page, limit } = params;

  const where = { worksheetId };

  if (name) {
    where.name = { contains: name };
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const totalItems = await prismaClient.riskAssessment.count({ where });

  const assessments = await prismaClient.riskAssessment.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    message: "Risk assessment berhasil ditemukan",
    data: assessments,
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

const getById = async (unitKerjaId, worksheetId, id, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const idParams = validate(assessmentIdSchema, { id });

  // Check unit kerja access (allow KOMITE_PUSAT)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Get assessment
  const assessment = await prismaClient.riskAssessment.findUnique({
    where: { id: idParams.id },
    select: assessmentSelect,
  });

  if (!assessment) {
    throw new ResponseError(404, "Risk assessment tidak ditemukan.");
  }

  if (assessment.worksheet.id !== worksheetId) {
    throw new ResponseError(404, "Risk assessment tidak ditemukan.");
  }

  return {
    message: "Risk assessment berhasil ditemukan",
    data: assessment,
  };
};

const update = async (unitKerjaId, worksheetId, id, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const idParams = validate(assessmentIdSchema, { id });

  // Check unit kerja access (PENGELOLA_RISIKO_UKER only)
  checkUnitKerjaAccess(user, unitKerjaId);

  // Validate request body
  reqBody = validate(updateRiskAssessmentSchema, reqBody);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(idParams.id, worksheetId);

  // Check if editable
  checkAssessmentEditable(assessment);

  // Check ownership
  checkAssessmentOwnership(assessment, user.userId, "mengubah assessment");

  // Update assessment
  const updatedAssessment = await prismaClient.riskAssessment.update({
    where: { id: idParams.id },
    data: {
      ...reqBody,
      updatedBy: user.userId,
    },
    select: assessmentSelect,
  });

  return {
    message: "Risk assessment berhasil diperbarui",
    data: updatedAssessment,
  };
};

const submit = async (unitKerjaId, worksheetId, id, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const idParams = validate(assessmentIdSchema, { id });

  // Check unit kerja access (PENGELOLA_RISIKO_UKER only)
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(idParams.id, worksheetId);

  // Check if editable (DRAFT or REJECTED)
  checkAssessmentEditable(assessment);

  // Check ownership
  checkAssessmentOwnership(assessment, user.userId, "mengajukan assessment");

  // Check if has at least 1 item
  if (assessment._count.items === 0) {
    throw new ResponseError(
      400,
      "Tidak dapat mengajukan assessment tanpa item risiko. Tambahkan minimal 1 item risiko."
    );
  }

  // Update status to SUBMITTED
  const submittedAssessment = await prismaClient.riskAssessment.update({
    where: { id: idParams.id },
    data: {
      status: RISK_ASSESSMENT_STATUSES.SUBMITTED,
      submittedAt: new Date(),
      submittedBy: user.userId,
      updatedBy: user.userId,
    },
    select: assessmentSelect,
  });

  return {
    message: "Risk assessment berhasil diajukan untuk review",
    data: submittedAssessment,
  };
};

const approve = async (unitKerjaId, worksheetId, id, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const idParams = validate(assessmentIdSchema, { id });

  // Check KOMITE_PUSAT role
  checkKomitePusatRole(user);

  // Validate request body
  reqBody = validate(approveRiskAssessmentSchema, reqBody);

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(idParams.id, worksheetId);

  // Check status is SUBMITTED or IN_REVIEW
  if (
    assessment.status !== RISK_ASSESSMENT_STATUSES.SUBMITTED &&
    assessment.status !== RISK_ASSESSMENT_STATUSES.IN_REVIEW
  ) {
    throw new ResponseError(
      400,
      `Tidak dapat menyetujui assessment dengan status ${assessment.status}.`
    );
  }

  // Update status to APPROVED
  const approvedAssessment = await prismaClient.riskAssessment.update({
    where: { id: idParams.id },
    data: {
      status: RISK_ASSESSMENT_STATUSES.APPROVED,
      reviewedAt: new Date(),
      reviewedBy: user.userId,
      reviewNotes: reqBody.reviewNotes || null,
      updatedBy: user.userId,
    },
    select: assessmentSelect,
  });

  return {
    message: "Risk assessment berhasil disetujui",
    data: approvedAssessment,
  };
};

const reject = async (unitKerjaId, worksheetId, id, reqBody, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const idParams = validate(assessmentIdSchema, { id });

  // Check KOMITE_PUSAT role
  checkKomitePusatRole(user);

  // Validate request body (reviewNotes required)
  reqBody = validate(rejectRiskAssessmentSchema, reqBody);

  // Verify worksheet exists
  await verifyWorksheetExists(worksheetId, unitKerjaId);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(idParams.id, worksheetId);

  // Check status is SUBMITTED or IN_REVIEW
  if (
    assessment.status !== RISK_ASSESSMENT_STATUSES.SUBMITTED &&
    assessment.status !== RISK_ASSESSMENT_STATUSES.IN_REVIEW
  ) {
    throw new ResponseError(
      400,
      `Tidak dapat menolak assessment dengan status ${assessment.status}.`
    );
  }

  // Update status to REJECTED
  const rejectedAssessment = await prismaClient.riskAssessment.update({
    where: { id: idParams.id },
    data: {
      status: RISK_ASSESSMENT_STATUSES.REJECTED,
      reviewedAt: new Date(),
      reviewedBy: user.userId,
      reviewNotes: reqBody.reviewNotes,
      updatedBy: user.userId,
    },
    select: assessmentSelect,
  });

  return {
    message: "Risk assessment ditolak",
    data: rejectedAssessment,
  };
};

const archive = async (unitKerjaId, worksheetId, id, user) => {
  // Validate params
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  const worksheetParams = validate(worksheetIdSchema, { worksheetId });
  worksheetId = worksheetParams.worksheetId;

  const idParams = validate(assessmentIdSchema, { id });

  // Check unit kerja access (PENGELOLA_RISIKO_UKER only)
  checkUnitKerjaAccess(user, unitKerjaId);

  // Verify assessment exists
  const assessment = await verifyAssessmentExists(idParams.id, worksheetId);

  // Check ownership
  checkAssessmentOwnership(assessment, user.userId, "mengarsipkan assessment");

  // Already archived
  if (assessment.status === RISK_ASSESSMENT_STATUSES.ARCHIVED) {
    throw new ResponseError(400, "Assessment sudah diarsipkan.");
  }

  // Soft delete - update status to ARCHIVED
  const archivedAssessment = await prismaClient.riskAssessment.update({
    where: { id: idParams.id },
    data: {
      status: RISK_ASSESSMENT_STATUSES.ARCHIVED,
      updatedBy: user.userId,
    },
    select: assessmentSelect,
  });

  return {
    message: "Risk assessment berhasil diarsipkan",
    data: archivedAssessment,
  };
};

export default {
  create,
  search,
  getById,
  update,
  submit,
  approve,
  reject,
  archive,
};
