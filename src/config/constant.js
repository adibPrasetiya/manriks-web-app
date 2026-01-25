import { config } from "dotenv";

config();

export const APP_PORT = process.env.APP_PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const ROLES = {
  USER: "USER",
  ADMINISTRATOR: "ADMINISTRATOR",
  KOMITE_PUSAT: "KOMITE_PUSAT",
  PENGELOLA_RISIKO_UKER: "PENGELOLA_RISIKO_UKER",
};

export const ASSET_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
};

export const KONTEKS_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
};

export const RISK_WORKSHEET_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
};

export const RISK_ASSESSMENT_STATUSES = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
};

export const MITIGATION_STATUSES = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const MITIGATION_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

export const CONTROL_EFFECTIVENESS = {
  EFFECTIVE: "EFFECTIVE",
  PARTIALLY_EFFECTIVE: "PARTIALLY_EFFECTIVE",
  INEFFECTIVE: "INEFFECTIVE",
};

export const TREATMENT_OPTIONS = {
  ACCEPT: "ACCEPT",
  MITIGATE: "MITIGATE",
  TRANSFER: "TRANSFER",
  AVOID: "AVOID",
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
