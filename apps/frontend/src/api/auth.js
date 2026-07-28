import apiClient from './axios';

export const authApi = {
  login(email, password) {
    return apiClient.post('/auth/login', { email, password });
  },

  logout() {
    return apiClient.post('/auth/logout');
  },

  me() {
    return apiClient.get('/auth/me');
  },
};
