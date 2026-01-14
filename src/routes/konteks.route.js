import konteksController from "../controllers/konteks.controller.js";
import { ROLES } from "../config/constant.js";

export const konteksRoutes = [
  {
    method: "post",
    path: "/konteks",
    handler: konteksController.create,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/konteks",
    handler: konteksController.search,
  },
  {
    method: "get",
    path: "/konteks/:konteksId",
    handler: konteksController.getById,
  },
  {
    method: "patch",
    path: "/konteks/:konteksId",
    handler: konteksController.update,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/konteks/:konteksId/activate",
    handler: konteksController.setActive,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/konteks/:konteksId/deactivate",
    handler: konteksController.deactivate,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
  {
    method: "delete",
    path: "/konteks/:konteksId",
    handler: konteksController.remove,
    roles: [ROLES.KOMITE_PUSAT, ROLES.ADMINISTRATOR],
  },
];
