import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';

class FiscalYearService {
  /**
   * Create a new fiscal year
   * @param {Object} fiscalYearData - Fiscal year data to create
   * @returns {Promise<Object>} Created fiscal year
   */
  async createFiscalYear(fiscalYearData) {
    // Check if fiscal year code already exists
    const codeExists = await fiscalYearRepository.codeExists(fiscalYearData.code);
    if (codeExists) {
      throw new AppError('Fiscal year code already exists', HTTP_STATUS.CONFLICT);
    }

    // Validate date range
    const startDate = new Date(fiscalYearData.startDate);
    const endDate = new Date(fiscalYearData.endDate);
    if (startDate >= endDate) {
      throw new AppError('Start date must be before end date', HTTP_STATUS.BAD_REQUEST);
    }

    // Check for overlapping date ranges
    const isOverlapping = await fiscalYearRepository.isOverlapping(startDate, endDate);
    if (isOverlapping) {
      throw new AppError('Fiscal year date range overlaps with an existing fiscal year', HTTP_STATUS.CONFLICT);
    }

    // Set default status if not provided
    const dataToCreate = {
      ...fiscalYearData,
      status: fiscalYearData.status || FISCAL_YEAR_STATUS.INACTIVE,
      isActive: fiscalYearData.isActive || false,
    };

    // Create the fiscal year
    const fiscalYear = await fiscalYearRepository.create(dataToCreate);
    return fiscalYear;
  }

  /**
   * Get fiscal year by ID
   * @param {string} id - Fiscal year ID
   * @returns {Promise<Object>} Fiscal year
   */
  async getFiscalYearById(id) {
    const fiscalYear = await fiscalYearRepository.findById(id);
    if (!fiscalYear) {
      throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
    }
    return fiscalYear;
  }

  /**
   * Get fiscal years with filtering, pagination, and sorting
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} ordering - Ordering options
   * @returns {Promise<Object>} Fiscal years list and pagination info
   */
  async getAllFiscalYears(filters = {}, pagination = {}, ordering = {}) {
    // Get fiscal years and total count
    const [fiscalYears, totalCount] = await Promise.all([
      fiscalYearRepository.findMany(filters, pagination, ordering),
      fiscalYearRepository.count(filters),
    ]);

    // Calculate pagination info
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      fiscalYears,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update fiscal year by ID
   * @param {string} id - Fiscal year ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated fiscal year
   */
  async updateFiscalYear(id, updateData) {
    // Check if fiscal year exists
    const existingFiscalYear = await fiscalYearRepository.findById(id);
    if (!existingFiscalYear) {
      throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
    }

    // If code is being updated, check if it already exists
    if (updateData.code && updateData.code !== existingFiscalYear.code) {
      const codeExists = await fiscalYearRepository.codeExists(updateData.code, id);
      if (codeExists) {
        throw new AppError('Fiscal year code already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Validate date range if dates are being updated
    const startDate = updateData.startDate ? new Date(updateData.startDate) : new Date(existingFiscalYear.startDate);
    const endDate = updateData.endDate ? new Date(updateData.endDate) : new Date(existingFiscalYear.endDate);
    if (startDate >= endDate) {
      throw new AppError('Start date must be before end date', HTTP_STATUS.BAD_REQUEST);
    }

    // Check for overlapping date ranges if dates are being updated
    if (updateData.startDate || updateData.endDate) {
      const isOverlapping = await fiscalYearRepository.isOverlapping(startDate, endDate, id);
      if (isOverlapping) {
        throw new AppError('Fiscal year date range overlaps with an existing fiscal year', HTTP_STATUS.CONFLICT);
      }
    }

    // Set default values for status and isActive if not provided
    const dataToUpdate = {
      ...updateData,
      status: updateData.status || existingFiscalYear.status,
      isActive: updateData.isActive !== undefined ? updateData.isActive : existingFiscalYear.isActive,
    };

    // Update the fiscal year
    const updatedFiscalYear = await fiscalYearRepository.update(id, dataToUpdate);
    return updatedFiscalYear;
  }

  /**
   * Delete fiscal year by ID
   * @param {string} id - Fiscal year ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteFiscalYear(id) {
    // Check if fiscal year exists
    const existingFiscalYear = await fiscalYearRepository.findById(id);
    if (!existingFiscalYear) {
      throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
    }

    // TODO: Add check for dependencies (e.g., if fiscal year is used in budgets, transactions, etc.)
    // For now, we'll allow deletion if no explicit dependencies are checked
    // In a real system, you would check if the fiscal year is referenced by other entities

    // Delete the fiscal year
    await fiscalYearRepository.delete(id);
    return { message: 'Fiscal year deleted successfully' };
  }

  /**
   * Set fiscal year as active (deactivates all others)
   * @param {string} id - Fiscal year ID to set as active
   * @returns {Promise<Object>} Updated fiscal year
   */
  async setActiveFiscalYear(id) {
    // Check if fiscal year exists
    const existingFiscalYear = await fiscalYearRepository.findById(id);
    if (!existingFiscalYear) {
      throw new AppError('Fiscal year not found', HTTP_STATUS.NOT_FOUND);
    }

    // Set the fiscal year as active
    const updatedFiscalYear = await fiscalYearRepository.setActive(id);
    return updatedFiscalYear;
  }
}

export const fiscalYearService = new FiscalYearService();