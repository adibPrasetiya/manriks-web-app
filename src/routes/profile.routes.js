import profileController from "../controllers/profile.controller.js";

export const profileRoutes = [
  {
    method: "post",
    path: "/users/me/profile",
    handler: profileController.create,
  },
];
