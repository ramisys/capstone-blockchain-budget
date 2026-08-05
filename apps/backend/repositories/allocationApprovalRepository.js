import prisma from '../models/prismaClient.js';

/**
 * Relations eagerly loaded with every approval query. The actor is selected
 * explicitly to avoid exposing the password hash.
 */
const approvalInclude = {
  actor: {
    select: { id: true, fullName: true, email: true, role: true },
  },
};

class AllocationApprovalRepository {
  /**
   * Record a single approval decision in the allocation's history.
   *
   * @param {Object} data - Approval data
   * @param {string} data.allocationId - Allocation ID
   * @param {string} data.action - Approval action from ALLOCATION_APPROVAL_ACTIONS
   * @param {string|null} data.comment - Optional decision comment / rejection reason
   * @param {string} data.actorId - User ID performing the action
   * @returns {Promise<Object>} Created approval record
   */
  async create(data) {
    return prisma.allocationApproval.create({
      data,
      include: approvalInclude,
    });
  }

  /**
   * Find all approval records for an allocation, newest first.
   *
   * @param {string} allocationId - Allocation ID
   * @returns {Promise<Array>} Approval history
   */
  async findManyByAllocationId(allocationId) {
    return prisma.allocationApproval.findMany({
      where: { allocationId },
      orderBy: { createdAt: 'desc' },
      include: approvalInclude,
    });
  }

  /**
   * Find approval records for the financial activity timeline, newest first.
   *
   * The merged timeline is re-sorted and paginated in memory (matching the
   * unified blockchain history), so this deliberately applies no DB-level
   * limit — only the shared date-range filter.
   *
   * @param {Object} filters - Filter criteria (dateFrom, dateTo)
   * @returns {Promise<Array>} Approval records with actor + allocation
   */
  async findTimeline(filters = {}) {
    const where = {};

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

    return prisma.allocationApproval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ...approvalInclude,
        allocation: {
          select: {
            id: true,
            allocationCode: true,
            status: true,
            allocatedAmount: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });
  }
}

export const allocationApprovalRepository = new AllocationApprovalRepository();
