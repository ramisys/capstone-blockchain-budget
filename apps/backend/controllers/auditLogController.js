import { auditLogService } from '../services/auditLogService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class AuditLogController {
  /**
   * Get paginated audit log entries with filtering and sorting.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getLogs(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        action: req.query.action,
        result: req.query.result,
        resourceType: req.query.resourceType,
        resourceId: req.query.resourceId,
        actorId: req.query.actorId,
        anchorStatus: req.query.anchorStatus,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const pagination = { page: req.query.page, limit: req.query.limit };
      const ordering = { sortBy: req.query.sortBy, sortOrder: req.query.sortOrder };

      const result = await auditLogService.getLogs(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Audit logs retrieved successfully', {
            logs: result.logs,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single audit log entry by ID.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getLogById(req, res, next) {
    try {
      const { id } = req.params;
      const log = await auditLogService.getLogById(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Audit log retrieved successfully', { log }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit summary counts for the audit dashboard.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getSummary(req, res, next) {
    try {
      const summary = await auditLogService.getSummary();
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Audit summary retrieved successfully', { summary }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Re-anchor a Pending/Failed audit log entry on the AuditLedger contract.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async retryAnchor(req, res, next) {
    try {
      const { id } = req.params;
      const log = await auditLogService.retryAnchor(id, req.user);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Audit event anchored successfully', { log }));
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogController = new AuditLogController();
