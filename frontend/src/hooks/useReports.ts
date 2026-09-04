import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '../services';
import { ReportFilterParams, CreateReportDTO } from '../services/contracts/reports.contract';
import { ReportStatus } from '../types';

export const REPORTS_QUERY_KEY = ['reports'];

export function useReports(params?: ReportFilterParams) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, params],
    queryFn: () => reportsService.getReports(params),
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? reportsService.getReportById(id) : null),
    enabled: !!id,
  });
}

export function useNearbyReports(lat: number, lng: number, radiusKm = 5) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'nearby', lat, lng, radiusKm],
    queryFn: () => reportsService.getNearbyReports(lat, lng, radiusKm),
    enabled: !!lat && !!lng,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReportDTO) => reportsService.createReport(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ReportStatus; note?: string }) =>
      reportsService.updateReportStatus(id, status, note),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...REPORTS_QUERY_KEY, 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
