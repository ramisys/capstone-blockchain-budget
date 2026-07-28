import { userRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errors/appError.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} Created user (without password)
   */
  async createUser(userData) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', HTTP_STATUS.CONFLICT);
    }

    // Hash password if provided
    const hashedPassword = await hashPassword(userData.password);

    // Prepare user data for creation
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      role: userData.role || ROLES.BUDGET_OFFICER, // Default role
      status: userData.status || USER_STATUS.ACTIVE, // Default status
    };

    // Remove password confirmation if present
    delete userToCreate.passwordConfirm;

    const user = await userRepository.createUser(userToCreate);

    // Remove password from returned user object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User (without password)
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users with optional filtering and pagination
   * @param {Object} filters - Filter criteria (role, status, search)
   * @param {Object} pagination - Pagination options (page, limit)
   * @returns {Promise<Object>} Users list and pagination info
   */
  async getAllUsers(filters = {}, pagination = {}) {
    // Build where clause for filtering
    const where = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search } },
        { fullName: { contains: filters.search } },
      ];
    }

    // Set pagination defaults
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users and total count
    const [users, totalCount] = await Promise.all([
      userRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password
        },
      }),
      userRepository.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @param {string} [currentUserId] - ID of the currently authenticated user
   * @returns {Promise<Object>} Updated user (without password)
   */
  async updateUser(id, updateData, currentUserId = null) {
    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Last Admin Protection: Prevent demoting or deactivating the last active administrator
    if (existingUser.role === ROLES.ADMINISTRATOR && existingUser.status === USER_STATUS.ACTIVE) {
      const isDemoting = updateData.role && updateData.role !== ROLES.ADMINISTRATOR;
      const isDeactivating = updateData.status && updateData.status !== USER_STATUS.ACTIVE;

      if (isDemoting || isDeactivating) {
        const activeAdminCount = await userRepository.count({
          where: {
            role: ROLES.ADMINISTRATOR,
            status: USER_STATUS.ACTIVE,
          },
        });

        if (activeAdminCount <= 1) {
          throw new AppError(
            'Operation failed. Cannot demote or deactivate the last active administrator account.',
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }
    }

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await userRepository.findByEmail(updateData.email);
      if (emailExists) {
        throw new AppError('User with this email already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Remove password confirmation if present
    delete updateData.passwordConfirm;

    // Update user
    const updatedUser = await userRepository.updateUser(id, updateData);

    // Remove password from returned user object
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID to delete
   * @param {string} [currentUserId] - ID of the currently authenticated user
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteUser(id, currentUserId = null) {
    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Self-deletion protection
    if (currentUserId && id === currentUserId) {
      throw new AppError(
        'Self-deletion is not permitted. You cannot delete your own account.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Last Admin Protection: Prevent deleting the last active administrator
    if (existingUser.role === ROLES.ADMINISTRATOR && existingUser.status === USER_STATUS.ACTIVE) {
      const activeAdminCount = await userRepository.count({
        where: {
          role: ROLES.ADMINISTRATOR,
          status: USER_STATUS.ACTIVE,
        },
      });

      if (activeAdminCount <= 1) {
        throw new AppError(
          'Operation failed. Cannot delete the last active administrator account.',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Delete user
    await userRepository.deleteUser(id);

    return { message: 'User deleted successfully' };
  }

  /**
   * Change user role
   * @param {string} id - User ID
   * @param {string} role - New role
   * @param {string} [currentUserId] - ID of the currently authenticated user
   * @returns {Promise<Object>} Updated user (without password)
   */
  async changeUserRole(id, role, currentUserId = null) {
    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      throw new AppError('Invalid role', HTTP_STATUS.BAD_REQUEST);
    }

    // Update user role
    return this.updateUser(id, { role }, currentUserId);
  }

  /**
   * Change user status
   * @param {string} id - User ID
   * @param {string} status - New status
   * @param {string} [currentUserId] - ID of the currently authenticated user
   * @returns {Promise<Object>} Updated user (without password)
   */
  async changeUserStatus(id, status, currentUserId = null) {
    // Validate status
    if (!Object.values(USER_STATUS).includes(status)) {
      throw new AppError('Invalid status', HTTP_STATUS.BAD_REQUEST);
    }

    // Update user status
    return this.updateUser(id, { status }, currentUserId);
  }
}

export const userService = new UserService();