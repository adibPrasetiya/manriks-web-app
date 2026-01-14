import impactScaleController from "../controllers/impact-scale.controller.js";
import { ROLES } from "../config/constant.js";

export const impactScaleRoutes = [
  {
    method: "post",
    path: "/konteks/:konteksId/risk-categories/:riskCategoryId/impact-scales",
    handler: impactScaleController.create,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/konteks/:konteksId/risk-categories/:riskCategoryId/impact-scales",
    handler: impactScaleController.search,
  },
  {
    method: "get",
    path: "/konteks/:konteksId/risk-categories/:riskCategoryId/impact-scales/:id",
    handler: impactScaleController.getById,
  },
  {
    method: "patch",
    path: "/konteks/:konteksId/risk-categories/:riskCategoryId/impact-scales/:id",
    handler: impactScaleController.update,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/konteks/:konteksId/risk-categories/:riskCategoryId/impact-scales/:id",
    handler: impactScaleController.remove,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
];
