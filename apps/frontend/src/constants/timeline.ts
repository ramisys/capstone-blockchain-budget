/**
 * Financial activity timeline kind definitions.
 *
 * Mirrors the backend `TIMELINE_KINDS` in
 * `apps/backend/constants/timelineKinds.js`. Each entry in the dashboard feed
 * carries one of these kinds so the UI can render a distinct badge + icon.
 */

import type { TimelineKind } from '../types/timeline';

export const TIMELINE_KIND = {
  ALLOCATION_APPROVAL: 'AllocationApproval',
  DOCUMENT_ACTIVITY: 'DocumentActivity',
  AUDIT_LOG: 'AuditLog',
  BLOCKCHAIN_RECORD: 'BlockchainRecord',
} as const;

export const TIMELINE_KIND_LIST: TimelineKind[] = [
  TIMELINE_KIND.ALLOCATION_APPROVAL,
  TIMELINE_KIND.DOCUMENT_ACTIVITY,
  TIMELINE_KIND.AUDIT_LOG,
  TIMELINE_KIND.BLOCKCHAIN_RECORD,
];

export const TIMELINE_KIND_LABELS: Record<TimelineKind, string> = {
  [TIMELINE_KIND.ALLOCATION_APPROVAL]: 'Allocation',
  [TIMELINE_KIND.DOCUMENT_ACTIVITY]: 'Document',
  [TIMELINE_KIND.AUDIT_LOG]: 'Audit',
  [TIMELINE_KIND.BLOCKCHAIN_RECORD]: 'Blockchain',
};

/**
 * Badge variants consumed by the shared `Badge` component so each timeline
 * kind stays visually distinct in the feed.
 */
export const TIMELINE_KIND_VARIANTS: Record<TimelineKind, string> = {
  [TIMELINE_KIND.ALLOCATION_APPROVAL]: 'primary',
  [TIMELINE_KIND.DOCUMENT_ACTIVITY]: 'success',
  [TIMELINE_KIND.AUDIT_LOG]: 'warning',
  [TIMELINE_KIND.BLOCKCHAIN_RECORD]: 'secondary',
};
