import apiClient from '../api/apiClient';

export const allocationApi = {
  // Get all allocations with filtering, pagination, and sorting
  getAllocations: (params) => {
    return apiClient.get('/allocations', { params });
  },

  // Get allocation by ID
  getAllocationById: (id) => {
    return apiClient.get(`/allocations/${id}`);
  },

  // Create a new budget allocation
  createAllocation: (data) => {
    return apiClient.post('/allocations', data);
  },

  // Update allocation by ID (only Draft allocations are editable)
  updateAllocation: (id, data) => {
    return apiClient.put(`/allocations/${id}`, data);
  },

  // Soft-delete (archive) an allocation
  deleteAllocation: (id) => {
    return apiClient.delete(`/allocations/${id}`);
  },

  // Get allocation dashboard statistics
  getAllocationStatistics: (params) => {
    return apiClient.get('/allocations/statistics', { params });
  },

  // Get total budget, allocated, and remaining budget summary
  getRemainingBudget: (params) => {
    return apiClient.get('/allocations/remaining-budget', { params });
  }
};
