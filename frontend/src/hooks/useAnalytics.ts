import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services';

export const ANALYTICS_QUERY_KEY = ['analytics'];

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'overview'],
    queryFn: () => analyticsService.getOverview(),
  });
}

export function useReportsTrend(days = 7) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'trend', days],
    queryFn: () => analyticsService.getReportsTrend(days),
  });
}

export function useSeverityDistribution() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'severity'],
    queryFn: () => analyticsService.getSeverityDistribution(),
  });
}

export function usePriorityDistribution() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'priority'],
    queryFn: () => analyticsService.getPriorityDistribution(),
  });
}

export function useDepartmentWorkload() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, 'workload'],
    queryFn: () => analyticsService.getDepartmentWorkload(),
  });
}
