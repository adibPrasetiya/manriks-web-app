import { prismaClient } from "../apps/database.js";
import { ResponseError } from "../errors/response.error.js";

/**
 * Check if a konteks is active by konteksId.
 * Throws ResponseError (403) if active, preventing edit/delete operations.
 *
 * @param {string} konteksId - The konteks ID to check
 * @param {string} entityName - Name of the entity being modified (for error message)
 * @throws {ResponseError} 403 if konteks is active
 */
export const checkKonteksNotActive = async (konteksId, entityName = "data") => {
  const konteks = await prismaClient.konteks.findUnique({
    where: { id: konteksId },
    select: { isActive: true, name: true },
  });

  if (konteks?.isActive) {
    throw new ResponseError(
      403,
      `Tidak dapat mengubah atau menghapus ${entityName} karena konteks "${konteks.name}" sedang aktif. Nonaktifkan konteks terlebih dahulu.`
    );
  }
};
