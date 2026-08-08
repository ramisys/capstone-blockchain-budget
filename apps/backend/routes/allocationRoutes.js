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
  allocationBreakdownSchema,
  remainingBudgetQuerySchema,
  allocationIdParamSchema,
  rejectAllocationSchema,
  returnAllocationSchema,
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

const APPROVAL_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER];

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
 * @route   GET /api/allocations/breakdown
 * @description Get approved allocation amounts grouped by department or category
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/breakdown',
  authorize(...READ_ROLES),
  validateRequest(allocationBreakdownSchema, 'query'),
  (req, res, next) => allocationController.getAllocationBreakdown(req, res, next)
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

/**
 * @route   POST /api/allocations/:id/submit
 * @description Submit a Draft allocation for approval
 * @access  Private (Admin, BudgetOfficer)
 */
router.post(
  '/:id/submit',
  authorize(...WRITE_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => allocationController.submitForApproval(req, res, next)
);

/**
 * @route   POST /api/allocations/:id/approve
 * @description Approve a PendingApproval allocation
 * @access  Private (Admin, Treasurer)
 */
router.post(
  '/:id/approve',
  authorize(...APPROVAL_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => allocationController.approveAllocation(req, res, next)
);

/**
 * @route   POST /api/allocations/:id/reject
 * @description Reject a PendingApproval allocation with a reason
 * @access  Private (Admin, Treasurer)
 */
router.post(
  '/:id/reject',
  authorize(...APPROVAL_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  validateRequest(rejectAllocationSchema),
  (req, res, next) => allocationController.rejectAllocation(req, res, next)
);

/**
 * @route   POST /api/allocations/:id/return
 * @description Return an allocation to Draft for revision
 * @access  Private (Admin, Treasurer, BudgetOfficer)
 */
router.post(
  '/:id/return',
  authorize(ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER),
  validateRequest(allocationIdParamSchema, 'params'),
  validateRequest(returnAllocationSchema),
  (req, res, next) => allocationController.returnAllocation(req, res, next)
);

/**
 * @route   GET /api/allocations/:id/approvals
 * @description Get the approval history for an allocation
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id/approvals',
  authorize(...READ_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => allocationController.getApprovalHistory(req, res, next)
);

export default router;
