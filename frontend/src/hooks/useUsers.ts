import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, departmentsService, modelsService, systemService } from '../services';
import { UserFilterParams } from '../services/contracts/users.contract';
import { AuditLogFilterParams } from '../services/contracts/system.contract';
import { UserRole, AIConfiguration } from '../types';

export function useUsers(params?: UserFilterParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersService.getUsers(params),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => (id ? usersService.getUserById(id) : null),
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsService.getDepartments(),
  });
}

export function useWards() {
  return useQuery({
    queryKey: ['wards'],
    queryFn: () => departmentsService.getWards(),
  });
}

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: () => modelsService.getModelVersions(),
  });
}

export function useAIConfiguration() {
  return useQuery({
    queryKey: ['aiConfig'],
    queryFn: () => modelsService.getAIConfiguration(),
  });
}

export function useUpdateAIConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<AIConfiguration>) => modelsService.updateAIConfiguration(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConfig'] });
    },
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => systemService.getSystemHealth(),
    refetchInterval: 10000,
  });
}

export function useAuditLogs(params?: AuditLogFilterParams) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => systemService.getAuditLogs(params),
  });
}
