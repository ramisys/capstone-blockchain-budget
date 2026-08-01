import { ForbiddenError, UnauthorizedError } from '../errors/apiError.js';
import { logger } from '../utils/logger.js';

/**
 * Role-Based Access Control (RBAC) authorization middleware factory.
 * Accepts list of allowed roles, e.g. authorize("Administrator", "Treasurer")
 *
 * @param {...string} allowedRoles - List of permitted role names
 * @returns {Function} Express middleware function
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication required before authorization check'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt: user ${req.user.id} (${req.user.role}) on ${req.method} ${req.originalUrl}`
      );
      return next(
        new ForbiddenError('You do not have permission to access this resource', [
          `Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        ])
      );
    }

    next();
  };
};
