import { Router } from 'express';
import { fundSourceController } from '../controllers/fundSourceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createFundSourceSchema,
  updateFundSourceSchema,
  fundSourceQuerySchema
} from '../validators/fundSourceValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/fund-sources
 * @description Get all fund sources with filtering, pagination, and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...Object.values(ROLES)), // Allow all roles to view fund sources
  validateRequest(fundSourceQuerySchema, 'query'),
  (req, res, next) => fundSourceController.getAllFundSources(req, res, next)
);

/**
 * @route   GET /api/fund-sources/:id
 * @description Get fund source by ID
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...Object.values(ROLES)),
  (req, res, next) => fundSourceController.getFundSourceById(req, res, next)
);

/**
 * @route   GET /api/fund-sources/code/:code
 * @description Get fund source by code
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/code/:code',
  authorize(...Object.values(ROLES)),
  (req, res, next) => fundSourceController.getFundSourceByCode(req, res, next)
);

/**
 * @route   POST /api/fund-sources
 * @description Create a new fund source
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(createFundSourceSchema),
  (req, res, next) => fundSourceController.createFundSource(req, res, next)
);

/**
 * @route   PUT /api/fund-sources/:id
 * @description Update fund source by ID
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(updateFundSourceSchema),
  (req, res, next) => fundSourceController.updateFundSource(req, res, next)
);

/**
 * @route   DELETE /api/fund-sources/:id
 * @description Delete fund source by ID
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => fundSourceController.deleteFundSource(req, res, next)
);

export default router;