import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { USER_STATUS } from '../constants/status.js';

class BudgetCategoryService {
  /**
   * Create a new budget category
   * @param {Object} budgetCategoryData - Budget category data to create
   * @returns {Promise<Object>} Created budget category
   */
  async createBudgetCategory(budgetCategoryData) {
    // Check if budget category code already exists
    const codeExists = await budgetCategoryRepository.codeExists(budgetCategoryData.code);
    if (codeExists) {
      throw new AppError('Budget category code already exists', HTTP_STATUS.CONFLICT);
    }

    // Check if budget category name already exists
    const nameExists = await budgetCategoryRepository.nameExists(budgetCategoryData.name);
    if (nameExists) {
      throw new AppError('Budget category name already exists', HTTP_STATUS.CONFLICT);
    }

    // Set default status if not provided
    const dataToCreate = {
      ...budgetCategoryData,
      status: budgetCategoryData.status || USER_STATUS.ACTIVE,
    };

    // Create the budget category
    const budgetCategory = await budgetCategoryRepository.create(dataToCreate);
    return budgetCategory;
  }

  /**
   * Get budget category by ID
   * @param {string} id - Budget category ID
   * @returns {Promise<Object>} Budget category
   */
  async getBudgetCategoryById(id) {
    const budgetCategory = await budgetCategoryRepository.findById(id);
    if (!budgetCategory) {
      throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
    }
    return budgetCategory;
  }

  /**
   * Get budget category by code
   * @param {string} code - Budget category code
   * @returns {Promise<Object>} Budget category
   */
  async getBudgetCategoryByCode(code) {
    const budgetCategory = await budgetCategoryRepository.findByCode(code);
    if (!budgetCategory) {
      throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
    }
    return budgetCategory;
  }

  /**
   * Get budget category by name
   * @param {string} name - Budget category name
   * @returns {Promise<Object>} Budget category
   */
  async getBudgetCategoryByName(name) {
    const budgetCategory = await budgetCategoryRepository.findByName(name);
    if (!budgetCategory) {
      throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
    }
    return budgetCategory;
  }

  /**
   * Get all budget categories with filtering, pagination, and sorting
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} ordering - Ordering options
   * @returns {Promise<Object>} Budget categories list and pagination info
   */
  async getAllBudgetCategories(filters = {}, pagination = {}, ordering = {}) {
    // Get budget categories and total count
    const [budgetCategories, totalCount] = await Promise.all([
      budgetCategoryRepository.findMany(filters, pagination, ordering),
      budgetCategoryRepository.count(filters),
    ]);

    // Calculate pagination info
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      budgetCategories,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update budget category by ID
   * @param {string} id - Budget category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated budget category
   */
  async updateBudgetCategory(id, updateData) {
    // Check if budget category exists
    const existing = await budgetCategoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
    }

    // If code is being updated, check if it already exists
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await budgetCategoryRepository.codeExists(updateData.code, id);
      if (codeExists) {
        throw new AppError('Budget category code already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // If name is being updated, check if it already exists
    if (updateData.name && updateData.name !== existing.name) {
      const nameExists = await budgetCategoryRepository.nameExists(updateData.name, id);
      if (nameExists) {
        throw new AppError('Budget category name already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Update the budget category
    const updated = await budgetCategoryRepository.update(id, updateData);
    return updated;
  }

  /**
   * Delete budget category by ID
   * @param {string} id - Budget category ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteBudgetCategory(id) {
    // Check if budget category exists
    const existing = await budgetCategoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
    }

    // TODO: Add check for dependencies (e.g., if budget category is used in budgets, transactions, etc.)
    // For now, we'll allow deletion if no explicit dependencies are checked
    // In a real system, you would check if the budget category is referenced by other entities

    await budgetCategoryRepository.delete(id);
    return { message: 'Budget category deleted successfully' };
  }
}

export const budgetCategoryService = new BudgetCategoryService();