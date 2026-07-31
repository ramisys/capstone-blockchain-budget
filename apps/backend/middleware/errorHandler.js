import { Prisma } from '@prisma/client';
import { AppError } from '../errors/appError.js';
import { PrismaError } from '../errors/prismaError.js';
import { formatErrorResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Detect whether an error was thrown by the Prisma client.
 *
 * @param {Error} err - Error object thrown
 * @returns {boolean} True if the error originates from Prisma
 */
const isPrismaError = (err) => {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  );
};

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
  let normalized = false;

  // Normalize Prisma errors into operational errors with proper HTTP status codes
  if (isPrismaError(err)) {
    normalized = true;
    const prismaError = PrismaError.fromError(err);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errors = prismaError.errors;

    // Keep database issues visible outside production for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Prisma Error (${err.code || err.name}):`, err.message);
    }
  }

  // Hide internal error details in production
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
    message = 'An unexpected internal server error occurred';
    errors = [];
  }

  // Log non-operational errors for debugging
  if (!err.isOperational && !normalized) {
    console.error('Unhandled System Error:', err);
  }

  return res.status(statusCode).json(formatErrorResponse(message, errors));
};
