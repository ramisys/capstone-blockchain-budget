import { AUDIT_RESULTS } from '../constants/auditActions.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordconfirm',
  'password_confirm',
  'token',
  'refreshtoken',
  'refresh_token',
  'accesstoken',
  'access_token',
  'secret',
  'authorization',
]);

/**
 * Sanitize an object or primitive, stripping sensitive data such as passwords and tokens.
 *
 * @param {*} data - Data to sanitize
 * @param {number} [depth=0] - Recursion depth
 * @returns {*} Sanitized copy of the data
 */
export function sanitizeData(data, depth = 0) {
  if (depth > 5 || data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Extract client IP address from an Express request object.
 *
 * @param {import('express').Request|string} [req]
 * @returns {string} Client IP address
 */
export function extractClientIp(req) {
  if (!req) return 'UNKNOWN';
  if (typeof req === 'string') return req;

  // Handle Express req.ip (populated when 'trust proxy' is enabled)
  if (req.ip) return req.ip;

  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'UNKNOWN';
}

/**
 * Normalize actor information into a standardized representation.
 *
 * @param {Object|string|null} actor
 * @returns {Object} Standardized actor object
 */
export function normalizeActor(actor) {
  if (!actor) {
    return { id: 'ANONYMOUS', role: 'Anonymous' };
  }

  if (typeof actor === 'string') {
    return { id: actor };
  }

  return {
    id: actor.id ?? 'UNKNOWN',
    ...(actor.email && { email: actor.email }),
    ...(actor.role && { role: actor.role }),
    ...(actor.fullName && { fullName: actor.fullName }),
  };
}

/**
 * Normalize target resource metadata.
 *
 * @param {Object|string|null} resource
 * @returns {Object|null} Standardized resource object
 */
export function normalizeResource(resource) {
  if (!resource) return null;
  if (typeof resource === 'string') {
    return { type: resource };
  }
  return {
    type: resource.type ?? 'UNKNOWN',
    ...(resource.id !== undefined && { id: resource.id }),
    ...(resource.name !== undefined && { name: resource.name }),
    ...(resource.code !== undefined && { code: resource.code }),
  };
}

/**
 * Structured Audit Logger for tracking security and lifecycle events.
 */
export const auditLogger = {
  /**
   * Log a structured audit event.
   *
   * @param {Object} entry
   * @param {string} entry.action - Audit action identifier from AUDIT_ACTIONS
   * @param {string} [entry.result='SUCCESS'] - 'SUCCESS' | 'FAILURE'
   * @param {Object|string|null} [entry.actor] - User or actor performing the action
   * @param {string|Object} [entry.ip='UNKNOWN'] - Client IP address or Request object
   * @param {Object|string|null} [entry.resource] - Target entity/resource
   * @param {Object|null} [entry.details] - Additional contextual details
   * @param {string} [entry.timestamp] - ISO timestamp
   * @returns {Object} Structured audit log record
   */
  log({
    action,
    result = AUDIT_RESULTS.SUCCESS,
    actor = null,
    ip = 'UNKNOWN',
    resource = null,
    details = null,
    timestamp = new Date().toISOString(),
  }) {
    const clientIp = typeof ip === 'object' && ip !== null ? extractClientIp(ip) : ip || 'UNKNOWN';
    const normalizedActor = normalizeActor(actor);
    const normalizedResource = normalizeResource(resource);
    const sanitizedDetails = details ? sanitizeData(details) : null;

    const auditEntry = {
      timestamp,
      action,
      result: result === AUDIT_RESULTS.FAILURE ? AUDIT_RESULTS.FAILURE : AUDIT_RESULTS.SUCCESS,
      actor: normalizedActor,
      ip: clientIp,
      resource: normalizedResource,
      ...(sanitizedDetails && { details: sanitizedDetails }),
    };

    const logMessage = `[${auditEntry.timestamp}] [AUDIT] [${auditEntry.action}] [${auditEntry.result}] actor=${auditEntry.actor.id} ip=${auditEntry.ip}${
      auditEntry.resource ? ` resource=${auditEntry.resource.type}${auditEntry.resource.id ? `:${auditEntry.resource.id}` : ''}` : ''
    }${auditEntry.details ? ` details=${JSON.stringify(auditEntry.details)}` : ''}`;

    if (auditEntry.result === AUDIT_RESULTS.FAILURE) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }

    return auditEntry;
  },

  /**
   * Convenience helper to log a successful audit event.
   */
  logSuccess(params) {
    return this.log({ ...params, result: AUDIT_RESULTS.SUCCESS });
  },

  /**
   * Convenience helper to log a failed audit event.
   */
  logFailure(params) {
    return this.log({ ...params, result: AUDIT_RESULTS.FAILURE });
  },

  /**
   * Log an audit event directly extracting actor and client IP from an Express request.
   *
   * @param {import('express').Request} req - Express request object
   * @param {Object} options - Audit event details
   * @returns {Object} Structured audit log record
   */
  logFromReq(req, { action, result = AUDIT_RESULTS.SUCCESS, actor = null, resource = null, details = null, error = null }) {
    const effectiveActor = actor || req?.user || null;
    const clientIp = extractClientIp(req);
    const combinedDetails = {
      ...(details || {}),
      ...(error && { error: error.message || String(error) }),
    };

    return this.log({
      action,
      result,
      actor: effectiveActor,
      ip: clientIp,
      resource,
      details: Object.keys(combinedDetails).length > 0 ? combinedDetails : null,
    });
  },
};
