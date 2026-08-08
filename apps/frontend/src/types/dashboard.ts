/**
 * Type definitions for the main dashboard.
 *
 * Shapes mirror the serialized responses returned by the backend
 * `dashboardController` (`apps/backend/controllers/dashboardController.js`) and
 * the aggregations in `dashboardService` / `userRepository`.
 */

/**
 * Aggregated counts returned by `GET /api/dashboard/stats`.
 *
 * User counts come from `userRepository.getDashboardStatsAggregated()`; the
 * master-data counts come from the individual repository `count()` calls.
 */
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  administrators: number;
  treasurers: number;
  budgetOfficers: number;
  auditors: number;
  fiscalYears: number;
  fundSources: number;
  departments: number;
  budgetCategories: number;
  budgetPrograms: number;
}

export interface UsersByRoleEntry {
  /** Display-formatted role label, e.g. "Budget Officer". */
  role: string;
  count: number;
}

export interface UsersByStatusEntry {
  /** Display-formatted status label, e.g. "Active". */
  status: string;
  count: number;
}

/** Chart series returned by `GET /api/dashboard/charts`. */
export interface DashboardChartsData {
  usersByRole: UsersByRoleEntry[];
  usersByStatus: UsersByStatusEntry[];
}

export type DashboardNotificationType = 'success' | 'info' | 'warning' | 'error';

/** Live-state notification returned by `GET /api/dashboard/notifications`. */
export interface DashboardNotification {
  title: string;
  message: string;
  type: DashboardNotificationType;
}
