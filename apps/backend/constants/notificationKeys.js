/**
 * Dashboard notification keys.
 *
 * Notifications are derived from live system state rather than stored, so each
 * one carries a stable key instead of an id. The key identifies *what* the
 * notification is about; the client decides how to present it and where it
 * links, which keeps route knowledge out of the API.
 */
export const NOTIFICATION_KEYS = {
  INACTIVE_USERS: 'INACTIVE_USERS',
  PENDING_APPROVALS: 'PENDING_APPROVALS',
  LEDGER_ANCHORS_FAILED: 'LEDGER_ANCHORS_FAILED',
};

export const NOTIFICATION_KEYS_LIST = Object.values(NOTIFICATION_KEYS);

/**
 * Notification severities, ordered most to least urgent. `getNotifications`
 * sorts by this rank so the most urgent item is always first.
 */
export const NOTIFICATION_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
};

export const NOTIFICATION_TYPE_RANK = {
  [NOTIFICATION_TYPES.ERROR]: 0,
  [NOTIFICATION_TYPES.WARNING]: 1,
  [NOTIFICATION_TYPES.INFO]: 2,
  [NOTIFICATION_TYPES.SUCCESS]: 3,
};
