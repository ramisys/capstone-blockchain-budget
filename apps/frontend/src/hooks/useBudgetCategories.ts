import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetCategoryApi } from '../services/budgetCategoryService';

// Types for our budget category data
export interface BudgetCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface BudgetCategoryFormData {
  code: string;
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
}

export interface BudgetCategoriesResponse {
  categories: BudgetCategory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hook to fetch all budget categories with filtering, pagination, and sorting
export const useBudgetCategories = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
) => {
  return useQuery({
    queryKey: ['budgetCategories', filters, pagination, ordering],
    queryFn: () => budgetCategoryApi.getAllBudgetCategories({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder
      }),
    select: (response) => response.data?.data
  });
};

// Hook to fetch a single budget category by ID
export const useBudgetCategoryById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['budgetCategory', id],
    queryFn: () => budgetCategoryApi.getBudgetCategoryById(id!),
    enabled: !!id,
    select: (response) => response.data?.data
  });
};

// Hook to create a new budget category
export const useCreateBudgetCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetCategoryFormData) => budgetCategoryApi.createBudgetCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetCategories'] });
    }
  });
};

// Hook to update a budget category
export const useUpdateBudgetCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetCategoryFormData }) =>
      budgetCategoryApi.updateBudgetCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetCategories'] });
    }
  });
};

// Hook to delete a budget category
export const useDeleteBudgetCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => budgetCategoryApi.deleteBudgetCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetCategories'] });
    }
  });
};