import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_RESULTS } from '../constants/auditActions.js';

/**
 * Middleware factory to automatically audit an endpoint upon completion.
 *
 * @param {string} action - Action name from AUDIT_ACTIONS
 * @param {Function} [resourceExtractor] - Optional function `(req, res) => resource`
 * @param {Function} [detailsExtractor] - Optional function `(req, res) => details`
 * @returns {import('express').RequestHandler}
 */
export function auditRoute(action, resourceExtractor = null, detailsExtractor = null) {
  return (req, res, next) => {
    res.on('finish', () => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      const resource = resourceExtractor ? resourceExtractor(req, res) : null;
      const details = detailsExtractor ? detailsExtractor(req, res) : { statusCode: res.statusCode };

      auditLogger.logFromReq(req, {
        action,
        result: isSuccess ? AUDIT_RESULTS.SUCCESS : AUDIT_RESULTS.FAILURE,
        resource,
        details,
      });
    });

    next();
  };
}

export { auditLogger };
