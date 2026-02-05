import { NODE_ENV } from "./constant.js";

// Environment detection
export const isProduction = NODE_ENV === "production";
export const isDevelopment = NODE_ENV === "development";

// Log levels configuration
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Current log level based on environment
export const CURRENT_LOG_LEVEL = isProduction ? "info" : "debug";

// Sensitive fields to be redacted (masked)
export const SENSITIVE_FIELDS = [
  // Authentication
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "jwt",
  "token",
  "secret",
  "apiKey",
  "api_key",

  // PIN/OTP
  "pin",
  "otp",
  "verificationCode",
  "twoFactorCode",

  // Data Pribadi
  "nik",
  "ktp",
  "npwp",
  "noTelp",
  "phoneNumber",
  "phone",
];

// Log file paths for production
export const LOG_PATHS = {
  COMBINED: "logs/combined",
  ERROR: "logs/error",
  SECURITY: "logs/security",
  HTTP: "logs/http",
};

// Log rotation configuration
export const LOG_ROTATION = {
  MAX_SIZE: "20m",
  MAX_FILES: "90d",
  COMPRESS: true,
  DATE_PATTERN: "YYYY-MM-DD",
};

// Redaction mask character
export const REDACTION_MASK = "[REDACTED]";

// Action types for audit trail
export const ACTION_TYPES = {
  // Authentication
  LOGIN_ATTEMPT: "auth.login.attempt",
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILURE: "auth.login.failure",
  LOGOUT: "auth.logout",
  TOKEN_REFRESH: "auth.token.refresh",
  TOKEN_EXPIRED: "auth.token.expired",
  TOKEN_INVALID: "auth.token.invalid",

  // Authorization
  ACCESS_DENIED: "auth.access.denied",
  UNAUTHORIZED: "auth.unauthorized",

  // User Management
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  PASSWORD_CHANGED: "user.password.changed",
  PASSWORD_RESET: "user.password.reset",

  // Profile
  PROFILE_CREATED: "profile.created",
  PROFILE_UPDATED: "profile.updated",
  PROFILE_VERIFIED: "profile.verified",
  PROFILE_CHANGE_REQUEST_CREATED: "profile.change.request.created",
  PROFILE_CHANGE_REQUEST_APPROVED: "profile.change.request.approved",
  PROFILE_CHANGE_REQUEST_REJECTED: "profile.change.request.rejected",

  // Session Management
  SESSION_CREATED: "session.created",
  SESSION_DELETED: "session.deleted",
  SESSION_EXPIRED: "session.expired",

  // Risk Management
  WORKSHEET_CREATED: "risk.worksheet.created",
  WORKSHEET_UPDATED: "risk.worksheet.updated",
  WORKSHEET_SUBMITTED: "risk.worksheet.submitted",
  WORKSHEET_APPROVED: "risk.worksheet.approved",
  WORKSHEET_DELETED: "risk.worksheet.deleted",

  ASSESSMENT_CREATED: "risk.assessment.created",
  ASSESSMENT_UPDATED: "risk.assessment.updated",
  ASSESSMENT_DELETED: "risk.assessment.deleted",

  ASSESSMENT_ITEM_CREATED: "risk.assessment.item.created",
  ASSESSMENT_ITEM_UPDATED: "risk.assessment.item.updated",
  ASSESSMENT_ITEM_DELETED: "risk.assessment.item.deleted",

  MITIGATION_CREATED: "risk.mitigation.created",
  MITIGATION_UPDATED: "risk.mitigation.updated",
  MITIGATION_COMPLETED: "risk.mitigation.completed",
  MITIGATION_DELETED: "risk.mitigation.deleted",

  RISK_CATEGORY_CREATED: "risk.category.created",
  RISK_CATEGORY_UPDATED: "risk.category.updated",
  RISK_CATEGORY_DELETED: "risk.category.deleted",

  RISK_LIKELIHOOD_CREATED: "risk.likelihood.created",
  RISK_LIKELIHOOD_UPDATED: "risk.likelihood.updated",
  RISK_LIKELIHOOD_DELETED: "risk.likelihood.deleted",

  RISK_IMPACT_CREATED: "risk.impact.created",
  RISK_IMPACT_UPDATED: "risk.impact.updated",
  RISK_IMPACT_DELETED: "risk.impact.deleted",

  // Asset Management
  ASSET_CREATED: "asset.created",
  ASSET_UPDATED: "asset.updated",
  ASSET_ARCHIVED: "asset.archived",
  ASSET_DELETED: "asset.deleted",

  ASSET_CATEGORY_CREATED: "asset.category.created",
  ASSET_CATEGORY_UPDATED: "asset.category.updated",
  ASSET_CATEGORY_DELETED: "asset.category.deleted",

  // Konteks
  KONTEKS_CREATED: "konteks.created",
  KONTEKS_UPDATED: "konteks.updated",
  KONTEKS_DELETED: "konteks.deleted",

  KONTEKS_UKER_CREATED: "konteks.uker.created",
  KONTEKS_UKER_UPDATED: "konteks.uker.updated",
  KONTEKS_UKER_DELETED: "konteks.uker.deleted",

  // Master Data
  UNIT_KERJA_CREATED: "unitkerja.created",
  UNIT_KERJA_UPDATED: "unitkerja.updated",
  UNIT_KERJA_DELETED: "unitkerja.deleted",

  CATEGORY_CREATED: "category.created",
  CATEGORY_UPDATED: "category.updated",
  CATEGORY_DELETED: "category.deleted",

  SUBCATEGORY_CREATED: "subcategory.created",
  SUBCATEGORY_UPDATED: "subcategory.updated",
  SUBCATEGORY_DELETED: "subcategory.deleted",

  KRITERIA_DAMPAK_CREATED: "kriteria.dampak.created",
  KRITERIA_DAMPAK_UPDATED: "kriteria.dampak.updated",
  KRITERIA_DAMPAK_DELETED: "kriteria.dampak.deleted",

  KRITERIA_KEMUNGKINAN_CREATED: "kriteria.kemungkinan.created",
  KRITERIA_KEMUNGKINAN_UPDATED: "kriteria.kemungkinan.updated",
  KRITERIA_KEMUNGKINAN_DELETED: "kriteria.kemungkinan.deleted",

  MATRIX_CREATED: "matriks.created",
  MATRIX_UPDATED: "matriks.updated",
  MATRIX_DELETED: "matriks.deleted",

  // HTTP
  HTTP_REQUEST: "http.request",
  HTTP_RESPONSE: "http.response",

  // Errors
  ERROR: "error",
  VALIDATION_ERROR: "error.validation",
  INTERNAL_ERROR: "error.internal",
};
