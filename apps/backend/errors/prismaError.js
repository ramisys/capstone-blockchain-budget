import { Prisma } from '@prisma/client';
import { AppError } from './appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Extract the field(s) involved in a unique constraint violation.
 *
 * @param {Object} err - Prisma known request error
 * @returns {string} Field name or comma-separated fields
 */
const extractUniqueTarget = (err) => {
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.join(', ');
  if (typeof target === 'string') return target;
  return 'field';
};

/**
 * Humanize a database column or table name for display.
 * "departmentId" -> "department", "budget_programs" -> "budget programs".
 *
 * @param {string} field - Raw field name
 * @returns {string} Human-readable label
 */
const humanizeFieldName = (field) => {
  return field
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+Id$/i, '')
    .trim()
    .toLowerCase();
};

/**
 * Extract the field involved in a foreign key constraint violation.
 * Prisma may report either the constraint name (<table>_<column>_fkey)
 * or just the column name.
 *
 * @param {Object} err - Prisma known request error
 * @returns {string} Human-readable field label, or empty string
 */
const extractFkField = (err) => {
  const fieldName = err.meta?.field_name || '';
  const constraintMatch = fieldName.match(/^.*_([^_]*)_fkey$/);
  return constraintMatch ? humanizeFieldName(constraintMatch[1]) : humanizeFieldName(fieldName);
};

/**
 * Map of Prisma error codes to HTTP status codes and user-facing messages.
 * Messages may be static strings or functions receiving the original error.
 */
const PRISMA_ERROR_MAP = {
  // Connection & initialization errors
  P1000: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'Authentication failed for the database' },
  P1001: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'Unable to reach the database server' },
  P1002: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'Timed out connecting to the database' },
  P1003: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'The database does not exist' },
  P1008: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'Database operations timed out' },
  P1009: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'The database already exists' },
  P1010: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'Access to the database was denied' },
  P1011: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'Failed to open a connection to the database' },
  P1017: { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'The database server closed the connection' },

  // Known request errors
  P2000: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'The provided value is too long for its column' },
  P2002: {
    statusCode: HTTP_STATUS.CONFLICT,
    message: (err) => `A record with this ${extractUniqueTarget(err)} already exists`,
    errors: (err) => {
      const field = extractUniqueTarget(err);
      return [{ field, message: `A record with this ${field} already exists` }];
    },
  },
  P2003: {
    statusCode: HTTP_STATUS.CONFLICT,
    message: (err) => {
      const field = extractFkField(err);
      return field
        ? `This record is still referenced by ${field} and cannot be modified or deleted`
        : 'This record is referenced by another record and cannot be modified or deleted';
    },
    errors: (err) => {
      const field = err.meta?.field_name || 'related records';
      return [{ field, message: 'This record is referenced by another record' }];
    },
  },
  P2004: { statusCode: HTTP_STATUS.CONFLICT, message: 'A database constraint was violated' },
  P2005: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Invalid value provided to the query' },
  P2006: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Invalid value provided for a field' },
  P2007: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Invalid data was provided' },
  P2008: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'The query could not be parsed' },
  P2009: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'The query failed validation' },
  P2010: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'The raw query failed' },
  P2011: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'A required value was null' },
  P2012: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'A required value was missing' },
  P2013: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'A required argument was missing' },
  P2014: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'The change would violate a required relation' },
  P2015: { statusCode: HTTP_STATUS.NOT_FOUND, message: 'A related record could not be found' },
  P2016: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'The query could not be interpreted' },
  P2017: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'The records are not connected' },
  P2018: { statusCode: HTTP_STATUS.NOT_FOUND, message: 'Required connected records were not found' },
  P2019: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Invalid input was provided' },
  P2020: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'A value was out of range' },
  P2021: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'A required table does not exist in the database' },
  P2022: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'A required column does not exist in the database' },
  P2023: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Inconsistent column data was detected' },
  P2024: { statusCode: HTTP_STATUS.REQUEST_TIMEOUT, message: 'The query timed out' },
  P2025: {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: (err) => {
      const model = err.meta?.modelName;
      return model ? `${model} not found` : 'The requested record was not found';
    },
  },
  P2026: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'The operation uses an unsupported feature' },
  P2027: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Multiple database errors occurred' },
  P2028: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'The database transaction failed' },
  P2030: { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Full-text search is not available on this database' },
  P2033: { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'A number provided to the query was out of range' },
  P2034: { statusCode: HTTP_STATUS.CONFLICT, message: 'The transaction failed due to a write conflict' },
};

/**
 * Operational error representing a failed database operation, carrying the
 * appropriate HTTP status code and a safe, user-facing message.
 */
export class PrismaError extends AppError {
  /**
   * @param {string} message - User-facing error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} [errors] - Field-level error details
   * @param {string|null} [code] - Original Prisma error code
   */
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = [], code = null) {
    super(message, statusCode, errors);
    this.name = 'PrismaError';
    this.code = code;
  }

  /**
   * Convert a raw Prisma client error into an operational PrismaError.
   *
   * @param {Object} err - Error thrown by the Prisma client
   * @returns {PrismaError} Mapped operational error
   */
  static fromError(err) {
    if (!err) {
      return new PrismaError('A database operation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      return new PrismaError('Invalid data was provided to the database', HTTP_STATUS.BAD_REQUEST, [], 'P2009');
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
      return new PrismaError('Unable to connect to the database', HTTP_STATUS.SERVICE_UNAVAILABLE, [], err.errorCode);
    }

    if (err instanceof Prisma.PrismaClientRustPanicError) {
      return new PrismaError('The database engine encountered an internal error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
      return new PrismaError('An unknown database error occurred', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const mapping = PRISMA_ERROR_MAP[err.code];
    if (mapping) {
      const message = typeof mapping.message === 'function' ? mapping.message(err) : mapping.message;
      const errors = typeof mapping.errors === 'function' ? mapping.errors(err) : [];
      return new PrismaError(message, mapping.statusCode, errors, err.code);
    }

    return new PrismaError('An unexpected database error occurred', HTTP_STATUS.INTERNAL_SERVER_ERROR, [], err.code || null);
  }
}
