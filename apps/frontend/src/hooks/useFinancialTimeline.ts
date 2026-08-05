import { useQuery } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { dashboardApi } from '../services/dashboardService';
import type { TimelineParams, TimelineResponse } from '../types/timeline';

const QUERY_KEY = 'financialTimeline';

/**
 * Fetch the merged financial activity timeline with filtering and pagination.
 */
export const useFinancialTimeline = (
  params: TimelineParams = {},
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse, Error, TimelineResponse>({
    queryKey: [QUERY_KEY, params],
    queryFn: () => dashboardApi.getTimeline(params),
    enabled,
    select: (response) => response.data?.data,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
