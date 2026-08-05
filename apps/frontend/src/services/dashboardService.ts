import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import type { TimelineParams, TimelineResponse } from '../types/timeline';

interface ApiEnvelope<T> {
  data: T;
}

export const dashboardApi = {
  // Get the merged financial activity timeline (allocations, documents, audits, blockchain)
  getTimeline(
    params: TimelineParams
  ): Promise<AxiosResponse<ApiEnvelope<TimelineResponse>>> {
    return apiClient.get('/dashboard/timeline', { params });
  },
};
