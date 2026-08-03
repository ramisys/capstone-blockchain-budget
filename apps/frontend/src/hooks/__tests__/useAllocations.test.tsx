import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAllocations,
  useAllocationById,
  useAllocationStatistics,
  useRemainingBudget,
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
} from '../useAllocations';
import { allocationApi } from '../../services/allocationService';
import type { Allocation, AllocationsResponse } from '../../types/allocation';

// Mock allocationApi methods
vi.mock('../../services/allocationService', () => ({
  allocationApi: {
    getAllocations: vi.fn(),
    getAllocationById: vi.fn(),
    createAllocation: vi.fn(),
    updateAllocation: vi.fn(),
    deleteAllocation: vi.fn(),
    getAllocationStatistics: vi.fn(),
    getRemainingBudget: vi.fn(),
  },
}));

// Mock Toast hook
const mockShowToast = vi.fn();
vi.mock('../../components/ui/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

const mockAllocation: Allocation = {
  id: 'alloc-1',
  allocationCode: 'ALC-2026-0001',
  fiscalYearId: 'fy-2026',
  departmentId: 'dept-1',
  fundSourceId: 'fund-1',
  categoryId: 'cat-1',
  programId: 'prog-1',
  allocatedAmount: 150000,
  description: 'Initial department budget',
  status: 'Draft',
  createdBy: 'user-1',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-01-15T08:00:00.000Z',
  fiscalYear: { id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026' },
  department: { id: 'dept-1', code: 'ENG', name: 'Engineering' },
  fundSource: { id: 'fund-1', code: 'GEN', name: 'General Fund' },
  category: { id: 'cat-1', code: 'OPEX', name: 'Operating Expenses' },
  program: { id: 'prog-1', code: 'INFRA', name: 'Infrastructure' },
  creator: { id: 'user-1', fullName: 'John Doe', email: 'john@example.com', role: 'Administrator' },
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

describe('useAllocations hook suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAllocations', () => {
    it('fetches allocations list with default pagination and sorting', async () => {
      const mockResponse: AllocationsResponse = {
        allocations: [mockAllocation],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      vi.mocked(allocationApi.getAllocations).mockResolvedValueOnce({
        data: { data: mockResponse },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAllocations(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(allocationApi.getAllocations).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result.current.data?.allocations).toHaveLength(1);
      expect(result.current.data?.allocations[0].allocationCode).toBe('ALC-2026-0001');
    });

    it('passes custom filters, pagination, and sorting parameters', async () => {
      vi.mocked(allocationApi.getAllocations).mockResolvedValueOnce({
        data: { data: { allocations: [], pagination: { page: 2, limit: 25, total: 0, totalPages: 0 } } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () =>
          useAllocations(
            { departmentId: 'dept-1', status: 'Draft' },
            { page: 2, limit: 25 },
            { sortBy: 'allocatedAmount', sortOrder: 'asc' }
          ),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(allocationApi.getAllocations).toHaveBeenCalledWith({
        departmentId: 'dept-1',
        status: 'Draft',
        page: 2,
        limit: 25,
        sortBy: 'allocatedAmount',
        sortOrder: 'asc',
      });
    });

    it('handles query fetch errors properly', async () => {
      vi.mocked(allocationApi.getAllocations).mockRejectedValueOnce(new Error('Network error'));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAllocations(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('useAllocationById', () => {
    it('fetches a single allocation by ID when ID is provided', async () => {
      vi.mocked(allocationApi.getAllocationById).mockResolvedValueOnce({
        data: { data: { allocation: mockAllocation } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAllocationById('alloc-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(allocationApi.getAllocationById).toHaveBeenCalledWith('alloc-1');
      expect(result.current.data?.id).toBe('alloc-1');
      expect(result.current.data?.allocatedAmount).toBe(150000);
    });

    it('does not execute the query when ID is undefined', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAllocationById(undefined), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(allocationApi.getAllocationById).not.toHaveBeenCalled();
    });
  });

  describe('useAllocationStatistics', () => {
    it('fetches dashboard statistics optionally scoped to a fiscal year', async () => {
      const mockStats = {
        totalAllocations: 12,
        totalAllocatedAmount: 1500000,
        approvedAmount: 1200000,
        pendingCount: 2,
        approvedCount: 8,
        draftCount: 2,
        statusBreakdown: [],
        departmentBreakdown: [],
      };

      vi.mocked(allocationApi.getAllocationStatistics).mockResolvedValueOnce({
        data: { data: { statistics: mockStats } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAllocationStatistics('fy-2026'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(allocationApi.getAllocationStatistics).toHaveBeenCalledWith({ fiscalYearId: 'fy-2026' });
      expect(result.current.data?.totalAllocations).toBe(12);
    });
  });

  describe('useRemainingBudget', () => {
    it('fetches remaining budget breakdown', async () => {
      const mockBudget = {
        totalBudget: 2000000,
        totalAllocated: 1500000,
        remainingBudget: 500000,
        utilizationPercentage: 75,
      };

      vi.mocked(allocationApi.getRemainingBudget).mockResolvedValueOnce({
        data: { data: { budget: mockBudget } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useRemainingBudget({ fiscalYearId: 'fy-2026' }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(allocationApi.getRemainingBudget).toHaveBeenCalledWith({ fiscalYearId: 'fy-2026' });
      expect(result.current.data?.remainingBudget).toBe(500000);
    });
  });

  describe('useCreateAllocation', () => {
    it('creates an allocation and invalidates query cache on success', async () => {
      vi.mocked(allocationApi.createAllocation).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateAllocation(), { wrapper });

      const newAllocationData = {
        fiscalYearId: 'fy-2026',
        departmentId: 'dept-1',
        fundSourceId: 'fund-1',
        categoryId: 'cat-1',
        programId: 'prog-1',
        allocatedAmount: 75000,
        description: 'Testing create',
      };

      await result.current.mutateAsync(newAllocationData);

      expect(allocationApi.createAllocation).toHaveBeenCalledWith(newAllocationData);
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('shows toast notification on creation error', async () => {
      vi.mocked(allocationApi.createAllocation).mockRejectedValueOnce({
        response: { data: { message: 'Allocation exceeds budget ceiling' } },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateAllocation(), { wrapper });

      try {
        await result.current.mutateAsync({
          fiscalYearId: 'fy-2026',
          departmentId: 'dept-1',
          fundSourceId: 'fund-1',
          categoryId: 'cat-1',
          programId: 'prog-1',
          allocatedAmount: 99999999,
        });
      } catch {
        // Expected mutation failure
      }

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Allocation exceeds budget ceiling', 'error');
      });
    });
  });

  describe('useUpdateAllocation', () => {
    it('updates allocation and invalidates cache on success', async () => {
      vi.mocked(allocationApi.updateAllocation).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateAllocation(), { wrapper });

      await result.current.mutateAsync({
        id: 'alloc-1',
        data: { allocatedAmount: 180000, description: 'Updated description' },
      });

      expect(allocationApi.updateAllocation).toHaveBeenCalledWith('alloc-1', {
        allocatedAmount: 180000,
        description: 'Updated description',
      });
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('shows toast notification on update error', async () => {
      vi.mocked(allocationApi.updateAllocation).mockRejectedValueOnce({
        response: { data: { message: 'Cannot edit an approved allocation' } },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAllocation(), { wrapper });

      try {
        await result.current.mutateAsync({
          id: 'alloc-1',
          data: { allocatedAmount: 200000 },
        });
      } catch {
        // Expected
      }

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Cannot edit an approved allocation', 'error');
      });
    });
  });

  describe('useDeleteAllocation', () => {
    it('deletes (archives) allocation and invalidates cache', async () => {
      vi.mocked(allocationApi.deleteAllocation).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteAllocation(), { wrapper });

      await result.current.mutateAsync('alloc-1');

      expect(allocationApi.deleteAllocation).toHaveBeenCalledWith('alloc-1');
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('shows toast notification on delete error', async () => {
      vi.mocked(allocationApi.deleteAllocation).mockRejectedValueOnce({
        response: { data: { message: 'Allocation not found' } },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAllocation(), { wrapper });

      try {
        await result.current.mutateAsync('alloc-non-existent');
      } catch {
        // Expected
      }

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Allocation not found', 'error');
      });
    });
  });
});
