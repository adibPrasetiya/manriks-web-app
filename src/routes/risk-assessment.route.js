import riskAssessmentController from "../controllers/risk-assessment.controller.js";
import { ROLES } from "../config/constant.js";

export const riskAssessmentRoutes = [
  {
    method: "post",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments",
    handler: riskAssessmentController.create,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments",
    handler: riskAssessmentController.search,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "get",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments/:id",
    handler: riskAssessmentController.getById,
    roles: [ROLES.PENGELOLA_RISIKO_UKER, ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments/:id",
    handler: riskAssessmentController.update,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments/:id/submit",
    handler: riskAssessmentController.submit,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments/:id/approve",
    handler: riskAssessmentController.approve,
    roles: [ROLES.KOMITE_PUSAT],
  },
  {
    method: "patch",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments/:id/reject",
    handler: riskAssessmentController.reject,
    roles: [ROLES.KOMITE_PUSAT],
  },
  {
    method: "delete",
    path: "/unit-kerja/:unitKerjaId/worksheets/:worksheetId/assessments/:id",
    handler: riskAssessmentController.archive,
    roles: [ROLES.PENGELOLA_RISIKO_UKER],
  },
];
