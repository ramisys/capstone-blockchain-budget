import apiClient from '../api/apiClient';

export const budgetProgramApi = {
  // Get all budget programs with filtering, pagination, and sorting
  getAllBudgetPrograms: (params) => {
    return apiClient.get('/budget-programs', { params });
  },

  // Get budget program by ID
  getBudgetProgramById: (id) => {
    return apiClient.get(`/budget-programs/${id}`);
  },

  // Create a new budget program
  createBudgetProgram: (data) => {
    return apiClient.post('/budget-programs', data);
  },

  // Update budget program by ID
  updateBudgetProgram: (id, data) => {
    return apiClient.put(`/budget-programs/${id}`, data);
  },

  // Delete budget program by ID
  deleteBudgetProgram: (id) => {
    return apiClient.delete(`/budget-programs/${id}`);
  }
};