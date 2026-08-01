/**
 * Budget allocation status definitions.
 *
 * Mirrors the backend `AllocationStatus` enum. Values are used verbatim in API
 * requests/responses while `ALLOCATION_STATUS_LABELS` provides human-readable
 * labels for the UI.
 */

export const ALLOCATION_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'PendingApproval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
};

export const ALLOCATION_STATUS_LIST = [
  ALLOCATION_STATUS.DRAFT,
  ALLOCATION_STATUS.PENDING_APPROVAL,
  ALLOCATION_STATUS.APPROVED,
  ALLOCATION_STATUS.REJECTED,
  ALLOCATION_STATUS.ARCHIVED,
];

export const ALLOCATION_STATUS_LABELS = {
  [ALLOCATION_STATUS.DRAFT]: 'Draft',
  [ALLOCATION_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [ALLOCATION_STATUS.APPROVED]: 'Approved',
  [ALLOCATION_STATUS.REJECTED]: 'Rejected',
  [ALLOCATION_STATUS.ARCHIVED]: 'Archived',
};

/**
 * Badge variants consumed by the shared `Badge` component. Kept in a single
 * place so every status indicator in the app uses consistent colors.
 */
export const ALLOCATION_STATUS_VARIANTS = {
  [ALLOCATION_STATUS.DRAFT]: 'secondary',
  [ALLOCATION_STATUS.PENDING_APPROVAL]: 'warning',
  [ALLOCATION_STATUS.APPROVED]: 'success',
  [ALLOCATION_STATUS.REJECTED]: 'danger',
  [ALLOCATION_STATUS.ARCHIVED]: 'inactive',
};

/**
 * Dot colors shown beside the status label in badges.
 */
export const ALLOCATION_STATUS_DOT_COLORS = {
  [ALLOCATION_STATUS.DRAFT]: 'bg-slate-400',
  [ALLOCATION_STATUS.PENDING_APPROVAL]: 'bg-amber-500',
  [ALLOCATION_STATUS.APPROVED]: 'bg-emerald-500',
  [ALLOCATION_STATUS.REJECTED]: 'bg-red-500',
  [ALLOCATION_STATUS.ARCHIVED]: 'bg-slate-300',
};

/**
 * Default allocation sort keys understood by the backend `GET /allocations`
 * endpoint (`sortBy` enum). Semantic aliases are also accepted by the API.
 */
export const ALLOCATION_SORT_KEYS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest Amount' },
  { value: 'lowest', label: 'Lowest Amount' },
  { value: 'code', label: 'Allocation Code' },
  { value: 'department', label: 'Department' },
];

export const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
