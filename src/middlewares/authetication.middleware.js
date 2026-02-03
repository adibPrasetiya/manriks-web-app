import { prismaClient } from "../apps/database.js";
import { verifyAccessToken } from "../utils/token.utils.js";
import {
  logAuthEvent,
  logSecurityEvent,
  buildLogContext,
  ACTION_TYPES,
} from "../utils/logger.utils.js";

export const authenticationMiddleware = async (req, res, next) => {
  const context = buildLogContext(req);

  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logAuthEvent(ACTION_TYPES.UNAUTHORIZED, {
        ...context,
        reason: "Missing or invalid authorization header",
      });
      return res.status(401).json({
        errors: "Authorization header is missing or invalid format",
      });
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      logAuthEvent(ACTION_TYPES.TOKEN_INVALID, {
        ...context,
        reason: error.message,
      });
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
        profile: true,
      },
    });

    if (!user) {
      logAuthEvent(ACTION_TYPES.TOKEN_INVALID, {
        ...context,
        reason: "User not found for token",
      });
      return res.status(401).json({
        errors: "User not found",
      });
    }

    if (!user.isActive) {
      logSecurityEvent(
        ACTION_TYPES.ACCESS_DENIED,
        {
          ...context,
          userId: user.id,
          username: user.username,
          reason: "Inactive account",
        },
        "warn"
      );
      return res.status(403).json({
        errors: "User account is not active",
      });
    }

    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );

      if (decoded.iat < passwordChangedTimestamp) {
        logAuthEvent(ACTION_TYPES.TOKEN_EXPIRED, {
          ...context,
          userId: user.id,
          username: user.username,
          reason: "Password changed after token issued",
        });
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
        logSecurityEvent(
          ACTION_TYPES.ACCESS_DENIED,
          {
            ...context,
            userId: user.id,
            username: user.username,
            reason: "Must change password first",
          },
          "warn"
        );
        return res.status(403).json({
          errors:
            "Password change required. Your password was reset by an administrator. Please change your password before accessing other resources.",
          mustChangePassword: true,
        });
      }
    }

    // Check if user has profile
    if (!user.profile) {
      const isCreateProfileEndpoint =
        req.method === "POST" && req.path === "/users/me/profiles";
      const isLogoutEndpoint =
        req.method === "DELETE" && req.path === "/users/me/logout";
      const isSearchUnitKerjaEndpoint =
        req.method === "GET" && req.path.startsWith("/unit-kerja");
      const isGetProfileRequestEndpoint =
        req.method === "GET" &&
        req.path.startsWith("/users/me/profile-requests");

      if (
        !isCreateProfileEndpoint &&
        !isLogoutEndpoint &&
        !isSearchUnitKerjaEndpoint &&
        !isGetProfileRequestEndpoint
      ) {
        return res.status(403).json({
          errors:
            "Profile creation required. Please create your profile before accessing other resources.",
          mustCreateProfile: true,
        });
      }
    }

    // Check if profile is verified
    if (user.profile && !user.profile.isVerified) {
      const allowedEndpointsForUnverified = [
        { method: "DELETE", path: "/users/me/logout" },
        { method: "GET", path: "/users/me/profiles" },
        { method: "GET", pathStartsWith: "/users/me/profile-requests" },
        { method: "POST", path: "/users/me/profile-requests" },
        { method: "GET", pathStartsWith: "/unit-kerja" },
      ];

      const isAllowedForUnverified = allowedEndpointsForUnverified.some(
        (endpoint) => {
          if (endpoint.pathStartsWith) {
            return (
              req.method === endpoint.method &&
              req.path.startsWith(endpoint.pathStartsWith)
            );
          }
          return req.method === endpoint.method && req.path === endpoint.path;
        }
      );

      if (!isAllowedForUnverified) {
        return res.status(403).json({
          errors:
            "Profile belum diverifikasi. Silakan tunggu persetujuan administrator.",
          mustVerifyProfile: true,
          profileStatus: "PENDING_VERIFICATION",
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
      hasProfile: !!user.profile,
      profileVerified: user.profile?.isVerified || false,
      unitKerjaId: user.profile?.unitKerjaId || null,
    };

    next();
  } catch (error) {
    logAuthEvent(ACTION_TYPES.INTERNAL_ERROR, {
      ...context,
      reason: error.message,
      errorName: error.name,
    });
    return res.status(500).json({
      message: "Internal server error during authentication",
      error: error.message,
    });
  }
};
