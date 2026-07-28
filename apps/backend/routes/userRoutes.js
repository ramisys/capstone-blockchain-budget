import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/users
 * @description Get all users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => userController.getAllUsers(req, res, next)
);

/**
 * @route   GET /api/users/:id
 * @description Get user by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => userController.getUserById(req, res, next)
);

/**
 * @route   POST /api/users
 * @description Create a new user
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(createUserSchema),
  (req, res, next) => userController.createUser(req, res, next)
);

/**
 * @route   PUT /api/users/:id
 * @description Update user by ID
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(updateUserSchema),
  (req, res, next) => userController.updateUser(req, res, next)
);

/**
 * @route   DELETE /api/users/:id
 * @description Delete user by ID
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => userController.deleteUser(req, res, next)
);

/**
 * @route   PATCH /api/users/:id/role
 * @description Change user role
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/role',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => userController.changeUserRole(req, res, next)
);

/**
 * @route   PATCH /api/users/:id/status
 * @description Change user status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => userController.changeUserStatus(req, res, next)
);

export default router;