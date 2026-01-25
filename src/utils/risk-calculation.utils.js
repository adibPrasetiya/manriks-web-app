import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";

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
