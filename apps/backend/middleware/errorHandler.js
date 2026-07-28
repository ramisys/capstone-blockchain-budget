import { AppError } from '../errors/appError.js';
import { formatErrorResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Centralized Express Error Handling Middleware.
 *
 * @param {Error} err - Error object thrown
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Handle Prisma Known Request Errors (e.g. Unique Constraint Violation)
  if (err.code === 'P2002') {
    statusCode = HTTP_STATUS.CONFLICT;
    const targetFields = err.meta?.target ? err.meta.target.join(', ') : 'field';
    message = `A record with this ${targetFields} already exists`;
    errors = [{ field: targetFields, message }];
  }

  // Hide internal error details in production
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
    message = 'An unexpected internal server error occurred';
    errors = [];
  }

  // Log non-operational errors for debugging
  if (!err.isOperational) {
    console.error('Unhandled System Error:', err);
  }

  return res.status(statusCode).json(formatErrorResponse(message, errors));
};
