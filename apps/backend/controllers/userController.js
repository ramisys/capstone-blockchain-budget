import { userService } from '../services/userService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  userQuerySchema,
  changeRoleSchema,
  changeStatusSchema
} from '../validators/userValidator.js';

class UserController {
  /**
   * Get all users with filtering and pagination
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getAllUsers(req, res, next) {
    try {
      const filters = {
        role: req.query.role,
        status: req.query.status,
        search: req.query.search,
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await userService.getAllUsers(filters, pagination);

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Users retrieved successfully', {
            users: result.users,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('User retrieved successfully', { user })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);

      return res
        .status(HTTP_STATUS.CREATED)
        .json(
          formatSuccessResponse('User created successfully', { user })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const currentUserId = req.user?.id;
      const user = await userService.updateUser(id, updateData, currentUserId);

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('User updated successfully', { user })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      await userService.deleteUser(id, currentUserId);

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('User deleted successfully', {})
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user role
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async changeUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const currentUserId = req.user?.id;
      const user = await userService.changeUserRole(id, role, currentUserId);

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('User role updated successfully', { user })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async changeUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const currentUserId = req.user?.id;
      const user = await userService.changeUserStatus(id, status, currentUserId);

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('User status updated successfully', { user })
        );
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();