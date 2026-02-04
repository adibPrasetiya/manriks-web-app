import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { v4 as uuidv4 } from "uuid";
import {
  isProduction,
  LOG_LEVELS,
  CURRENT_LOG_LEVEL,
  SENSITIVE_FIELDS,
  LOG_PATHS,
  LOG_ROTATION,
  REDACTION_MASK,
  ACTION_TYPES,
} from "../config/log.config.js";

// Custom format for SIEM-compatible JSON logs
const siemFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Development format - colorized and readable
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  }),
);

// Determine transports based on environment
const getTransports = () => {
  if (isProduction) {
    return [
      new winston.transports.Console({
        format: devFormat,
      }),
      // // Combined logs (all levels)
      // new DailyRotateFile({
      //   filename: `${LOG_PATHS.COMBINED}-%DATE%.log`,
      //   datePattern: LOG_ROTATION.DATE_PATTERN,
      //   maxSize: LOG_ROTATION.MAX_SIZE,
      //   maxFiles: LOG_ROTATION.MAX_FILES,
      //   zippedArchive: LOG_ROTATION.COMPRESS,
      //   format: siemFormat,
      // }),
      // // Error-only logs
      // new DailyRotateFile({
      //   filename: `${LOG_PATHS.ERROR}-%DATE%.log`,
      //   datePattern: LOG_ROTATION.DATE_PATTERN,
      //   level: "error",
      //   maxSize: LOG_ROTATION.MAX_SIZE,
      //   maxFiles: LOG_ROTATION.MAX_FILES,
      //   zippedArchive: LOG_ROTATION.COMPRESS,
      //   format: siemFormat,
      // }),
      // // Security/audit logs
      // new DailyRotateFile({
      //   filename: `${LOG_PATHS.SECURITY}-%DATE%.log`,
      //   datePattern: LOG_ROTATION.DATE_PATTERN,
      //   maxSize: LOG_ROTATION.MAX_SIZE,
      //   maxFiles: LOG_ROTATION.MAX_FILES,
      //   zippedArchive: LOG_ROTATION.COMPRESS,
      //   format: siemFormat,
      // }),
    ];
  } else {
    // Development: Console only
    return [
      new winston.transports.Console({
        format: devFormat,
      }),
    ];
  }
};

// Create Winston logger instance
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: CURRENT_LOG_LEVEL,
  transports: getTransports(),
  exitOnError: false,
});

// Add colors for custom levels
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
});

// Export the base logger
export { logger };

// Export action types for use throughout the app
export { ACTION_TYPES };

/**
 * Deep clone and redact sensitive fields from an object
 * @param {Object} obj - Object to redact
 * @param {Array<string>} sensitiveFields - Fields to mask
 * @returns {Object} - Redacted object copy
 */
export const redact = (obj, sensitiveFields = SENSITIVE_FIELDS) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, sensitiveFields));
  }

  // Clone and process object
  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if this key should be redacted
    const shouldRedact = sensitiveFields.some(
      (field) =>
        lowerKey === field.toLowerCase() ||
        lowerKey.includes(field.toLowerCase()),
    );

    if (shouldRedact && value !== undefined && value !== null) {
      redacted[key] = REDACTION_MASK;
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redact(value, sensitiveFields);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
};

/**
 * Generate a unique request ID for correlation
 * @returns {string} - UUID v4
 */
export const generateRequestId = () => uuidv4();

/**
 * Extract client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
export const extractClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

/**
 * Build log context with standard SIEM fields
 * @param {Object} req - Express request object
 * @param {Object} additionalContext - Additional context to include
 * @returns {Object} - Structured log context
 */
export const buildLogContext = (req, additionalContext = {}) => {
  const context = {
    requestId: req.requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl || req.url,
    ipAddress: extractClientIp(req),
    userAgent: req.headers?.["user-agent"] || "unknown",
    ...additionalContext,
  };

  // Add user info if authenticated
  if (req.user) {
    context.userId = req.user.userId;
    context.username = req.user.username;
    context.roles = req.user.roles;
  }

  return context;
};

/**
 * Log HTTP request
 * @param {Object} context - Log context
 */
export const logHttpRequest = (context) => {
  logger.http("Incoming request", {
    action: ACTION_TYPES.HTTP_REQUEST,
    ...context,
  });
};

/**
 * Log HTTP response
 * @param {Object} context - Log context including response info
 */
export const logHttpResponse = (context) => {
  const level =
    context.statusCode >= 500
      ? "error"
      : context.statusCode >= 400
        ? "warn"
        : "http";

  logger.log(level, "Request completed", {
    action: ACTION_TYPES.HTTP_RESPONSE,
    ...context,
  });
};

/**
 * Log authentication events
 * @param {string} action - Action type from ACTION_TYPES
 * @param {Object} context - Event context
 */
export const logAuthEvent = (action, context) => {
  const level =
    action.includes("failure") || action.includes("denied") ? "warn" : "info";

  logger.log(level, `Auth event: ${action}`, {
    action,
    category: "security",
    ...redact(context),
  });
};

/**
 * Log security events (to security log in production)
 * @param {string} action - Action type
 * @param {Object} context - Event context
 * @param {string} level - Log level
 */
export const logSecurityEvent = (action, context, level = "info") => {
  logger.log(level, `Security event: ${action}`, {
    action,
    category: "security",
    ...redact(context),
  });
};

/**
 * Log errors with full context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  const errorContext = {
    action: context.action || ACTION_TYPES.ERROR,
    errorName: error.name,
    errorMessage: error.message,
    statusCode: error.statusCode || 500,
    stackTrace: error.stack,
    ...redact(context),
  };

  logger.error(error.message, errorContext);
};

/**
 * Create a child logger with preset context (useful for services)
 * @param {string} serviceName - Name of the service
 * @returns {Object} - Logger wrapper with preset context
 */
export const createServiceLogger = (serviceName) => {
  return {
    info: (message, context = {}) =>
      logger.info(message, { service: serviceName, ...redact(context) }),
    warn: (message, context = {}) =>
      logger.warn(message, { service: serviceName, ...redact(context) }),
    error: (message, context = {}) =>
      logger.error(message, { service: serviceName, ...redact(context) }),
    debug: (message, context = {}) =>
      logger.debug(message, { service: serviceName, ...redact(context) }),
    security: (action, context = {}) =>
      logSecurityEvent(action, { service: serviceName, ...context }),
  };
};
