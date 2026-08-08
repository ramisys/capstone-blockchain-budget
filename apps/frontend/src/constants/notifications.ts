/**
 * Dashboard notification definitions.
 *
 * Mirrors the backend `NOTIFICATION_KEYS` in
 * `apps/backend/constants/notificationKeys.js`. The API sends a stable key
 * describing *what* the notification is about; the route it links to is decided
 * here, so route knowledge stays in the client.
 */

import { ALLOCATION_STATUS } from './allocationStatus';

export const NOTIFICATION_KEY = {
  INACTIVE_USERS: 'INACTIVE_USERS',
  PENDING_APPROVALS: 'PENDING_APPROVALS',
  LEDGER_ANCHORS_FAILED: 'LEDGER_ANCHORS_FAILED',
} as const;

export type NotificationKey = (typeof NOTIFICATION_KEY)[keyof typeof NOTIFICATION_KEY];

/**
 * Where each notification takes the user, and which roles may follow it.
 * An empty `roles` array means every authenticated role can.
 */
export const NOTIFICATION_TARGETS: Record<
  string,
  { to: string; actionLabel: string; roles: string[] }
> = {
  [NOTIFICATION_KEY.INACTIVE_USERS]: {
    to: '/users',
    actionLabel: 'Review user accounts',
    // /users is Administrator-only in AppRoutes; other roles get a 403.
    roles: ['Administrator'],
  },
  [NOTIFICATION_KEY.PENDING_APPROVALS]: {
    to: `/budget-allocation/allocations?status=${ALLOCATION_STATUS.PENDING_APPROVAL}`,
    actionLabel: 'Review pending allocations',
    roles: [],
  },
  [NOTIFICATION_KEY.LEDGER_ANCHORS_FAILED]: {
    to: '/budget-allocation/blockchain',
    actionLabel: 'Open the blockchain ledger',
    roles: [],
  },
};
