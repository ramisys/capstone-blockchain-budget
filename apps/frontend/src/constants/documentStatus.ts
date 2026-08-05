/**
 * Document status definitions.
 *
 * Mirrors the backend `DocumentStatus` enum. Values are used verbatim in API
 * requests/responses while labels and badge variants drive the UI.
 */

export const DOCUMENT_STATUS = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
} as const;

export type DocumentStatusValue = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export const DOCUMENT_STATUS_LIST = [
  DOCUMENT_STATUS.ACTIVE,
  DOCUMENT_STATUS.ARCHIVED,
];

export const DOCUMENT_STATUS_LABELS = {
  [DOCUMENT_STATUS.ACTIVE]: 'Active',
  [DOCUMENT_STATUS.ARCHIVED]: 'Archived',
};

/**
 * Badge variants consumed by the shared `Badge` component so document statuses
 * stay color-consistent with the rest of the app.
 */
export const DOCUMENT_STATUS_VARIANTS = {
  [DOCUMENT_STATUS.ACTIVE]: 'active',
  [DOCUMENT_STATUS.ARCHIVED]: 'inactive',
};

/**
 * Dot colors shown beside the status label in badges.
 */
export const DOCUMENT_STATUS_DOT_COLORS = {
  [DOCUMENT_STATUS.ACTIVE]: 'bg-emerald-500',
  [DOCUMENT_STATUS.ARCHIVED]: 'bg-slate-300',
};

/**
 * Default sort keys understood by the backend `GET /documents` endpoint
 * (`sortBy` enum).
 */
export const DOCUMENT_SORT_KEYS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'code', label: 'Document Code' },
  { value: 'title', label: 'Title' },
  { value: 'documentCode', label: 'Document Code' },
];
