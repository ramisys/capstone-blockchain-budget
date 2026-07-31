import prisma from '../models/prismaClient.js';

class BudgetCategoryRepository {
  /**
   * Find a budget category by its code.
   *
   * @param {string} code - Budget category code
   * @returns {Promise<object|null>} Budget category object or null
   */
  async findByCode(code) {
    return prisma.budgetCategory.findUnique({
      where: { code },
    });
  }

  /**
   * Find a budget category by its name.
   *
   * @param {string} name - Budget category name
   * @returns {Promise<object|null>} Budget category object or null
   */
  async findByName(name) {
    return prisma.budgetCategory.findUnique({
      where: { name },
    });
  }

  /**
   * Find a budget category by its ID.
   *
   * @param {string} id - Budget category ID
   * @returns {Promise<object|null>} Budget category object or null
   */
  async findById(id) {
    return prisma.budgetCategory.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new budget category.
   *
   * @param {Object} data - Budget category data
   * @returns {Promise<Object>} Created budget category
   */
  async create(data) {
    return prisma.budgetCategory.create({
      data,
    });
  }

  /**
   * Update a budget category by ID.
   *
   * @param {string} id - Budget category ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated budget category
   */
  async update(id, data) {
    return prisma.budgetCategory.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a budget category by ID.
   *
   * @param {string} id - Budget category ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.budgetCategory.delete({
      where: { id },
    });
  }

  /**
   * Find many budget categories with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (code, name, description, status)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of budget categories
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = {};

    if (filters.code) {
      where.code = { contains: filters.code };
    }
    if (filters.name) {
      where.name = { contains: filters.name };
    }
    if (filters.description) {
      where.description = { contains: filters.description };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
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

    return prisma.budgetCategory.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });
  }

  /**
   * Count budget categories matching filters.
   *
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    const where = {};

    if (filters.code) {
      where.code = { contains: filters.code };
    }
    if (filters.name) {
      where.name = { contains: filters.name };
    }
    if (filters.description) {
      where.description = { contains: filters.description };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return prisma.budgetCategory.count({ where });
  }

  /**
   * Check if a budget category code already exists (excluding a given ID).
   *
   * @param {string} code - Budget category code
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

    const budgetCategory = await prisma.budgetCategory.findFirst({ where });
    return !!budgetCategory;
  }

  /**
   * Check if a budget category name already exists (excluding a given ID).
   *
   * @param {string} name - Budget category name
   * @param {string} excludeId - ID to exclude from the check
   * @returns {Promise<boolean>} True if name exists
   */
  async nameExists(name, excludeId = null) {
    const where = {
      name,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const budgetCategory = await prisma.budgetCategory.findFirst({ where });
    return !!budgetCategory;
  }
}

export const budgetCategoryRepository = new BudgetCategoryRepository();