import { Router } from 'express';
import { departmentController } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema
} from '../validators/departmentValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/departments
 * @description Get all departments with filtering, pagination, and sorting
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/',
  authorize(...Object.values(ROLES)), // Allow all roles to view departments
  validateRequest(departmentQuerySchema, 'query'),
  (req, res, next) => departmentController.getAllDepartments(req, res, next)
);

/**
 * @route   GET /api/departments/:id
 * @description Get department by ID
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/:id',
  authorize(...Object.values(ROLES)),
  (req, res, next) => departmentController.getDepartmentById(req, res, next)
);

/**
 * @route   GET /api/departments/code/:code
 * @description Get department by code
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/code/:code',
  authorize(...Object.values(ROLES)),
  (req, res, next) => departmentController.getDepartmentByCode(req, res, next)
);

/**
 * @route   GET /api/departments/name/:name
 * @description Get department by name
 * @access  Private (Admin, Treasurer, BudgetOfficer, Auditor)
 */
router.get(
  '/name/:name',
  authorize(...Object.values(ROLES)),
  (req, res, next) => departmentController.getDepartmentByName(req, res, next)
);

/**
 * @route   POST /api/departments
 * @description Create a new department
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(createDepartmentSchema),
  (req, res, next) => departmentController.createDepartment(req, res, next)
);

/**
 * @route   PUT /api/departments/:id
 * @description Update department by ID
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  validateRequest(updateDepartmentSchema),
  (req, res, next) => departmentController.updateDepartment(req, res, next)
);

/**
 * @route   DELETE /api/departments/:id
 * @description Delete department by ID
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRATOR),
  (req, res, next) => departmentController.deleteDepartment(req, res, next)
);

export default router;