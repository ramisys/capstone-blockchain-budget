import { userRepository } from '../repositories/userRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { blockchainService } from './blockchainService.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { ALLOCATION_STATUS } from '../constants/allocationStatus.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import {
  NOTIFICATION_KEYS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_RANK,
} from '../constants/notificationKeys.js';

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
   *
   * Every notification reports a condition that is actually true right now:
   * inactive accounts, allocations awaiting a decision, and ledger anchors
   * that failed. When nothing is wrong the list is empty — the dashboard shows
   * its own empty state rather than an unearned "all systems normal" claim.
   *
   * Failed anchors are counted straight from the database so this endpoint
   * never makes an RPC call; live connectivity is reported by
   * `getBlockchainStatus` instead.
   *
   * @returns {Promise<Array>} Notifications, most urgent first
   */
  async getNotifications() {
    const [statusCounts, allocationStatusCounts, ledgerStatusCounts] =
      await Promise.all([
        userRepository.aggregateStatusCounts(),
        allocationRepository.countByStatusAll(),
        blockchainRepository.countByStatus(),
      ]);

    const notifications = [];

    // Check for inactive users
    const inactiveGroup = statusCounts.find(
      (g) => g.status === USER_STATUS.INACTIVE
    );
    const inactiveCount = inactiveGroup ? Number(inactiveGroup._count) : 0;
    if (inactiveCount > 0) {
      notifications.push({
        key: NOTIFICATION_KEYS.INACTIVE_USERS,
        title: 'Inactive Users',
        message: `${inactiveCount} user account${inactiveCount > 1 ? 's are' : ' is'} currently inactive.`,
        type: NOTIFICATION_TYPES.WARNING,
        count: inactiveCount,
      });
    }

    // Check for pending-approval allocations
    const pendingGroup = allocationStatusCounts.find(
      (g) => g.status === ALLOCATION_STATUS.PENDING_APPROVAL
    );
    const pendingCount = pendingGroup ? Number(pendingGroup._count) : 0;
    if (pendingCount > 0) {
      notifications.push({
        key: NOTIFICATION_KEYS.PENDING_APPROVALS,
        title: 'Pending Approvals',
        message: `${pendingCount} budget allocation${pendingCount > 1 ? 's require' : ' requires'} approval.`,
        type: NOTIFICATION_TYPES.INFO,
        count: pendingCount,
      });
    }

    // Check for ledger anchors that failed to record
    const failedGroup = (ledgerStatusCounts ?? []).find(
      (g) => g.status === BLOCKCHAIN_RECORD_STATUS.FAILED
    );
    const failedCount = failedGroup ? Number(failedGroup._count) : 0;
    if (failedCount > 0) {
      notifications.push({
        key: NOTIFICATION_KEYS.LEDGER_ANCHORS_FAILED,
        title: 'Ledger Anchors Failed',
        message: `${failedCount} blockchain record${failedCount > 1 ? 's' : ''} failed to anchor and can be retried.`,
        type: NOTIFICATION_TYPES.ERROR,
        count: failedCount,
      });
    }

    return notifications.sort(
      (a, b) => NOTIFICATION_TYPE_RANK[a.type] - NOTIFICATION_TYPE_RANK[b.type]
    );
  }

  /**
   * Get blockchain integration status.
   * Returns an honest status reflecting the current integration state.
   *
   * @returns {Promise<Object>} Blockchain status
   */
  async getBlockchainStatus() {
    return blockchainService.getBlockchainStatus();
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