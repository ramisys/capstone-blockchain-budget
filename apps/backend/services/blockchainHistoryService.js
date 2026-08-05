import { blockchainProvider } from '../config/blockchain.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { LEDGER_RECORD_TYPES } from '../constants/ledgerTypes.js';
import { toNumber } from '../utils/amountUtils.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Unified, type-aware blockchain transaction history.
 *
 * The allocation anchors (`BlockchainRecord`), document anchors
 * (`DocumentVersion`), and audit events (`AuditLog`) live in separate tables
 * and are kept there by design (Phase 4.6 explicitly forbids duplicating anchor
 * fields). This service merges them at read time into one normalized shape
 * `{ id, recordType, code, hash, txHash, blockNumber, network, status,
 * createdAt, explorerUrl, ref }`, sorted by date and paginated in memory.
 *
 * Records are fetched without a DB-level limit per source: the union is
 * re-sorted across tables, so correct pagination requires the full filtered
 * set. The final response is capped at MAX_LIMIT (100) per page, matching the
 * other list endpoints.
 */
class BlockchainHistoryService {
  /**
   * Get the unified ledger history with pagination, filtering (recordType,
   * status, search, date range), and sorting.
   *
   * @param {Object} filters - Filter criteria (recordType, search, status,
   *                           dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Object>} History entries and pagination info
   */
  async getHistory(filters = {}, pagination = {}, ordering = {}) {
    const MAX_LIMIT = 100;
    const page = parseInt(pagination.page, 10) || 1;
    const limit = Math.min(parseInt(pagination.limit, 10) || 10, MAX_LIMIT);

    const baseFilters = {
      search: filters.search,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const sources = [];
    if (!filters.recordType || filters.recordType === LEDGER_RECORD_TYPES.ALLOCATION) {
      sources.push(this.loadAllocations(baseFilters));
    }
    if (!filters.recordType || filters.recordType === LEDGER_RECORD_TYPES.DOCUMENT) {
      sources.push(this.loadDocuments(baseFilters));
    }
    if (!filters.recordType || filters.recordType === LEDGER_RECORD_TYPES.AUDIT) {
      sources.push(this.loadAudits(baseFilters));
    }

    const results = await Promise.all(sources);
    const entries = results.flat().sort(this.buildComparator(ordering));

    const totalCount = entries.length;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
    const start = (page - 1) * limit;
    const items = entries.slice(start, start + limit);

    return {
      transactions: items,
      pagination: { total: totalCount, page, limit, totalPages },
    };
  }

  /**
   * Get a single transaction detail by resolving its source table.
   *
   * `recordType` disambiguates the lookup (UUIDs are unique per table, but not
   * guaranteed unique across tables). Defaults to Allocation for backward
   * compatibility.
   *
   * @param {string} id - Record ID in the source table
   * @param {string} [recordType] - One of LEDGER_RECORD_TYPES
   * @returns {Promise<Object>} Normalized transaction detail
   */
  async getTransactionDetail(id, recordType) {
    if (recordType === LEDGER_RECORD_TYPES.DOCUMENT) {
      const version = await documentRepository.findVersionById(id);
      if (!version) {
        throw new AppError('Blockchain transaction not found', HTTP_STATUS.NOT_FOUND);
      }
      return this.serializeDocument(version);
    }

    if (recordType === LEDGER_RECORD_TYPES.AUDIT) {
      const log = await auditLogRepository.findById(id);
      if (!log) {
        throw new AppError('Blockchain transaction not found', HTTP_STATUS.NOT_FOUND);
      }
      return this.serializeAudit(log);
    }

    const record = await blockchainRepository.findById(id);
    if (!record) {
      throw new AppError('Blockchain transaction not found', HTTP_STATUS.NOT_FOUND);
    }
    return this.serializeAllocation(record);
  }

  /**
   * Load and normalize allocation anchors.
   *
   * @private
   * @param {Object} filters - Shared history filters
   * @returns {Promise<Array>} Normalized allocation entries
   */
  async loadAllocations(filters) {
    const records = await blockchainRepository.findMany(filters, {}, { sortBy: 'newest' });
    return records.map((record) => this.serializeAllocation(record));
  }

  /**
   * Load and normalize document version anchors.
   *
   * @private
   * @param {Object} filters - Shared history filters
   * @returns {Promise<Array>} Normalized document entries
   */
  async loadDocuments(filters) {
    const versions = await documentRepository.findVersionAnchors(filters);
    return versions.map((version) => this.serializeDocument(version));
  }

  /**
   * Load and normalize anchored audit events.
   *
   * @private
   * @param {Object} filters - Shared history filters
   * @returns {Promise<Array>} Normalized audit entries
   */
  async loadAudits(filters) {
    const logs = await auditLogRepository.findMany(
      { ...filters, hasEventHash: true },
      {},
      { sortBy: 'newest' }
    );
    return logs.map((log) => this.serializeAudit(log));
  }

  /**
   * Normalize an allocation blockchain record to the unified history shape.
   *
   * @private
   * @param {Object} record - BlockchainRecord from Prisma
   * @returns {Object} Normalized entry
   */
  serializeAllocation(record) {
    return {
      id: record.id,
      recordType: LEDGER_RECORD_TYPES.ALLOCATION,
      code: record.allocationCode,
      hash: record.contentHash,
      txHash: record.txHash,
      txExplorerUrl: blockchainProvider.getExplorerTxUrl(record.txHash),
      blockNumber: record.blockNumber != null ? Number(record.blockNumber) : null,
      network: record.network,
      status: record.status,
      confirmedAt: record.confirmedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      supersededAt: record.supersededAt,
      allocationId: record.allocationId,
      ref: record.allocation
        ? {
            id: record.allocation.id,
            allocationCode: record.allocation.allocationCode,
            status: record.allocation.status,
            allocatedAmount: toNumber(record.allocation.allocatedAmount),
            department: record.allocation.department,
            fiscalYear: record.allocation.fiscalYear,
          }
        : null,
    };
  }

  /**
   * Normalize a document version anchor to the unified history shape.
   *
   * @private
   * @param {Object} version - DocumentVersion from Prisma
   * @returns {Object} Normalized entry
   */
  serializeDocument(version) {
    return {
      id: version.id,
      recordType: LEDGER_RECORD_TYPES.DOCUMENT,
      code: version.document?.documentCode ?? version.id,
      hash: version.sha256Hash,
      txHash: version.txHash,
      txExplorerUrl: blockchainProvider.getExplorerTxUrl(version.txHash),
      blockNumber: version.blockNumber != null ? Number(version.blockNumber) : null,
      network: version.network,
      status: version.blockchainStatus,
      confirmedAt: version.confirmedAt,
      createdAt: version.uploadedAt,
      updatedAt: version.createdAt,
      versionNumber: version.versionNumber,
      ref: version.document
        ? {
            id: version.document.id,
            documentCode: version.document.documentCode,
            title: version.document.title,
            documentType: version.document.documentType,
            status: version.document.status,
            originalFileName: version.originalFileName,
            fileSizeBytes: toNumber(version.fileSizeBytes),
            mimeType: version.mimeType,
          }
        : null,
    };
  }

  /**
   * Normalize an audit event to the unified history shape.
   *
   * @private
   * @param {Object} log - AuditLog from Prisma
   * @returns {Object} Normalized entry
   */
  serializeAudit(log) {
    return {
      id: log.id,
      recordType: LEDGER_RECORD_TYPES.AUDIT,
      code: log.resourceCode || log.action,
      hash: log.eventHash,
      txHash: log.txHash,
      txExplorerUrl: blockchainProvider.getExplorerTxUrl(log.txHash),
      blockNumber: log.blockNumber != null ? Number(log.blockNumber) : null,
      network: log.network,
      status: log.anchorStatus,
      confirmedAt: log.confirmedAt,
      createdAt: log.createdAt,
      updatedAt: null,
      ref: {
        id: log.resourceId,
        action: log.action,
        result: log.result,
        actorEmail: log.actorEmail,
        actorName: log.actorName,
        actorRole: log.actorRole,
        resourceType: log.resourceType,
        resourceCode: log.resourceCode,
        details: log.details,
      },
    };
  }

  /**
   * Build a comparator for the merged entry list.
   *
   * @private
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Function} Comparator for Array.prototype.sort
   */
  buildComparator(ordering = {}) {
    const { sortBy, sortOrder } = ordering;
    const dir = sortOrder === 'asc' ? 1 : -1;
    const timeOf = (entry) => (entry.createdAt ? new Date(entry.createdAt).getTime() : 0);

    switch (sortBy) {
      case 'oldest':
        return (a, b) => timeOf(a) - timeOf(b);
      case 'recordType':
        return (a, b) =>
          (a.recordType < b.recordType ? -1 : a.recordType > b.recordType ? 1 : 0) * dir;
      case 'code':
        return (a, b) => String(a.code).localeCompare(String(b.code)) * dir;
      case 'status':
        return (a, b) => String(a.status).localeCompare(String(b.status)) * dir;
      default:
        return (a, b) => timeOf(b) - timeOf(a);
    }
  }
}

export const blockchainHistoryService = new BlockchainHistoryService();
