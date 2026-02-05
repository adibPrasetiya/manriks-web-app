import { rateLimit } from "express-rate-limit";
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_ATTEMPTS,
} from "../config/constant.js";
import { extractIpAddress } from "../utils/device.utils.js";
import { logSecurityEvent, ACTION_TYPES } from "../utils/logger.utils.js";

export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_ATTEMPTS,

  keyGenerator: (req) => {
    const identifier = req.body?.identifier || "anonymous";
    const ip = extractIpAddress(req);
    return `${identifier}:${ip}`;
  },

  handler: (req, res) => {
    const identifier = req.body?.identifier || "anonymous";
    const ip = extractIpAddress(req);

    logSecurityEvent(
      ACTION_TYPES.RATE_LIMIT_TRIGGERED,
      {
        identifier,
        ipAddress: ip,
        path: req.originalUrl,
      },
      "warn",
    );

    res
      .status(429)
      .json({
        errors:
          "Terlalu banyak percobaan login. Silakan coba lagi setelah beberapa menit.",
      })
      .end();
  },

  standardHeaders: false, // Tidak expose RateLimit-* headers — jangan bocorkan info retry ke attacker
  legacyHeaders: false, // Tidak expose X-RateLimit-* headers
});
