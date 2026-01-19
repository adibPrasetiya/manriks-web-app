import profileRequestController from "../controllers/profile-request.controller.js";
import { ROLES } from "../config/constant.js";

export const profileRequestRoutes = [
  // User endpoints (no role restriction - all authenticated users)
  {
    method: "get",
    path: "/users/me/profile-requests",
    handler: profileRequestController.getMyRequests,
  },
  {
    method: "get",
    path: "/users/me/profile-requests/:requestId",
    handler: profileRequestController.getMyRequestById,
  },
  {
    method: "post",
    path: "/users/me/profile-requests",
    handler: profileRequestController.create,
  },
  {
    method: "delete",
    path: "/users/me/profile-requests/:requestId",
    handler: profileRequestController.cancelMyRequest,
  },

  // Admin endpoints (ADMINISTRATOR only)
  {
    method: "get",
    path: "/profile-requests",
    handler: profileRequestController.search,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "get",
    path: "/profile-requests/:requestId",
    handler: profileRequestController.getById,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/profile-requests/:requestId/approve",
    handler: profileRequestController.approve,
    roles: [ROLES.ADMINISTRATOR],
  },
  {
    method: "patch",
    path: "/profile-requests/:requestId/reject",
    handler: profileRequestController.reject,
    roles: [ROLES.ADMINISTRATOR],
  },

  // Unverified profiles list (ADMINISTRATOR only)
  {
    method: "get",
    path: "/profiles/unverified",
    handler: profileRequestController.getUnverifiedProfiles,
    roles: [ROLES.ADMINISTRATOR],
  },
];
