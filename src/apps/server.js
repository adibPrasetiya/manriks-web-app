import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "../config/cors.conf.js";
import { errorMiddleware } from "../middlewares/error.middleware.js";
import { httpLoggerMiddleware } from "../middlewares/http-logger.middleware.js";
import { publicRoute } from "../routes/public.route.js";
import { authenticationMiddleware } from "../middlewares/authetication.middleware.js";
import { protectedRoute } from "../routes/protected.route.js";

export const app = express();

// HTTP Logger must be first to capture all requests
app.use(httpLoggerMiddleware);

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(publicRoute);
app.use(authenticationMiddleware);
app.use(protectedRoute);

app.use(errorMiddleware);
