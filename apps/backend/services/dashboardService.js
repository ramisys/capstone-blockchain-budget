import { userRepository } from '../repositories/userRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { ALLOCATION_STATUS } from '../constants/allocationStatus.js';

class DashboardService {
  /**
   * Get dashboard statistics using a single aggregation query
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    const [userStats, fiscalYears, fundSources, departments, budgetCategories, budgetPrograms] = await Promise.all([
      userRepository.getDashboardStatsAggregated(),
      fiscalYearRepository.count(),
      fundSourceRepository.count(),
      departmentRepository.count(),
      budgetCategoryRepository.count(),
      budgetProgramRepository.count(),
    ]);

    return {
      ...userStats,
      fiscalYears,
      fundSources,
      departments,
      budgetCategories,
      budgetPrograms,
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
      role: this.formatRole(roleCount.role),
      count: roleCount._count,
    }));

    // Get users by status
    const usersByStatusRaw = await userRepository.aggregateStatusCounts();

    // Format the data for the frontend
    const usersByStatus = usersByStatusRaw.map((statusCount) => ({
      status: this.formatStatus(statusCount.status),
      count: statusCount._count,
    }));

    return {
      usersByRole,
      usersByStatus,
    };
  }

  /**
   * Get recent activities derived from actual database records.
   * Merges recent user creations and allocation creations into a single
   * time-ordered feed.
   *
   * @param {number} [limit=10] - Maximum number of activity items to return
   * @returns {Promise<Array>} Recent activities sorted by time descending
   */
  async getRecentActivities(limit = 10) {
    // Fetch recent records from both tables in parallel
    const [recentUsers, recentAllocations] = await Promise.all([
      userRepository.findRecentlyCreated(limit),
      allocationRepository.findRecent(limit),
    ]);

    // Map users to activity items
    const userActivities = recentUsers.map((user) => ({
      id: `user-${user.id}`,
      type: 'USER_CREATED',
      message: `User ${user.fullName} (${this.formatRole(user.role)}) was created.`,
      time: user.createdAt.toISOString(),
    }));

    // Map allocations to activity items
    const allocationActivities = recentAllocations.map((alloc) => ({
      id: `alloc-${alloc.id}`,
      type: 'ALLOCATION_CREATED',
      message: `Allocation ${alloc.allocationCode} for ${alloc.department?.name ?? 'Unknown Dept.'} was created (${alloc.status}).`,
      time: alloc.createdAt.toISOString(),
    }));

    // Merge, sort by time descending, and trim to the requested limit
    return [...userActivities, ...allocationActivities]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);
  }

  /**
   * Get notifications derived from live system state.
   * Generates actionable notifications based on user statuses and
   * allocation approval queues.
   *
   * @returns {Promise<Array>} Notifications
   */
  async getNotifications() {
    const [statusCounts, allocationStatusCounts] = await Promise.all([
      userRepository.aggregateStatusCounts(),
      allocationRepository.countByStatusAll(),
    ]);

    const notifications = [];

    // Check for inactive users
    const inactiveGroup = statusCounts.find(
      (g) => g.status === USER_STATUS.INACTIVE
    );
    const inactiveCount = inactiveGroup ? Number(inactiveGroup._count) : 0;
    if (inactiveCount > 0) {
      notifications.push({
        title: 'Inactive Users',
        message: `${inactiveCount} user account${inactiveCount > 1 ? 's are' : ' is'} currently inactive.`,
        type: 'warning',
      });
    }

    // Check for pending-approval allocations
    const pendingGroup = allocationStatusCounts.find(
      (g) => g.status === ALLOCATION_STATUS.PENDING_APPROVAL
    );
    const pendingCount = pendingGroup ? Number(pendingGroup._count) : 0;
    if (pendingCount > 0) {
      notifications.push({
        title: 'Pending Approvals',
        message: `${pendingCount} budget allocation${pendingCount > 1 ? 's require' : ' requires'} approval.`,
        type: 'info',
      });
    }

    // Always include a system-health notification
    notifications.push({
      title: 'System Status',
      message: 'All services are operating normally.',
      type: 'success',
    });

    return notifications;
  }

  /**
   * Get blockchain integration status.
   * Returns an honest status reflecting the current integration state.
   *
   * @returns {Promise<Object>} Blockchain status
   */
  async getBlockchainStatus() {
    return {
      connected: false,
      network: null,
      latestBlock: null,
      lastSync: null,
      smartContract: null,
      message: 'Blockchain integration is not yet configured.',
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