import { fiscalYearService } from '../services/fiscalYearService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createFiscalYearSchema,
  updateFiscalYearSchema,
  fiscalYearQuerySchema
} from '../validators/fiscalYearValidator.js';

class FiscalYearController {
  /**
   * Create a new fiscal year
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createFiscalYear(req, res, next) {
    try {
      const fiscalYearData = req.body;
      const fiscalYear = await fiscalYearService.createFiscalYear(fiscalYearData);
      return res
        .status(HTTP_STATUS.CREATED)
        .json(
          formatSuccessResponse('Fiscal year created successfully', { fiscalYear })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fiscal year by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getFiscalYearById(req, res, next) {
    try {
      const { id } = req.params;
      const fiscalYear = await fiscalYearService.getFiscalYearById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fiscal year retrieved successfully', { fiscalYear })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all fiscal years with filtering, pagination, and sorting
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllFiscalYears(req, res, next) {
    try {
      const filters = {
        code: req.query.code,
        description: req.query.description,
        status: req.query.status,
        isActive: req.query.isActive,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
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

      const result = await fiscalYearService.getAllFiscalYears(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fiscal years retrieved successfully', {
            fiscalYears: result.fiscalYears,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update fiscal year by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateFiscalYear(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const fiscalYear = await fiscalYearService.updateFiscalYear(id, updateData);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fiscal year updated successfully', { fiscalYear })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete fiscal year by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteFiscalYear(req, res, next) {
    try {
      const { id } = req.params;
      const result = await fiscalYearService.deleteFiscalYear(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set fiscal year as active
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async setActiveFiscalYear(req, res, next) {
    try {
      const { id } = req.params;
      const fiscalYear = await fiscalYearService.setActiveFiscalYear(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fiscal year set as active successfully', { fiscalYear })
        );
    } catch (error) {
      next(error);
    }
  }
}

export const fiscalYearController = new FiscalYearController();