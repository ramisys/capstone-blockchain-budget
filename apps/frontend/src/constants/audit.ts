/**
 * Audit result / anchor status definitions for the Audit Trail module.
 *
 * Mirrors the backend `AuditResult` and `AuditAnchorStatus` enums. Values are
 * used verbatim in API requests/responses while labels and badge variants
 * drive the UI.
 */

export const AUDIT_RESULTS = {
  SUCCESS: 'Success',
  FAILURE: 'Failure',
} as const;

export type AuditResultValue = (typeof AUDIT_RESULTS)[keyof typeof AUDIT_RESULTS];

export const AUDIT_RESULT_LIST = [AUDIT_RESULTS.SUCCESS, AUDIT_RESULTS.FAILURE];

export const AUDIT_RESULT_LABELS = {
  [AUDIT_RESULTS.SUCCESS]: 'Success',
  [AUDIT_RESULTS.FAILURE]: 'Failure',
};

export const AUDIT_RESULT_VARIANTS = {
  [AUDIT_RESULTS.SUCCESS]: 'success',
  [AUDIT_RESULTS.FAILURE]: 'danger',
};

export const AUDIT_RESULT_DOT_COLORS = {
  [AUDIT_RESULTS.SUCCESS]: 'bg-emerald-500',
  [AUDIT_RESULTS.FAILURE]: 'bg-red-500',
};

export const AUDIT_ANCHOR_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed',
} as const;

export type AuditAnchorStatusValue =
  (typeof AUDIT_ANCHOR_STATUS)[keyof typeof AUDIT_ANCHOR_STATUS];

export const AUDIT_ANCHOR_STATUS_LIST = [
  AUDIT_ANCHOR_STATUS.PENDING,
  AUDIT_ANCHOR_STATUS.CONFIRMED,
  AUDIT_ANCHOR_STATUS.FAILED,
];

export const AUDIT_ANCHOR_STATUS_LABELS = {
  [AUDIT_ANCHOR_STATUS.PENDING]: 'Pending',
  [AUDIT_ANCHOR_STATUS.CONFIRMED]: 'Confirmed',
  [AUDIT_ANCHOR_STATUS.FAILED]: 'Failed',
};

export const AUDIT_ANCHOR_STATUS_VARIANTS = {
  [AUDIT_ANCHOR_STATUS.PENDING]: 'warning',
  [AUDIT_ANCHOR_STATUS.CONFIRMED]: 'success',
  [AUDIT_ANCHOR_STATUS.FAILED]: 'danger',
};

export const AUDIT_ANCHOR_STATUS_DOT_COLORS = {
  [AUDIT_ANCHOR_STATUS.PENDING]: 'bg-amber-500',
  [AUDIT_ANCHOR_STATUS.CONFIRMED]: 'bg-emerald-500',
  [AUDIT_ANCHOR_STATUS.FAILED]: 'bg-red-500',
};

/**
 * Default sort keys understood by the backend `GET /audit-logs` endpoint
 * (`sortBy` enum).
 */
export const AUDIT_SORT_KEYS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'action', label: 'Action' },
  { value: 'result', label: 'Result' },
  { value: 'actorEmail', label: 'Actor Email' },
];
