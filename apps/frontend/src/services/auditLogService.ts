import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import type {
  AuditLog,
  AuditLogListParams,
  AuditLogsResponse,
  AuditLogSummary,
} from '../types/audit';

interface ApiEnvelope<T> {
  data: T;
}

export const auditLogApi = {
  // Get paginated audit log entries with filtering and sorting
  getAuditLogs(
    params: AuditLogListParams
  ): Promise<AxiosResponse<ApiEnvelope<AuditLogsResponse>>> {
    return apiClient.get('/audit-logs', { params });
  },

  // Get a single audit log entry by ID
  getAuditLog(id: string): Promise<AxiosResponse<ApiEnvelope<{ log: AuditLog }>>> {
    return apiClient.get(`/audit-logs/${id}`);
  },

  // Get audit summary counts for the audit dashboard
  getAuditLogSummary(): Promise<AxiosResponse<ApiEnvelope<{ summary: AuditLogSummary }>>> {
    return apiClient.get('/audit-logs/summary');
  },
};
