import riskAssessmentItemController from "../controllers/risk-assessment-item.controller.js";
import { ROLES } from "../config/constant.js";

const basePath = "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments/:assessmentId/items";

export const riskAssessmentItemRoutes = [
  {
    method: "post",
    path: basePath,
    handler: riskAssessmentItemController.create,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: basePath,
    handler: riskAssessmentItemController.search,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: `${basePath}/:itemId`,
    handler: riskAssessmentItemController.getById,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: `${basePath}/:itemId`,
    handler: riskAssessmentItemController.update,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "delete",
    path: `${basePath}/:itemId`,
    handler: riskAssessmentItemController.remove,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
];
