import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validateRequest } from '../validators/validateRequest.js';
import { loginSchema } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLoginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get access token
 * @access  Public (Protected by Auth Rate Limiter - Max 5 attempts / 15 mins)
 */
router.post('/login', authLoginLimiter, validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Stateless logout endpoint
 * @access  Private (Authenticated)
 */
router.post('/logout', authenticate, (req, res, next) =>
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
