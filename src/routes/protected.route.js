import { Router } from "express";
import { authorize } from "../middlewares/authorization.middleware.js";
import { userRoutes } from "./user.route.js";
import { unitKerjaRoutes } from "./unit-kerja.route.js";
import { profileRoutes } from "./profile.routes.js";
import { konteksRoutes } from "./konteks.route.js";
import { riskCategoryRoutes } from "./risk-category.route.js";
import { likelihoodScaleRoutes } from "./likelihood-scale.route.js";
import { sessionRoutes } from "./session.route.js";

export const protectedRoute = Router();

const routes = [
  ...userRoutes,
  ...sessionRoutes,
  ...unitKerjaRoutes,
  ...profileRoutes,
  ...konteksRoutes,
  ...riskCategoryRoutes,
  ...likelihoodScaleRoutes,
];

routes.forEach(({ method, path, handler, roles }) => {
  const middleware = [];

  if (roles) {
    middleware.push(authorize(roles));
  }

  middleware.push(handler);

  protectedRoute[method](path, ...middleware);
});
