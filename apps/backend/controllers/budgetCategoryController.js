import { budgetCategoryService } from '../services/budgetCategoryService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createBudgetCategorySchema,
  updateBudgetCategorySchema,
  budgetCategoryQuerySchema
} from '../validators/budgetCategoryValidator.js';

class BudgetCategoryController {
  /**
   * Create a new budget category
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createBudgetCategory(req, res, next) {
    try {
      const budgetCategoryData = req.body;
      const budgetCategory = await budgetCategoryService.createBudgetCategory(budgetCategoryData);
      return res
        .status(HTTP_STATUS.CREATED)
        .json(
          formatSuccessResponse('Budget category created successfully', { budgetCategory })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget category by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getBudgetCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const budgetCategory = await budgetCategoryService.getBudgetCategoryById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget category retrieved successfully', { budgetCategory })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget category by code
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getBudgetCategoryByCode(req, res, next) {
    try {
      const { code } = req.params;
      const budgetCategory = await budgetCategoryService.getBudgetCategoryByCode(code);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget category retrieved successfully', { budgetCategory })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get budget category by name
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getBudgetCategoryByName(req, res, next) {
    try {
      const { name } = req.params;
      const budgetCategory = await budgetCategoryService.getBudgetCategoryByName(name);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget category retrieved successfully', { budgetCategory })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all budget categories with filtering, pagination, and sorting
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllBudgetCategories(req, res, next) {
    try {
      const filters = {
        code: req.query.code,
        name: req.query.name,
        description: req.query.description,
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

      const result = await budgetCategoryService.getAllBudgetCategories(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget categories retrieved successfully', {
            budgetCategories: result.budgetCategories,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update budget category by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateBudgetCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const budgetCategory = await budgetCategoryService.updateBudgetCategory(id, updateData);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Budget category updated successfully', { budgetCategory })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete budget category by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteBudgetCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await budgetCategoryService.deleteBudgetCategory(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      next(error);
    }
  }
}

export const budgetCategoryController = new BudgetCategoryController();