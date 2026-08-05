import { Router } from 'express';
import { blockchainController } from '../controllers/blockchainController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  blockchainQuerySchema,
  blockchainHistoryQuerySchema,
  allocationIdParamSchema,
  transactionIdParamSchema,
  transactionDetailQuerySchema,
} from '../validators/blockchainValidator.js';
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
 * @route   GET /api/blockchain/status
 * @description Get blockchain ledger status
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/status',
  authorize(...READ_ROLES),
  (req, res, next) => blockchainController.getStatus(req, res, next)
);

/**
 * @route   GET /api/blockchain/transactions
 * @description Get paginated blockchain transaction history
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/transactions',
  authorize(...READ_ROLES),
  validateRequest(blockchainQuerySchema, 'query'),
  (req, res, next) => blockchainController.getTransactions(req, res, next)
);

/**
 * @route   GET /api/blockchain/history
 * @description Get the unified, type-aware ledger history (Allocation / Document / Audit)
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/history',
  authorize(...READ_ROLES),
  validateRequest(blockchainHistoryQuerySchema, 'query'),
  (req, res, next) => blockchainController.getHistory(req, res, next)
);

/**
 * @route   GET /api/blockchain/transactions/:id
 * @description Get the full detail of a single blockchain transaction
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/transactions/:id',
  authorize(...READ_ROLES),
  validateRequest(transactionIdParamSchema, 'params'),
  validateRequest(transactionDetailQuerySchema, 'query'),
  (req, res, next) => blockchainController.getTransactionDetail(req, res, next)
);

/**
 * @route   GET /api/blockchain/allocations/:id
 * @description Get verification details for a single allocation
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/allocations/:id',
  authorize(...READ_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => blockchainController.getAllocationVerification(req, res, next)
);

/**
 * @route   POST /api/blockchain/allocations/:id/verify
 * @description Verify an allocation against the blockchain ledger
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.post(
  '/allocations/:id/verify',
  authorize(...READ_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => blockchainController.verifyAllocation(req, res, next)
);

/**
 * @route   POST /api/blockchain/allocations/:id/retry
 * @description Re-anchor a Pending/Failed allocation record on the ledger
 * @access  Private (Admin, Treasurer, BudgetOfficer)
 */
router.post(
  '/allocations/:id/retry',
  authorize(...RETRY_ROLES),
  validateRequest(allocationIdParamSchema, 'params'),
  (req, res, next) => blockchainController.retryRecord(req, res, next)
);

export default router;
