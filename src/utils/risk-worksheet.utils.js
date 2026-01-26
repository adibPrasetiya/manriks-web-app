import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { KONTEKS_STATUSES, ROLES } from "../config/constant.js";

/**
 * Verify user belongs to the specified unit kerja
 * PENGELOLA_RISIKO_UKER can only access their own unit kerja
 * @param {Object} user - User object with unitKerjaId and roles
 * @param {string} unitKerjaId - Unit kerja ID to check access
 * @param {Object} options - Options
 * @param {boolean} options.allowKomitePusat - Allow KOMITE_PUSAT to access all unit kerja
 */
export const checkUnitKerjaAccess = (user, unitKerjaId, options = {}) => {
  const { allowKomitePusat = false } = options;

  // KOMITE_PUSAT can access all unit kerja if allowed
  if (allowKomitePusat && user.roles.includes(ROLES.KOMITE_PUSAT)) {
    return;
  }

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

  if (konteks.status !== KONTEKS_STATUSES.ACTIVE) {
    throw new ResponseError(
      400,
      "Konteks tidak aktif. Hanya dapat membuat kertas kerja untuk konteks yang aktif."
    );
  }

  return konteks;
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
