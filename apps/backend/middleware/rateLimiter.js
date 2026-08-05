import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { formatErrorResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Standard handler for rate limit violations across all limiters.
 * Logs the blocked request and returns a consistent HTTP 429 error response.
 */
const createRateLimitHandler = (limiterName) => {
  return (req, res, next, options) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const logTimestamp = new Date().toISOString();

    console.warn(
      `[RATE_LIMIT_EXCEEDED] [${limiterName}] IP: ${ip} | Method: ${req.method} | Route: ${req.originalUrl} | Timestamp: ${logTimestamp}`
    );

    return res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(formatErrorResponse('Too many requests. Please try again later.', []));
  };
};

/**
 * 1. Global API Rate Limiter
 * Applied globally to /api/* endpoints.
 * Limits each IP to 100 requests per 15-minute window.
 */
export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Global API Limiter'),
});

/**
 * 2. Authentication Rate Limiter
 * Applied strictly to POST /api/auth/login.
 * Protects against brute-force password guessing and CPU exhaustion DoS.
 * Limits each IP to 5 attempts per 15-minute window.
 */
export const authLoginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Auth Login Limiter'),
});

/**
 * 3. Sensitive Route Rate Limiter
 * Reusable limiter prepared for future sensitive endpoints (e.g. password resets, email verifications).
 * Limits each IP to 10 requests per 1-hour window.
 */
export const sensitiveRouteLimiter = rateLimit({
  windowMs: config.rateLimit.sensitiveWindowMs,
  max: config.rateLimit.sensitiveMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Sensitive Route Limiter'),
});

/**
 * 4. Document Upload Rate Limiter
 * Applied to the multipart upload endpoints (POST /api/documents and
 * POST /api/documents/:id/replace). Uploads are far more expensive than regular
 * JSON requests, so a stricter per-IP cap prevents disk-exhaustion DoS on the
 * upload temp directory. Limits each IP to 20 uploads per 15-minute window.
 */
export const uploadLimiter = rateLimit({
  windowMs: config.rateLimit.uploadWindowMs,
  max: config.rateLimit.uploadMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: createRateLimitHandler('Document Upload Limiter'),
});
