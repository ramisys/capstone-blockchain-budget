/**
 * Unified blockchain ledger record types. The history endpoint unions
 * allocation anchors (BudgetLedger), document anchors (BudgetLedger via
 * DocumentVersion), and audit events (AuditLedger) into one type-aware feed.
 */
export const LEDGER_RECORD_TYPES = {
  ALLOCATION: 'Allocation',
  DOCUMENT: 'Document',
  AUDIT: 'Audit',
};

export const LEDGER_RECORD_TYPES_LIST = Object.values(LEDGER_RECORD_TYPES);
