import { allocationRepository, DUPLICATE_ALLOCATION_MESSAGE } from '../repositories/allocationRepository.js';
import { allocationApprovalRepository } from '../repositories/allocationApprovalRepository.js';
import { blockchainService } from './blockchainService.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import { AppError } from '../errors/appError.js';
import { ForbiddenError, ValidationError } from '../errors/apiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import {
  ALLOCATION_STATUS,
  ALLOCATION_CODE_PREFIX,
  ALLOCATION_APPROVAL_ACTIONS,
  ALLOWED_STATUS_TRANSITIONS,
} from '../constants/allocationStatus.js';
import { toNumber, MAX_AMOUNT } from '../utils/amountUtils.js';
import { logger } from '../utils/logger.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS } from '../constants/auditActions.js';

/**
 * Roles allowed to review (approve/reject/return) allocations. Admins and
 * Treasurers provide the financial oversight layer; Budget Officers create and
 * submit allocations but never decide on their own requests.
 */
const APPROVAL_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER];

class AllocationService {
  /**
   * Create a new budget allocation. Allocations always start as Draft.
   *
   * @param {Object} allocationData - Allocation data (validated by Zod)
   * @param {string} userId - ID of the authenticated user creating the allocation
   * @returns {Promise<Object>} Created allocation
   */
  async createAllocation(allocationData, userId) {
    this.validateAmount(allocationData.allocatedAmount);

    const resolved = await this.validateReferences({
      fiscalYearId: allocationData.fiscalYearId,
      departmentId: allocationData.departmentId,
      fundSourceId: allocationData.fundSourceId,
      categoryId: allocationData.categoryId,
      programId: allocationData.programId,
    });

    await this.validateBudgetCeiling(
      allocationData.fiscalYearId,
      allocationData.allocatedAmount,
      resolved.fiscalYear
    );

    const duplicate = await allocationRepository.duplicateExists({
      fiscalYearId: allocationData.fiscalYearId,
      departmentId: allocationData.departmentId,
      fundSourceId: allocationData.fundSourceId,
      categoryId: allocationData.categoryId,
      programId: allocationData.programId,
    });
    if (duplicate) {
      throw new AppError(DUPLICATE_ALLOCATION_MESSAGE, HTTP_STATUS.CONFLICT);
    }

    const prefix = this.buildCodePrefix(resolved.fiscalYear.startDate);
    const allocation = await allocationRepository.createWithSequentialCode(
      prefix,
      allocationData.fiscalYearId,
      {
        departmentId: allocationData.departmentId,
        fundSourceId: allocationData.fundSourceId,
        categoryId: allocationData.categoryId,
        programId: allocationData.programId,
        allocatedAmount: allocationData.allocatedAmount,
        description: allocationData.description,
        status: ALLOCATION_STATUS.DRAFT,
        createdBy: userId,
      },
      {
        fiscalYearId: allocationData.fiscalYearId,
        departmentId: allocationData.departmentId,
        fundSourceId: allocationData.fundSourceId,
        categoryId: allocationData.categoryId,
        programId: allocationData.programId,
      }
    );

    logger.logEvent(`Allocation ${allocation.allocationCode} created by user ${userId}`);
    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.ALLOCATION_CREATE,
      actor: userId,
      resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
      details: {
        allocatedAmount: allocation.allocatedAmount,
        departmentId: allocation.departmentId,
        fiscalYearId: allocation.fiscalYearId,
      },
    });

    await blockchainService.recordAllocation(allocation, userId);
    return this.serialize(allocation);
  }

  /**
   * Get a single allocation by ID.
   *
   * @param {string} id - Allocation ID
   * @returns {Promise<Object>} Allocation
   */
  async getAllocationById(id) {
    const allocation = await allocationRepository.findById(id);
    if (!allocation || allocation.deletedAt) {
      throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
    }
    return this.serialize(allocation);
  }

  /**
   * Get allocations with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} ordering - Ordering options
   * @returns {Promise<Object>} Allocations list and pagination info
   */
  async getAllocations(filters = {}, pagination = {}, ordering = {}) {
    const [allocations, totalCount] = await Promise.all([
      allocationRepository.findMany(filters, pagination, ordering),
      allocationRepository.count(filters),
    ]);

    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      allocations: this.serializeMany(allocations),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update a budget allocation. Only Draft allocations are editable.
   *
   * @param {string} id - Allocation ID
   * @param {Object} updateData - Data to update (validated by Zod)
   * @param {Object} actor - Authenticated user performing the update
   * @returns {Promise<Object>} Updated allocation
   */
  async updateAllocation(id, updateData, actor) {
    const existing = await allocationRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
    }
    if (existing.status !== ALLOCATION_STATUS.DRAFT) {
      throw new AppError('Only draft allocations can be edited', HTTP_STATUS.CONFLICT);
    }

    const dataToUpdate = {};

    if (updateData.allocatedAmount !== undefined) {
      this.validateAmount(updateData.allocatedAmount);
      dataToUpdate.allocatedAmount = updateData.allocatedAmount;
    }
    if (updateData.description !== undefined) {
      dataToUpdate.description = updateData.description;
    }

    const departmentChanged =
      updateData.departmentId !== undefined && updateData.departmentId !== existing.departmentId;
    const fundSourceChanged =
      updateData.fundSourceId !== undefined && updateData.fundSourceId !== existing.fundSourceId;
    const categoryChanged =
      updateData.categoryId !== undefined && updateData.categoryId !== existing.categoryId;
    const programChanged =
      updateData.programId !== undefined && updateData.programId !== existing.programId;

    const referencesChanged =
      departmentChanged || fundSourceChanged || categoryChanged || programChanged;

    if (referencesChanged) {
      const finalDepartmentId = updateData.departmentId ?? existing.departmentId;
      const finalProgramId = updateData.programId ?? existing.programId;

      // Department and program are validated together so their consistency can be checked.
      const referencesToValidate = {};
      if (fundSourceChanged) referencesToValidate.fundSourceId = updateData.fundSourceId;
      if (categoryChanged) referencesToValidate.categoryId = updateData.categoryId;
      if (departmentChanged || programChanged) {
        referencesToValidate.departmentId = finalDepartmentId;
        referencesToValidate.programId = finalProgramId;
      }

      await this.validateReferences(referencesToValidate);

      const duplicate = await allocationRepository.duplicateExists(
        {
          fiscalYearId: existing.fiscalYearId,
          departmentId: finalDepartmentId,
          fundSourceId: updateData.fundSourceId ?? existing.fundSourceId,
          categoryId: updateData.categoryId ?? existing.categoryId,
          programId: finalProgramId,
        },
        existing.id
      );
      if (duplicate) {
        throw new AppError(DUPLICATE_ALLOCATION_MESSAGE, HTTP_STATUS.CONFLICT);
      }

      if (departmentChanged) dataToUpdate.departmentId = updateData.departmentId;
      if (fundSourceChanged) dataToUpdate.fundSourceId = updateData.fundSourceId;
      if (categoryChanged) dataToUpdate.categoryId = updateData.categoryId;
      if (programChanged) dataToUpdate.programId = updateData.programId;
    }

    const updated = await allocationRepository.update(id, dataToUpdate);
    logger.logEvent(`Allocation ${existing.allocationCode} updated by user ${actor.id}`);
    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.ALLOCATION_UPDATE,
      actor,
      resource: { type: 'Allocation', id, code: existing.allocationCode },
      details: { updatedFields: Object.keys(dataToUpdate) },
    });
    return this.serialize(updated);
  }

  /**
   * Soft-delete a budget allocation.
   *
   * @param {string} id - Allocation ID
   * @param {Object} actor - Authenticated user performing the delete
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteAllocation(id, actor) {
    const existing = await allocationRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
    }
    if (existing.status === ALLOCATION_STATUS.ARCHIVED) {
      throw new AppError('Archived allocations cannot be deleted', HTTP_STATUS.CONFLICT);
    }
    if (actor.role === ROLES.BUDGET_OFFICER && existing.status !== ALLOCATION_STATUS.DRAFT) {
      throw new ForbiddenError('Budget officers can only delete draft allocations');
    }

    await allocationRepository.softDelete(id);
    logger.logEvent(`Allocation ${existing.allocationCode} deleted by user ${actor.id}`);
    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.ALLOCATION_DELETE,
      actor,
      resource: { type: 'Allocation', id, code: existing.allocationCode },
    });
    return { message: 'Allocation deleted successfully' };
  }

  /**
   * Transition an allocation's status while enforcing the allowed transition map.
   *
   * Intended as the seam for Phase 4.3 (allocation approval workflow) to expose
   * behind a dedicated endpoint.
   *
   * @param {string} id - Allocation ID
   * @param {string} newStatus - Target allocation status
   * @param {Object} actor - Authenticated user performing the transition
   * @returns {Promise<Object>} Updated allocation
   */
  async transitionStatus(id, newStatus, actor) {
    const existing = await allocationRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
    }

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Cannot transition allocation from ${existing.status} to ${newStatus}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (newStatus === ALLOCATION_STATUS.APPROVED) {
      await this.validateBudgetCeiling(
        existing.fiscalYearId,
        toNumber(existing.allocatedAmount)
      );
    }

    const updated = await allocationRepository.update(id, { status: newStatus });
    logger.logEvent(
      `Allocation ${existing.allocationCode} status changed from ${existing.status} to ${newStatus} by user ${actor.id}`
    );
    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.ALLOCATION_STATUS_CHANGE,
      actor,
      resource: { type: 'Allocation', id, code: existing.allocationCode },
      details: { fromStatus: existing.status, toStatus: newStatus },
    });
    return this.serialize(updated);
  }

  /**
   * Submit a Draft allocation for approval (Draft -> PendingApproval).
   *
   * @param {string} id - Allocation ID
   * @param {Object} actor - Authenticated user submitting the allocation
   * @returns {Promise<Object>} Updated allocation
   */
  async submitForApproval(id, actor) {
    return this.performTransition(id, ALLOCATION_STATUS.PENDING_APPROVAL, actor, {
      approvalAction: ALLOCATION_APPROVAL_ACTIONS.SUBMITTED,
      auditAction: AUDIT_ACTIONS.ALLOCATION_SUBMIT,
    });
  }

  /**
   * Approve a PendingApproval allocation. Only Administrators and Treasurers
   * may approve, and users cannot approve their own submissions. The budget
   * ceiling is re-validated before the allocation commits budget.
   *
   * @param {string} id - Allocation ID
   * @param {Object} actor - Authenticated user approving the allocation
   * @returns {Promise<Object>} Updated allocation
   */
  async approveAllocation(id, actor) {
    const existing = await this.getExistingAllocation(id);
    this.assertApprover(existing, actor);
    return this.performTransition(id, ALLOCATION_STATUS.APPROVED, actor, {
      approvalAction: ALLOCATION_APPROVAL_ACTIONS.APPROVED,
      auditAction: AUDIT_ACTIONS.ALLOCATION_APPROVE,
      setReviewFields: true,
    });
  }

  /**
   * Reject a PendingApproval allocation. A reason is required so the submitter
   * can revise and resubmit. Only Administrators and Treasurers may reject,
   * and users cannot reject their own submissions.
   *
   * @param {string} id - Allocation ID
   * @param {Object} actor - Authenticated user rejecting the allocation
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated allocation
   */
  async rejectAllocation(id, actor, reason) {
    if (!reason || !reason.trim()) {
      throw new ValidationError('A rejection reason is required');
    }
    const existing = await this.getExistingAllocation(id);
    this.assertApprover(existing, actor);
    return this.performTransition(id, ALLOCATION_STATUS.REJECTED, actor, {
      approvalAction: ALLOCATION_APPROVAL_ACTIONS.REJECTED,
      auditAction: AUDIT_ACTIONS.ALLOCATION_REJECT,
      comment: reason.trim(),
      setReviewFields: true,
      rejectionReason: reason.trim(),
    });
  }

  /**
   * Return an allocation to Draft for revision.
   *
   * - PendingApproval allocations are returned by an approver.
   * - Rejected allocations are returned by their creator or an approver so the
   *   submitter can edit and resubmit.
   *
   * @param {string} id - Allocation ID
   * @param {Object} actor - Authenticated user returning the allocation
   * @param {string|null} [comment=null] - Optional note explaining the return
   * @returns {Promise<Object>} Updated allocation
   */
  async returnToDraft(id, actor, comment = null) {
    const existing = await this.getExistingAllocation(id);

    if (existing.status === ALLOCATION_STATUS.REJECTED) {
      if (!APPROVAL_ROLES.includes(actor.role) && existing.createdBy !== actor.id) {
        throw new ForbiddenError('Only the creator or an approver can return a rejected allocation to draft');
      }
    } else {
      this.assertApprover(existing, actor);
    }

    return this.performTransition(id, ALLOCATION_STATUS.DRAFT, actor, {
      approvalAction: ALLOCATION_APPROVAL_ACTIONS.RETURNED,
      auditAction: AUDIT_ACTIONS.ALLOCATION_RETURN,
      comment: comment || null,
    });
  }

  /**
   * Get the recorded approval history for an allocation, newest first.
   *
   * @param {string} id - Allocation ID
   * @returns {Promise<Array>} Approval history records with actor details
   */
  async getApprovalHistory(id) {
    await this.getExistingAllocation(id);
    return allocationApprovalRepository.findManyByAllocationId(id);
  }

  /**
   * Fetch a live (non-deleted) allocation or throw a 404.
   *
   * @private
   * @param {string} id - Allocation ID
   * @returns {Promise<Object>} Allocation
   */
  async getExistingAllocation(id) {
    const existing = await allocationRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
    }
    return existing;
  }

  /**
   * Enforce approver authorization: role must be in APPROVAL_ROLES and the
   * actor must not be the allocation's creator.
   *
   * @private
   * @param {Object} existing - Existing allocation
   * @param {Object} actor - Authenticated user performing the action
   */
  assertApprover(existing, actor) {
    if (!APPROVAL_ROLES.includes(actor.role)) {
      throw new ForbiddenError('Only Administrators and Treasurers can review allocations');
    }
    if (existing.createdBy === actor.id) {
      throw new ForbiddenError('Users cannot review their own allocations');
    }
  }

  /**
   * Shared workflow transition: validates the state transition, applies the
   * status plus any workflow bookkeeping fields, records an approval entry in
   * the history table, and emits audit + event logs.
   *
   * @private
   * @param {string} id - Allocation ID
   * @param {string} newStatus - Target allocation status
   * @param {Object} actor - Authenticated user performing the transition
   * @param {Object} options - Workflow options
   * @param {string} options.approvalAction - History action to record
   * @param {string} options.auditAction - Audit action name
   * @param {string|null} [options.comment=null] - Decision comment
   * @param {boolean} [options.setReviewFields=false] - Stamp reviewedBy/reviewedAt
   * @param {string|null} [options.rejectionReason=null] - Reason persisted on the allocation
   * @returns {Promise<Object>} Updated allocation
   */
  async performTransition(id, newStatus, actor, {
    approvalAction,
    auditAction,
    comment = null,
    setReviewFields = false,
    rejectionReason = null,
  }) {
    const existing = await this.getExistingAllocation(id);

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Cannot transition allocation from ${existing.status} to ${newStatus}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (newStatus === ALLOCATION_STATUS.APPROVED) {
      await this.validateBudgetCeiling(
        existing.fiscalYearId,
        toNumber(existing.allocatedAmount)
      );
    }

    const dataToUpdate = { status: newStatus };
    if (setReviewFields) {
      dataToUpdate.reviewedBy = actor.id;
      dataToUpdate.reviewedAt = new Date();
    }
    if (rejectionReason !== null) {
      dataToUpdate.rejectionReason = rejectionReason;
    }
    if (newStatus === ALLOCATION_STATUS.PENDING_APPROVAL) {
      dataToUpdate.submittedAt = new Date();
      dataToUpdate.rejectionReason = null;
    }

    const updated = await allocationRepository.update(id, dataToUpdate);
    await allocationApprovalRepository.create({
      allocationId: id,
      action: approvalAction,
      comment: comment || null,
      actorId: actor.id,
    });

    if (newStatus === ALLOCATION_STATUS.APPROVED) {
      await blockchainService.recordAllocation(updated, actor.id);
    }

    logger.logEvent(
      `Allocation ${existing.allocationCode} status changed from ${existing.status} to ${newStatus} by user ${actor.id}`
    );
    auditLogger.logSuccess({
      action: auditAction,
      actor,
      resource: { type: 'Allocation', id, code: existing.allocationCode },
      details: {
        fromStatus: existing.status,
        toStatus: newStatus,
        ...(comment && { comment }),
      },
    });
    return this.serialize(updated);
  }

  /**
   * Get dashboard statistics for allocations.
   *
   * @param {Object} filters - Optional { fiscalYearId } scope
   * @returns {Promise<Object>} Allocation statistics
   */
  async getAllocationStatistics(filters = {}) {
    const scope = filters.fiscalYearId ? { fiscalYearId: filters.fiscalYearId } : {};

    if (filters.fiscalYearId) {
      const fiscalYear = await fiscalYearRepository.findById(filters.fiscalYearId);
      if (!fiscalYear) {
        throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
      }
    }

    const [totalAllocations, approvedAggregate, statusGroups, distinctYears] = await Promise.all([
      allocationRepository.countAll({ deletedAt: null, ...scope }),
      allocationRepository.aggregateApprovedAmount(scope),
      allocationRepository.countByStatus(scope),
      allocationRepository.distinctFiscalYearIds({ deletedAt: null, ...scope }),
    ]);

    const totalAllocatedAmount = toNumber(approvedAggregate._sum.allocatedAmount);

    const statusCounts = {
      draftCount: 0,
      pendingApprovalCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
    };
    for (const group of statusGroups) {
      switch (group.status) {
        case ALLOCATION_STATUS.DRAFT:
          statusCounts.draftCount = group._count;
          break;
        case ALLOCATION_STATUS.PENDING_APPROVAL:
          statusCounts.pendingApprovalCount = group._count;
          break;
        case ALLOCATION_STATUS.APPROVED:
          statusCounts.approvedCount = group._count;
          break;
        case ALLOCATION_STATUS.REJECTED:
          statusCounts.rejectedCount = group._count;
          break;
        default:
          break;
      }
    }

    // Remaining budget is measured against the fiscal year's budgetAmount ceiling.
    const yearIds = filters.fiscalYearId
      ? [filters.fiscalYearId]
      : distinctYears.map((row) => row.fiscalYearId);

    const totalAvailableBudget =
      yearIds.length > 0
        ? toNumber((await allocationRepository.sumFiscalYearBudgets(yearIds))._sum.budgetAmount)
        : 0;

    return {
      totalAllocations,
      totalAllocatedAmount,
      remainingBudget: totalAvailableBudget - totalAllocatedAmount,
      ...statusCounts,
    };
  }

  /**
   * Compute total budget, total allocated, and remaining budget.
   *
   * Remaining Budget = Total Budget (fiscal year budgetAmount ceilings) minus
   * the sum of approved allocations. Draft and PendingApproval allocations do
   * not commit budget; Rejected, Archived, and soft-deleted allocations are
   * excluded.
   *
   * @param {Object} filters - Optional { fiscalYearId, fundSourceId, departmentId }
   * @returns {Promise<Object>} Budget summary
   */
  async getRemainingBudget(filters = {}) {
    const { fiscalYearId, fundSourceId, departmentId } = filters;

    if (fiscalYearId) {
      const fiscalYear = await fiscalYearRepository.findById(fiscalYearId);
      if (!fiscalYear) {
        throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
      }
      if (fiscalYear.status === FISCAL_YEAR_STATUS.ARCHIVED) {
        throw new AppError(
          'Cannot compute remaining budget for an archived fiscal year',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const baseWhere = {
      deletedAt: null,
      status: ALLOCATION_STATUS.APPROVED,
      ...(fundSourceId && { fundSourceId }),
      ...(departmentId && { departmentId }),
    };

    if (fiscalYearId) {
      return this.computeRemainingBudget([fiscalYearId], { ...baseWhere, fiscalYearId });
    }

    // Without a fiscal year filter, scope the ceiling to the fiscal years the
    // matching allocations reference so department/fund-source filters remain
    // meaningful.
    const distinctYears = await allocationRepository.distinctFiscalYearIds(baseWhere);
    const yearIds = distinctYears.map((row) => row.fiscalYearId);

    if (yearIds.length === 0) {
      return { totalBudget: 0, totalAllocated: 0, remainingBudget: 0 };
    }

    return this.computeRemainingBudget(yearIds, { ...baseWhere, fiscalYearId: { in: yearIds } });
  }

  /**
   * Shared remaining-budget computation for a set of fiscal years.
   *
   * @private
   * @param {Array<string>} yearIds - Fiscal year IDs whose ceilings form the total budget
   * @param {Object} allocationWhere - Where clause for the allocated sum
   * @returns {Promise<Object>} Budget summary
   */
  async computeRemainingBudget(yearIds, allocationWhere) {
    const [budgetAggregate, allocatedAggregate] = await Promise.all([
      allocationRepository.sumFiscalYearBudgets(yearIds),
      allocationRepository.aggregateAmount(allocationWhere),
    ]);

    const totalBudget = toNumber(budgetAggregate._sum.budgetAmount);
    const totalAllocated = toNumber(allocatedAggregate._sum.allocatedAmount);

    return {
      totalBudget,
      totalAllocated,
      remainingBudget: totalBudget - totalAllocated,
    };
  }

  /**
   * Validate that referenced master-data entities exist and are usable.
   * Only the reference IDs supplied are checked, so the method is reusable by
   * both create and update flows.
   *
   * @private
   * @param {Object} referenceIds - { fiscalYearId, departmentId, fundSourceId, categoryId, programId }
   * @returns {Promise<Object>} Resolved entities keyed by role
   */
  async validateReferences(referenceIds = {}) {
    const [fiscalYear, department, fundSource, category, program] = await Promise.all([
      referenceIds.fiscalYearId
        ? fiscalYearRepository.findById(referenceIds.fiscalYearId)
        : Promise.resolve(null),
      referenceIds.departmentId
        ? departmentRepository.findById(referenceIds.departmentId)
        : Promise.resolve(null),
      referenceIds.fundSourceId
        ? fundSourceRepository.findById(referenceIds.fundSourceId)
        : Promise.resolve(null),
      referenceIds.categoryId
        ? budgetCategoryRepository.findById(referenceIds.categoryId)
        : Promise.resolve(null),
      referenceIds.programId
        ? budgetProgramRepository.findById(referenceIds.programId)
        : Promise.resolve(null),
    ]);

    const resolved = {};

    if (referenceIds.fiscalYearId) {
      if (!fiscalYear) {
        throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
      }
      if (fiscalYear.status === FISCAL_YEAR_STATUS.ARCHIVED) {
        throw new AppError(
          'Allocations cannot reference an archived fiscal year',
          HTTP_STATUS.CONFLICT
        );
      }
      resolved.fiscalYear = fiscalYear;
    }

    if (referenceIds.departmentId) {
      if (!department) {
        throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
      }
      if (department.status !== USER_STATUS.ACTIVE) {
        throw new AppError('Department is inactive and cannot be referenced', HTTP_STATUS.CONFLICT);
      }
      resolved.department = department;
    }

    if (referenceIds.fundSourceId) {
      if (!fundSource) {
        throw new AppError('Fund source not found', HTTP_STATUS.NOT_FOUND);
      }
      if (fundSource.status !== USER_STATUS.ACTIVE) {
        throw new AppError('Fund source is inactive and cannot be referenced', HTTP_STATUS.CONFLICT);
      }
      resolved.fundSource = fundSource;
    }

    if (referenceIds.categoryId) {
      if (!category) {
        throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
      }
      if (category.status !== USER_STATUS.ACTIVE) {
        throw new AppError(
          'Budget category is inactive and cannot be referenced',
          HTTP_STATUS.CONFLICT
        );
      }
      resolved.category = category;
    }

    if (referenceIds.programId) {
      if (!program) {
        throw new AppError('Budget program not found', HTTP_STATUS.NOT_FOUND);
      }
      if (program.status !== USER_STATUS.ACTIVE) {
        throw new AppError('Budget program is inactive and cannot be referenced', HTTP_STATUS.CONFLICT);
      }
      resolved.program = program;
    }

    if (resolved.department && resolved.program && resolved.program.departmentId !== resolved.department.id) {
      throw new AppError(
        'Budget program does not belong to the selected department',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return resolved;
  }

  /**
   * Validate that the requested allocation amount does not exceed the fiscal year's remaining budget.
   *
   * @private
   * @param {string} fiscalYearId - Fiscal year ID
   * @param {number} requestedAmount - Amount to validate
   * @param {Object|null} [fiscalYear=null] - Pre-fetched fiscal year (optional)
   */
  async validateBudgetCeiling(fiscalYearId, requestedAmount, fiscalYear = null) {
    const fy = fiscalYear || (await fiscalYearRepository.findById(fiscalYearId));
    if (!fy) {
      throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
    }
    if (fy.status === FISCAL_YEAR_STATUS.ARCHIVED) {
      throw new AppError(
        'Allocations cannot reference an archived fiscal year',
        HTTP_STATUS.CONFLICT
      );
    }

    const approvedAggregate = await allocationRepository.aggregateApprovedAmount({
      fiscalYearId,
    });
    const totalAllocated = toNumber(approvedAggregate?._sum?.allocatedAmount);
    const totalBudget = toNumber(fy.budgetAmount);
    const remainingBudget = totalBudget - totalAllocated;

    if (requestedAmount > remainingBudget) {
      throw new AppError(
        'Allocated amount exceeds fiscal year remaining budget',
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  /**
   * Validate that an allocated amount is a positive, finite number within range.
   *
   * @private
   * @param {number} amount - Amount to validate
   */
  validateAmount(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new ValidationError('Allocated amount must be a valid number');
    }
    if (amount <= 0) {
      throw new ValidationError('Allocated amount must be greater than zero');
    }
    if (amount > MAX_AMOUNT) {
      throw new ValidationError('Allocated amount is too large');
    }
  }

  /**
   * Build the allocation code prefix for a fiscal year, e.g. "BA-2026".
   *
   * @private
   * @param {Date|string} startDate - Fiscal year start date
   * @returns {string} Code prefix
   */
  buildCodePrefix(startDate) {
    const year = new Date(startDate).getFullYear();
    return `${ALLOCATION_CODE_PREFIX}-${year}`;
  }

  /**
   * Normalize an allocation for API responses (Decimal -> number).
   *
   * @private
   * @param {Object|null} allocation - Allocation from Prisma
   * @returns {Object|null} Serialized allocation
   */
  serialize(allocation) {
    if (!allocation) return allocation;
    return { ...allocation, allocatedAmount: toNumber(allocation.allocatedAmount) };
  }

  /**
   * Normalize a list of allocations for API responses.
   *
   * @private
   * @param {Array<Object>} allocations - Allocations from Prisma
   * @returns {Array<Object>} Serialized allocations
   */
  serializeMany(allocations) {
    return allocations.map((allocation) => this.serialize(allocation));
  }
}

export const allocationService = new AllocationService();
