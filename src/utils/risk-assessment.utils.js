import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import {
  RISK_WORKSHEET_STATUSES,
  RISK_ASSESSMENT_STATUSES,
  ROLES,
} from "../config/constant.js";

// Re-export common functions from risk-worksheet.utils.js
export {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
} from "./risk-worksheet.utils.js";

/**
 * Verify worksheet exists, is active, and belongs to the unit kerja
 * Used when creating new assessment
 */
export const verifyWorksheetExistsAndActive = async (worksheetId, unitKerjaId) => {
  const worksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: worksheetId },
    include: {
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
  });

  if (!worksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  if (worksheet.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  if (worksheet.status !== RISK_WORKSHEET_STATUSES.ACTIVE) {
    throw new ResponseError(
      400,
      "Kertas kerja risiko tidak aktif. Hanya dapat membuat assessment untuk kertas kerja yang aktif."
    );
  }

  return worksheet;
};

/**
 * Verify worksheet exists and belongs to the unit kerja (without checking active status)
 */
export const verifyWorksheetExists = async (worksheetId, unitKerjaId) => {
  const worksheet = await prismaClient.riskWorksheet.findUnique({
    where: { id: worksheetId },
    include: {
      konteks: {
        select: { id: true, name: true, code: true, matrixSize: true },
      },
      unitKerja: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  if (!worksheet) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  if (worksheet.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(404, "Kertas kerja risiko tidak ditemukan.");
  }

  return worksheet;
};

/**
 * Verify assessment exists and belongs to the worksheet
 */
export const verifyAssessmentExists = async (assessmentId, worksheetId) => {
  const assessment = await prismaClient.riskAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      worksheet: {
        include: {
          konteks: {
            select: { id: true, name: true, code: true, matrixSize: true },
          },
          unitKerja: {
            select: { id: true, name: true, code: true },
          },
        },
      },
      _count: { select: { items: true } },
    },
  });

  if (!assessment) {
    throw new ResponseError(404, "Risk assessment tidak ditemukan.");
  }

  if (assessment.worksheetId !== worksheetId) {
    throw new ResponseError(404, "Risk assessment tidak ditemukan.");
  }

  return assessment;
};

/**
 * Check if assessment is editable (DRAFT or REJECTED status)
 */
export const checkAssessmentEditable = (assessment) => {
  const editableStatuses = [
    RISK_ASSESSMENT_STATUSES.DRAFT,
    RISK_ASSESSMENT_STATUSES.REJECTED,
  ];

  if (!editableStatuses.includes(assessment.status)) {
    throw new ResponseError(
      400,
      `Tidak dapat mengubah assessment dengan status ${assessment.status}.`
    );
  }
};

/**
 * Check if user is the creator of the assessment
 */
export const checkAssessmentOwnership = (assessment, userId, action = "mengubah") => {
  if (assessment.createdBy !== userId) {
    throw new ResponseError(
      403,
      `Akses ditolak. Hanya pembuat assessment yang dapat ${action}.`
    );
  }
};

/**
 * Generate assessment code - Format: RA-{UKER_CODE}-{SEQUENCE}
 */
export const generateAssessmentCode = async (worksheetId, unitKerjaCode) => {
  const count = await prismaClient.riskAssessment.count({
    where: { worksheetId },
  });
  const sequence = String(count + 1).padStart(3, "0");
  return `RA-${unitKerjaCode}-${sequence}`;
};

/**
 * Check if user has KOMITE_PUSAT role
 */
export const checkKomitePusatRole = (user) => {
  if (!user.roles.includes(ROLES.KOMITE_PUSAT)) {
    throw new ResponseError(
      403,
      "Akses ditolak. Hanya KOMITE_PUSAT yang dapat melakukan aksi ini."
    );
  }
};
