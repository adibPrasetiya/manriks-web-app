import riskMitigationController from "../controllers/risk-mitigation.controller.js";
import { ROLES } from "../config/constant.js";

const basePath =
  "/unit-kerja/:unitKerjaId/risk-worksheets/:worksheetId/items/:itemId/mitigations";

export const riskMitigationRoutes = [
  // CRUD - PENGELOLA_RISIKO_UKER
  {
    method: "post",
    path: basePath,
    handler: riskMitigationController.create,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: basePath,
    handler: riskMitigationController.search,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: `${basePath}/:mitigationId`,
    handler: riskMitigationController.getById,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: `${basePath}/:mitigationId`,
    handler: riskMitigationController.update,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "delete",
    path: `${basePath}/:mitigationId`,
    handler: riskMitigationController.remove,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },

  // Validation - KOMITE_PUSAT only
  {
    method: "patch",
    path: `${basePath}/:mitigationId/validate`,
    handler: riskMitigationController.validate,
    roles: [ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: `${basePath}/:mitigationId/reject`,
    handler: riskMitigationController.reject,
    roles: [ROLES.KOMITE_PUSAT],
  },

  // Cross-unit kerja - KOMITE_PUSAT dashboard
  {
    method: "get",
    path: "/mitigations/pending-validation",
    handler: riskMitigationController.getPendingValidations,
    roles: [ROLES.KOMITE_PUSAT],
  },
];
