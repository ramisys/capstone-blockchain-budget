import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { timelineController } from '../controllers/timelineController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { validateRequest } from '../validators/validateRequest.js';
import { dashboardStatsSchema } from '../validators/dashboardValidator.js';
import { dashboardChartsSchema } from '../validators/dashboardValidator.js';
import { dashboardActivitiesSchema } from '../validators/dashboardValidator.js';
import { dashboardNotificationsSchema } from '../validators/dashboardValidator.js';
import { dashboardBlockchainSchema } from '../validators/dashboardValidator.js';
import { timelineQuerySchema } from '../validators/dashboardValidator.js';

const router = Router();

// Apply authentication to all dashboard routes
router.use(authenticate);

// Apply authorization to all dashboard routes (only allowed roles can access)
router.use(authorize(
  ROLES.ADMINISTRATOR,
  ROLES.TREASURER,
  ROLES.BUDGET_OFFICER,
  ROLES.AUDITOR
));

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Administrator, Treasurer, BudgetOfficer, Auditor)
 */
router.get('/stats', validateRequest(dashboardStatsSchema), (req, res, next) =>
  dashboardController.getStats(req, res, next)
);

/**
 * @route   GET /api/dashboard/charts
 * @desc    Get dashboard charts data
 * @access  Private (Administrator, Treasurer, BudgetOfficer, Auditor)
 */
router.get('/charts', validateRequest(dashboardChartsSchema), (req, res, next) =>
  dashboardController.getCharts(req, res, next)
);

/**
 * @route   GET /api/dashboard/activities
 * @desc    Get recent activities
 * @access  Private (Administrator, Treasurer, BudgetOfficer, Auditor)
 */
router.get('/activities', validateRequest(dashboardActivitiesSchema), (req, res, next) =>
  dashboardController.getActivities(req, res, next)
);

/**
 * @route   GET /api/dashboard/notifications
 * @desc    Get notifications
 * @access  Private (Administrator, Treasurer, BudgetOfficer, Auditor)
 */
router.get('/notifications', validateRequest(dashboardNotificationsSchema), (req, res, next) =>
  dashboardController.getNotifications(req, res, next)
);

/**
 * @route   GET /api/dashboard/blockchain
 * @desc    Get blockchain status
 * @access  Private (Administrator, Treasurer, BudgetOfficer, Auditor)
 */
router.get('/blockchain', validateRequest(dashboardBlockchainSchema), (req, res, next) =>
  dashboardController.getBlockchainStatus(req, res, next)
);

/**
 * @route   GET /api/dashboard/timeline
 * @desc    Get the merged financial activity timeline
 * @access  Private (Administrator, Treasurer, BudgetOfficer, Auditor)
 */
router.get('/timeline', validateRequest(timelineQuerySchema, 'query'), (req, res, next) =>
  timelineController.getTimeline(req, res, next)
);

export default router;