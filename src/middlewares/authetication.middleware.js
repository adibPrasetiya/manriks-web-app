import { prismaClient } from "../apps/database.js";
import { verifyAccessToken } from "../utils/token.utils.js";

export const authenticationMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        errors: "Authorization header is missing or invalid format",
      });
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        errors: "Invalid or expired access token",
      });
    }

    const user = await prismaClient.user.findUnique({
      where: {
        id: decoded.userId,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        errors: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        errors: "User account is not active",
      });
    }

    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );

      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          errors:
            "Password has been changed. Please login again with new password.",
        });
      }
    }

    if (user.mustChangePassword) {
      const isPasswordChangeEndpoint =
        req.method === "PATCH" && req.path === "/users/me/password";

      if (!isPasswordChangeEndpoint) {
        return res.status(403).json({
          errors:
            "Password change required. Your password was reset by an administrator. Please change your password before accessing other resources.",
          mustChangePassword: true, // Flag for frontend
        });
      }
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    req.user = {
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      roles: roles,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error during authentication",
      error: error.message,
    });
  }
};
