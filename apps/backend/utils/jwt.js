import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Sign a JWT access token.
 *
 * @param {object} payload - Claims to embed in token (id, email, role)
 * @returns {string} Signed JWT token
 */
export const signToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verify a JWT access token.
 *
 * @param {string} token - JWT token string
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};
