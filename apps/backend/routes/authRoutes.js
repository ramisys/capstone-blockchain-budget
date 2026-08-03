import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validateRequest } from '../validators/validateRequest.js';
import { loginSchema, refreshTokenSchema } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLoginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const optionalAuth = (req, res, next) => {
  authenticate(req, res, () => {
    next();
  });
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get access token + refresh token
 * @access  Public (Protected by Auth Rate Limiter - Max 5 attempts / 15 mins)
 */
router.post('/login', authLoginLimiter, validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using valid refresh token
 * @access  Public
 */
router.post('/refresh', validateRequest(refreshTokenSchema), (req, res, next) =>
  authController.refreshToken(req, res, next)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user & revoke refresh tokens
 * @access  Public / Private (Optional Auth)
 */
router.post('/logout', optionalAuth, (req, res, next) =>
  authController.logout(req, res, next)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);

export default router;
