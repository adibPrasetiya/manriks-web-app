import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";

// Re-export common functions
export {
  checkUnitKerjaAccess,
  verifyUnitKerjaExists,
} from "./risk-worksheet.utils.js";

export {
  verifyWorksheetExists,
  verifyWorksheetExistsAndDraft,
  checkWorksheetOwnership,
} from "./risk-assessment.utils.js";

/**
 * Verify risk assessment item exists and belongs to worksheet
 */
export const verifyItemExists = async (itemId, worksheetId) => {
  const item = await prismaClient.riskAssessmentItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  if (item.worksheetId !== worksheetId) {
    throw new ResponseError(404, "Item risiko tidak ditemukan.");
  }

  return item;
};

/**
 * Verify mitigation exists and belongs to item
 */
export const verifyMitigationExists = async (mitigationId, itemId) => {
  const mitigation = await prismaClient.riskMitigation.findUnique({
    where: { id: mitigationId },
  });

  if (!mitigation) {
    throw new ResponseError(404, "Mitigasi risiko tidak ditemukan.");
  }

  if (mitigation.itemId !== itemId) {
    throw new ResponseError(404, "Mitigasi risiko tidak ditemukan.");
  }

  return mitigation;
};

/**
 * Check if mitigation can be modified (not validated)
 */
export const checkMitigationModifiable = (mitigation) => {
  if (mitigation.isValidated) {
    throw new ResponseError(
      403,
      "Mitigasi yang sudah divalidasi tidak dapat diubah."
    );
  }
};

/**
 * Generate mitigation code - Format: M{SEQUENCE}
 */
export const generateMitigationCode = async (itemId) => {
  const count = await prismaClient.riskMitigation.count({
    where: { itemId },
  });
  const sequence = String(count + 1).padStart(3, "0");
  return `M${sequence}`;
};
