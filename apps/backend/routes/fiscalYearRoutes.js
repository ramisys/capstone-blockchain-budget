import { Router } from 'express';
import { fiscalYearController } from '../controllers/fiscalYearController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createFiscalYearSchema,
  updateFiscalYearSchema,
  fiscalYearQuerySchema
} from '../validators/fiscalYearValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/fiscal-years
 * @description Get all fiscal years with filtering, pagination, and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...Object.values(ROLES)), // Allow all roles to view fiscal years
  validateRequest(fiscalYearQuerySchema, 'query'),
  (req, res, next) => fiscalYearController.getAllFiscalYears(req, res, next)
);

/**
 * @route   GET /api/fiscal-years/:id
 * @description Get fiscal year by ID
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...Object.values(ROLES)),
  (req, res, next) => fiscalYearController.getFiscalYearById(req, res, next)
);

/**
 * @route   POST /api/fiscal-years
 * @description Create a new fiscal year
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(createFiscalYearSchema),
  (req, res, next) => fiscalYearController.createFiscalYear(req, res, next)
);

/**
 * @route   PUT /api/fiscal-years/:id
 * @description Update fiscal year by ID
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(updateFiscalYearSchema),
  (req, res, next) => fiscalYearController.updateFiscalYear(req, res, next)
);

/**
 * @route   DELETE /api/fiscal-years/:id
 * @description Delete fiscal year by ID
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => fiscalYearController.deleteFiscalYear(req, res, next)
);

/**
 * @route   PATCH /api/fiscal-years/:id/activate
 * @description Set fiscal year as active (deactivates all others)
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/activate',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => fiscalYearController.setActiveFiscalYear(req, res, next)
);

export default router;