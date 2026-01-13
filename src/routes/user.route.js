import userController from "../controllers/user.controller.js";
import { ROLES } from "../config/constant.js";

export const userRoutes = [
  {
    method: "delete",
    path: "/users/me/logout",
    handler: userController.logout,
  },
  {
    method: "patch",
    path: "/users/me/password",
    handler: userController.updatePassword,
  },
  {
    method: "get",
    path: "/users",
    handler: userController.search,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/users/:userId",
    handler: userController.updateByAdmin,
    roles: [ROLES.ADMINISTRATOR],
  },
];
