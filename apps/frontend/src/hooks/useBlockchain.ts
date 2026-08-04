import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { blockchainApi } from '../services/blockchainService';
import { useToast } from '../components/ui/Toast';
import type {
  BlockchainStatus,
  BlockchainTransactionsResponse,
  BlockchainVerification,
} from '../types/blockchain';

const QUERY_KEYS = {
  status: 'blockchainStatus',
  transactions: 'blockchainTransactions',
  verification: 'blockchainVerification',
};

/**
 * Fetch the blockchain ledger status with record statistics.
 */
export const useBlockchainStatus = () => {
  return useQuery<AxiosResponse, Error, BlockchainStatus>({
    queryKey: [QUERY_KEYS.status],
    queryFn: () => blockchainApi.getStatus(),
    select: (response) => response.data?.data?.blockchainStatus,
    staleTime: 30 * 1000, // 30 s – deduplicate across co-mounted components
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch paginated blockchain transaction history with filtering and sorting.
 */
export const useBlockchainTransactions = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = {
    sortBy: 'newest',
    sortOrder: 'desc',
  }
) => {
  return useQuery<AxiosResponse, Error, BlockchainTransactionsResponse>({
    queryKey: [QUERY_KEYS.transactions, filters, pagination, ordering],
    queryFn: () =>
      blockchainApi.getTransactions({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder,
      }),
    select: (response) => response.data?.data,
  });
};

/**
 * Fetch the verification detail for a single allocation.
 */
export const useAllocationBlockchainVerification = (allocationId: string | undefined) => {
  return useQuery<AxiosResponse, Error, BlockchainVerification>({
    queryKey: [QUERY_KEYS.verification, allocationId],
    queryFn: () => blockchainApi.getAllocationVerification(allocationId!),
    enabled: !!allocationId,
    select: (response) => response.data?.data,
    staleTime: 30 * 1000,
  });
};

/**
 * Re-run the verification computation for an allocation.
 */
export const useVerifyAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => blockchainApi.verifyAllocation(id),
    onSuccess: (_response, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.verification, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.transactions] });
      showToast('Allocation verified against the ledger', 'success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to verify allocation';
      showToast(message, 'error');
    },
  });
};

/**
 * Re-anchor a Pending/Failed blockchain record on the ledger.
 */
export const useRetryBlockchainRecord = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => blockchainApi.retryRecord(id),
    onSuccess: (_response, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.status] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.transactions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.verification, id] });
      showToast('Blockchain record anchored successfully', 'success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to anchor blockchain record';
      showToast(message, 'error');
    },
  });
};
