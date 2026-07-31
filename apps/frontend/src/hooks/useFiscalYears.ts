import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fiscalYearApi } from '../services/fiscalYearService';

// Types for our fiscal year data
export interface FiscalYear {
  id: string;
  code: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: 'Active' | 'Inactive' | 'Archived';
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface FiscalYearFormData {
  code: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status?: 'Active' | 'Inactive' | 'Archived';
  isActive?: boolean;
}

export interface FiscalYearsResponse {
  fiscalYears: FiscalYear[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hook to fetch all fiscal years with filtering, pagination, and sorting
export const useFiscalYears = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
) => {
  return useQuery({
    queryKey: ['fiscalYears', filters, pagination, ordering],
    queryFn: () => fiscalYearApi.getAllFiscalYears({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder
      }),
    select: (response) => response.data?.data
  });
};

// Hook to fetch a single fiscal year by ID
export const useFiscalYearById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['fiscalYear', id],
    queryFn: () => fiscalYearApi.getFiscalYearById(id!),
    enabled: !!id,
    select: (response) => response.data?.data
  });
};

// Hook to create a new fiscal year
export const useCreateFiscalYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FiscalYearFormData) => fiscalYearApi.createFiscalYear(data),
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['fiscalYears'] });
    }
  });
};

// Hook to update a fiscal year
export const useUpdateFiscalYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FiscalYearFormData }) =>
      fiscalYearApi.updateFiscalYear(id, data),
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['fiscalYears'] });
    }
  });
};

// Hook to delete a fiscal year
export const useDeleteFiscalYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.deleteFiscalYear(id),
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['fiscalYears'] });
    }
  });
};

// Hook to set fiscal year as active
export const useSetActiveFiscalYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.setActiveFiscalYear(id),
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['fiscalYears'] });
    }
  });
};