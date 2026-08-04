/**
 * Approval workflow definitions for budget allocations.
 *
 * Mirrors the backend `AllocationApprovalAction` enum. Values are used verbatim
 * in API requests/responses while `ALLOCATION_APPROVAL_ACTION_LABELS` and
 * `ALLOCATION_APPROVAL_ACTION_VARIANTS` drive the approval history timeline.
 */

export const ALLOCATION_APPROVAL_ACTION = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURNED: 'Returned',
} as const;

export type AllocationApprovalActionValue =
  (typeof ALLOCATION_APPROVAL_ACTION)[keyof typeof ALLOCATION_APPROVAL_ACTION];

export const ALLOCATION_APPROVAL_ACTION_LIST = [
  ALLOCATION_APPROVAL_ACTION.SUBMITTED,
  ALLOCATION_APPROVAL_ACTION.APPROVED,
  ALLOCATION_APPROVAL_ACTION.REJECTED,
  ALLOCATION_APPROVAL_ACTION.RETURNED,
];

export const ALLOCATION_APPROVAL_ACTION_LABELS = {
  [ALLOCATION_APPROVAL_ACTION.SUBMITTED]: 'Submitted',
  [ALLOCATION_APPROVAL_ACTION.APPROVED]: 'Approved',
  [ALLOCATION_APPROVAL_ACTION.REJECTED]: 'Rejected',
  [ALLOCATION_APPROVAL_ACTION.RETURNED]: 'Returned to Draft',
};

/**
 * Badge variants consumed by the shared `Badge` component so approval actions
 * stay color-consistent with allocation statuses.
 */
export const ALLOCATION_APPROVAL_ACTION_VARIANTS = {
  [ALLOCATION_APPROVAL_ACTION.SUBMITTED]: 'secondary',
  [ALLOCATION_APPROVAL_ACTION.APPROVED]: 'success',
  [ALLOCATION_APPROVAL_ACTION.REJECTED]: 'danger',
  [ALLOCATION_APPROVAL_ACTION.RETURNED]: 'warning',
};
