import prisma from '../models/prismaClient.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class BudgetProgramRepository {
  /**
   * Find a budget program by its code.
   *
   * @param {string} code - Budget program code
   * @returns {Promise<Object|null>} Budget program object or null
   */
  async findByCode(code) {
    return prisma.budgetProgram.findUnique({
      where: { code },
    });
  }

  /**
   * Find a budget program by its ID.
   *
   * @param {string} id - Budget program ID
   * @returns {Promise<Object|null>} Budget program object or null
   */
  async findById(id) {
    return prisma.budgetProgram.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new budget program.
   *
   * @param {Object} data - Budget program data
   * @returns {Promise<Object>} Created budget program
   */
  async create(data) {
    return prisma.budgetProgram.create({
      data,
    });
  }

  /**
   * Update a budget program by ID.
   *
   * @param {string} id - Budget program ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated budget program
   */
  async update(id, data) {
    return prisma.budgetProgram.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a budget program by ID.
   *
   * @param {string} id - Budget program ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.budgetProgram.delete({
      where: { id },
    });
  }

  /**
   * Find many budget programs with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (code, name, description, departmentId, budgetCategoryId, status)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of budget programs
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = {};

    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.description) {
      where.description = { contains: filters.description, mode: 'insensitive' };
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.budgetCategoryId) {
      where.budgetCategoryId = filters.budgetCategoryId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const orderBy = {};
    if (ordering.sortBy) {
      orderBy[ordering.sortBy] = ordering.sortOrder || 'asc';
    } else {
      // Default ordering by createdAt descending
      orderBy.createdAt = 'desc';
    }

    return prisma.budgetProgram.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        department: true,
        budgetCategory: true,
      },
    });
  }

  /**
   * Count budget programs matching filters.
   *
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    const where = {};

    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.description) {
      where.description = { contains: filters.description, mode: 'insensitive' };
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.budgetCategoryId) {
      where.budgetCategoryId = filters.budgetCategoryId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    return prisma.budgetProgram.count({ where });
  }

  /**
   * Check if a budget program code already exists (excluding a given ID).
   *
   * @param {string} code - Budget program code
   * @param {string} excludeId - ID to exclude from the check
   * @returns {Promise<boolean>} True if code exists
   */
  async codeExists(code, excludeId = null) {
    const where = {
      code,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const budgetProgram = await prisma.budgetProgram.findFirst({ where });
    return !!budgetProgram;
  }
}

export const budgetProgramRepository = new BudgetProgramRepository();