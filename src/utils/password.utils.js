import crypto from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(crypto.pbkdf2);

// Configuration
const DEFAULT_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

/**
 * Hash a password using PBKDF2-SHA512
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} - Formatted hash string: <salt_base64>$<hash_base64>
 */
export const hash = async (password) => {
  const salt = crypto.randomBytes(SALT_LENGTH);

  const derivedKey = await pbkdf2Async(
    password,
    salt,
    DEFAULT_ITERATIONS,
    KEY_LENGTH,
    DIGEST,
  );

  const saltBase64 = salt.toString("base64");
  const hashBase64 = derivedKey.toString("base64");

  return `${saltBase64}$${hashBase64}`;
};

/**
 * Compare a plain text password against a stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Stored hash string to compare against
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
export const compare = async (password, hashedPassword) => {
  if (!hashedPassword) {
    return false;
  }

  // Parse hash components: <salt_base64>$<hash_base64>
  const parts = hashedPassword.split("$");
  if (parts.length !== 2) {
    return false;
  }

  const salt = Buffer.from(parts[0], "base64");
  const storedHash = Buffer.from(parts[1], "base64");

  // Validate salt and hash length
  if (salt.length !== SALT_LENGTH || storedHash.length !== KEY_LENGTH) {
    return false;
  }

  try {
    const derivedKey = await pbkdf2Async(
      password,
      salt,
      DEFAULT_ITERATIONS,
      KEY_LENGTH,
      DIGEST,
    );

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(derivedKey, storedHash);
  } catch (error) {
    return false;
  }
};

export default {
  hash,
  compare,
};
