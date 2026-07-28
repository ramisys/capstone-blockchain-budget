import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/apiError.js';

/**
 * Express middleware for verifying JWT access token and attaching authenticated user to request.
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Authentication token is invalid');
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Authentication token has expired');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }
  } catch (error) {
    next(error);
  }
};
