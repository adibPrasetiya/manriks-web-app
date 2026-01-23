import assetController from "../controllers/asset.controller.js";
import { ROLES } from "../config/constant.js";

export const assetRoutes = [
  {
    method: "post",
    path: "/unit-kerja/:unitKerjaId/assets",
    handler: assetController.create,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/assets",
    handler: assetController.search,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/assets/:id",
    handler: assetController.getById,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/assets/:id",
    handler: assetController.update,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "delete",
    path: "/unit-kerja/:unitKerjaId/assets/:id",
    handler: assetController.remove,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
];
