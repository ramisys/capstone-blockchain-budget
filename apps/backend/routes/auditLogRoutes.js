import { Router } from 'express';
import { auditLogController } from '../controllers/auditLogController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import { auditLogQuerySchema, auditLogIdParamSchema } from '../validators/auditLogValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

const READ_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.TREASURER,
  ROLES.BUDGET_OFFICER,
  ROLES.AUDITOR,
];

const RETRY_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER];

/**
 * @route   GET /api/audit-logs
 * @description Get paginated audit log entries with filtering and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...READ_ROLES),
  validateRequest(auditLogQuerySchema, 'query'),
  (req, res, next) => auditLogController.getLogs(req, res, next)
);

/**
 * @route   GET /api/audit-logs/summary
 * @description Get audit summary counts for the audit dashboard
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/summary',
  authorize(...READ_ROLES),
  (req, res, next) => auditLogController.getSummary(req, res, next)
);

/**
 * @route   GET /api/audit-logs/:id
 * @description Get a single audit log entry by ID
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...READ_ROLES),
  validateRequest(auditLogIdParamSchema, 'params'),
  (req, res, next) => auditLogController.getLogById(req, res, next)
);

/**
 * @route   POST /api/audit-logs/:id/retry
 * @description Re-anchor a Pending/Failed audit event on the AuditLedger contract
 * @access  Private (Admin, Treasurer, BudgetOfficer)
 */
router.post(
  '/:id/retry',
  authorize(...RETRY_ROLES),
  validateRequest(auditLogIdParamSchema, 'params'),
  (req, res, next) => auditLogController.retryAnchor(req, res, next)
);

export default router;
