import { allocationService } from '../services/allocationService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS, AUDIT_RESULTS } from '../constants/auditActions.js';

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

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_CREATE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
        details: {
          allocationCode: allocation.allocationCode,
          fiscalYearId: allocation.fiscalYearId,
          departmentId: allocation.departmentId,
          allocatedAmount: allocation.allocatedAmount,
        },
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(formatSuccessResponse('Allocation created successfully', { allocation }));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_CREATE,
        result: AUDIT_RESULTS.FAILURE,
        details: { fiscalYearId: req.body?.fiscalYearId, departmentId: req.body?.departmentId },
        error,
      });
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

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_UPDATE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Allocation', id, code: allocation.allocationCode },
        details: { updatedFields: Object.keys(req.body) },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Allocation updated successfully', { allocation }));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_UPDATE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Allocation', id: req.params.id },
        error,
      });
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

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_DELETE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Allocation', id },
      });

      return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(result.message, {}));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_DELETE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Allocation', id: req.params.id },
        error,
      });
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
   * Get approved allocation amounts broken down by department or category
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllocationBreakdown(req, res, next) {
    try {
      const filters = {
        dimension: req.query.dimension,
        fiscalYearId: req.query.fiscalYearId,
      };
      const breakdown = await allocationService.getAllocationBreakdown(filters);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Allocation breakdown retrieved successfully', { breakdown })
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

  /**
   * Submit a Draft allocation for approval
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async submitForApproval(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.submitForApproval(id, req.user);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_SUBMIT,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Allocation', id, code: allocation.allocationCode },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Allocation submitted for approval', { allocation })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_SUBMIT,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Allocation', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Approve a PendingApproval allocation
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async approveAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.approveAllocation(id, req.user);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_APPROVE,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Allocation', id, code: allocation.allocationCode },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Allocation approved successfully', { allocation }));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_APPROVE,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Allocation', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Reject a PendingApproval allocation
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async rejectAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.rejectAllocation(id, req.user, req.body.reason);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_REJECT,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Allocation', id, code: allocation.allocationCode },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Allocation rejected successfully', { allocation }));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_REJECT,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Allocation', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Return an allocation to Draft for revision
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async returnAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const allocation = await allocationService.returnToDraft(id, req.user, req.body?.comment);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_RETURN,
        result: AUDIT_RESULTS.SUCCESS,
        resource: { type: 'Allocation', id, code: allocation.allocationCode },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Allocation returned to draft', { allocation })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.ALLOCATION_RETURN,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'Allocation', id: req.params.id },
        error,
      });
      next(error);
    }
  }

  /**
   * Get the approval history for an allocation
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getApprovalHistory(req, res, next) {
    try {
      const { id } = req.params;
      const approvals = await allocationService.getApprovalHistory(id);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Approval history retrieved successfully', { approvals })
        );
    } catch (error) {
      next(error);
    }
  }
}

export const allocationController = new AllocationController();

