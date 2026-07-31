import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetProgramApi } from '../services/budgetProgramService';

// Types for our budget program data
export interface BudgetProgram {
  id: string;
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  budgetCategoryId: string;
  status: 'Active' | 'Inactive';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Relationship data (populated when expanded)
  department?: {
    id: string;
    code: string;
    name: string;
  };
  budgetCategory?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface BudgetProgramFormData {
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  budgetCategoryId: string;
  status?: 'Active' | 'Inactive';
}

export interface BudgetProgramsResponse {
  programs: BudgetProgram[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hook to fetch all budget programs with filtering, pagination, and sorting
export const useBudgetPrograms = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
) => {
  return useQuery({
    queryKey: ['budgetPrograms', filters, pagination, ordering],
    queryFn: () => budgetProgramApi.getAllBudgetPrograms({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder
      }),
    select: (response) => response.data?.data
  });
};

// Hook to fetch a single budget program by ID
export const useBudgetProgramById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['budgetProgram', id],
    queryFn: () => budgetProgramApi.getBudgetProgramById(id!),
    enabled: !!id,
    select: (response) => response.data?.data
  });
};

// Hook to create a new budget program
export const useCreateBudgetProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetProgramFormData) => budgetProgramApi.createBudgetProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetPrograms'] });
    }
  });
};

// Hook to update a budget program
export const useUpdateBudgetProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetProgramFormData }) =>
      budgetProgramApi.updateBudgetProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetPrograms'] });
    }
  });
};

// Hook to delete a budget program
export const useDeleteBudgetProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => budgetProgramApi.deleteBudgetProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetPrograms'] });
    }
  });
};