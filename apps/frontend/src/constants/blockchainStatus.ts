/**
 * Blockchain record status definitions.
 *
 * Mirrors the backend `BlockchainRecordStatus` enum. Values are used verbatim
 * in API requests/responses while labels and badge variants drive the UI.
 */

export const BLOCKCHAIN_RECORD_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed',
} as const;

export type BlockchainRecordStatusValue =
  (typeof BLOCKCHAIN_RECORD_STATUS)[keyof typeof BLOCKCHAIN_RECORD_STATUS];

export const BLOCKCHAIN_RECORD_STATUS_LIST = [
  BLOCKCHAIN_RECORD_STATUS.PENDING,
  BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
  BLOCKCHAIN_RECORD_STATUS.FAILED,
];

export const BLOCKCHAIN_RECORD_STATUS_LABELS = {
  [BLOCKCHAIN_RECORD_STATUS.PENDING]: 'Pending',
  [BLOCKCHAIN_RECORD_STATUS.CONFIRMED]: 'Confirmed',
  [BLOCKCHAIN_RECORD_STATUS.FAILED]: 'Failed',
};

/**
 * Badge variants consumed by the shared `Badge` component so blockchain record
 * statuses stay color-consistent with the rest of the app.
 */
export const BLOCKCHAIN_RECORD_STATUS_VARIANTS = {
  [BLOCKCHAIN_RECORD_STATUS.PENDING]: 'warning',
  [BLOCKCHAIN_RECORD_STATUS.CONFIRMED]: 'success',
  [BLOCKCHAIN_RECORD_STATUS.FAILED]: 'danger',
};

/**
 * Dot colors shown beside the status label in badges.
 */
export const BLOCKCHAIN_RECORD_STATUS_DOT_COLORS = {
  [BLOCKCHAIN_RECORD_STATUS.PENDING]: 'bg-amber-500',
  [BLOCKCHAIN_RECORD_STATUS.CONFIRMED]: 'bg-emerald-500',
  [BLOCKCHAIN_RECORD_STATUS.FAILED]: 'bg-red-500',
};

/**
 * Default sort keys understood by the backend `GET /blockchain/transactions`
 * endpoint (`sortBy` enum).
 */
export const BLOCKCHAIN_SORT_KEYS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'status', label: 'Status' },
  { value: 'allocationCode', label: 'Allocation Code' },
];
