import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { auditLogApi } from '../services/auditLogService';
import { useToast } from '../components/ui/Toast';
import type { AuditLog, AuditLogsResponse, AuditLogSummary } from '../types/audit';

const QUERY_KEYS = {
  logs: 'auditLogs',
  log: 'auditLog',
  summary: 'auditLogSummary',
};

/**
 * Fetch paginated audit log entries with filtering, sorting, and pagination.
 */
export const useAuditLogs = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = {
    sortBy: 'newest',
    sortOrder: 'desc',
  }
) => {
  return useQuery<AxiosResponse, Error, AuditLogsResponse>({
    queryKey: [QUERY_KEYS.logs, filters, pagination, ordering],
    queryFn: () =>
      auditLogApi.getAuditLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder,
      }),
    select: (response) => response.data?.data,
    staleTime: 15 * 1000,
  });
};

/**
 * Fetch a single audit log entry by ID.
 */
export const useAuditLog = (logId: string | undefined) => {
  return useQuery<AxiosResponse, Error, AuditLog>({
    queryKey: [QUERY_KEYS.log, logId],
    queryFn: () => auditLogApi.getAuditLog(logId!),
    enabled: !!logId,
    select: (response) => response.data?.data?.log,
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch audit summary counts for the audit dashboard.
 */
export const useAuditLogSummary = () => {
  return useQuery<AxiosResponse, Error, AuditLogSummary>({
    queryKey: [QUERY_KEYS.summary],
    queryFn: () => auditLogApi.getAuditLogSummary(),
    select: (response) => response.data?.data?.summary,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Retry anchoring a Pending/Failed audit event on the blockchain ledger.
 * Invalidates the list, the detail entry, and the summary on success.
 */
export const useRetryAuditLog = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => auditLogApi.retryAuditLog(id),
    onSuccess: (_response, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.logs] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.log, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.summary] });
      showToast('Audit event anchored successfully', 'success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to anchor audit event';
      showToast(message, 'error');
    },
  });
};
