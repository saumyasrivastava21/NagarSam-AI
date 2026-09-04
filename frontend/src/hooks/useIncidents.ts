import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsService } from '../services';
import { IncidentFilterParams } from '../services/contracts/incidents.contract';
import { Priority } from '../types';
import { REPORTS_QUERY_KEY } from './useReports';

export const INCIDENTS_QUERY_KEY = ['incidents'];

export function useIncidents(params?: IncidentFilterParams) {
  return useQuery({
    queryKey: [...INCIDENTS_QUERY_KEY, params],
    queryFn: () => incidentsService.getIncidents(params),
  });
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: [...INCIDENTS_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? incidentsService.getIncidentById(id) : null),
    enabled: !!id,
  });
}

export function useUpdateIncidentPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority, note }: { id: string; priority: Priority; note?: string }) =>
      incidentsService.updateIncidentPriority(id, priority, note),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...INCIDENTS_QUERY_KEY, 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}

export function useAssignIncidentWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workerId, instructions }: { id: string; workerId: string; instructions?: string }) =>
      incidentsService.assignIncidentToWorker(id, workerId, instructions),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...INCIDENTS_QUERY_KEY, 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
