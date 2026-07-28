import { NotFoundError } from '../errors/apiError.js';

/**
 * Middleware to handle 404 Route Not Found errors.
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl} - Route not found`);
  next(error);
};
