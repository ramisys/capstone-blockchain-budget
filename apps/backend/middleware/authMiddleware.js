import { verifyToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/userRepository.js';
import { UnauthorizedError, ForbiddenError } from '../errors/apiError.js';
import { USER_STATUS } from '../constants/status.js';

/**
 * Express middleware for verifying the JWT access token and attaching the
 * authenticated user to the request.
 *
 * The token is verified for signature, expiry, issuer, audience, and
 * algorithm. The account is then re-validated against the database so that
 * deleted or deactivated users lose access immediately rather than waiting
 * for their token to expire, and `req.user` always carries fresh role/status.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Authentication token is invalid');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Authentication token has expired');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedError('Authentication token is invalid');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenError('Account is inactive. Please contact the administrator.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};
