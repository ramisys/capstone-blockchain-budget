import apiClient from '../api/apiClient';

export const userApi = {
  // Get all users with filtering, pagination, and sorting
  getAllUsers: (params) => {
    return apiClient.get('/users', { params });
  },

  // Get user by ID
  getUserById: (id) => {
    return apiClient.get(`/users/${id}`);
  },

  // Create a new user
  createUser: (data) => {
    return apiClient.post('/users', data);
  },

  // Update user by ID
  updateUser: (id, data) => {
    return apiClient.put(`/users/${id}`, data);
  },

  // Delete user by ID
  deleteUser: (id) => {
    return apiClient.delete(`/users/${id}`);
  }
};
