import sessionController from "../controllers/session.controller.js";
import { ROLES } from "../config/constant.js";

export const sessionRoutes = [
  {
    method: "get",
    path: "/sessions",
    handler: sessionController.search,
    roles: [ROLES.ADMINISTRATOR],
  },
  // DELETE bulk remove expired sessions
  // Note: Placed before /sessions/:id to prevent route conflict
  {
    method: "delete",
    path: "/sessions/expired",
    handler: sessionController.bulkRemoveExpired,
    roles: [ROLES.ADMINISTRATOR],
  },

  // GET sessions by user ID
  // Note: Placed before /sessions/:id to prevent route conflict
  {
    method: "get",
    path: "/sessions/user/:userId",
    handler: sessionController.getByUserId,
    roles: [ROLES.ADMINISTRATOR],
  },

  // DELETE all sessions by user ID
  {
    method: "delete",
    path: "/sessions/user/:userId",
    handler: sessionController.removeByUserId,
    roles: [ROLES.ADMINISTRATOR],
  },

  // GET session by ID
  {
    method: "get",
    path: "/sessions/:id",
    handler: sessionController.getById,
    roles: [ROLES.ADMINISTRATOR],
  },

  // DELETE session by ID
  {
    method: "delete",
    path: "/sessions/:id",
    handler: sessionController.removeById,
    roles: [ROLES.ADMINISTRATOR],
  },
];
