import { Router } from "express";
import { authorize } from "../middlewares/authorization.middleware.js";
import { userRoutes } from "./user.route.js";
import { unitKerjaRoutes } from "./unit-kerja.route.js";
import { profileRoutes } from "./profile.routes.js";

export const protectedRoute = Router();

const routes = [...userRoutes, ...unitKerjaRoutes, ...profileRoutes];

routes.forEach(({ method, path, handler, roles }) => {
  const middleware = [];

  if (roles) {
    middleware.push(authorize(roles));
  }

  middleware.push(handler);

  protectedRoute[method](path, ...middleware);
});
