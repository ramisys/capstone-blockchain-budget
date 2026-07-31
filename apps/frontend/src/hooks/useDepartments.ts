import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '../services/departmentService';

// Types for our department data
export interface Department {
  id: string;
  code: string;
  name: string;
  officeHead?: string;
  contactNumber?: string;
  email?: string;
  officeAddress?: string;
  status: 'Active' | 'Inactive';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface DepartmentFormData {
  code: string;
  name: string;
  officeHead?: string;
  contactNumber?: string;
  email?: string;
  officeAddress?: string;
  status?: 'Active' | 'Inactive';
}

export interface DepartmentsResponse {
  departments: Department[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hook to fetch all departments with filtering, pagination, and sorting
export const useDepartments = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
) => {
  return useQuery({
    queryKey: ['departments', filters, pagination, ordering],
    queryFn: () => departmentApi.getAllDepartments({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder
      }),
    select: (response) => response.data?.data
  });
};

// Hook to fetch a single department by ID
export const useDepartmentById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentApi.getDepartmentById(id!),
    enabled: !!id,
    select: (response) => response.data?.data
  });
};

// Hook to fetch a department by code
export const useDepartmentByCode = (code: string | undefined) => {
  return useQuery({
    queryKey: ['department', 'code', code],
    queryFn: () => departmentApi.getDepartmentByCode(code!),
    enabled: !!code
  });
};

// Hook to fetch a department by name
export const useDepartmentByName = (name: string | undefined) => {
  return useQuery({
    queryKey: ['department', 'name', name],
    queryFn: () => departmentApi.getDepartmentByName(name!),
    enabled: !!name
  });
};

// Hook to create a new department
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepartmentFormData) => departmentApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    }
  });
};

// Hook to update a department
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentFormData }) =>
      departmentApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    }
  });
};

// Hook to delete a department
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    }
  });
};