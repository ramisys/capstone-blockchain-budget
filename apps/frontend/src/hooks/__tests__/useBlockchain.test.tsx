import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useBlockchainStatus,
  useBlockchainTransactions,
  useAllocationBlockchainVerification,
  useVerifyAllocation,
  useRetryBlockchainRecord,
} from '../useBlockchain';
import { blockchainApi } from '../../services/blockchainService';
import type { BlockchainStatus, BlockchainTransactionsResponse } from '../../types/blockchain';

vi.mock('../../services/blockchainService', () => ({
  blockchainApi: {
    getStatus: vi.fn(),
    getTransactions: vi.fn(),
    getAllocationVerification: vi.fn(),
    verifyAllocation: vi.fn(),
    retryRecord: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock('../../components/ui/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

const mockStatus: BlockchainStatus = {
  connected: true,
  network: 'hardhat',
  chainId: 31337,
  latestBlock: 42,
  lastSync: '2026-08-04T08:00:00.000Z',
  contractAddress: '0x1234567890abcdef',
  onChainCount: 3,
  message: 'Blockchain ledger is connected.',
  recordCount: 3,
  confirmedCount: 2,
  pendingCount: 1,
  failedCount: 0,
};

const mockTransactions: BlockchainTransactionsResponse = {
  transactions: [
    {
      id: 'rec-1',
      allocationId: 'alloc-1',
      allocationCode: 'ALC-2026-0001',
      contentHash: '0xab',
      txHash: '0xdeadbeef',
      blockNumber: 42,
      network: 'hardhat',
      status: 'Confirmed',
      confirmedAt: '2026-08-04T08:00:00.000Z',
      createdBy: 'user-1',
      createdAt: '2026-08-04T08:00:00.000Z',
      updatedAt: '2026-08-04T08:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
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

describe('useBlockchain hook suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useBlockchainStatus', () => {
    it('fetches the blockchain ledger status', async () => {
      vi.mocked(blockchainApi.getStatus).mockResolvedValueOnce({
        data: { data: { blockchainStatus: mockStatus } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlockchainStatus(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(blockchainApi.getStatus).toHaveBeenCalled();
      expect(result.current.data?.connected).toBe(true);
      expect(result.current.data?.confirmedCount).toBe(2);
    });

    it('propagates status fetch errors', async () => {
      vi.mocked(blockchainApi.getStatus).mockRejectedValueOnce(new Error('Node unreachable'));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlockchainStatus(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Node unreachable');
    });
  });

  describe('useBlockchainTransactions', () => {
    it('fetches transactions with filters, pagination, and ordering', async () => {
      vi.mocked(blockchainApi.getTransactions).mockResolvedValueOnce({
        data: { data: mockTransactions },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () =>
          useBlockchainTransactions(
            { search: 'ALC-2026', status: 'Confirmed' },
            { page: 2, limit: 25 },
            { sortBy: 'newest', sortOrder: 'desc' }
          ),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(blockchainApi.getTransactions).toHaveBeenCalledWith({
        search: 'ALC-2026',
        status: 'Confirmed',
        page: 2,
        limit: 25,
        sortBy: 'newest',
        sortOrder: 'desc',
      });
      expect(result.current.data?.transactions).toHaveLength(1);
      expect(result.current.data?.transactions[0].allocationCode).toBe('ALC-2026-0001');
    });
  });

  describe('useAllocationBlockchainVerification', () => {
    it('fetches verification detail for an allocation', async () => {
      vi.mocked(blockchainApi.getAllocationVerification).mockResolvedValueOnce({
        data: {
          data: {
            verified: true,
            integrityOk: true,
            onChain: null,
            record: mockTransactions.transactions[0],
            message: 'Allocation verified on the blockchain ledger.',
          },
        },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAllocationBlockchainVerification('alloc-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(blockchainApi.getAllocationVerification).toHaveBeenCalledWith('alloc-1');
      expect(result.current.data?.verified).toBe(true);
    });

    it('does not fetch when allocationId is undefined', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAllocationBlockchainVerification(undefined), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(blockchainApi.getAllocationVerification).not.toHaveBeenCalled();
    });
  });

  describe('useVerifyAllocation', () => {
    it('verifies an allocation, invalidates caches, and shows a success toast', async () => {
      vi.mocked(blockchainApi.verifyAllocation).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useVerifyAllocation(), { wrapper });

      await result.current.mutateAsync('alloc-1');

      expect(blockchainApi.verifyAllocation).toHaveBeenCalledWith('alloc-1');
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Allocation verified against the ledger', 'success');
    });

    it('shows a toast with the backend message on error', async () => {
      vi.mocked(blockchainApi.verifyAllocation).mockRejectedValueOnce({
        response: { data: { message: 'Allocation not found' } },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useVerifyAllocation(), { wrapper });

      try {
        await result.current.mutateAsync('alloc-nope');
      } catch {
        // Expected mutation failure
      }

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Allocation not found', 'error');
      });
    });
  });

  describe('useRetryBlockchainRecord', () => {
    it('re-anchors a record, invalidates caches, and shows a success toast', async () => {
      vi.mocked(blockchainApi.retryRecord).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRetryBlockchainRecord(), { wrapper });

      await result.current.mutateAsync('alloc-1');

      expect(blockchainApi.retryRecord).toHaveBeenCalledWith('alloc-1');
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Blockchain record anchored successfully', 'success');
    });
  });
});
