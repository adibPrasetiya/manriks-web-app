import { Router } from "express";
import { authorize } from "../middlewares/authorization.middleware.js";
import { userRoutes } from "./user.route.js";
import { unitKerjaRoutes } from "./unit-kerja.route.js";
import { profileRoutes } from "./profile.routes.js";
import { profileRequestRoutes } from "./profile-request.route.js";
import { konteksRoutes } from "./konteks.route.js";
import { riskCategoryRoutes } from "./risk-category.route.js";
import { likelihoodScaleRoutes } from "./likelihood-scale.route.js";
import { impactScaleRoutes } from "./impact-scale.route.js";
import { riskMatrixRoutes } from "./risk-matrix.route.js";
import { sessionRoutes } from "./session.route.js";
import { assetCategoryRoutes } from "./asset-category.route.js";
import { assetRoutes } from "./asset.route.js";
import { riskWorksheetRoutes } from "./risk-worksheet.route.js";
import { riskAssessmentRoutes } from "./risk-assessment.route.js";
import { riskAssessmentItemRoutes } from "./risk-assessment-item.route.js";

export const protectedRoute = Router();

const routes = [
  ...userRoutes,
  ...sessionRoutes,
  ...unitKerjaRoutes,
  ...profileRoutes,
  ...profileRequestRoutes,
  ...konteksRoutes,
  ...riskCategoryRoutes,
  ...likelihoodScaleRoutes,
  ...impactScaleRoutes,
  ...riskMatrixRoutes,
  ...assetCategoryRoutes,
  ...assetRoutes,
  ...riskWorksheetRoutes,
  ...riskAssessmentRoutes,
  ...riskAssessmentItemRoutes,
];

routes.forEach(({ method, path, handler, roles }) => {
  const middleware = [];

  if (roles) {
    middleware.push(authorize(roles));
  }

  middleware.push(handler);

  protectedRoute[method](path, ...middleware);
});
