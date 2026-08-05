/**
 * Financial activity timeline entry kinds.
 *
 * The dashboard timeline is a read-time union over four existing sources:
 * allocation approval decisions, document activities, audit log entries, and
 * blockchain anchor records. Each source normalizes to a common entry shape
 * discriminated by `kind`.
 */
export const TIMELINE_KINDS = {
  ALLOCATION_APPROVAL: 'AllocationApproval',
  DOCUMENT_ACTIVITY: 'DocumentActivity',
  AUDIT_LOG: 'AuditLog',
  BLOCKCHAIN_RECORD: 'BlockchainRecord',
};

export const TIMELINE_KINDS_LIST = Object.values(TIMELINE_KINDS);
