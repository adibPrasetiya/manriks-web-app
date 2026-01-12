import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  JWT_ACCESS_SECRET,
  REFRESH_TOKEN_EXPIRY_HOURS,
} from "../config/constant.js";

/**
 * Generate JWT Access Token
 * @param {Object} payload - { userId, username, email, roles }
 * @returns {string} - JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
};

/**
 * Generate Refresh Token (random string)
 * @returns {string} - Random refresh token
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * Hash refresh token untuk disimpan di database
 * @param {string} token - Refresh token
 * @returns {string} - Hashed token
 */
export const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Verify JWT Access Token
 * @param {string} token - JWT access token
 * @returns {Object} - Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

/**
 * Calculate refresh token expiry date
 * @returns {Date} - Expiry date
 */
export const getRefreshTokenExpiry = () => {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + REFRESH_TOKEN_EXPIRY_HOURS);
  return expiryDate;
};
