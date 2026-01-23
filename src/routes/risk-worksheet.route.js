import riskWorksheetController from "../controllers/risk-worksheet.controller.js";
import { ROLES } from "../config/constant.js";

export const riskWorksheetRoutes = [
  {
    method: "post",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets",
    handler: riskWorksheetController.create,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets",
    handler: riskWorksheetController.search,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id",
    handler: riskWorksheetController.getById,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id",
    handler: riskWorksheetController.update,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id/activate",
    handler: riskWorksheetController.setActive,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id/deactivate",
    handler: riskWorksheetController.setInactive,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "delete",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id",
    handler: riskWorksheetController.archive,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
];
