import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { RISK_WORKSHEET_STATUSES } from "../config/constant.js";

// Re-export common functions from risk-worksheet.utils.js
export {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
} from "./risk-worksheet.utils.js";

/**
 * Verify worksheet exists, is DRAFT, and belongs to the unit kerja
 * Used when creating/updating/deleting risk assessment items
 * Items can only be modified when worksheet is in DRAFT status
 */
export const verifyWorksheetExistsAndDraft = async (
  worksheetId,
  unitKerjaId
) => {
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
          riskAppetiteLevel: true,
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

  if (worksheet.status !== RISK_WORKSHEET_STATUSES.DRAFT) {
    throw new ResponseError(
      400,
      "Kertas kerja risiko bukan berstatus DRAFT. Hanya dapat memodifikasi item risiko untuk kertas kerja dengan status DRAFT."
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
        select: {
          id: true,
          name: true,
          code: true,
          matrixSize: true,
          riskAppetiteLevel: true,
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

  return worksheet;
};

/**
 * Check if user is the owner of the worksheet
 */
export const checkWorksheetOwnership = (
  worksheet,
  userId,
  action = "mengubah"
) => {
  if (worksheet.ownerId !== userId) {
    throw new ResponseError(
      403,
      `Akses ditolak. Hanya pemilik kertas kerja yang dapat ${action}.`
    );
  }
};

/**
 * Generate risk item code - Format: R{SEQUENCE}
 */
export const generateRiskItemCode = async (worksheetId) => {
  const count = await prismaClient.riskAssessmentItem.count({
    where: { worksheetId },
  });
  const sequence = String(count + 1).padStart(3, "0");
  return `R${sequence}`;
};
