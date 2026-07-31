import { Router } from 'express';
import { budgetProgramController } from '../controllers/budgetProgramController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createBudgetProgramSchema,
  updateBudgetProgramSchema,
  budgetProgramQuerySchema
} from '../validators/budgetProgramValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/budget-programs
 * @description Get all budget programs with filtering, pagination, and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...Object.values(ROLES)), // Allow all roles to view budget programs
  validateRequest(budgetProgramQuerySchema, 'query'),
  (req, res, next) => budgetProgramController.getAllBudgetPrograms(req, res, next)
);

/**
 * @route   GET /api/budget-programs/:id
 * @description Get budget program by ID
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...Object.values(ROLES)),
  (req, res, next) => budgetProgramController.getBudgetProgramById(req, res, next)
);

/**
 * @route   GET /api/budget-programs/code/:code
 * @description Get budget program by code
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/code/:code',
  authorize(...Object.values(ROLES)),
  (req, res, next) => budgetProgramController.getBudgetProgramByCode(req, res, next)
);

/**
 * @route   POST /api/budget-programs
 * @description Create a new budget program
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(createBudgetProgramSchema),
  (req, res, next) => budgetProgramController.createBudgetProgram(req, res, next)
);

/**
 * @route   PUT /api/budget-programs/:id
 * @description Update budget program by ID
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(updateBudgetProgramSchema),
  (req, res, next) => budgetProgramController.updateBudgetProgram(req, res, next)
);

/**
 * @route   DELETE /api/budget-programs/:id
 * @description Delete budget program by ID
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => budgetProgramController.deleteBudgetProgram(req, res, next)
);

export default router;