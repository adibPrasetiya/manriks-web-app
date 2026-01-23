import assetCategoryController from "../controllers/asset-category.controller.js";
import { ROLES } from "../config/constant.js";

export const assetCategoryRoutes = [
  {
    method: "post",
    path: "/asset-categories",
    handler: assetCategoryController.create,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/asset-categories",
    handler: assetCategoryController.search,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "get",
    path: "/asset-categories/:id",
    handler: assetCategoryController.getById,
    roles: [ROLES.ADMINISTRATOR, ROLES.PENGELOLA_RISIKO_UKER],
  },
  {
    method: "patch",
    path: "/asset-categories/:id",
    handler: assetCategoryController.update,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/asset-categories/:id",
    handler: assetCategoryController.remove,
    roles: [ROLES.ADMINISTRATOR],
  },
];
