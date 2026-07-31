import { departmentRepository } from '../repositories/departmentRepository.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { USER_STATUS } from '../constants/status.js';

class DepartmentService {
  /**
   * Create a new department
   * @param {Object} departmentData - Department data to create
   * @returns {Promise<Object>} Created department
   */
  async createDepartment(departmentData) {
    // Check if department code already exists
    const codeExists = await departmentRepository.codeExists(departmentData.code);
    if (codeExists) {
      throw new AppError('Department code already exists', HTTP_STATUS.CONFLICT);
    }

    // Check if department name already exists
    const nameExists = await departmentRepository.nameExists(departmentData.name);
    if (nameExists) {
      throw new AppError('Department name already exists', HTTP_STATUS.CONFLICT);
    }

    // Set default status if not provided
    const dataToCreate = {
      ...departmentData,
      status: departmentData.status || USER_STATUS.ACTIVE,
    };

    // Create the department
    const department = await departmentRepository.create(dataToCreate);
    return department;
  }

  /**
   * Get department by ID
   * @param {string} id - Department ID
   * @returns {Promise<Object>} Department
   */
  async getDepartmentById(id) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }
    return department;
  }

  /**
   * Get department by code
   * @param {string} code - Department code
   * @returns {Promise<Object>} Department
   */
  async getDepartmentByCode(code) {
    const department = await departmentRepository.findByCode(code);
    if (!department) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }
    return department;
  }

  /**
   * Get department by name
   * @param {string} name - Department name
   * @returns {Promise<Object>} Department
   */
  async getDepartmentByName(name) {
    const department = await departmentRepository.findByName(name);
    if (!department) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }
    return department;
  }

  /**
   * Get all departments with filtering, pagination, and sorting
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} ordering - Ordering options
   * @returns {Promise<Object>} Departments list and pagination info
   */
  async getAllDepartments(filters = {}, pagination = {}, ordering = {}) {
    // Get departments and total count
    const [departments, totalCount] = await Promise.all([
      departmentRepository.findMany(filters, pagination, ordering),
      departmentRepository.count(filters),
    ]);

    // Calculate pagination info
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      departments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update department by ID
   * @param {string} id - Department ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated department
   */
  async updateDepartment(id, updateData) {
    // Check if department exists
    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // If code is being updated, check if it already exists
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await departmentRepository.codeExists(updateData.code, id);
      if (codeExists) {
        throw new AppError('Department code already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // If name is being updated, check if it already exists
    if (updateData.name && updateData.name !== existing.name) {
      const nameExists = await departmentRepository.nameExists(updateData.name, id);
      if (nameExists) {
        throw new AppError('Department name already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Update the department
    const updated = await departmentRepository.update(id, updateData);
    return updated;
  }

  /**
   * Delete department by ID
   * @param {string} id - Department ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteDepartment(id) {
    // Check if department exists
    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // TODO: Add check for dependencies (e.g., if department is used in budgets, transactions, etc.)
    // For now, we'll allow deletion if no explicit dependencies are checked
    // In a real system, you would check if the department is referenced by other entities

    await departmentRepository.delete(id);
    return { message: 'Department deleted successfully' };
  }
}

export const departmentService = new DepartmentService();