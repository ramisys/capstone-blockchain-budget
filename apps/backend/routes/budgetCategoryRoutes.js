import { Router } from 'express';
import { budgetCategoryController } from '../controllers/budgetCategoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createBudgetCategorySchema,
  updateBudgetCategorySchema,
  budgetCategoryQuerySchema
} from '../validators/budgetCategoryValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/budget-categories
 * @description Get all budget categories with filtering, pagination, and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...Object.values(ROLES)), // Allow all roles to view budget categories
  validateRequest(budgetCategoryQuerySchema, 'query'),
  (req, res, next) => budgetCategoryController.getAllBudgetCategories(req, res, next)
);

/**
 * @route   GET /api/budget-categories/:id
 * @description Get budget category by ID
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...Object.values(ROLES)),
  (req, res, next) => budgetCategoryController.getBudgetCategoryById(req, res, next)
);

/**
 * @route   GET /api/budget-categories/code/:code
 * @description Get budget category by code
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/code/:code',
  authorize(...Object.values(ROLES)),
  (req, res, next) => budgetCategoryController.getBudgetCategoryByCode(req, res, next)
);

/**
 * @route   GET /api/budget-categories/name/:name
 * @description Get budget category by name
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/name/:name',
  authorize(...Object.values(ROLES)),
  (req, res, next) => budgetCategoryController.getBudgetCategoryByName(req, res, next)
);

/**
 * @route   POST /api/budget-categories
 * @description Create a new budget category
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(createBudgetCategorySchema),
  (req, res, next) => budgetCategoryController.createBudgetCategory(req, res, next)
);

/**
 * @route   PUT /api/budget-categories/:id
 * @description Update budget category by ID
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(updateBudgetCategorySchema),
  (req, res, next) => budgetCategoryController.updateBudgetCategory(req, res, next)
);

/**
 * @route   DELETE /api/budget-categories/:id
 * @description Delete budget category by ID
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => budgetCategoryController.deleteBudgetCategory(req, res, next)
);

export default router;