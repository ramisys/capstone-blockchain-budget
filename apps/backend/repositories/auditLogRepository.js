import prisma from '../models/prismaClient.js';

/**
 * Repository for the append-only `audit_logs` table.
 *
 * Audit logs are immutable: only `create` and read operations exist here. There
 * is intentionally no update or delete method, matching the audit trail
 * requirements of the blockchain integrity milestone.
 */
class AuditLogRepository {
  /**
   * Persist a new audit log entry.
   *
   * @param {Object} data - Audit log columns (action, result, actor snapshots,
   *                        ip, resource fields, details, eventHash, ...)
   * @returns {Promise<Object>} Created audit log row
   */
  async create(data) {
    return prisma.auditLog.create({ data });
  }

  /**
   * Find an audit log entry by ID.
   *
   * @param {string} id - Audit log ID
   * @returns {Promise<Object|null>} Audit log row or null
   */
  async findById(id) {
    return prisma.auditLog.findUnique({ where: { id } });
  }

  /**
   * Find an audit log entry by its unique content hash.
   *
   * @param {string} eventHash - SHA-256 hash of the canonical event payload
   * @returns {Promise<Object|null>} Audit log row or null
   */
  async findByEventHash(eventHash) {
    return prisma.auditLog.findUnique({ where: { eventHash } });
  }

  /**
   * Update only the blockchain anchor fields of an audit log entry.
   *
   * The `audit_logs` table is append-only with respect to audit content — the
   * action, actor snapshot, and details can never change. This method exists
   * solely so the anchoring pipeline (and the retry scheduler) can mark a row
   * Confirmed/Failed with its on-chain txHash/blockNumber after the event is
   * written to the AuditLedger contract.
   *
   * @param {string} id - Audit log ID
   * @param {Object} data - Anchor fields (anchorStatus, txHash, blockNumber,
   *                        network, confirmedAt)
   * @returns {Promise<Object>} Updated audit log row
   */
  async updateAnchor(id, data) {
    return prisma.auditLog.update({
      where: { id },
      data,
    });
  }

  /**
   * Find audit log entries with filtering, pagination, and ordering.
   *
   * @param {Object} filters - Filter criteria (action, result, actorId,
   *                           resourceType, resourceId, anchorStatus,
   *                           search, dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of audit log rows
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = this.buildWhere(filters);

    const MAX_LIMIT = 100;
    const page = parseInt(pagination.page, 10) || 1;
    const limit = Math.min(parseInt(pagination.limit, 10) || 10, MAX_LIMIT);
    const skip = (page - 1) * limit;

    return prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: this.buildOrderBy(ordering),
    });
  }

  /**
   * Count audit log entries matching the list filters.
   *
   * @param {Object} filters - Same filter criteria as findMany
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    return prisma.auditLog.count({ where: this.buildWhere(filters) });
  }

  /**
   * Count audit log entries grouped by action.
   *
   * @returns {Promise<Array>} Grouped counts, e.g. [{ action: 'AUTH_LOGIN', _count: 3 }]
   */
  async countByAction() {
    return prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
    });
  }

  /**
   * Count audit log entries grouped by result (Success / Failure).
   *
   * @returns {Promise<Array>} Grouped counts, e.g. [{ result: 'Failure', _count: 1 }]
   */
  async countByResult() {
    return prisma.auditLog.groupBy({
      by: ['result'],
      _count: true,
    });
  }

  /**
   * Find unanchored audit log entries (Pending anchor status), oldest first,
   * for the anchoring scheduler.
   *
   * @param {number} [limit=50] - Maximum number of entries to fetch
   * @returns {Promise<Array>} List of pending audit log rows
   */
  async findUnconfirmed(limit = 50) {
    return prisma.auditLog.findMany({
      where: { anchorStatus: 'Pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
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
    const where = {};

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.result) {
      where.result = filters.result;
    }
    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }
    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }
    if (filters.anchorStatus) {
      where.anchorStatus = filters.anchorStatus;
    }
    if (filters.hasEventHash) {
      where.eventHash = { not: null };
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
      where.OR = [
        { action: { contains: filters.search } },
        { actorEmail: { contains: filters.search } },
        { resourceCode: { contains: filters.search } },
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
      case 'action':
        return { action: sortOrder || 'asc' };
      case 'result':
        return { result: sortOrder || 'asc' };
      case 'actorEmail':
        return { actorEmail: sortOrder || 'asc' };
      default:
        if (sortBy) {
          return { [sortBy]: sortOrder || 'asc' };
        }
        return { createdAt: 'desc' };
    }
  }
}

export const auditLogRepository = new AuditLogRepository();
