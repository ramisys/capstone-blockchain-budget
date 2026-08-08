import { useQuery } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { dashboardApi } from '../services/dashboardService';
import type {
  DashboardChartsData,
  DashboardNotification,
  DashboardStats,
} from '../types/dashboard';

/**
 * Query keys for the main dashboard. Exported so callers (e.g. a refresh
 * control) can invalidate dashboard data without re-deriving the key strings.
 */
export const DASHBOARD_QUERY_KEYS = {
  stats: 'dashboardStats',
  charts: 'dashboardCharts',
  notifications: 'dashboardNotifications',
} as const;

/**
 * Shared cache policy for dashboard widgets. A 30 s stale window deduplicates
 * the request across co-mounted components and across quick re-navigations,
 * matching `useAllocationStatistics` and `useBlockchainStatus`.
 */
const DASHBOARD_CACHE = {
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
} as const;

/**
 * Fetch aggregated user and master-data counts (`GET /dashboard/stats`).
 */
export const useDashboardStats = () => {
  return useQuery<AxiosResponse, Error, DashboardStats>({
    queryKey: [DASHBOARD_QUERY_KEYS.stats],
    queryFn: () => dashboardApi.getStats(),
    select: (response) => response.data?.data?.stats,
    ...DASHBOARD_CACHE,
  });
};

/**
 * Fetch the users-by-role and users-by-status chart series
 * (`GET /dashboard/charts`).
 */
export const useDashboardCharts = () => {
  return useQuery<AxiosResponse, Error, DashboardChartsData>({
    queryKey: [DASHBOARD_QUERY_KEYS.charts],
    queryFn: () => dashboardApi.getCharts(),
    select: (response) => response.data?.data?.chartsData,
    ...DASHBOARD_CACHE,
  });
};

/**
 * Fetch notifications derived from live system state
 * (`GET /dashboard/notifications`).
 */
export const useDashboardNotifications = () => {
  return useQuery<AxiosResponse, Error, DashboardNotification[]>({
    queryKey: [DASHBOARD_QUERY_KEYS.notifications],
    queryFn: () => dashboardApi.getNotifications(),
    select: (response) => response.data?.data?.notifications ?? [],
    ...DASHBOARD_CACHE,
  });
};
