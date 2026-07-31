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

    // Set default status if not provided and normalize dates
    const dataToCreate = {
      ...fiscalYearData,
      startDate,
      endDate,
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

    // Normalize dates
    const dataToUpdate = {
      ...updateData,
      ...(updateData.startDate && { startDate }),
      ...(updateData.endDate && { endDate }),
    };

    // Resolve the effective status / activation state, keeping the two in sync
    const status = updateData.status || existingFiscalYear.status;
    const isActive = updateData.isActive !== undefined ? updateData.isActive : existingFiscalYear.isActive;

    const wantsActive = isActive === true || status === FISCAL_YEAR_STATUS.ACTIVE;
    const wantsArchived = status === FISCAL_YEAR_STATUS.ARCHIVED;

    if (existingFiscalYear.status === FISCAL_YEAR_STATUS.ARCHIVED && wantsActive) {
      throw new AppError('Archived fiscal years cannot be activated', HTTP_STATUS.CONFLICT);
    }

    if (wantsArchived && existingFiscalYear.isActive) {
      throw new AppError('Cannot archive the currently active fiscal year', HTTP_STATUS.CONFLICT);
    }

    if (wantsActive) {
      // Activation must go through the shared path so all other fiscal years
      // are deactivated atomically
      const activated = await fiscalYearRepository.setActive(id);
      if (Object.keys(dataToUpdate).length === 0) {
        return activated;
      }
      return fiscalYearRepository.update(id, {
        ...dataToUpdate,
        status: FISCAL_YEAR_STATUS.ACTIVE,
        isActive: true,
      });
    }

    return fiscalYearRepository.update(id, {
      ...dataToUpdate,
      status: wantsArchived ? FISCAL_YEAR_STATUS.ARCHIVED : FISCAL_YEAR_STATUS.INACTIVE,
      isActive: false,
    });
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

    // Archived fiscal years are retired and must not be reactivated
    if (existingFiscalYear.status === FISCAL_YEAR_STATUS.ARCHIVED) {
      throw new AppError(
        'Archived fiscal years cannot be activated',
        HTTP_STATUS.CONFLICT
      );
    }

    // Idempotent: activating the currently active year is a no-op
    if (existingFiscalYear.isActive) {
      return existingFiscalYear;
    }

    // Set the fiscal year as active
    const updatedFiscalYear = await fiscalYearRepository.setActive(id);
    return updatedFiscalYear;
  }
}

export const fiscalYearService = new FiscalYearService();