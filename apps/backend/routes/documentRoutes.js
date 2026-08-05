import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import { uploadMiddleware, validateUploadedFile } from '../middleware/uploadMiddleware.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  replaceDocumentSchema,
  documentQuerySchema,
  documentIdParamSchema,
  documentVersionQuerySchema,
} from '../validators/documentValidator.js';
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

const WRITE_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.TREASURER,
  ROLES.BUDGET_OFFICER,
];

const RETRY_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.TREASURER,
  ROLES.BUDGET_OFFICER,
];

/**
 * @route   GET /api/documents
 * @description Get documents with filtering, pagination, and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...READ_ROLES),
  validateRequest(documentQuerySchema, 'query'),
  (req, res, next) => documentController.getDocuments(req, res, next)
);

/**
 * @route   GET /api/documents/:id/download
 * @description Download a document version as an attachment (default current)
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id/download',
  authorize(...READ_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  validateRequest(documentVersionQuerySchema, 'query'),
  (req, res, next) => documentController.downloadDocument(req, res, next)
);

/**
 * @route   GET /api/documents/:id/preview
 * @description Preview a document inline (PDFs and images only)
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id/preview',
  authorize(...READ_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  (req, res, next) => documentController.previewDocument(req, res, next)
);

/**
 * @route   GET /api/documents/:id/versions
 * @description Get the full version history of a document
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id/versions',
  authorize(...READ_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  (req, res, next) => documentController.getDocumentVersions(req, res, next)
);

/**
 * @route   GET /api/documents/:id/activity
 * @description Get the persisted activity timeline of a document
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id/activity',
  authorize(...READ_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  (req, res, next) => documentController.getDocumentActivities(req, res, next)
);

/**
 * @route   GET /api/documents/:id/verify
 * @description Verify a document version's integrity and on-chain anchor
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id/verify',
  authorize(...READ_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  validateRequest(documentVersionQuerySchema, 'query'),
  (req, res, next) => documentController.verifyDocument(req, res, next)
);

/**
 * @route   POST /api/documents/:id/retry
 * @description Re-anchor a Pending/Failed document version on the ledger
 * @access  Private (Admin, Treasurer, BudgetOfficer)
 */
router.post(
  '/:id/retry',
  authorize(...RETRY_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  validateRequest(documentVersionQuerySchema, 'query'),
  (req, res, next) => documentController.retryDocument(req, res, next)
);

/**
 * @route   GET /api/documents/:id
 * @description Get document by ID (including current version + verification status)
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...READ_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  (req, res, next) => documentController.getDocumentById(req, res, next)
);

/**
 * @route   POST /api/documents
 * @description Upload a new document (multipart)
 * @access  Private (Admin, Treasurer, BudgetOfficer - own)
 */
router.post(
  '/',
  authorize(...WRITE_ROLES),
  uploadMiddleware('file'),
  validateUploadedFile,
  validateRequest(createDocumentSchema),
  (req, res, next) => documentController.uploadDocument(req, res, next)
);

/**
 * @route   POST /api/documents/:id/replace
 * @description Replace the current version with a new file (multipart)
 * @access  Private (Admin, Treasurer, BudgetOfficer - own)
 */
router.post(
  '/:id/replace',
  authorize(...WRITE_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  uploadMiddleware('file'),
  validateUploadedFile,
  validateRequest(replaceDocumentSchema),
  (req, res, next) => documentController.replaceDocument(req, res, next)
);

/**
 * @route   PUT /api/documents/:id
 * @description Update document metadata
 * @access  Private (Admin, Treasurer, BudgetOfficer - own)
 */
router.put(
  '/:id',
  authorize(...WRITE_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  validateRequest(updateDocumentSchema),
  (req, res, next) => documentController.updateDocument(req, res, next)
);

/**
 * @route   DELETE /api/documents/:id
 * @description Archive + soft-delete a document (versions are kept)
 * @access  Private (Admin - any, Treasurer/BudgetOfficer - own)
 */
router.delete(
  '/:id',
  authorize(...WRITE_ROLES),
  validateRequest(documentIdParamSchema, 'params'),
  (req, res, next) => documentController.deleteDocument(req, res, next)
);

export default router;
