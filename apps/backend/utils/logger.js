import { auditLogger } from './auditLogger.js';

/**
 * Lightweight application logger.
 *
 * Keeps lifecycle/security events visible in development and production logs
 * without introducing an external dependency.
 */
export const logger = {
  /**
   * Log a business/security event (created, updated, deleted, forbidden, etc.)
   *
   * @param {string} message - Event description
   */
  logEvent(message) {
    console.log(`[${new Date().toISOString()}] [EVENT] ${message}`);
  },

  /**
   * Log a structured audit event.
   *
   * @param {Object} params - Audit parameters
   */
  audit(params) {
    return auditLogger.log(params);
  },

  /**
   * Log a warning (validation failures, suspicious access).
   *
   * @param {string} message - Warning description
   */
  warn(message) {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`);
  },

  /**
   * Log an unexpected error.
   *
   * @param {string} message - Error description
   * @param {Error} [error] - Original error object
   */
  error(message, error) {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, error || '');
  },
};

export { auditLogger };

