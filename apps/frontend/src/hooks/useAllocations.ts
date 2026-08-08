import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { allocationApi } from '../services/allocationService';
import { useToast } from '../components/ui/Toast';
import type {
  Allocation,
  AllocationFormData,
  AllocationListParams,
  AllocationStatistics,
  AllocationUpdateData,
  AllocationsResponse,
  ApprovalRecord,
  BudgetSummary,
} from '../types/allocation';

const QUERY_KEYS = {
  allocations: 'allocations',
  allocation: 'allocation',
  statistics: 'allocationStatistics',
  remainingBudget: 'remainingBudget',
  approvalHistory: 'allocationApprovalHistory',
};

function invalidateAllocationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.allocations] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.allocation] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.statistics] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.remainingBudget] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.approvalHistory] });
}

/**
 * Fetch allocations with filtering, pagination, and sorting.
 */
export const useAllocations = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
) => {
  return useQuery<AxiosResponse, Error, AllocationsResponse>({
    queryKey: [QUERY_KEYS.allocations, filters, pagination, ordering],
    queryFn: () =>
      allocationApi.getAllocations({
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
 * Fetch a single allocation by ID.
 */
export const useAllocationById = (id: string | undefined) => {
  return useQuery<AxiosResponse, Error, Allocation>({
    queryKey: [QUERY_KEYS.allocation, id],
    queryFn: () => allocationApi.getAllocationById(id!),
    enabled: !!id,
    select: (response) => response.data?.data?.allocation,
  });
};

/**
 * Fetch dashboard statistics, optionally scoped to a fiscal year.
 *
 * `enabled` lets callers defer the request until the scope is known, so a
 * caller that resolves its fiscal year asynchronously does not first fetch the
 * unscoped statistics and then immediately replace them.
 */
export const useAllocationStatistics = (
  fiscalYearId?: string,
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse, Error, AllocationStatistics>({
    queryKey: [QUERY_KEYS.statistics, fiscalYearId ?? null],
    queryFn: () =>
      allocationApi.getAllocationStatistics(
        fiscalYearId ? { fiscalYearId } : {}
      ),
    enabled,
    select: (response) => response.data?.data?.statistics,
    staleTime: 30 * 1000,     // 30 s – deduplicate across co-mounted components
    gcTime: 5 * 60 * 1000,    // 5 min – keep inactive cache for quick re-mount
  });
};

/**
 * Fetch total budget, allocated, and remaining budget summary.
 *
 * `enabled` lets callers defer the request until the scope is known, so a
 * caller that resolves its fiscal year asynchronously does not first fetch the
 * unscoped summary and then immediately replace it.
 */
export const useRemainingBudget = (
  params: AllocationListParams = {},
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse, Error, BudgetSummary>({
    queryKey: [QUERY_KEYS.remainingBudget, params],
    queryFn: () => allocationApi.getRemainingBudget(params),
    enabled,
    select: (response) => response.data?.data?.budget,
  });
};

/**
 * Fetch the recorded approval history for an allocation, newest first.
 */
export const useAllocationApprovalHistory = (id: string | undefined) => {
  return useQuery<AxiosResponse, Error, ApprovalRecord[]>({
    queryKey: [QUERY_KEYS.approvalHistory, id],
    queryFn: () => allocationApi.getApprovalHistory(id!),
    enabled: !!id,
    select: (response) => response.data?.data?.approvals,
  });
};

/**
 * Create a new budget allocation.
 */
export const useCreateAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: AllocationFormData) => allocationApi.createAllocation(data),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create allocation';
      showToast(message, 'error');
    },
  });
};

/**
 * Update an existing (Draft) budget allocation.
 */
export const useUpdateAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AllocationUpdateData }) =>
      allocationApi.updateAllocation(id, data),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update allocation';
      showToast(message, 'error');
    },
  });
};

/**
 * Soft-delete (archive) a budget allocation.
 */
export const useDeleteAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => allocationApi.deleteAllocation(id),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete allocation';
      showToast(message, 'error');
    },
  });
};

/**
 * Submit a Draft allocation for approval (Draft -> PendingApproval).
 */
export const useSubmitAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => allocationApi.submitForApproval(id),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
      showToast('Allocation submitted for approval', 'success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit allocation for approval';
      showToast(message, 'error');
    },
  });
};

/**
 * Approve a PendingApproval allocation.
 */
export const useApproveAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => allocationApi.approveAllocation(id),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
      showToast('Allocation approved successfully', 'success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to approve allocation';
      showToast(message, 'error');
    },
  });
};

/**
 * Reject a PendingApproval allocation with a reason.
 */
export const useRejectAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      allocationApi.rejectAllocation(id, reason),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
      showToast('Allocation rejected', 'success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to reject allocation';
      showToast(message, 'error');
    },
  });
};

/**
 * Return an allocation to Draft for revision (PendingApproval or Rejected).
 */
export const useReturnAllocation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      allocationApi.returnAllocation(id, comment),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
      showToast('Allocation returned to draft', 'success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to return allocation to draft';
      showToast(message, 'error');
    },
  });
};
