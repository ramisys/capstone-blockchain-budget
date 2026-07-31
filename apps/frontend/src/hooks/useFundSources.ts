import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundSourceApi } from '../services/fundSourceService';

// Types for our fund source data
export interface FundSource {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface FundSourceFormData {
  code: string;
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
}

export interface FundSourcesResponse {
  fundSources: FundSource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hook to fetch all fund sources with filtering, pagination, and sorting
export const useFundSources = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
) => {
  return useQuery({
    queryKey: ['fundSources', filters, pagination, ordering],
    queryFn: () => fundSourceApi.getAllFundSources({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder
      }),
    select: (response) => response.data?.data
  });
};

// Hook to fetch a single fund source by ID
export const useFundSourceById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['fundSource', id],
    queryFn: () => fundSourceApi.getFundSourceById(id!),
    enabled: !!id,
    select: (response) => response.data?.data
  });
};

// Hook to create a new fund source
export const useCreateFundSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FundSourceFormData) => fundSourceApi.createFundSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundSources'] });
    }
  });
};

// Hook to update a fund source
export const useUpdateFundSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FundSourceFormData }) =>
      fundSourceApi.updateFundSource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundSources'] });
    }
  });
};

// Hook to delete a fund source
export const useDeleteFundSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fundSourceApi.deleteFundSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundSources'] });
    }
  });
};