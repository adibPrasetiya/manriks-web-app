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
        profile: true,
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
        user.passwordChangedAt.getTime() / 1000,
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

    console.log("method:", req.method);
    console.log("path:", req.path);
    console.log("originalUrl:", req.originalUrl);

    console.log(user);

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
        { method: "DELETE", pathStartsWith: "/users/me/profile-requests/" },
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
        },
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
    return res.status(500).json({
      message: "Internal server error during authentication",
      error: error.message,
    });
  }
};
