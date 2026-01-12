import { Router } from "express";
import userController from "../controllers/user.controller.js";

export const publicRoute = Router();

const routes = [
  {
    method: "post",
    path: "/users",
    handler: userController.login,
  },
  {
    method: "post",
    path: "/user/login",
    handler: userController.login,
  },
  {
    method: "post",
    path: "user/refersh-token",
    handler: userController.refreshToken,
  },
];

routes.forEach(({ method, path, handler }) => {
  publicRoute[method](path, handler);
});
