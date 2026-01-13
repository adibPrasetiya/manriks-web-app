import { config } from "dotenv";

config();

export const APP_PORT = process.env.APP_PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const ROLES = {
  USER: "USER",
  ADMINISTRATOR: "ADMINISTRATOR",
  KOMITE_PUSAT: "KOMITE_PUSAT",
};
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;
export const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "your-access-secret-key-change-this-in-production";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-refresh-secret-key-change-this-in-production";
export const ACCESS_TOKEN_EXPIRY = NODE_ENV === "production" ? "30s" : "1d";
export const REFRESH_TOKEN_EXPIRY_HOURS =
  NODE_ENV === "production" ? 1 : 7 * 24; // 1 jam (production) atau 7 hari (development)
