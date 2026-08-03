import type { AxiosResponse } from 'axios';
import apiClient from './axios';

export interface LoginResponse {
  data: {
    user: AuthUser;
    token: string;
    refreshToken?: string;
  };
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeResponse {
  data: {
    user: AuthUser;
  };
}

export const authApi = {
  login(email: string, password: string): Promise<AxiosResponse<LoginResponse>> {
    return apiClient.post('/auth/login', { email, password });
  },

  refresh(refreshToken: string): Promise<AxiosResponse> {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  logout(refreshToken: string | null): Promise<AxiosResponse> {
    return apiClient.post('/auth/logout', { refreshToken });
  },

  me(options?: { signal?: AbortSignal }): Promise<AxiosResponse<MeResponse>> {
    return apiClient.get('/auth/me', options);
  },
};
