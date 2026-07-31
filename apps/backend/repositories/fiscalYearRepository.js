import prisma from '../models/prismaClient.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';

class FiscalYearRepository {
  /**
   * Find a fiscal year by its code.
   *
   * @param {string} code - Fiscal year code
   * @returns {Promise<object|null>} Fiscal year object or null
   */
  async findByCode(code) {
    return prisma.fiscalYear.findUnique({
      where: { code },
    });
  }

  /**
   * Find a fiscal year by its ID.
   *
   * @param {string} id - Fiscal year ID
   * @returns {Promise<object|null>} Fiscal year object or null
   */
  async findById(id) {
    return prisma.fiscalYear.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new fiscal year.
   *
   * @param {Object} data - Fiscal year data
   * @returns {Promise<Object>} Created fiscal year
   */
  async create(data) {
    return prisma.fiscalYear.create({
      data,
    });
  }

  /**
   * Update a fiscal year by ID.
   *
   * @param {string} id - Fiscal year ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated fiscal year
   */
  async update(id, data) {
    return prisma.fiscalYear.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a fiscal year by ID.
   *
   * @param {string} id - Fiscal year ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.fiscalYear.delete({
      where: { id },
    });
  }

  /**
   * Find many fiscal years with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (code, description, status, isActive, startDate, endDate)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of fiscal years
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = {};

    if (filters.code) {
      where.code = { contains: filters.code };
    }
    if (filters.description) {
      where.description = { contains: filters.description };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.startDate) {
      // Assuming filters.startDate is a Date object or string that can be compared
      where.startDate = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.endDate = { lte: new Date(filters.endDate) };
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
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

    return prisma.fiscalYear.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });
  }

  /**
   * Count fiscal years matching filters.
   *
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    const where = {};

    if (filters.code) {
      where.code = { contains: filters.code };
    }
    if (filters.description) {
      where.description = { contains: filters.description };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.startDate) {
      where.startDate = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.endDate = { lte: new Date(filters.endDate) };
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    return prisma.fiscalYear.count({ where });
  }

  /**
   * Set a fiscal year as active, deactivating all others.
   *
   * Runs inside a transaction so the "deactivate all + activate one" steps
   * are atomic and concurrent activations cannot leave the system with
   * multiple (or zero) active fiscal years. Only years that are currently
   * active are reverted to Inactive, so Archived years keep their status.
   *
   * @param {string} id - Fiscal year ID to set as active
   * @returns {Promise<Object>} Updated fiscal year
   */
  async setActive(id) {
    return prisma.$transaction(async (tx) => {
      // Deactivate whichever fiscal year is currently active
      await tx.fiscalYear.updateMany({
        where: { isActive: true },
        data: { isActive: false, status: FISCAL_YEAR_STATUS.INACTIVE },
      });

      // Activate the specified fiscal year
      return tx.fiscalYear.update({
        where: { id },
        data: { isActive: true, status: FISCAL_YEAR_STATUS.ACTIVE },
      });
    });
  }

  /**
   * Check if a fiscal year code already exists (excluding a given ID).
   *
   * @param {string} code - Fiscal year code
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

    const fiscalYear = await prisma.fiscalYear.findFirst({ where });
    return !!fiscalYear;
  }

  /**
   * Check if the given date range overlaps with any existing fiscal year.
   *
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} excludeId - ID to exclude from the check (for updates)
   * @returns {Promise<boolean>} True if overlap exists
   */
  async isOverlapping(startDate, endDate, excludeId = null) {
    const where = {
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const fiscalYear = await prisma.fiscalYear.findFirst({ where });
    return !!fiscalYear;
  }
}

export const fiscalYearRepository = new FiscalYearRepository();