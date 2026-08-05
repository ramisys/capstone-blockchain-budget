import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuditLogs, useAuditLog, useAuditLogSummary } from '../useAuditLogs';
import { auditLogApi } from '../../services/auditLogService';
import type { AuditLog, AuditLogsResponse, AuditLogSummary } from '../../types/audit';

vi.mock('../../services/auditLogService', () => ({
  auditLogApi: {
    getAuditLogs: vi.fn(),
    getAuditLog: vi.fn(),
    getAuditLogSummary: vi.fn(),
  },
}));

const mockLog: AuditLog = {
  id: 'log-1',
  action: 'AUTH_LOGIN',
  result: 'Success',
  actorId: 'user-1',
  actorEmail: 'admin@university.edu',
  actorRole: 'Administrator',
  ip: '127.0.0.1',
  userAgent: null,
  resourceType: 'User',
  resourceId: 'user-1',
  resourceCode: null,
  details: { foo: 'bar' },
  eventHash: 'a'.repeat(64),
  anchorStatus: 'Confirmed',
  txHash: '0xdeadbeef',
  blockNumber: 42,
  createdAt: '2026-08-06T08:00:00.000Z',
  updatedAt: '2026-08-06T08:00:00.000Z',
};

const mockLogs: AuditLogsResponse = {
  logs: [mockLog],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

const mockSummary: AuditLogSummary = {
  total: 10,
  successCount: 8,
  failureCount: 2,
  pendingAnchors: 3,
  byAction: [{ action: 'AUTH_LOGIN', count: 5 }],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useAuditLogs hook suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuditLogs', () => {
    it('fetches audit logs with filters, pagination, and ordering', async () => {
      vi.mocked(auditLogApi.getAuditLogs).mockResolvedValueOnce({
        data: { data: mockLogs },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () =>
          useAuditLogs(
            { search: 'login', result: 'Success' },
            { page: 2, limit: 25 },
            { sortBy: 'newest', sortOrder: 'desc' }
          ),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(auditLogApi.getAuditLogs).toHaveBeenCalledWith({
        search: 'login',
        result: 'Success',
        page: 2,
        limit: 25,
        sortBy: 'newest',
        sortOrder: 'desc',
      });
      expect(result.current.data?.logs).toHaveLength(1);
      expect(result.current.data?.logs[0].action).toBe('AUTH_LOGIN');
    });

    it('propagates fetch errors', async () => {
      vi.mocked(auditLogApi.getAuditLogs).mockRejectedValueOnce(new Error('Database unavailable'));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAuditLogs(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Database unavailable');
    });
  });

  describe('useAuditLog', () => {
    it('fetches a single audit log entry by id', async () => {
      vi.mocked(auditLogApi.getAuditLog).mockResolvedValueOnce({
        data: { data: { log: mockLog } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAuditLog('log-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(auditLogApi.getAuditLog).toHaveBeenCalledWith('log-1');
      expect(result.current.data?.id).toBe('log-1');
      expect(result.current.data?.blockNumber).toBe(42);
    });

    it('does not fetch when logId is undefined', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAuditLog(undefined), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(auditLogApi.getAuditLog).not.toHaveBeenCalled();
    });
  });

  describe('useAuditLogSummary', () => {
    it('fetches the audit summary counts', async () => {
      vi.mocked(auditLogApi.getAuditLogSummary).mockResolvedValueOnce({
        data: { data: { summary: mockSummary } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAuditLogSummary(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(auditLogApi.getAuditLogSummary).toHaveBeenCalled();
      expect(result.current.data?.total).toBe(10);
      expect(result.current.data?.successCount).toBe(8);
      expect(result.current.data?.failureCount).toBe(2);
      expect(result.current.data?.pendingAnchors).toBe(3);
    });
  });
});
