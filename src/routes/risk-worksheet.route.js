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
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id",
    handler: riskWorksheetController.getById,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id",
    handler: riskWorksheetController.update,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id/submit",
    handler: riskWorksheetController.submit,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id/approve",
    handler: riskWorksheetController.approve,
    roles: [ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id/reject",
    handler: riskWorksheetController.reject,
    roles: [ROLES.KOMITE_PUSAT],
  },
  {
    method: "delete",
    path: "/unit-kerja/:unitKerjaId/risk-worksheets/:id",
    handler: riskWorksheetController.archive,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
];
