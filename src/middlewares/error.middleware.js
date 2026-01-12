import { CorsError } from "../errors/cors.error.js";
import { ResponseError } from "../errors/response.error.js";
import { ValidationError } from "../errors/validation.error.js";

export const errorMiddleware = async (err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  if (res.headersSent) {
    console.error("Error occurred after headers sent:", err);
    return res.end();
  }

  if (err instanceof ValidationError) {
    res
      .status(err.statusCode)
      .json({
        errors: err.message,
        details: err.details,
      })
      .end();
  } else if (err instanceof CorsError) {
    res
      .status(err.statusCode)
      .json({
        errors: err.message,
      })
      .end();
  } else if (err instanceof ResponseError) {
    res
      .status(err.statusCode)
      .json({
        errors: err.message,
      })
      .end();
  } else {
    console.log(err);
    res
      .status(500)
      .json({
        errors: "Internal Server Error",
      })
      .end();
  }
};
