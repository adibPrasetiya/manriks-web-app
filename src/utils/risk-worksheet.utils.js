import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { RISK_WORKSHEET_STATUSES } from "../config/constant.js";

/**
 * Verify user belongs to the specified unit kerja
 * PENGELOLA_RISIKO_UKER can only access their own unit kerja
 */
export const checkUnitKerjaAccess = (user, unitKerjaId) => {
  if (user.unitKerjaId !== unitKerjaId) {
    throw new ResponseError(
      403,
      "Akses ditolak. Anda tidak memiliki akses ke unit kerja ini."
    );
  }
};

/**
 * Verify unit kerja exists
 */
export const verifyUnitKerjaExists = async (unitKerjaId) => {
  const unitKerja = await prismaClient.unitKerja.findUnique({
    where: { id: unitKerjaId },
  });

  if (!unitKerja) {
    throw new ResponseError(404, "Unit kerja tidak ditemukan.");
  }

  return unitKerja;
};

/**
 * Verify konteks exists and is active
 */
export const verifyKonteksExistsAndActive = async (konteksId) => {
  const konteks = await prismaClient.konteks.findUnique({
    where: { id: konteksId },
  });

  if (!konteks) {
    throw new ResponseError(404, "Konteks tidak ditemukan.");
  }

  if (!konteks.isActive) {
    throw new ResponseError(
      400,
      "Konteks tidak aktif. Hanya dapat membuat kertas kerja untuk konteks yang aktif."
    );
  }

  return konteks;
};

/**
 * Check if there's already an ACTIVE worksheet for this unit kerja and konteks
 */
export const checkActiveWorksheetLimit = async (
  unitKerjaId,
  konteksId,
  excludeId = null
) => {
  const where = {
    unitKerjaId,
    konteksId,
    status: RISK_WORKSHEET_STATUSES.ACTIVE,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const existingActive = await prismaClient.riskWorksheet.findFirst({ where });

  if (existingActive) {
    throw new ResponseError(
      409,
      "Unit kerja ini sudah memiliki kertas kerja aktif untuk konteks ini. Nonaktifkan kertas kerja lain terlebih dahulu."
    );
  }
};

/**
 * Verify user is the owner of the worksheet
 */
export const checkWorksheetOwnership = (worksheet, userId, action = "mengubah status") => {
  if (worksheet.ownerId !== userId) {
    throw new ResponseError(
      403,
      `Akses ditolak. Hanya pemilik kertas kerja yang dapat ${action}.`
    );
  }
};
