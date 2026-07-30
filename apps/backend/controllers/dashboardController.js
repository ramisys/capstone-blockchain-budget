import { dashboardService } from '../services/dashboardService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { validateRequest } from '../validators/validateRequest.js';
import { dashboardStatsSchema } from '../validators/dashboardValidator.js';
import { dashboardChartsSchema } from '../validators/dashboardValidator.js';

class DashboardController {
  /**
   * Get dashboard statistics
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getStats(req, res, next) {
    try {
      // Validate query parameters (even though none are required now, preparing for future)
      await new Promise((resolve, reject) => {
        validateRequest(dashboardStatsSchema)(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const stats = await dashboardService.getDashboardStats();

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Dashboard statistics retrieved successfully', {
            stats,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard charts data
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getCharts(req, res, next) {
    try {
      // Validate query parameters (even though none are required now, preparing for future)
      await new Promise((resolve, reject) => {
        validateRequest(dashboardChartsSchema)(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const chartsData = await dashboardService.getDashboardCharts();

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Dashboard charts data retrieved successfully', {
            chartsData,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activities
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getActivities(req, res, next) {
    try {
      const activities = await dashboardService.getRecentActivities();

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Recent activities retrieved successfully', {
            activities,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notifications
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getNotifications(req, res, next) {
    try {
      const notifications = await dashboardService.getNotifications();

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Notifications retrieved successfully', {
            notifications,
          })
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get blockchain status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getBlockchainStatus(req, res, next) {
    try {
      const blockchainStatus = await dashboardService.getBlockchainStatus();

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Blockchain status retrieved successfully', {
            blockchainStatus,
          })
        );
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();