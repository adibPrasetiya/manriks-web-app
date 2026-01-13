import riskCategoryController from "../controllers/risk-category.controller.js";
import { ROLES } from "../config/constant.js";

export const riskCategoryRoutes = [
  {
    method: "post",
    path: "/konteks/:konteksId/risk-categories",
    handler: riskCategoryController.create,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/konteks/:konteksId/risk-categories",
    handler: riskCategoryController.search,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/konteks/:konteksId/risk-categories/:id",
    handler: riskCategoryController.getById,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/konteks/:konteksId/risk-categories/:id",
    handler: riskCategoryController.update,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/konteks/:konteksId/risk-categories/:id",
    handler: riskCategoryController.remove,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
];
