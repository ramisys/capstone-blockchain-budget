import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { uploadMiddleware, validateUploadedFile } from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
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

/**
 * @route   POST /api/verification/documents
 * @description Verify a user-uploaded file against the ledger without storing it
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.post(
  '/documents',
  authorize(...READ_ROLES),
  uploadLimiter,
  uploadMiddleware('file'),
  validateUploadedFile,
  (req, res, next) => documentController.verifyExternalDocument(req, res, next)
);

export default router;
