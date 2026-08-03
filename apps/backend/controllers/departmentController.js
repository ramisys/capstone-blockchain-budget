import { departmentService } from '../services/departmentService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS, AUDIT_RESULTS } from '../constants/auditActions.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema
} from '../validators/departmentValidator.js';

class DepartmentController {
  /**
   * Create a new department
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createDepartment(req, res, next) {
    try {
      const departmentData = req.body;
      const department = await departmentService.createDepartment(departmentData);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DEPARTMENT_CREATE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Department', id: department.id, code: department.code },
        details: { code: department.code, name: department.name },
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(
          formatSuccessResponse('Department created successfully', { department })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DEPARTMENT_CREATE,
        result: AUDIT_RESULTS.FAILURE,
        details: { code: req.body?.code, name: req.body?.name },
        error,
      });
      next(error);
    }
  }

  /**
   * Get department by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDepartmentById(req, res, next) {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Department retrieved successfully', { department })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department by code
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDepartmentByCode(req, res, next) {
    try {
      const { code } = req.params;
      const department = await departmentService.getDepartmentByCode(code);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Department retrieved successfully', { department })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department by name
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getDepartmentByName(req, res, next) {
    try {
      const { name } = req.params;
      const department = await departmentService.getDepartmentByName(name);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Department retrieved successfully', { department })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all departments with filtering, pagination, and sorting
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllDepartments(req, res, next) {
    try {
      const filters = {
        code: req.query.code,
        name: req.query.name,
        officeHead: req.query.officeHead,
        contactNumber: req.query.contactNumber,
        email: req.query.email,
        officeAddress: req.query.officeAddress,
        status: req.query.status,
        search: req.query.search,
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const ordering = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await departmentService.getAllDepartments(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Departments retrieved successfully', {
            departments: result.departments,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update department by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const department = await departmentService.updateDepartment(id, updateData);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DEPARTMENT_UPDATE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Department', id, code: department.code },
        details: { updatedFields: Object.keys(updateData) },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Department updated successfully', { department })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DEPARTMENT_UPDATE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Department', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Delete department by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const result = await departmentService.deleteDepartment(id);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DEPARTMENT_DELETE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Department', id },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.DEPARTMENT_DELETE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Department', id: req.params.id },
        error,
      });
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();