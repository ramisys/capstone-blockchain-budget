import apiClient from './axios';

export const authApi = {
  login(email, password) {
    return apiClient.post('/auth/login', { email, password });
  },

  refresh(refreshToken) {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  logout(refreshToken) {
    return apiClient.post('/auth/logout', { refreshToken });
  },

  me(options) {
    return apiClient.get('/auth/me', options);
  },
};
