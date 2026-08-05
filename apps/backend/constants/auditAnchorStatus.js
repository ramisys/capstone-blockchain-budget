/**
 * Audit anchor status values used for the blockchain anchoring of audit log
 * entries. These mirror the `AuditAnchorStatus` Prisma enum.
 */
export const AUDIT_ANCHOR_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed',
};

export const AUDIT_ANCHOR_STATUS_LIST = Object.values(AUDIT_ANCHOR_STATUS);
