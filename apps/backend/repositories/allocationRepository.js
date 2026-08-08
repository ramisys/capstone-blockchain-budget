import { Prisma } from '@prisma/client';
import prisma from '../models/prismaClient.js';
import {
  ALLOCATION_STATUS,
  EXCLUDED_ALLOCATION_STATUSES,
} from '../constants/allocationStatus.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const DUPLICATE_ALLOCATION_MESSAGE =
  'An allocation already exists for this fiscal year, department, program, fund source, and category';

/**
 * Relations eagerly loaded with every allocation query so callers never
 * trigger N+1 queries. The creator is selected explicitly to avoid exposing
 * the password hash.
 */
const allocationInclude = {
  fiscalYear: true,
  department: true,
  fundSource: true,
  category: true,
  program: true,
  creator: {
    select: { id: true, fullName: true, email: true, role: true },
  },
};

class AllocationRepository {
  /**
   * Find an allocation by ID (including soft-deleted rows; the service layer
   * decides whether a soft-deleted record should be returned).
   *
   * @param {string} id - Allocation ID
   * @returns {Promise<Object|null>} Allocation object or null
   */
  async findById(id) {
    return prisma.budgetAllocation.findUnique({
      where: { id },
      include: allocationInclude,
    });
  }

  /**
   * Find many allocations with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (search, fiscalYearId, departmentId,
   *                           fundSourceId, categoryId, programId, status, dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of allocations
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = this.buildWhere(filters);

    const MAX_LIMIT = 100;
    const page = parseInt(pagination.page) || 1;
    const limit = Math.min(parseInt(pagination.limit) || 10, MAX_LIMIT);
    const skip = (page - 1) * limit;

    return prisma.budgetAllocation.findMany({
      where,
      skip,
      take: limit,
      orderBy: this.buildOrderBy(ordering),
      include: allocationInclude,
    });
  }

  /**
   * Count allocations matching the list filters (excludes soft-deleted).
   *
   * @param {Object} filters - Same filter criteria as findMany
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    return prisma.budgetAllocation.count({
      where: this.buildWhere(filters),
    });
  }

  /**
   * Count allocations matching an arbitrary where clause.
   *
   * @param {Object} where - Prisma where clause
   * @returns {Promise<number>} Count
   */
  async countAll(where = {}) {
    return prisma.budgetAllocation.count({ where });
  }

  /**
   * Sum allocatedAmount across approved (committed) allocations in the given
   * scope. Remaining-budget calculations subtract only approved amounts; Draft
   * and PendingApproval allocations do not commit budget.
   *
   * @param {Object} scope - Extra equality filters (e.g. { fiscalYearId })
   * @returns {Promise<Object>} Prisma aggregate result
   */
  async aggregateApprovedAmount(scope = {}) {
    return prisma.budgetAllocation.aggregate({
      where: {
        deletedAt: null,
        status: ALLOCATION_STATUS.APPROVED,
        ...scope,
      },
      _sum: { allocatedAmount: true },
    });
  }

  /**
   * Sum allocatedAmount for an arbitrary where clause.
   *
   * @param {Object} where - Prisma where clause
   * @returns {Promise<Object>} Prisma aggregate result
   */
  async aggregateAmount(where = {}) {
    return prisma.budgetAllocation.aggregate({
      where,
      _sum: { allocatedAmount: true },
    });
  }

  /**
   * Count allocations grouped by status (excludes soft-deleted) within a scope.
   *
   * @param {Object} scope - Extra equality filters
   * @returns {Promise<Array>} Grouped counts, e.g. [{ status: 'Draft', _count: 3 }]
   */
  async countByStatus(scope = {}) {
    return prisma.budgetAllocation.groupBy({
      by: ['status'],
      where: { deletedAt: null, ...scope },
      _count: true,
    });
  }

  /**
   * List distinct fiscal year IDs for allocations matching a where clause.
   *
   * @param {Object} where - Prisma where clause
   * @returns {Promise<Array>} Array of { fiscalYearId }
   */
  async distinctFiscalYearIds(where = {}) {
    return prisma.budgetAllocation.findMany({
      where,
      distinct: ['fiscalYearId'],
      select: { fiscalYearId: true },
    });
  }

  /**
   * Sum budgetAmount across the given fiscal years.
   *
   * @param {Array<string>} yearIds - Fiscal year IDs
   * @returns {Promise<Object>} Prisma aggregate result
   */
  async sumFiscalYearBudgets(yearIds) {
    return prisma.fiscalYear.aggregate({
      where: { id: { in: yearIds } },
      _sum: { budgetAmount: true },
    });
  }

  /**
   * Check whether a live allocation already exists for the same fiscal year,
   * department, program, fund source, and category combination. Rejected,
   * Archived, and soft-deleted allocations do not block new allocations.
   *
   * @param {Object} combo - Combination of references to check
   * @param {string|null} excludeId - Allocation ID to exclude (for updates)
   * @returns {Promise<boolean>} True if a duplicate exists
   */
  async duplicateExists(
    { fiscalYearId, departmentId, fundSourceId, categoryId, programId },
    excludeId = null
  ) {
    const allocation = await prisma.budgetAllocation.findFirst({
      where: {
        deletedAt: null,
        fiscalYearId,
        departmentId,
        fundSourceId,
        categoryId,
        programId,
        status: { notIn: EXCLUDED_ALLOCATION_STATUSES },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!allocation;
  }

  /**
   * Create an allocation with an auto-generated sequential code.
   *
   * The sequence is computed and the insert performed inside a serializable
   * transaction so concurrent creations cannot produce duplicate codes. The
   * sequence counts every allocation for the fiscal year (including soft-deleted
   * rows) because deleted records keep their unique codes.
   *
   * @param {string} prefix - Code prefix, e.g. "BA-2026"
   * @param {string} fiscalYearId - Fiscal year the code sequence belongs to
   * @param {Object} data - Allocation data (without allocationCode)
   * @param {Object|null} combo - Reference combination
   *        ({ fiscalYearId, departmentId, fundSourceId, categoryId, programId }) to
   *        guard against duplicate allocations inside the transaction. When omitted
   *        the uniqueness check is skipped (used by the code-generator tests).
   * @returns {Promise<Object>} Created allocation with related entities
   */
  async createWithSequentialCode(prefix, fiscalYearId, data, combo = null) {
    return prisma.$transaction(
      async (tx) => {
        if (combo) {
          const duplicate = await tx.budgetAllocation.findFirst({
            where: {
              deletedAt: null,
              fiscalYearId: combo.fiscalYearId,
              departmentId: combo.departmentId,
              fundSourceId: combo.fundSourceId,
              categoryId: combo.categoryId,
              programId: combo.programId,
              status: { notIn: EXCLUDED_ALLOCATION_STATUSES },
            },
            select: { id: true },
          });
          if (duplicate) {
            throw new AppError(DUPLICATE_ALLOCATION_MESSAGE, HTTP_STATUS.CONFLICT);
          }
        }

        const existing = await tx.budgetAllocation.findMany({
          where: {
            fiscalYearId,
            allocationCode: { startsWith: `${prefix}-` },
          },
          select: { allocationCode: true },
        });

        let maxSequence = 0;
        for (const { allocationCode } of existing) {
          const sequence = parseInt(allocationCode.slice(prefix.length + 1), 10);
          if (Number.isFinite(sequence) && sequence > maxSequence) {
            maxSequence = sequence;
          }
        }

        const allocationCode = `${prefix}-${String(maxSequence + 1).padStart(3, '0')}`;

        return tx.budgetAllocation.create({
          data: { ...data, allocationCode, fiscalYearId },
          include: allocationInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }

  /**
   * Update an allocation by ID.
   *
   * @param {string} id - Allocation ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated allocation with related entities
   */
  async update(id, data) {
    return prisma.budgetAllocation.update({
      where: { id },
      data,
      include: allocationInclude,
    });
  }

  /**
   * Soft-delete an allocation by setting its deletedAt timestamp.
   *
   * @param {string} id - Allocation ID
   * @returns {Promise<Object>} Updated allocation
   */
  async softDelete(id) {
    return prisma.budgetAllocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Find the most recently created allocations (non-deleted).
   *
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Recent allocations with related entity names
   */
  async findRecent(limit = 10) {
    return prisma.budgetAllocation.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        department: { select: { name: true } },
        creator: { select: { fullName: true } },
      },
      // Only select the fields we need for the activity feed
    });
  }

  /**
   * Count all allocations (non-deleted) grouped by status, across all fiscal
   * years. Used by the dashboard notifications widget.
   *
   * @returns {Promise<Array>} Grouped counts, e.g. [{ status: 'Draft', _count: 3 }]
   */
  async countByStatusAll() {
    return prisma.budgetAllocation.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });
  }

  /**
   * Sum allocated amounts grouped by a dimension column.
   *
   * Used by the dashboard breakdown charts so the aggregation happens in the
   * database rather than by paging the allocation list into the client.
   *
   * @param {string} field - Column to group by, e.g. 'departmentId'
   * @param {Object} where - Prisma where clause
   * @returns {Promise<Array>} Grouped sums, e.g. [{ departmentId, _sum, _count }]
   */
  async groupByDimension(field, where = {}) {
    return prisma.budgetAllocation.groupBy({
      by: [field],
      where,
      _sum: { allocatedAmount: true },
      _count: true,
    });
  }

  /**
   * Resolve display labels for a set of breakdown dimension IDs.
   *
   * `groupBy` cannot join relations, so the labels are fetched in one follow-up
   * query. Kept here beside `groupByDimension` so the breakdown feature reads
   * as a unit; neither department nor category repository exposes a
   * find-by-many-IDs method to reuse.
   *
   * @param {string} model - Dimension name: 'department' or 'category'
   * @param {Array<string>} ids - Dimension IDs to resolve
   * @returns {Promise<Array>} Records of { id, code, name }
   */
  async findDimensionLabels(model, ids = []) {
    if (ids.length === 0) return [];

    const select = { id: true, code: true, name: true };
    if (model === 'department') {
      return prisma.department.findMany({ where: { id: { in: ids } }, select });
    }
    return prisma.budgetCategory.findMany({ where: { id: { in: ids } }, select });
  }

  /**
   * Build a Prisma where clause from list filters. Shared by findMany and count.
   *
   * @private
   * @param {Object} filters - Filter criteria
   * @returns {Object} Prisma where clause
   */
  buildWhere(filters = {}) {
    const where = { deletedAt: null };

    if (filters.fiscalYearId) {
      where.fiscalYearId = filters.fiscalYearId;
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.fundSourceId) {
      where.fundSourceId = filters.fundSourceId;
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.programId) {
      where.programId = filters.programId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    // "Date created" range filter (dateTo is inclusive to end of day)
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    // Fuzzy search across code, description, and related entity names
    if (filters.search) {
      where.OR = [
        { allocationCode: { contains: filters.search } },
        { description: { contains: filters.search } },
        { department: { name: { contains: filters.search } } },
        { fundSource: { name: { contains: filters.search } } },
        { category: { name: { contains: filters.search } } },
        { program: { name: { contains: filters.search } } },
      ];
    }

    return where;
  }

  /**
   * Build a Prisma orderBy clause from semantic sorting options.
   *
   * @private
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Object} Prisma orderBy clause
   */
  buildOrderBy(ordering = {}) {
    const { sortBy, sortOrder } = ordering;

    switch (sortBy) {
      case 'newest':
        return { createdAt: 'desc' };
      case 'oldest':
        return { createdAt: 'asc' };
      case 'highest':
        return { allocatedAmount: 'desc' };
      case 'lowest':
        return { allocatedAmount: 'asc' };
      case 'code':
        return { allocationCode: sortOrder || 'asc' };
      case 'department':
        return { department: { name: sortOrder || 'asc' } };
      default:
        if (sortBy) {
          return { [sortBy]: sortOrder || 'asc' };
        }
        return { createdAt: 'desc' };
    }
  }
}

export const allocationRepository = new AllocationRepository();
