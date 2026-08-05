/**
 * Type definitions for the Financial Activity Timeline.
 *
 * Shapes mirror the backend `timelineService` normalization: a read-time union
 * over allocation approvals, document activities, audit log entries, and
 * blockchain anchor records, each discriminated by `kind`.
 */

import type { PaginationInfo } from './allocation';

export type TimelineKind =
  | 'AllocationApproval'
  | 'DocumentActivity'
  | 'AuditLog'
  | 'BlockchainRecord';

export interface TimelineActor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  action: string;
  label: string;
  description: string | null;
  actor: TimelineActor | null;
  resourceType: string | null;
  resourceCode: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface TimelineResponse {
  timeline: TimelineEntry[];
  pagination: PaginationInfo;
}

export interface TimelineParams {
  page?: number;
  limit?: number;
  kind?: TimelineKind;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
