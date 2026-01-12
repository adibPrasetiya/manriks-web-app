/**
 * Authorization Middleware - Role-Based Access Control (RBAC)
 *
 * Middleware ini menggunakan pattern factory function untuk create middleware
 * yang check apakah user memiliki role yang diperlukan untuk akses resource.
 *
 * IMPORTANT: Middleware ini harus digunakan SETELAH authenticationMiddleware
 * karena memerlukan req.user yang di-set oleh authentication middleware.
 *
 * @param {string|string[]} allowedRoles - Single role atau array of roles yang diperbolehkan
 * @returns {Function} Express middleware function
 *
 * @example
 * import { authorize } from '../middlewares/authorization-middleware.js';
 * import { ROLES } from '../conf/constant.js';
 *
 * // Single role
 * router.get('/admin', authenticationMiddleware, authorize(ROLES.ADMINISTRATOR), controller);
 *
 * // Multiple roles (user hanya perlu 1 dari roles yang di-list)
 * router.get('/data', authenticationMiddleware, authorize([ROLES.ADMINISTRATOR, ROLES.TEAM_LEADER]), controller);
 */
export const authorize = (allowedRoles) => {
  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        errors: "Authentication required. Please login first.",
      });
    }

    if (!req.user.roles || !Array.isArray(req.user.roles)) {
      return res.status(403).json({
        errors: "Access denied. User roles not found.",
      });
    }

    const hasRequiredRole = rolesArray.some((role) =>
      req.user.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        errors: `Access denied.`,
      });
    }

    next();
  };
};
