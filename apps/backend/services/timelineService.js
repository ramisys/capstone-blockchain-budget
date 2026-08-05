import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { allocationApprovalRepository } from '../repositories/allocationApprovalRepository.js';
import { TIMELINE_KINDS } from '../constants/timelineKinds.js';
import { toNumber } from '../utils/amountUtils.js';

/**
 * Merged financial activity timeline.
 *
 * The dashboard feed is a read-time union over four existing tables:
 * allocation approval decisions, document activities, audit log entries, and
 * blockchain anchor records. Each source is kept in its own table (Phase 4.6
 * forbids duplicating history) and normalized here into one common shape
 * `{ id, kind, action, label, description, actor, resourceType, resourceCode,
 * details, createdAt }`, sorted by date and paginated in memory.
 *
 * Sources are fetched without a DB-level limit because the union is re-sorted
 * across tables, so correct pagination requires the full filtered set. The
 * final response is capped at MAX_LIMIT (100) per page.
 */
class TimelineService {
  /**
   * Get the merged financial activity timeline.
   *
   * @param {Object} filters - Filter criteria (kind, dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Object>} Timeline entries and pagination info
   */
  async getTimeline(filters = {}, pagination = {}, ordering = {}) {
    const MAX_LIMIT = 100;
    const page = parseInt(pagination.page, 10) || 1;
    const limit = Math.min(parseInt(pagination.limit, 10) || 20, MAX_LIMIT);

    const baseFilters = {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const sources = [];
    if (!filters.kind || filters.kind === TIMELINE_KINDS.ALLOCATION_APPROVAL) {
      sources.push(this.loadApprovals(baseFilters));
    }
    if (!filters.kind || filters.kind === TIMELINE_KINDS.DOCUMENT_ACTIVITY) {
      sources.push(this.loadDocumentActivities(baseFilters));
    }
    if (!filters.kind || filters.kind === TIMELINE_KINDS.AUDIT_LOG) {
      sources.push(this.loadAuditLogs(baseFilters));
    }
    if (!filters.kind || filters.kind === TIMELINE_KINDS.BLOCKCHAIN_RECORD) {
      sources.push(this.loadBlockchainRecords(baseFilters));
    }

    const results = await Promise.all(sources);
    const entries = results.flat().sort(this.buildComparator(ordering));

    const totalCount = entries.length;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
    const start = (page - 1) * limit;
    const items = entries.slice(start, start + limit);

    return {
      timeline: items,
      pagination: { total: totalCount, page, limit, totalPages },
    };
  }

  /**
   * Load and normalize allocation approval decisions.
   *
   * @private
   * @param {Object} filters - Shared timeline filters
   * @returns {Promise<Array>} Normalized approval entries
   */
  async loadApprovals(filters) {
    const approvals = await allocationApprovalRepository.findTimeline(filters);
    return approvals.map((approval) => this.serializeApproval(approval));
  }

  /**
   * Load and normalize document activities.
   *
   * @private
   * @param {Object} filters - Shared timeline filters
   * @returns {Promise<Array>} Normalized document activity entries
   */
  async loadDocumentActivities(filters) {
    const activities = await documentRepository.findRecentActivities(filters);
    return activities.map((activity) => this.serializeDocumentActivity(activity));
  }

  /**
   * Load and normalize audit log entries.
   *
   * @private
   * @param {Object} filters - Shared timeline filters
   * @returns {Promise<Array>} Normalized audit entries
   */
  async loadAuditLogs(filters) {
    const logs = await auditLogRepository.findMany(filters, {}, { sortBy: 'newest' });
    return logs.map((log) => this.serializeAuditLog(log));
  }

  /**
   * Load and normalize blockchain anchor records (live, non-superseded).
   *
   * @private
   * @param {Object} filters - Shared timeline filters
   * @returns {Promise<Array>} Normalized blockchain entries
   */
  async loadBlockchainRecords(filters) {
    const records = await blockchainRepository.findMany(filters, {}, { sortBy: 'newest' });
    return records.map((record) => this.serializeBlockchainRecord(record));
  }

  /**
   * Normalize an allocation approval to the timeline shape.
   *
   * @private
   * @param {Object} approval - AllocationApproval from Prisma
   * @returns {Object} Normalized entry
   */
  serializeApproval(approval) {
    const allocation = approval.allocation;
    return {
      id: approval.id,
      kind: TIMELINE_KINDS.ALLOCATION_APPROVAL,
      action: approval.action,
      label: `Allocation ${approval.action.toLowerCase()}`,
      description: allocation
        ? `${allocation.allocationCode}${allocation.department ? ` · ${allocation.department.name}` : ''} was ${approval.action.toLowerCase()}.`
        : `${approval.action} recorded for an allocation.`,
      actor: approval.actor ? this.serializeActor(approval.actor) : null,
      resourceType: 'Allocation',
      resourceCode: allocation?.allocationCode ?? null,
      details: {
        comment: approval.comment ?? null,
        allocationStatus: allocation?.status ?? null,
        allocatedAmount: allocation ? toNumber(allocation.allocatedAmount) : null,
      },
      createdAt: approval.createdAt,
    };
  }

  /**
   * Normalize a document activity to the timeline shape.
   *
   * @private
   * @param {Object} activity - DocumentActivity from Prisma
   * @returns {Object} Normalized entry
   */
  serializeDocumentActivity(activity) {
    const doc = activity.document;
    return {
      id: activity.id,
      kind: TIMELINE_KINDS.DOCUMENT_ACTIVITY,
      action: activity.action,
      label: this.documentActionLabel(activity.action),
      description: doc ? `"${doc.title}" (${doc.documentCode})` : 'Document activity',
      actor: activity.actor ? this.serializeActor(activity.actor) : null,
      resourceType: 'Document',
      resourceCode: doc?.documentCode ?? null,
      details: {
        ...(activity.details ?? {}),
        action: activity.action,
      },
      createdAt: activity.createdAt,
    };
  }

  /**
   * Normalize an audit log entry to the timeline shape.
   *
   * @private
   * @param {Object} log - AuditLog from Prisma
   * @returns {Object} Normalized entry
   */
  serializeAuditLog(log) {
    return {
      id: log.id,
      kind: TIMELINE_KINDS.AUDIT_LOG,
      action: log.action,
      label: log.action,
      description: [log.resourceType, log.resourceCode].filter(Boolean).join(' ') || null,
      actor:
        log.actorName || log.actorEmail
          ? {
              id: log.actorId,
              name: log.actorName,
              email: log.actorEmail,
              role: log.actorRole,
            }
          : null,
      resourceType: log.resourceType ?? null,
      resourceCode: log.resourceCode ?? null,
      details: {
        ...(log.details ?? {}),
        result: log.result,
        anchorStatus: log.anchorStatus,
      },
      createdAt: log.createdAt,
    };
  }

  /**
   * Normalize a blockchain anchor record to the timeline shape.
   *
   * @private
   * @param {Object} record - BlockchainRecord from Prisma
   * @returns {Object} Normalized entry
   */
  serializeBlockchainRecord(record) {
    return {
      id: record.id,
      kind: TIMELINE_KINDS.BLOCKCHAIN_RECORD,
      action: record.status,
      label: `Anchor ${record.status.toLowerCase()}`,
      description: `${record.allocationCode} anchored on ${record.network}.`,
      actor: null,
      resourceType: 'Blockchain',
      resourceCode: record.allocationCode ?? null,
      details: {
        status: record.status,
        txHash: record.txHash ?? null,
        blockNumber: record.blockNumber != null ? Number(record.blockNumber) : null,
        network: record.network,
      },
      createdAt: record.createdAt,
    };
  }

  /**
   * Normalize an actor projection (actor or related user).
   *
   * @private
   * @param {Object} actor - User projection with id/fullName/email/role
   * @returns {Object} Normalized actor
   */
  serializeActor(actor) {
    return {
      id: actor.id,
      name: actor.fullName,
      email: actor.email,
      role: actor.role,
    };
  }

  /**
   * Map a document activity action to a readable timeline label.
   *
   * @private
   * @param {string} action - Activity action (e.g. UPLOAD)
   * @returns {string} Human-readable label
   */
  documentActionLabel(action) {
    const map = {
      UPLOAD: 'Document uploaded',
      METADATA_UPDATE: 'Document updated',
      REPLACE: 'Document replaced',
      ARCHIVE: 'Document archived',
      VERIFY: 'Document verified',
      ANCHOR_RETRY: 'Document anchor retried',
    };
    return map[action] || 'Document activity';
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
      case 'kind':
        return (a, b) => String(a.kind).localeCompare(String(b.kind)) * dir;
      case 'action':
        return (a, b) => String(a.action).localeCompare(String(b.action)) * dir;
      default:
        return (a, b) => timeOf(b) - timeOf(a);
    }
  }
}

export const timelineService = new TimelineService();
