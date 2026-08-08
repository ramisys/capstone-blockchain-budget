import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import type { TimelineParams, TimelineResponse } from '../types/timeline';
import type {
  DashboardChartsData,
  DashboardNotification,
  DashboardStats,
} from '../types/dashboard';

interface ApiEnvelope<T> {
  data: T;
}

export const dashboardApi = {
  // Get aggregated user and master-data counts
  getStats(): Promise<AxiosResponse<ApiEnvelope<{ stats: DashboardStats }>>> {
    return apiClient.get('/dashboard/stats');
  },

  // Get the users-by-role and users-by-status chart series
  getCharts(): Promise<AxiosResponse<ApiEnvelope<{ chartsData: DashboardChartsData }>>> {
    return apiClient.get('/dashboard/charts');
  },

  // Get notifications derived from live system state
  getNotifications(): Promise<
    AxiosResponse<ApiEnvelope<{ notifications: DashboardNotification[] }>>
  > {
    return apiClient.get('/dashboard/notifications');
  },

  // Get the merged financial activity timeline (allocations, documents, audits, blockchain)
  getTimeline(
    params: TimelineParams
  ): Promise<AxiosResponse<ApiEnvelope<TimelineResponse>>> {
    return apiClient.get('/dashboard/timeline', { params });
  },
};
