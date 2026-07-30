import { userRepository } from '../repositories/userRepository.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';

class DashboardService {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    // Get total users count
    const totalUsers = await userRepository.count({});

    // Get active users count
    const activeUsers = await userRepository.count({
      where: { status: USER_STATUS.ACTIVE },
    });

    // Get inactive users count
    const inactiveUsers = await userRepository.count({
      where: { status: USER_STATUS.INACTIVE },
    });

    // Get count by role
    const administrators = await userRepository.count({
      where: { role: ROLES.ADMINISTRATOR, status: USER_STATUS.ACTIVE },
    });

    const treasurers = await userRepository.count({
      where: { role: ROLES.TREASURER, status: USER_STATUS.ACTIVE },
    });

    const budgetOfficers = await userRepository.count({
      where: { role: ROLES.BUDGET_OFFICER, status: USER_STATUS.ACTIVE },
    });

    const auditors = await userRepository.count({
      where: { role: ROLES.AUDITOR, status: USER_STATUS.ACTIVE },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      administrators,
      treasurers,
      budgetOfficers,
      auditors,
    };
  }

  /**
   * Get dashboard charts data
   * @returns {Promise<Object>} Dashboard charts data
   */
  async getDashboardCharts() {
    // Get users by role
    const usersByRoleRaw = await userRepository.aggregateRoleCounts();

    // Format the data for the frontend
    const usersByRole = usersByRoleRaw.map((roleCount) => ({
      role: this.formatRole(roleCount._id.role),
      count: parseInt(roleCount._count),
    }));

    // Get users by status
    const usersByStatusRaw = await userRepository.aggregateStatusCounts();

    // Format the data for the frontend
    const usersByStatus = usersByStatusRaw.map((statusCount) => ({
      status: this.formatStatus(statusCount._id.status),
      count: parseInt(statusCount._count),
    }));

    return {
      usersByRole,
      usersByStatus,
    };
  }

  /**
   * Get recent activities (mock data for now)
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivities() {
    // For now, return mock data as specified in the requirements
    // In future phases, this will be replaced with actual audit log data
    return [
      {
        id: 1,
        type: 'USER_CREATED',
        message: 'John Doe was created.',
        time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 2,
        type: 'USER_UPDATED',
        message: 'Jane Smith role updated to Treasurer.',
        time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
      {
        id: 3,
        type: 'USER_DEACTIVATED',
        message: 'Bob Wilson account deactivated.',
        time: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      },
    ];
  }

  /**
   * Get notifications (mock data for now)
   * @returns {Promise<Array>} Notifications
   */
  async getNotifications() {
    // For now, return mock data as specified in the requirements
    // In future phases, this will be replaced with actual notification system
    return [
      {
        title: 'System Status',
        message: 'System operating normally.',
        type: 'success',
      },
      {
        title: 'Backup Completed',
        message: 'Daily backup completed successfully.',
        type: 'info',
      },
      {
        title: 'Security Alert',
        message: 'Failed login attempt detected from unknown IP.',
        type: 'warning',
      },
    ];
  }

  /**
   * Get blockchain status (mock data for now)
   * @returns {Promise<Object>} Blockchain status
   */
  async getBlockchainStatus() {
    // For now, return mock data as specified in the requirements
    // In future phases, this will be replaced with actual blockchain integration
    return {
      connected: false,
      network: 'Localhost',
      latestBlock: 0,
      lastSync: null,
      smartContract: 'Not Connected',
    };
  }

  /**
   * Format role for display
   * @private
   * @param {string} role
   * @returns {string} Formatted role
   */
  formatRole(role) {
    const roleMap = {
      [ROLES.ADMINISTRATOR]: 'Administrator',
      [ROLES.TREASURER]: 'Treasurer',
      [ROLES.BUDGET_OFFICER]: 'Budget Officer',
      [ROLES.AUDITOR]: 'Auditor',
    };
    return roleMap[role] || role;
  }

  /**
   * Format status for display
   * @private
   * @param {string} status
   * @returns {string} Formatted status
   */
  formatStatus(status) {
    const statusMap = {
      [USER_STATUS.ACTIVE]: 'Active',
      [USER_STATUS.INACTIVE]: 'Inactive',
      [USER_STATUS.PENDING]: 'Pending',
    };
    return statusMap[status] || status;
  }
}

export const dashboardService = new DashboardService();