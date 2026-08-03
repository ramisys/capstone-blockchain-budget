import { fundSourceService } from '../services/fundSourceService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS, AUDIT_RESULTS } from '../constants/auditActions.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  createFundSourceSchema,
  updateFundSourceSchema,
  fundSourceQuerySchema
} from '../validators/fundSourceValidator.js';

class FundSourceController {
  /**
   * Create a new fund source
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createFundSource(req, res, next) {
    try {
      const fundSourceData = req.body;
      const fundSource = await fundSourceService.createFundSource(fundSourceData);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.FUND_SOURCE_CREATE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'FundSource', id: fundSource.id, code: fundSource.code },
        details: { code: fundSource.code, name: fundSource.name },
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(
          formatSuccessResponse('Fund source created successfully', { fundSource })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.FUND_SOURCE_CREATE,
        result: AUDIT_RESULTS.FAILURE,
        details: { code: req.body?.code, name: req.body?.name },
        error,
      });
      next(error);
    }
  }

  /**
   * Get fund source by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getFundSourceById(req, res, next) {
    try {
      const { id } = req.params;
      const fundSource = await fundSourceService.getFundSourceById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fund source retrieved successfully', { fundSource })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get fund source by code
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getFundSourceByCode(req, res, next) {
    try {
      const { code } = req.params;
      const fundSource = await fundSourceService.getFundSourceByCode(code);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fund source retrieved successfully', { fundSource })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all fund sources with filtering, pagination, and sorting
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllFundSources(req, res, next) {
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

      const result = await fundSourceService.getAllFundSources(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fund sources retrieved successfully', {
            fundSources: result.fundSources,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update fund source by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateFundSource(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const fundSource = await fundSourceService.updateFundSource(id, updateData);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.FUND_SOURCE_UPDATE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'FundSource', id, code: fundSource.code },
        details: { updatedFields: Object.keys(updateData) },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Fund source updated successfully', { fundSource })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.FUND_SOURCE_UPDATE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'FundSource', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Delete fund source by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteFundSource(req, res, next) {
    try {
      const { id } = req.params;
      const result = await fundSourceService.deleteFundSource(id);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.FUND_SOURCE_DELETE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'FundSource', id },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.FUND_SOURCE_DELETE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'FundSource', id: req.params.id },
        error,
      });
      next(error);
    }
  }
}

export const fundSourceController = new FundSourceController();