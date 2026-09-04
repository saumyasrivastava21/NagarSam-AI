import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersService } from '../services';
import { WorkOrderFilterParams, CreateWorkOrderDTO } from '../services/contracts/workOrders.contract';
import { INCIDENTS_QUERY_KEY } from './useIncidents';
import { REPORTS_QUERY_KEY } from './useReports';

export const WORK_ORDERS_QUERY_KEY = ['workOrders'];

export function useWorkOrders(params?: WorkOrderFilterParams) {
  return useQuery({
    queryKey: [...WORK_ORDERS_QUERY_KEY, params],
    queryFn: () => workOrdersService.getWorkOrders(params),
  });
}

export function useWorkOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...WORK_ORDERS_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? workOrdersService.getWorkOrderById(id) : null),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWorkOrderDTO) => workOrdersService.createWorkOrder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useAcceptWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workOrdersService.acceptWorkOrder(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, 'detail', id] });
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}

export function useStartRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workOrdersService.startRepair(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, 'detail', id] });
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      afterImageFile,
      afterImageUrl,
      notes,
    }: {
      id: string;
      afterImageFile?: File;
      afterImageUrl?: string;
      notes?: string;
    }) => workOrdersService.completeWorkOrder(id, afterImageFile, afterImageUrl, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useVerifyWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) =>
      workOrdersService.verifyWorkOrder(id, approved, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORK_ORDERS_QUERY_KEY, 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
