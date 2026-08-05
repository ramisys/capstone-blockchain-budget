import { blockchainService } from '../services/blockchainService.js';
import { blockchainHistoryService } from '../services/blockchainHistoryService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class BlockchainController {
  /**
   * Get blockchain ledger status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getStatus(req, res, next) {
    try {
      const blockchainStatus = await blockchainService.getBlockchainStatus();
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Blockchain status retrieved successfully', { blockchainStatus }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get paginated blockchain transaction history
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getTransactions(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status,
        allocationId: req.query.allocationId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const pagination = { page: req.query.page, limit: req.query.limit };
      const ordering = { sortBy: req.query.sortBy, sortOrder: req.query.sortOrder };

      const result = await blockchainService.getTransactionHistory(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Blockchain transactions retrieved successfully', {
            transactions: result.transactions,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the unified, type-aware blockchain history (allocations, documents,
   * audit events) with pagination and filtering.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getHistory(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        recordType: req.query.recordType,
        status: req.query.status,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const pagination = { page: req.query.page, limit: req.query.limit };
      const ordering = { sortBy: req.query.sortBy, sortOrder: req.query.sortOrder };

      const result = await blockchainHistoryService.getHistory(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Blockchain history retrieved successfully', {
            transactions: result.transactions,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the full detail of a single blockchain transaction, resolving its type
   * (Allocation / Document / Audit) from the recordType query parameter.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getTransactionDetail(req, res, next) {
    try {
      const { id } = req.params;
      const { recordType } = req.query;
      const transaction = await blockchainHistoryService.getTransactionDetail(id, recordType);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Blockchain transaction retrieved successfully', { transaction }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the verification record for a single allocation
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllocationVerification(req, res, next) {
    try {
      const { id } = req.params;
      const result = await blockchainService.verifyAllocation(id, req.user);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Allocation verification retrieved successfully', result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify (or re-verify) an allocation against the ledger
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const result = await blockchainService.verifyAllocation(id, req.user);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Allocation verified against the blockchain ledger', result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Re-anchor a Pending/Failed allocation record on the ledger
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async retryRecord(req, res, next) {
    try {
      const { id } = req.params;
      const record = await blockchainService.retryRecord(id, req.user);
      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Blockchain record anchored successfully', { record }));
    } catch (error) {
      next(error);
    }
  }
}

export const blockchainController = new BlockchainController();
