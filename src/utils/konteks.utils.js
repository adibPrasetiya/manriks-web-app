import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";
import { KONTEKS_STATUSES } from "../config/constant.js";

/**
 * Check if a konteks is active or archived by konteksId.
 * Throws ResponseError if active (403) or archived (400), preventing edit/delete operations.
 *
 * @param {string} konteksId - The konteks ID to check
 * @param {string} entityName - Name of the entity being modified (for error message)
 * @throws {ResponseError} 403 if konteks is active, 400 if archived
 */
export const checkKonteksNotActive = async (konteksId, entityName = "data") => {
  const konteks = await prismaClient.konteks.findUnique({
    where: { id: konteksId },
    select: { status: true, name: true },
  });

  // Check if ACTIVE
  if (konteks?.status === KONTEKS_STATUSES.ACTIVE) {
    throw new ResponseError(
      403,
      `Tidak dapat mengubah atau menghapus ${entityName} karena konteks "${konteks.name}" sedang aktif. Nonaktifkan konteks terlebih dahulu.`
    );
  }

  // Check if ARCHIVED
  if (konteks?.status === KONTEKS_STATUSES.ARCHIVED) {
    throw new ResponseError(
      400,
      `Tidak dapat mengubah atau menghapus ${entityName} karena konteks "${konteks.name}" sudah diarsipkan.`
    );
  }
};
