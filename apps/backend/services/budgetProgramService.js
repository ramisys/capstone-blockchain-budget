import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { USER_STATUS } from '../constants/status.js';
import prisma from '../models/prismaClient.js';

class BudgetProgramService {
  /**
   * Create a new budget program
   * @param {Object} budgetProgramData - Budget program data to create
   * @returns {Promise<Object>} Created budget program
   */
  async createBudgetProgram(budgetProgramData) {
    // Check if budget program code already exists
    const codeExists = await budgetProgramRepository.codeExists(budgetProgramData.code);
    if (codeExists) {
      throw new AppError('Budget program code already exists', HTTP_STATUS.CONFLICT);
    }

    // Validate that the department exists
    const departmentExists = await prisma.department.findUnique({
      where: { id: budgetProgramData.departmentId },
    });
    if (!departmentExists) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // Validate that the budget category exists
    const budgetCategoryExists = await prisma.budgetCategory.findUnique({
      where: { id: budgetProgramData.budgetCategoryId },
    });
    if (!budgetCategoryExists) {
      throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
    }

    // Set default status if not provided
    const dataToCreate = {
      ...budgetProgramData,
      status: budgetProgramData.status || USER_STATUS.ACTIVE,
    };

    // Create the budget program
    const budgetProgram = await budgetProgramRepository.create(dataToCreate);
    return budgetProgram;
  }

  /**
   * Get budget program by ID
   * @param {string} id - Budget program ID
   * @returns {Promise<Object>} Budget program
   */
  async getBudgetProgramById(id) {
    const budgetProgram = await budgetProgramRepository.findById(id);
    if (!budgetProgram) {
      throw new AppError('Budget program not found', HTTP_STATUS.NOT_FOUND);
    }
    return budgetProgram;
  }

  /**
   * Get budget program by code
   * @param {string} code - Budget program code
   * @returns {Promise<Object>} Budget program
   */
  async getBudgetProgramByCode(code) {
    const budgetProgram = await budgetProgramRepository.findByCode(code);
    if (!budgetProgram) {
      throw new AppError('Budget program not found', HTTP_STATUS.NOT_FOUND);
    }
    return budgetProgram;
  }

  /**
   * Get all budget programs with filtering, pagination, and sorting
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} ordering - Ordering options
   * @returns {Promise<Object>} Budget programs list and pagination info
   */
  async getAllBudgetPrograms(filters = {}, pagination = {}, ordering = {}) {
    // Get budget programs and total count
    const [budgetPrograms, totalCount] = await Promise.all([
      budgetProgramRepository.findMany(filters, pagination, ordering),
      budgetProgramRepository.count(filters),
    ]);

    // Calculate pagination info
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      budgetPrograms,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update budget program by ID
   * @param {string} id - Budget program ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated budget program
   */
  async updateBudgetProgram(id, updateData) {
    // Check if budget program exists
    const existing = await budgetProgramRepository.findById(id);
    if (!existing) {
      throw new AppError('Budget program not found', HTTP_STATUS.NOT_FOUND);
    }

    // If code is being updated, check if it already exists
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await budgetProgramRepository.codeExists(updateData.code, id);
      if (codeExists) {
        throw new AppError('Budget program code already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // If departmentId is being updated, check if it exists
    if (updateData.departmentId && updateData.departmentId !== existing.departmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: updateData.departmentId },
      });
      if (!departmentExists) {
        throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
      }
    }

    // If budgetCategoryId is being updated, check if it exists
    if (updateData.budgetCategoryId && updateData.budgetCategoryId !== existing.budgetCategoryId) {
      const budgetCategoryExists = await prisma.budgetCategory.findUnique({
        where: { id: updateData.budgetCategoryId },
      });
      if (!budgetCategoryExists) {
        throw new AppError('Budget category not found', HTTP_STATUS.NOT_FOUND);
      }
    }

    // Update the budget program
    const updated = await budgetProgramRepository.update(id, updateData);
    return updated;
  }

  /**
   * Delete budget program by ID
   * @param {string} id - Budget program ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteBudgetProgram(id) {
    // Check if budget program exists
    const existing = await budgetProgramRepository.findById(id);
    if (!existing) {
      throw new AppError('Budget program not found', HTTP_STATUS.NOT_FOUND);
    }

    // TODO: Add check for dependencies (e.g., if budget program is used in budgets, transactions, etc.)
    // For now, we'll allow deletion if no explicit dependencies are checked
    // In a real system, you would check if the budget program is referenced by other entities

    await budgetProgramRepository.delete(id);
    return { message: 'Budget program deleted successfully' };
  }
}

export const budgetProgramService = new BudgetProgramService();