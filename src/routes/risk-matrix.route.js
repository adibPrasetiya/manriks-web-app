import riskMatrixController from "../controllers/risk-matrix.controller.js";
import { ROLES } from "../config/constant.js";

export const riskMatrixRoutes = [
  {
    method: "post",
    path: "/konteks/:konteksId/risk-matrices",
    handler: riskMatrixController.create,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/konteks/:konteksId/risk-matrices",
    handler: riskMatrixController.search,
  },
  {
    method: "get",
    path: "/konteks/:konteksId/risk-matrices/:id",
    handler: riskMatrixController.getById,
  },
  {
    method: "patch",
    path: "/konteks/:konteksId/risk-matrices/:id",
    handler: riskMatrixController.update,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/konteks/:konteksId/risk-matrices/:id",
    handler: riskMatrixController.remove,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
];
