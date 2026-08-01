import { allocationRepository, DUPLICATE_ALLOCATION_MESSAGE } from '../repositories/allocationRepository.js';
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
  ALLOWED_STATUS_TRANSITIONS,
} from '../constants/allocationStatus.js';
import { toNumber, MAX_AMOUNT } from '../utils/amountUtils.js';
import { logger } from '../utils/logger.js';

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

    const updated = await allocationRepository.update(id, { status: newStatus });
    logger.logEvent(
      `Allocation ${existing.allocationCode} status changed from ${existing.status} to ${newStatus} by user ${actor.id}`
    );
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
