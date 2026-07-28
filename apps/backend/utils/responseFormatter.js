/**
 * Format standard success response payload.
 *
 * @param {string} message - Human-readable success message
 * @param {object|array|null} data - Payload data
 * @returns {object} Standard success response structure
 */
export const formatSuccessResponse = (message, data = {}) => {
  return {
    success: true,
    message,
    data: data ?? {},
  };
};

/**
 * Format standard error response payload.
 *
 * @param {string} message - Human-readable error message
 * @param {array} errors - List of detailed error objects or strings
 * @returns {object} Standard error response structure
 */
export const formatErrorResponse = (message, errors = []) => {
  return {
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  };
};
