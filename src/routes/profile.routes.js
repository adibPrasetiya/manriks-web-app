import profileController from "../controllers/profile.controller.js";

export const profileRoutes = [
  {
    method: "post",
    path: "/users/me/profiles",
    handler: profileController.create,
  },
  {
    method: "patch",
    path: "/users/me/profiles",
    handler: profileController.update,
  },
  {
    method: "get",
    path: "/users/me/profiles",
    handler: profileController.get,
  },
];
