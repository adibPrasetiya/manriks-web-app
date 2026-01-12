import crypto from "crypto";

/**
 * Generate device ID dari user agent dan IP address
 * Device ID digunakan untuk constraint 1 session per user per device
 * @param {string} userAgent - User agent string dari request
 * @param {string} ipAddress - IP address dari request
 * @returns {string} - Device ID (hashed)
 */
export const generateDeviceId = (userAgent, ipAddress) => {
  // Combine user agent dan IP untuk create unique device identifier
  const deviceString = `${userAgent || "unknown"}-${ipAddress || "unknown"}`;

  // Hash untuk create consistent device ID
  return crypto.createHash("sha256").update(deviceString).digest("hex");
};

/**
 * Parse device name dari user agent
 * @param {string} userAgent - User agent string
 * @returns {string} - Device name
 */
export const parseDeviceName = (userAgent) => {
  if (!userAgent) return "Unknown Device";

  // Detect browser
  let browser = "Unknown Browser";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";

  // Detect OS
  let os = "Unknown OS";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone"))
    os = "iOS";

  return `${browser} on ${os}`;
};

/**
 * Extract IP address dari request
 * @param {Object} req - Express request object
 * @returns {string} - IP address
 */
export const extractIpAddress = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};
