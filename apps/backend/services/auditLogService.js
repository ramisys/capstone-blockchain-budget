import { config } from '../config/env.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class AuditLogService {
  /**
   * Get paginated, filterable audit log entries.
   *
   * @param {Object} filters - Filter criteria (search, action, result,
   *                           resourceType, resourceId, actorId, anchorStatus,
   *                           dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Object>} Logs list and pagination info
   */
  async getLogs(filters = {}, pagination = {}, ordering = {}) {
    const [logs, totalCount] = await Promise.all([
      auditLogRepository.findMany(filters, pagination, ordering),
      auditLogRepository.count(filters),
    ]);

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      logs: this.serializeMany(logs),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get a single audit log entry by ID.
   *
   * @param {string} id - Audit log ID
   * @returns {Promise<Object>} Serialized audit log entry
   */
  async getLogById(id) {
    const entry = await auditLogRepository.findById(id);
    if (!entry) {
      throw new AppError('Audit log entry not found', HTTP_STATUS.NOT_FOUND);
    }
    return this.serialize(entry);
  }

  /**
   * Get summary counts for the audit dashboard: total entries, success/failure
   * splits, per-action counts, and the number of anchors awaiting confirmation.
   *
   * @returns {Promise<Object>} Audit summary
   */
  async getSummary() {
    const [byAction, byResult, pending] = await Promise.all([
      auditLogRepository.countByAction(),
      auditLogRepository.countByResult(),
      auditLogRepository.count({ anchorStatus: 'Pending' }),
    ]);

    const total = byAction.reduce((sum, group) => sum + group._count, 0);
    const successCount = byResult.find((g) => g.result === 'Success')?._count ?? 0;
    const failureCount = byResult.find((g) => g.result === 'Failure')?._count ?? 0;

    return {
      total,
      successCount,
      failureCount,
      pendingAnchors: pending,
      byAction: byAction
        .map((group) => ({ action: group.action, count: group._count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Normalize an audit log entry for API responses (BigInt -> number).
   *
   * @private
   * @param {Object|null} entry - Entry from Prisma
   * @returns {Object|null} Serialized entry
   */
  serialize(entry) {
    if (!entry) return entry;
    return {
      ...entry,
      blockNumber: entry.blockNumber !== null && entry.blockNumber !== undefined ? Number(entry.blockNumber) : null,
      txExplorerUrl: this.getTxExplorerUrl(entry.txHash),
    };
  }

  /**
   * Normalize a list of audit log entries for API responses.
   *
   * @private
   * @param {Array<Object>} entries - Entries from Prisma
   * @returns {Array<Object>} Serialized entries
   */
  serializeMany(entries) {
    return entries.map((entry) => this.serialize(entry));
  }

  /**
   * Build the block-explorer URL for a transaction hash.
   *
   * @private
   * @param {string|null} txHash - Transaction hash
   * @returns {string|null} Explorer URL or null
   */
  getTxExplorerUrl(txHash) {
    if (!txHash || !config.blockchain.explorerUrl) return null;
    const base = config.blockchain.explorerUrl.replace(/\/+$/, '');
    return `${base}/tx/${txHash}`;
  }
}

export const auditLogService = new AuditLogService();
