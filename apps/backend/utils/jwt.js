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
