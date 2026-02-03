import {
  generateRequestId,
  buildLogContext,
  logHttpRequest,
  logHttpResponse,
  redact,
} from "../utils/logger.utils.js";

/**
 * HTTP Request/Response Logger Middleware
 * Implements: INTERCEPT - automatically captures all HTTP traffic
 *             ESTIMATE - adds request ID, timing, and context
 *             REDACT - masks sensitive data in logs
 */
export const httpLoggerMiddleware = (req, res, next) => {
  // Assign unique request ID for correlation
  req.requestId = generateRequestId();

  // Set request ID in response header for client-side debugging
  res.setHeader("X-Request-ID", req.requestId);

  // Record start time for response time calculation
  const startTime = process.hrtime.bigint();

  // Build initial request context
  const requestContext = buildLogContext(req, {
    query: Object.keys(req.query || {}).length
      ? redact(req.query)
      : undefined,
  });

  // Log request body if present (with redaction)
  if (req.body && Object.keys(req.body).length > 0) {
    requestContext.body = redact(req.body);
  }

  // Log incoming request
  logHttpRequest(requestContext);

  // Hook into response finish event
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const responseTimeMs = Number(endTime - startTime) / 1e6; // Convert to milliseconds

    const responseContext = {
      ...requestContext,
      statusCode: res.statusCode,
      responseTime: `${responseTimeMs.toFixed(2)}ms`,
      contentLength: res.get("Content-Length") || 0,
    };

    // Add user context if authentication happened during request
    if (req.user && !requestContext.userId) {
      responseContext.userId = req.user.userId;
      responseContext.username = req.user.username;
    }

    // Remove body from response context to avoid duplicate logging
    delete responseContext.body;

    logHttpResponse(responseContext);
  });

  next();
};
