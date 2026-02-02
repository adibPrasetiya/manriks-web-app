import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { validate } from "../utils/validator.utils.js";
import { RISK_WORKSHEET_STATUSES, ROLES } from "../config/constant.js";
import {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
  verifyKonteksExistsAndActive,
  checkWorksheetOwnership,
} from "../utils/risk-worksheet.utils.js";
import {
  createRiskWorksheetSchema,
  updateRiskWorksheetSchema,
  searchRiskWorksheetSchema,
  unitKerjaIdSchema,
  worksheetIdSchema,
  approvalNotesSchema,
} from "../validations/risk-worksheet.validation.js";

const worksheetSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  submittedBy: true,
  approvedAt: true,
  approvedBy: true,
  approvalNotes: true,
  unitKerja: {
    select: { id: true, name: true, code: true },
  },
  konteks: {
    select: {
      id: true,
      name: true,
      code: true,
      riskAppetiteLevel: true,
      riskAppetiteDescription: true,
      status: true,
      periodStart: true,
      periodEnd: true,
    },
  },
  owner: {
    select: { id: true, name: true, username: true },
  },
  submitter: {
    select: { id: true, name: true, username: true },
  },
  approver: {
    select: { id: true, name: true, username: true },
  },
  _count: {
    select: { riskAssessmentItems: true },
  },
};

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

  // Create worksheet - always starts as DRAFT
  const worksheet = await prismaClient.riskWorksheet.create({
    data: {
      unitKerjaId,
      konteksId: reqBody.konteksId,
      ownerId: user.userId,
      name: reqBody.name,
      description: reqBody.description || null,
      status: RISK_WORKSHEET_STATUSES.DRAFT,
    },
    select: worksheetSelect,
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

  // Check unit kerja access (allow KOMITE_PUSAT to view all)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

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
    select: worksheetSelect,
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

  // Check unit kerja access (allow KOMITE_PUSAT to view)
  checkUnitKerjaAccess(user, unitKerjaId, { allowKomitePusat: true });

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  const worksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: idParams.id },
    select: worksheetSelect,
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

  checkWorksheetOwnership(
    existingWorksheet,
    user.userId,
    "mengedit data worksheet",
  );

  // Can only update DRAFT worksheets
  if (existingWorksheet.status !== RISK_WORKSHEET_STATUSES.DRAFT) {
    throw new ResponseError(
      403,
      "Hanya dapat mengubah kertas kerja dengan status DRAFT.",
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
    select: worksheetSelect,
  });

  return {
    message: "Kertas kerja risiko berhasil diperbarui",
    data: updatedWorksheet,
  };
};

/**
 * Submit worksheet for approval (DRAFT → SUBMITTED)
 * Only owner can submit
 */
const submit = async (unitKerjaId, id, user) => {
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
    include: {
      _count: { select: { riskAssessmentItems: true } },
    },
  });

  if (!existingWorksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Verify worksheet belongs to the specified unit kerja
  if (existingWorksheet.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  // Only owner can submit
  checkWorksheetOwnership(
    existingWorksheet,
    user.userId,
    "mengajukan kertas kerja",
  );

  // Can only submit DRAFT worksheets
  if (existingWorksheet.status !== RISK_WORKSHEET_STATUSES.DRAFT) {
    throw new ResponseError(
      400,
      "Hanya dapat mengajukan kertas kerja dengan status DRAFT.",
    );
  }

  // Must have at least 1 risk assessment item
  if (existingWorksheet._count.riskAssessmentItems === 0) {
    throw new ResponseError(
      400,
      "Kertas kerja harus memiliki minimal 1 item risiko sebelum diajukan.",
    );
  }

  // Update status to SUBMITTED
  const updatedWorksheet = await prismaClient.riskWorksheet.update({
    where: { id: idParams.id },
    data: {
      status: RISK_WORKSHEET_STATUSES.SUBMITTED,
      submittedAt: new Date(),
      submittedBy: user.userId,
    },
    select: worksheetSelect,
  });

  return {
    message: "Kertas kerja risiko berhasil diajukan untuk persetujuan",
    data: updatedWorksheet,
  };
};

/**
 * Approve worksheet (SUBMITTED → APPROVED)
 * Only KOMITE_PUSAT can approve
 */
const approve = async (unitKerjaId, id, reqBody, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  // Validate request body (optional approval notes)
  reqBody = validate(approvalNotesSchema, reqBody || {});

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

  // Can only approve SUBMITTED worksheets
  if (existingWorksheet.status !== RISK_WORKSHEET_STATUSES.SUBMITTED) {
    throw new ResponseError(
      400,
      "Hanya dapat menyetujui kertas kerja dengan status SUBMITTED.",
    );
  }

  // Update status to APPROVED
  const updatedWorksheet = await prismaClient.riskWorksheet.update({
    where: { id: idParams.id },
    data: {
      status: RISK_WORKSHEET_STATUSES.APPROVED,
      approvedAt: new Date(),
      approvedBy: user.userId,
      approvalNotes: reqBody.approvalNotes || null,
    },
    select: worksheetSelect,
  });

  return {
    message: "Kertas kerja risiko berhasil disetujui",
    data: updatedWorksheet,
  };
};

/**
 * Reject worksheet (SUBMITTED → DRAFT)
 * Only KOMITE_PUSAT can reject
 */
const reject = async (unitKerjaId, id, reqBody, user) => {
  // Validate unit kerja ID
  const unitKerjaParams = validate(unitKerjaIdSchema, { unitKerjaId });
  unitKerjaId = unitKerjaParams.unitKerjaId;

  // Check if user has KOMITE_PUSAT role
  if (!user.roles.includes(ROLES.KOMITE_PUSAT)) {
    throw new ResponseError(
      403,
      "Akses ditolak. Hanya KOMITE_PUSAT yang dapat menolak kertas kerja.",
    );
  }

  // Validate worksheet ID
  const idParams = validate(worksheetIdSchema, { id });

  // Validate request body (required rejection notes)
  reqBody = validate(approvalNotesSchema, reqBody || {});

  if (!reqBody.approvalNotes || reqBody.approvalNotes.trim().length < 10) {
    throw new ResponseError(
      400,
      "Alasan penolakan wajib diisi (minimal 10 karakter).",
    );
  }

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

  // Can only reject SUBMITTED worksheets
  if (existingWorksheet.status !== RISK_WORKSHEET_STATUSES.SUBMITTED) {
    throw new ResponseError(
      400,
      "Hanya dapat menolak kertas kerja dengan status SUBMITTED.",
    );
  }

  // Update status back to DRAFT
  const updatedWorksheet = await prismaClient.riskWorksheet.update({
    where: { id: idParams.id },
    data: {
      status: RISK_WORKSHEET_STATUSES.DRAFT,
      approvalNotes: reqBody.approvalNotes,
      // Clear submission tracking so owner can resubmit
      submittedAt: null,
      submittedBy: null,
    },
    select: worksheetSelect,
  });

  return {
    message: "Kertas kerja risiko ditolak dan dikembalikan ke DRAFT",
    data: updatedWorksheet,
  };
};

/**
 * Archive worksheet (any status except ARCHIVED → ARCHIVED)
 * Only owner can archive
 */
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
    user.userId,
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
    select: worksheetSelect,
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
  submit,
  approve,
  reject,
  archive,
};
