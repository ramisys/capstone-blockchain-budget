import prisma from '../models/prismaClient.js';

class FundSourceRepository {
  /**
   * Find a fund source by its code.
   *
   * @param {string} code - Fund source code
   * @returns {Promise<object|null>} Fund source object or null
   */
  async findByCode(code) {
    return prisma.fundSource.findUnique({
      where: { code },
    });
  }

  /**
   * Find a fund source by its ID.
   *
   * @param {string} id - Fund source ID
   * @returns {Promise<object|null>} Fund source object or null
   */
  async findById(id) {
    return prisma.fundSource.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new fund source.
   *
   * @param {Object} data - Fund source data
   * @returns {Promise<Object>} Created fund source
   */
  async create(data) {
    return prisma.fundSource.create({
      data,
    });
  }

  /**
   * Update a fund source by ID.
   *
   * @param {string} id - Fund source ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated fund source
   */
  async update(id, data) {
    return prisma.fundSource.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a fund source by ID.
   *
   * @param {string} id - Fund source ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.fundSource.delete({
      where: { id },
    });
  }

  /**
   * Find many fund sources with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (code, name, description, status)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of fund sources
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

    return prisma.fundSource.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });
  }

  /**
   * Count fund sources matching filters.
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

    return prisma.fundSource.count({ where });
  }

  /**
   * Check if a fund source code already exists (excluding a given ID).
   *
   * @param {string} code - Fund source code
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

    const fundSource = await prisma.fundSource.findFirst({ where });
    return !!fundSource;
  }
}

export const fundSourceRepository = new FundSourceRepository();