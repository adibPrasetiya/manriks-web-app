import unitKerjaController from "../controllers/unit-kerja.controller.js";
import { ROLES } from "../config/constant.js";

export const unitKerjaRoutes = [
  {
    method: "post",
    path: "/unit-kerja",
    handler: unitKerjaController.create,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/unit-kerja",
    handler: unitKerjaController.search,
  },
  {
    method: "get",
    path: "/unit-kerja/:id",
    handler: unitKerjaController.getById,
  },
  {
    method: "patch",
    path: "/unit-kerja/:id",
    handler: unitKerjaController.update,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/unit-kerja/:id",
    handler: unitKerjaController.remove,
    roles: [ROLES.ADMINISTRATOR],
  },
];
