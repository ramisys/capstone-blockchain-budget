import { useQuery } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import { useAuth } from './useAuth';
import { ROLES } from '../constants/roles';

export interface UploaderOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface UploadersResponse {
  users: UploaderOption[];
}

const UPLOADERS_LIMIT = 100;

/**
 * Loads the users that can appear as document uploaders for the uploader
 * filter. The user list endpoint is Administrator-only, so non-admins get an
 * empty list (the filter control is hidden) and no request is made.
 */
export function useDocumentUploaders(): {
  uploaders: UploaderOption[];
  isLoading: boolean;
  isError: boolean;
} {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  const query = useQuery<AxiosResponse, Error, UploaderOption[]>({
    queryKey: ['documentUploaders'],
    queryFn: () => apiClient.get('/users', { params: { page: 1, limit: UPLOADERS_LIMIT } }),
    enabled: isAdmin,
    select: (response) => response.data?.data?.users ?? [],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    uploaders: isAdmin ? (query.data ?? []) : [],
    isLoading: isAdmin && query.isLoading,
    isError: isAdmin && query.isError,
  };
}
