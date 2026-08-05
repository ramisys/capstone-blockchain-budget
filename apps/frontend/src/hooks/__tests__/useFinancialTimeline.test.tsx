import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFinancialTimeline } from '../useFinancialTimeline';
import { dashboardApi } from '../../services/dashboardService';
import type { TimelineResponse } from '../../types/timeline';

vi.mock('../../services/dashboardService', () => ({
  dashboardApi: {
    getTimeline: vi.fn(),
  },
}));

const mockTimeline: TimelineResponse = {
  timeline: [
    {
      id: 'entry-1',
      kind: 'AuditLog',
      action: 'ALLOCATION_APPROVE',
      label: 'ALLOCATION_APPROVE',
      description: 'Allocation ALC-2026-0001',
      actor: { id: 'user-1', name: 'Admin User', email: 'admin@university.edu', role: 'Administrator' },
      resourceType: 'Allocation',
      resourceCode: 'ALC-2026-0001',
      details: { result: 'Success' },
      createdAt: '2026-08-06T08:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
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

describe('useFinancialTimeline hook suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the timeline with filters and pagination', async () => {
    vi.mocked(dashboardApi.getTimeline).mockResolvedValueOnce({
      data: { data: mockTimeline },
    } as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useFinancialTimeline({ kind: 'AuditLog', page: 2, limit: 10 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardApi.getTimeline).toHaveBeenCalledWith({
      kind: 'AuditLog',
      page: 2,
      limit: 10,
    });
    expect(result.current.data?.timeline).toHaveLength(1);
    expect(result.current.data?.timeline[0].kind).toBe('AuditLog');
  });

  it('does not fetch when disabled', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFinancialTimeline({}, false), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(dashboardApi.getTimeline).not.toHaveBeenCalled();
  });

  it('propagates fetch errors', async () => {
    vi.mocked(dashboardApi.getTimeline).mockRejectedValueOnce(new Error('Database unavailable'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFinancialTimeline(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Database unavailable');
  });
});
