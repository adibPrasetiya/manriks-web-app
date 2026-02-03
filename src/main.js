import { app } from "./apps/server.js";
import { APP_PORT, NODE_ENV } from "./config/constant.js";
import { logger } from "./utils/logger.utils.js";

app.listen(APP_PORT || 3000, () => {
  logger.info("Server started", {
    port: APP_PORT || 3000,
    environment: NODE_ENV,
    pid: process.pid,
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    action: "process.uncaughtException",
    errorName: error.name,
    errorMessage: error.message,
    stackTrace: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", {
    action: "process.unhandledRejection",
    reason: reason?.message || String(reason),
    stackTrace: reason?.stack,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully", {
    action: "process.shutdown",
  });
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully", {
    action: "process.shutdown",
  });
  process.exit(0);
});
