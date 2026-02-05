import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { loginRateLimiter } from "../middlewares/rate-limit.middleware.js";

export const publicRoute = Router();

const routes = [
  {
    method: "post",
    path: "/users",
    handler: userController.registration,
  },
  {
    method: "post",
    path: "/users/login",
    middleware: [loginRateLimiter],
    handler: userController.login,
  },
  {
    method: "post",
    path: "/users/refresh-token",
    handler: userController.refreshToken,
  },
];

routes.forEach(({ method, path, handler, middleware = [] }) => {
  publicRoute[method](path, ...middleware, handler);
});
