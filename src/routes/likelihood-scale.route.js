import likelihoodScaleController from "../controllers/likelihood-scale.controller.js";
import { ROLES } from "../config/constant.js";

export const likelihoodScaleRoutes = [
  {
    method: "post",
    path: "/konteks/:konteksId/likelihood-scales",
    handler: likelihoodScaleController.create,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/konteks/:konteksId/likelihood-scales",
    handler: likelihoodScaleController.search,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/konteks/:konteksId/likelihood-scales/:id",
    handler: likelihoodScaleController.getById,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/konteks/:konteksId/likelihood-scales/:id",
    handler: likelihoodScaleController.update,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/konteks/:konteksId/likelihood-scales/:id",
    handler: likelihoodScaleController.remove,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
];
