import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationApi } from '../services/allocationService';
import type {
  Allocation,
  AllocationFormData,
  AllocationListParams,
  AllocationStatistics,
  AllocationUpdateData,
  AllocationsResponse,
  BudgetSummary,
} from '../types/allocation';

const QUERY_KEYS = {
  allocations: 'allocations',
  allocation: 'allocation',
  statistics: 'allocationStatistics',
  remainingBudget: 'remainingBudget',
};

function invalidateAllocationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.allocations] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.allocation] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.statistics] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.remainingBudget] });
}

/**
 * Fetch allocations with filtering, pagination, and sorting.
 */
export const useAllocations = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
) => {
  return useQuery<AllocationsResponse>({
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
  return useQuery<Allocation>({
    queryKey: [QUERY_KEYS.allocation, id],
    queryFn: () => allocationApi.getAllocationById(id!),
    enabled: !!id,
    select: (response) => response.data?.data?.allocation,
  });
};

/**
 * Fetch dashboard statistics, optionally scoped to a fiscal year.
 */
export const useAllocationStatistics = (fiscalYearId?: string) => {
  return useQuery<AllocationStatistics>({
    queryKey: [QUERY_KEYS.statistics, fiscalYearId ?? null],
    queryFn: () =>
      allocationApi.getAllocationStatistics(
        fiscalYearId ? { fiscalYearId } : {}
      ),
    select: (response) => response.data?.data?.statistics,
  });
};

/**
 * Fetch total budget, allocated, and remaining budget summary.
 */
export const useRemainingBudget = (params: AllocationListParams = {}) => {
  return useQuery<BudgetSummary>({
    queryKey: [QUERY_KEYS.remainingBudget, params],
    queryFn: () => allocationApi.getRemainingBudget(params),
    select: (response) => response.data?.data?.budget,
  });
};

/**
 * Create a new budget allocation.
 */
export const useCreateAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AllocationFormData) => allocationApi.createAllocation(data),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
    },
  });
};

/**
 * Update an existing (Draft) budget allocation.
 */
export const useUpdateAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AllocationUpdateData }) =>
      allocationApi.updateAllocation(id, data),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
    },
  });
};

/**
 * Soft-delete (archive) a budget allocation.
 */
export const useDeleteAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => allocationApi.deleteAllocation(id),
    onSuccess: () => {
      invalidateAllocationQueries(queryClient);
    },
  });
};
