import { CorsError } from "../errors/cors.error.js";
import { ALLOWED_ORIGINS, NODE_ENV } from "./constant.js";

const allowedOrigins = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(",")
  : ["http://localhost:4200"];

export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (NODE_ENV === "development") {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(
        new CorsError(
          `Origin ${origin} is not allowed by CORS policy. Allowed origins: ${allowedOrigins.join(
            ", "
          )}`
        )
      );
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // 10 minutes
};
