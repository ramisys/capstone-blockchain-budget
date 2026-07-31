import { budgetProgramService } from '../services/budgetProgramService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createBudgetProgramSchema,
  updateBudgetProgramSchema,
  budgetProgramQuerySchema
} from '../validators/budgetProgramValidator.js';

class BudgetProgramController {
  /**
   * Create a new budget program
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createBudgetProgram(req, res, next) {
    try {
      const budgetProgramData = req.body;
      const budgetProgram = await budgetProgramService.createBudgetProgram(budgetProgramData);
      return res
        .status(HTTP_STATUS.CREATED)
        .json(
          formatSuccessResponse('Budget program created successfully', { budgetProgram })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget program by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getBudgetProgramById(req, res, next) {
    try {
      const { id } = req.params;
      const budgetProgram = await budgetProgramService.getBudgetProgramById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget program retrieved successfully', { budgetProgram })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget program by code
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getBudgetProgramByCode(req, res, next) {
    try {
      const { code } = req.params;
      const budgetProgram = await budgetProgramService.getBudgetProgramByCode(code);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget program retrieved successfully', { budgetProgram })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all budget programs with filtering, pagination, and sorting
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllBudgetPrograms(req, res, next) {
    try {
      const filters = {
        code: req.query.code,
        name: req.query.name,
        description: req.query.description,
        departmentId: req.query.departmentId,
        budgetCategoryId: req.query.budgetCategoryId,
        status: req.query.status,
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const ordering = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await budgetProgramService.getAllBudgetPrograms(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget programs retrieved successfully', {
            budgetPrograms: result.budgetPrograms,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update budget program by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateBudgetProgram(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const budgetProgram = await budgetProgramService.updateBudgetProgram(id, updateData);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget program updated successfully', { budgetProgram })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete budget program by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteBudgetProgram(req, res, next) {
    try {
      const { id } = req.params;
      const result = await budgetProgramService.deleteBudgetProgram(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      next(error);
    }
  }
}

export const budgetProgramController = new BudgetProgramController();