import apiClient from '../api/apiClient';

export const budgetCategoryApi = {
  // Get all budget categories with filtering, pagination, and sorting
  getAllBudgetCategories: (params) => {
    return apiClient.get('/budget-categories', { params });
  },

  // Get budget category by ID
  getBudgetCategoryById: (id) => {
    return apiClient.get(`/budget-categories/${id}`);
  },

  // Create a new budget category
  createBudgetCategory: (data) => {
    return apiClient.post('/budget-categories', data);
  },

  // Update budget category by ID
  updateBudgetCategory: (id, data) => {
    return apiClient.put(`/budget-categories/${id}`, data);
  },

  // Delete budget category by ID
  deleteBudgetCategory: (id) => {
    return apiClient.delete(`/budget-categories/${id}`);
  }
};