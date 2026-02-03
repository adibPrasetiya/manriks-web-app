import { CorsError } from "../errors/cors.error.js";
import { ResponseError } from "../errors/response.error.js";
import { ValidationError } from "../errors/validation.error.js";
import {
  logError,
  buildLogContext,
  ACTION_TYPES,
} from "../utils/logger.utils.js";

export const errorMiddleware = async (err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  // Build error context for logging
  const errorContext = buildLogContext(req, {
    errorType: err.constructor.name,
  });

  if (res.headersSent) {
    logError(err, {
      ...errorContext,
      action: ACTION_TYPES.INTERNAL_ERROR,
      note: "Error occurred after headers sent",
    });
    return res.end();
  }

  if (err instanceof ValidationError) {
    logError(err, {
      ...errorContext,
      action: ACTION_TYPES.VALIDATION_ERROR,
      validationDetails: err.details,
    });

    res
      .status(err.statusCode)
      .json({
        errors: err.message,
        details: err.details,
      })
      .end();
  } else if (err instanceof CorsError) {
    logError(err, {
      ...errorContext,
      action: ACTION_TYPES.ACCESS_DENIED,
      origin: req.headers.origin,
    });

    res
      .status(err.statusCode)
      .json({
        errors: err.message,
      })
      .end();
  } else if (err instanceof ResponseError) {
    logError(err, {
      ...errorContext,
      action: ACTION_TYPES.ERROR,
    });

    res
      .status(err.statusCode)
      .json({
        errors: err.message,
      })
      .end();
  } else {
    // Unexpected error - log with full details
    logError(err, {
      ...errorContext,
      action: ACTION_TYPES.INTERNAL_ERROR,
    });

    res
      .status(500)
      .json({
        errors: "Internal Server Error",
      })
      .end();
  }
};
