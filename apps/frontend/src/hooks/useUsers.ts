import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/userService';
import type { RoleValue } from '../constants/roles';

// Types for our user data
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: RoleValue;
  status: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface UserFormData {
  fullName: string;
  email: string;
  password?: string;
  role: string;
  status: string;
}

const QUERY_KEYS = {
  users: 'users',
  user: 'user',
};

function invalidateUserQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.user] });
}

// Hook to fetch a single user by ID
export const useUserById = (id: string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.user, id],
    queryFn: () => userApi.getUserById(id!),
    enabled: !!id,
    select: (response) => response.data?.data?.user as User | undefined,
  });
};

// Hook to create a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserFormData) => userApi.createUser(data),
    onSuccess: () => invalidateUserQueries(queryClient),
  });
};

// Hook to update an existing user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserFormData }) =>
      userApi.updateUser(id, data),
    onSuccess: () => invalidateUserQueries(queryClient),
  });
};
