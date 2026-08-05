/**
 * Type definitions for the Audit Trail module.
 *
 * Shapes mirror the backend `AuditLog` model and the serialized API responses
 * returned by the audit log controllers.
 */

import type { PaginationInfo } from './allocation';

export type AuditResult = 'Success' | 'Failure';
export type AuditAnchorStatus = 'Pending' | 'Confirmed' | 'Failed';

export interface AuditLog {
  id: string;
  action: string;
  result: AuditResult;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  ip: string | null;
  userAgent: string | null;
  resourceType: string | null;
  resourceId: string | null;
  resourceCode: string | null;
  details: Record<string, unknown> | null;
  eventHash: string;
  anchorStatus: AuditAnchorStatus;
  txHash: string | null;
  txExplorerUrl?: string | null;
  blockNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: PaginationInfo;
}

export interface AuditLogSummary {
  total: number;
  successCount: number;
  failureCount: number;
  pendingAnchors: number;
  byAction: Array<{ action: string; count: number }>;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  result?: AuditResult;
  resourceType?: string;
  resourceId?: string;
  actorId?: string;
  anchorStatus?: AuditAnchorStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
