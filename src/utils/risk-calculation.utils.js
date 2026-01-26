import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import {
  RISK_LEVEL_HIERARCHY,
  TREATMENT_OPTIONS,
} from "../config/constant.js";

/**
 * Get risk level from RiskMatrix based on likelihood and impact
 * @param {string} konteksId - Konteks ID
 * @param {number} likelihood - Likelihood level (1 to matrixSize)
 * @param {number} impact - Impact level (1 to matrixSize)
 * @returns {Promise<string>} Risk level (LOW, MEDIUM, HIGH, CRITICAL)
 */
export const getRiskLevelFromMatrix = async (konteksId, likelihood, impact) => {
  const matrix = await prismaClient.riskMatrix.findUnique({
    where: {
      konteksId_likelihoodLevel_impactLevel: {
        konteksId,
        likelihoodLevel: likelihood,
        impactLevel: impact,
      },
    },
  });

  if (!matrix) {
    throw new ResponseError(
      400,
      `Kombinasi likelihood ${likelihood} dan impact ${impact} tidak ditemukan dalam risk matrix.`
    );
  }

  return matrix.riskLevel;
};

/**
 * Validate likelihood and impact values against konteks matrixSize
 * @param {number} matrixSize - Matrix size from konteks
 * @param {number} likelihood - Likelihood value to validate
 * @param {number} impact - Impact value to validate
 */
export const validateLikelihoodImpact = (matrixSize, likelihood, impact) => {
  if (likelihood < 1 || likelihood > matrixSize) {
    throw new ResponseError(
      400,
      `Nilai likelihood harus antara 1 dan ${matrixSize}.`
    );
  }

  if (impact < 1 || impact > matrixSize) {
    throw new ResponseError(
      400,
      `Nilai impact harus antara 1 dan ${matrixSize}.`
    );
  }
};

/**
 * Verify risk category exists and belongs to the konteks
 * @param {string} riskCategoryId - Risk category ID
 * @param {string} konteksId - Konteks ID
 * @returns {Promise<Object>} Risk category object
 */
export const verifyRiskCategoryExists = async (riskCategoryId, konteksId) => {
  const riskCategory = await prismaClient.riskCategory.findUnique({
    where: { id: riskCategoryId },
  });

  if (!riskCategory) {
    throw new ResponseError(404, "Kategori risiko tidak ditemukan.");
  }

  if (riskCategory.konteksId !== konteksId) {
    throw new ResponseError(
      400,
      "Kategori risiko tidak sesuai dengan konteks kertas kerja."
    );
  }

  return riskCategory;
};

/**
 * Verify asset exists and belongs to the unit kerja (optional)
 * @param {string|null} assetId - Asset ID (can be null)
 * @param {string} unitKerjaId - Unit kerja ID
 * @returns {Promise<Object|null>} Asset object or null
 */
export const verifyAssetExists = async (assetId, unitKerjaId) => {
  if (!assetId) {
    return null;
  }

  const asset = await prismaClient.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new ResponseError(404, "Aset tidak ditemukan.");
  }

  if (asset.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(400, "Aset tidak sesuai dengan unit kerja.");
  }

  return asset;
};

/**
 * Compare two risk levels
 * @param {string} level1 - First risk level
 * @param {string} level2 - Second risk level
 * @returns {number} negative if level1 < level2, 0 if equal, positive if level1 > level2
 */
export const compareRiskLevels = (level1, level2) => {
  const index1 = RISK_LEVEL_HIERARCHY.indexOf(level1);
  const index2 = RISK_LEVEL_HIERARCHY.indexOf(level2);
  return index1 - index2;
};

/**
 * Check if residual risk exceeds risk appetite
 * @param {string} residualRiskLevel - The calculated residual risk level
 * @param {string} riskAppetiteLevel - Risk appetite from konteks
 * @returns {boolean} True if risk exceeds appetite
 */
export const isRiskAboveAppetite = (residualRiskLevel, riskAppetiteLevel) => {
  if (!riskAppetiteLevel) return false;
  return compareRiskLevels(residualRiskLevel, riskAppetiteLevel) > 0;
};

/**
 * Get allowed treatment options based on risk appetite validation
 * @param {string} residualRiskLevel - The calculated residual risk level
 * @param {string} riskAppetiteLevel - Risk appetite from konteks
 * @returns {string[]} Array of allowed treatment options
 */
export const getAllowedTreatmentOptions = (
  residualRiskLevel,
  riskAppetiteLevel
) => {
  if (isRiskAboveAppetite(residualRiskLevel, riskAppetiteLevel)) {
    // Only MITIGATE or TRANSFER allowed when risk exceeds appetite
    return [TREATMENT_OPTIONS.MITIGATE, TREATMENT_OPTIONS.TRANSFER];
  }
  // All options allowed when within appetite
  return Object.values(TREATMENT_OPTIONS);
};

/**
 * Validate treatment option against risk appetite
 * @param {string} treatmentOption - The selected treatment option
 * @param {string} residualRiskLevel - The calculated residual risk level
 * @param {string} riskAppetiteLevel - Risk appetite from konteks
 * @throws {ResponseError} if treatment option is not allowed
 */
export const validateTreatmentOption = (
  treatmentOption,
  residualRiskLevel,
  riskAppetiteLevel
) => {
  if (!treatmentOption) return; // No treatment option to validate
  if (!riskAppetiteLevel) return; // No appetite defined, skip validation

  const allowedOptions = getAllowedTreatmentOptions(
    residualRiskLevel,
    riskAppetiteLevel
  );

  if (!allowedOptions.includes(treatmentOption)) {
    throw new ResponseError(
      400,
      `Treatment option "${treatmentOption}" tidak diizinkan. Risiko residual (${residualRiskLevel}) melebihi risk appetite (${riskAppetiteLevel}). Hanya MITIGATE atau TRANSFER yang diizinkan.`
    );
  }
};
