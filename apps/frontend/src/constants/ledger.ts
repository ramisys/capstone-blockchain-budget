/**
 * Unified blockchain ledger record type definitions.
 *
 * Mirrors the backend `LEDGER_RECORD_TYPES` in
 * `apps/backend/constants/ledgerTypes.js`. The unified history merges
 * allocation anchors, document anchors, and audit events into one feed, so the
 * UI needs a stable value/label/badge mapping per record type.
 */

export const LEDGER_RECORD_TYPE = {
  ALLOCATION: 'Allocation',
  DOCUMENT: 'Document',
  AUDIT: 'Audit',
} as const;

export type LedgerRecordTypeValue =
  (typeof LEDGER_RECORD_TYPE)[keyof typeof LEDGER_RECORD_TYPE];

export const LEDGER_RECORD_TYPE_LIST = [
  LEDGER_RECORD_TYPE.ALLOCATION,
  LEDGER_RECORD_TYPE.DOCUMENT,
  LEDGER_RECORD_TYPE.AUDIT,
];

export const LEDGER_RECORD_TYPE_LABELS = {
  [LEDGER_RECORD_TYPE.ALLOCATION]: 'Allocation',
  [LEDGER_RECORD_TYPE.DOCUMENT]: 'Document',
  [LEDGER_RECORD_TYPE.AUDIT]: 'Audit Event',
};

/**
 * Badge variants consumed by the shared `Badge` component so each record type
 * stays visually distinct in the unified ledger feed.
 */
export const LEDGER_RECORD_TYPE_VARIANTS = {
  [LEDGER_RECORD_TYPE.ALLOCATION]: 'primary',
  [LEDGER_RECORD_TYPE.DOCUMENT]: 'success',
  [LEDGER_RECORD_TYPE.AUDIT]: 'warning',
};
