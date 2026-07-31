import prisma from '../models/prismaClient.js';

class DepartmentRepository {
  /**
   * Find a department by its code.
   *
   * @param {string} code - Department code
   * @returns {Promise<object|null>} Department object or null
   */
  async findByCode(code) {
    return prisma.department.findUnique({
      where: { code },
    });
  }

  /**
   * Find a department by its name.
   *
   * @param {string} name - Department name
   * @returns {Promise<object|null>} Department object or null
   */
  async findByName(name) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  /**
   * Find a department by its ID.
   *
   * @param {string} id - Department ID
   * @returns {Promise<object|null>} Department object or null
   */
  async findById(id) {
    return prisma.department.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new department.
   *
   * @param {Object} data - Department data
   * @returns {Promise<Object>} Created department
   */
  async create(data) {
    return prisma.department.create({
      data,
    });
  }

  /**
   * Update a department by ID.
   *
   * @param {string} id - Department ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated department
   */
  async update(id, data) {
    return prisma.department.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a department by ID.
   *
   * @param {string} id - Department ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.department.delete({
      where: { id },
    });
  }

  /**
   * Find many departments with filtering, pagination, and sorting.
   *
   * @param {Object} filters - Filter criteria (code, name, officeHead, contactNumber, email, officeAddress, status)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Array>} List of departments
   */
  async findMany(filters = {}, pagination = {}, ordering = {}) {
    const where = {};

    if (filters.code) {
      where.code = { contains: filters.code };
    }
    if (filters.name) {
      where.name = { contains: filters.name };
    }
    if (filters.officeHead) {
      where.officeHead = { contains: filters.officeHead };
    }
    if (filters.contactNumber) {
      where.contactNumber = { contains: filters.contactNumber };
    }
    if (filters.email) {
      where.email = { contains: filters.email };
    }
    if (filters.officeAddress) {
      where.officeAddress = { contains: filters.officeAddress };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search } },
        { officeHead: { contains: filters.search } },
        { email: { contains: filters.search } },
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

    return prisma.department.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });
  }

  /**
   * Count departments matching filters.
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
    if (filters.officeHead) {
      where.officeHead = { contains: filters.officeHead };
    }
    if (filters.contactNumber) {
      where.contactNumber = { contains: filters.contactNumber };
    }
    if (filters.email) {
      where.email = { contains: filters.email };
    }
    if (filters.officeAddress) {
      where.officeAddress = { contains: filters.officeAddress };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search } },
        { officeHead: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    return prisma.department.count({ where });
  }

  /**
   * Check if a department code already exists (excluding a given ID).
   *
   * @param {string} code - Department code
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

    const department = await prisma.department.findFirst({ where });
    return !!department;
  }

  /**
   * Check if a department name already exists (excluding a given ID).
   *
   * @param {string} name - Department name
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

    const department = await prisma.department.findFirst({ where });
    return !!department;
  }
}

export const departmentRepository = new DepartmentRepository();