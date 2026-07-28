import { AppError } from './appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', errors = []) {
    super(message, HTTP_STATUS.UNAUTHORIZED, errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', errors = []) {
    super(message, HTTP_STATUS.FORBIDDEN, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errors = []) {
    super(message, HTTP_STATUS.NOT_FOUND, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', errors = []) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, errors);
  }
}
