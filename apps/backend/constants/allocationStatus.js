/**
 * Allocation status values used throughout the Budget Allocation module.
 * Statuses follow the business workflow:
 *   Draft -> PendingApproval -> Approved/Rejected
 *   Approved -> Archived
 */
export const ALLOCATION_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'PendingApproval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
};

export const ALLOCATION_STATUS_LIST = Object.values(ALLOCATION_STATUS);

/**
 * Statuses considered "live" (not yet decided / still in effect).
 * Rejected, Archived, and soft-deleted allocations are excluded from
 * remaining-budget and allocated-amount computations.
 */
export const ACTIVE_ALLOCATION_STATUSES = [
  ALLOCATION_STATUS.DRAFT,
  ALLOCATION_STATUS.PENDING_APPROVAL,
  ALLOCATION_STATUS.APPROVED,
];

/**
 * Statuses excluded from remaining-budget computations.
 */
export const EXCLUDED_ALLOCATION_STATUSES = [
  ALLOCATION_STATUS.REJECTED,
  ALLOCATION_STATUS.ARCHIVED,
];

/**
 * Prefix used when auto-generating allocation codes, e.g. BA-2026-001.
 */
export const ALLOCATION_CODE_PREFIX = 'BA';

/**
 * Valid status transitions. Phase 4.3 (approval workflow) builds on this map.
 */
export const ALLOWED_STATUS_TRANSITIONS = {
  [ALLOCATION_STATUS.DRAFT]: [
    ALLOCATION_STATUS.PENDING_APPROVAL,
    ALLOCATION_STATUS.REJECTED,
  ],
  [ALLOCATION_STATUS.PENDING_APPROVAL]: [
    ALLOCATION_STATUS.APPROVED,
    ALLOCATION_STATUS.REJECTED,
    ALLOCATION_STATUS.DRAFT,
  ],
  [ALLOCATION_STATUS.APPROVED]: [ALLOCATION_STATUS.ARCHIVED],
  [ALLOCATION_STATUS.REJECTED]: [ALLOCATION_STATUS.DRAFT],
  [ALLOCATION_STATUS.ARCHIVED]: [],
};
