import { allocationService } from '../services/allocationService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class AllocationController {
  /**
   * Create a new budget allocation
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createAllocation(req, res, next) {
    try {
      const allocation = await allocationService.createAllocation(req.body, req.user.id);
      return res
        .status(HTTP_STATUS.CREATED)
        .json(formatSuccessResponse('Allocation created successfully', { allocation }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get allocation by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllocationById(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.getAllocationById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Allocation retrieved successfully', { allocation }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all allocations with filtering, pagination, and sorting
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllocations(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        fiscalYearId: req.query.fiscalYearId,
        departmentId: req.query.departmentId,
        fundSourceId: req.query.fundSourceId,
        categoryId: req.query.categoryId,
        programId: req.query.programId,
        status: req.query.status,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const ordering = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await allocationService.getAllocations(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Allocations retrieved successfully', {
            allocations: result.allocations,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update allocation by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.updateAllocation(id, req.body, req.user);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Allocation updated successfully', { allocation }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete allocation by ID (soft delete)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const result = await allocationService.deleteAllocation(id, req.user);
      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get allocation statistics
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllocationStatistics(req, res, next) {
    try {
      const filters = {
        fiscalYearId: req.query.fiscalYearId,
      };
      const statistics = await allocationService.getAllocationStatistics(filters);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Allocation statistics retrieved successfully', { statistics })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get remaining budget summary
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getRemainingBudget(req, res, next) {
    try {
      const filters = {
        fiscalYearId: req.query.fiscalYearId,
        fundSourceId: req.query.fundSourceId,
        departmentId: req.query.departmentId,
      };
      const budget = await allocationService.getRemainingBudget(filters);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Remaining budget retrieved successfully', { budget }));
    } catch (error) {
      next(error);
    }
  }
}

export const allocationController = new AllocationController();
