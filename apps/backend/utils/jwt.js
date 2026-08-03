import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';

/**
 * Sign a JWT access token.
 *
 * Includes issuer, audience, a unique token ID (jti), and pins the
 * signing algorithm to HS256 so tokens cannot be confused across
 * consumers or algorithms.
 *
 * @param {object} payload - Claims to embed in token (id, email, role)
 * @returns {string} Signed JWT token
 */
export const signToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    jwtid: randomUUID(),
    algorithm: 'HS256',
  });
};

/**
 * Verify a JWT access token.
 *
 * Rejects tokens with a mismatched issuer, audience, or algorithm,
 * so a token intended for another service (or signed with another
 * algorithm) is never accepted.
 *
 * @param {string} token - JWT token string
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256'],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

/**
 * Helper to parse time string like '7d', '1d', '15m' to milliseconds.
 * @param {string} timeStr
 * @returns {number} milliseconds
 */
export const parseDurationToMs = (timeStr) => {
  if (typeof timeStr === 'number') return timeStr;
  const match = /^(\d+)([smhd])$/.exec(timeStr);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return val * 1000;
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
};

/**
 * Generate a cryptographically secure refresh token string and expiration Date.
 *
 * @returns {{ token: string, expiresAt: Date }}
 */
export const generateRefreshToken = () => {
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const durationMs = parseDurationToMs(config.jwt.refreshTokenExpiresIn);
  const expiresAt = new Date(Date.now() + durationMs);
  return { token, expiresAt };
};

