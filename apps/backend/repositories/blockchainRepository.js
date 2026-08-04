import prisma from '../models/prismaClient.js';

/**
 * Lightweight allocation projection included with blockchain record queries so
 * the verification dashboard can show the related budget line without N+1.
 */
const allocationSelect = {
  select: {
    id: true,
    allocationCode: true,
    status: true,
    allocatedAmount: true,
    department: { select: { id: true, name: true, code: true } },
    fiscalYear: { select: { id: true, code: true } },
  },
};

class BlockchainRepository {
  /**
   * Create a blockchain record as the allocation's current anchor, superseding
   * any previous live records for the same allocation.
   *
   * Superseded records are kept for the immutable on-chain audit trail but are
   * excluded from history and status counts, so re-approvals after a
   * return-to-draft do not inflate the ledger.
   *
   * @param {Object} data - Record data
   * @returns {Promise<Object>} Created record
   */
  async createCurrent(data) {
    const { allocationId } = data;
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      await tx.blockchainRecord.updateMany({
        where: { allocationId, supersededAt: null },
        data: { supersededAt: now },
      });
      return tx.blockchainRecord.create({
        data,
        include: { allocation: allocationSelect },
      });
    });
  }

  /**
   * Find a blockchain record by ID.
   *
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>} Record or null
   */
  async findById(id) {
    return prisma.blockchainRecord.findUnique({
      where: { id },
      include: { allocation: allocationSelect },
    });
  }

  /**
   * Find the current (non-superseded) record for an allocation.
   *
   * @param {string} allocationId - Allocation ID
   * @returns {Promise<Object|null>} Record or null
   */
  async findByAllocationId(allocationId) {
    return prisma.blockchainRecord.findFirst({
      where: { allocationId, supersededAt: null },
      orderBy: { createdAt: 'desc' },
      include: { allocation: allocationSelect },
    });
  }

  /**
   * Find a blockchain record by its unique content hash.
   *
   * @param {string} contentHash - SHA-256 content hash
   * @returns {Promise<Object|null>} Record or null
   */
  async findByContentHash(contentHash) {
    return prisma.blockchainRecord.findUnique({
      where: { contentHash },
      include: { allocation: allocationSelect },
    });
  }

  /**
   * Update a blockchain record.
   *
   * @param {string} id - Record ID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data) {
    return prisma.blockchainRecord.update({
      where: { id },
      data,
      include: { allocation: allocationSelect },
    });
  }

  /**
   * Find many blockchain records with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (search, status, allocationId,
   *                           dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of records
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = this.buildWhere(filters);

    const MAX_LIMIT = 100;
    const page = parseInt(pagination.page) || 1;
    const limit = Math.min(parseInt(pagination.limit) || 10, MAX_LIMIT);
    const skip = (page - 1) * limit;

    return prisma.blockchainRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: this.buildOrderBy(ordering),
      include: { allocation: allocationSelect },
    });
  }

  /**
   * Count blockchain records matching the list filters.
   *
   * @param {Object} filters - Same filter criteria as findMany
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    return prisma.blockchainRecord.count({
      where: this.buildWhere(filters),
    });
  }

  /**
   * Count records grouped by status (Pending / Confirmed / Failed).
   * Superseded records are excluded so dashboard counts reflect live anchors.
   *
   * @returns {Promise<Array>} Grouped counts, e.g. [{ status: 'Confirmed', _count: 3 }]
   */
  async countByStatus() {
    return prisma.blockchainRecord.groupBy({
      by: ['status'],
      where: { supersededAt: null },
      _count: true,
    });
  }

  /**
   * Find all live (non-superseded) unconfirmed records (Pending or Failed status).
   *
   * @returns {Promise<Array>} List of unconfirmed records
   */
  async findUnconfirmed() {
    return prisma.blockchainRecord.findMany({
      where: {
        supersededAt: null,
        status: { in: ['Pending', 'Failed'] },
      },
      orderBy: { createdAt: 'asc' },
      include: { allocation: allocationSelect },
    });
  }

  /**
   * Find the most recently created live (non-superseded) record (used for
   * lastSync tracking).
   *
   * @returns {Promise<Object|null>} Latest record or null
   */
  async getLatest() {
    return prisma.blockchainRecord.findFirst({
      where: { supersededAt: null },
      orderBy: { createdAt: 'desc' },
      include: { allocation: allocationSelect },
    });
  }

  /**
   * Build a Prisma where clause from list filters. Shared by findMany and count.
   *
   * @private
   * @param {Object} filters - Filter criteria
   * @returns {Object} Prisma where clause
   */
  buildWhere(filters = {}) {
    const where = { supersededAt: null };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.allocationId) {
      where.allocationId = filters.allocationId;
    }

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

    if (filters.search) {
      where.OR = [{ allocationCode: { contains: filters.search } }];
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
      case 'status':
        return { status: sortOrder || 'asc' };
      case 'allocationCode':
        return { allocationCode: sortOrder || 'asc' };
      default:
        if (sortBy) {
          return { [sortBy]: sortOrder || 'asc' };
        }
        return { createdAt: 'desc' };
    }
  }
}

export const blockchainRepository = new BlockchainRepository();
