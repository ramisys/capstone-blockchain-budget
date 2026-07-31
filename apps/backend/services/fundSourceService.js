import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { USER_STATUS } from '../constants/status.js';

class FundSourceService {
  /**
   * Create a new fund source
   * @param {Object} fundSourceData - Fund source data to create
   * @returns {Promise<Object>} Created fund source
   */
  async createFundSource(fundSourceData) {
    // Check if fund source code already exists
    const codeExists = await fundSourceRepository.codeExists(fundSourceData.code);
    if (codeExists) {
      throw new AppError('Fund source code already exists', HTTP_STATUS.CONFLICT);
    }

    // Set default status if not provided
    const dataToCreate = {
      ...fundSourceData,
      status: fundSourceData.status || USER_STATUS.ACTIVE,
    };

    // Create the fund source
    const fundSource = await fundSourceRepository.create(dataToCreate);
    return fundSource;
  }

  /**
   * Get fund source by ID
   * @param {string} id - Fund source ID
   * @returns {Promise<Object>} Fund source
   */
  async getFundSourceById(id) {
    const fundSource = await fundSourceRepository.findById(id);
    if (!fundSource) {
      throw new AppError('Fund source not found', HTTP_STATUS.NOT_FOUND);
    }
    return fundSource;
  }

  /**
   * Get fund source by code
   * @param {string} code - Fund source code
   * @returns {Promise<Object>} Fund source
   */
  async getFundSourceByCode(code) {
    const fundSource = await fundSourceRepository.findByCode(code);
    if (!fundSource) {
      throw new AppError('Fund source not found', HTTP_STATUS.NOT_FOUND);
    }
    return fundSource;
  }

  /**
   * Get all fund sources with filtering, pagination, and sorting
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} ordering - Ordering options
   * @returns {Promise<Object>} Fund sources list and pagination info
   */
  async getAllFundSources(filters = {}, pagination = {}, ordering = {}) {
    // Get fund sources and total count
    const [fundSources, totalCount] = await Promise.all([
      fundSourceRepository.findMany(filters, pagination, ordering),
      fundSourceRepository.count(filters),
    ]);

    // Calculate pagination info
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      fundSources,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update fund source by ID
   * @param {string} id - Fund source ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated fund source
   */
  async updateFundSource(id, updateData) {
    // Check if fund source exists
    const existing = await fundSourceRepository.findById(id);
    if (!existing) {
      throw new AppError('Fund source not found', HTTP_STATUS.NOT_FOUND);
    }

    // If code is being updated, check if it already exists
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await fundSourceRepository.codeExists(updateData.code, id);
      if (codeExists) {
        throw new AppError('Fund source code already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Update the fund source
    const updated = await fundSourceRepository.update(id, updateData);
    return updated;
  }

  /**
   * Delete fund source by ID
   * @param {string} id - Fund source ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteFundSource(id) {
    // Check if fund source exists
    const existing = await fundSourceRepository.findById(id);
    if (!existing) {
      throw new AppError('Fund source not found', HTTP_STATUS.NOT_FOUND);
    }

    // TODO: Add check for dependencies (e.g., if fund source is used in budgets, transactions, etc.)
    // For now, we'll allow deletion if no explicit dependencies are checked
    // In a real system, you would check if the fund source is referenced by other entities

    await fundSourceRepository.delete(id);
    return { message: 'Fund source deleted successfully' };
  }
}

export const fundSourceService = new FundSourceService();