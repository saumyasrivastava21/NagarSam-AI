import { apiClient } from './client';
import { ISystemService, AuditLogFilterParams } from '../contracts/system.contract';
import { SystemServiceHealth, AuditLog } from '../../types';
import { PaginatedResult } from '../contracts/reports.contract';

export class ApiSystemService implements ISystemService {
  async getSystemHealth(): Promise<SystemServiceHealth[]> {
    const res = await apiClient.get<SystemServiceHealth[]>('/system/health');
    return res.data;
  }

  async getAuditLogs(params?: AuditLogFilterParams): Promise<PaginatedResult<AuditLog>> {
    const res = await apiClient.get<{ data: AuditLog[]; total: number }>('/audit-logs', { params });
    return {
      data: res.data.data,
      total: res.data.total,
      page: params?.page || 1,
      limit: params?.limit || 50,
      totalPages: Math.ceil(res.data.total / (params?.limit || 50))
    };
  }

  async createAuditLog(
    action: string,
    resource: string,
    resourceId: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING',
    details?: string
  ): Promise<AuditLog> {
    const res = await apiClient.post<AuditLog>('/audit-logs', {
      action,
      resourceType: resource,
      resourceId,
      result,
      metadata: details ? { details } : {}
    });
    return res.data;
  }
}
