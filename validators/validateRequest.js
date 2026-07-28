import { ValidationError } from '../errors/apiError.js';

/**
 * Generic Express middleware generator for Zod schema validation.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} [target='body'] - Request target to validate
 * @returns {Function} Express middleware handler
 */
export const validateRequest = (schema, target = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return next(new ValidationError('Validation failed', formattedErrors));
    }

    req[target] = result.data;
    next();
  };
};
