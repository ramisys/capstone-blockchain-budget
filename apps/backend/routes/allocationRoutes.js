import { Router } from 'express';
import { allocationController } from '../controllers/allocationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createAllocationSchema,
  updateAllocationSchema,
  allocationQuerySchema,
  allocationStatisticsSchema,
  remainingBudgetQuerySchema,
  allocationIdParamSchema,
} from '../validators/allocationValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

const READ_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.TREASURER,
  ROLES.BUDGET_OFFICER,
  ROLES.AUDITOR,
];

const WRITE_ROLES = [ROLES.ADMINISTRATOR, ROLES.BUDGET_OFFICER];

/**
 * @route   GET /api/allocations
 * @description Get all allocations with filtering, pagination, and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...READ_ROLES),
  validateRequest(allocationQuerySchema, 'query'),
  (req, res, next) => allocationController.getAllocations(req, res, next)
);

/**
 * @route   GET /api/allocations/statistics
 * @description Get allocation dashboard statistics
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/statistics',
  authorize(...READ_ROLES),
  validateRequest(allocationStatisticsSchema, 'query'),
  (req, res, next) => allocationController.getAllocationStatistics(req, res, next)
);

/**
 * @route   GET /api/allocations/remaining-budget
 * @description Get total budget, allocated, and remaining budget
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/remaining-budget',
  authorize(...READ_ROLES),
  validateRequest(remainingBudgetQuerySchema, 'query'),
  (req, res, next) => allocationController.getRemainingBudget(req, res, next)
);

/**
 * @route   GET /api/allocations/:id
 * @description Get allocation by ID
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...READ_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => allocationController.getAllocationById(req, res, next)
);

/**
 * @route   POST /api/allocations
 * @description Create a new budget allocation
 * @access  Private (Admin, BudgetOfficer)
 */
router.post(
  '/',
  authorize(...WRITE_ROLES),
  validateRequest(createAllocationSchema),
  (req, res, next) => allocationController.createAllocation(req, res, next)
);

/**
 * @route   PUT /api/allocations/:id
 * @description Update a draft budget allocation
 * @access  Private (Admin, BudgetOfficer)
 */
router.put(
  '/:id',
  authorize(...WRITE_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  validateRequest(updateAllocationSchema),
  (req, res, next) => allocationController.updateAllocation(req, res, next)
);

/**
 * @route   DELETE /api/allocations/:id
 * @description Soft-delete a budget allocation
 * @access  Private (Admin, BudgetOfficer)
 */
router.delete(
  '/:id',
  authorize(...WRITE_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => allocationController.deleteAllocation(req, res, next)
);

export default router;
