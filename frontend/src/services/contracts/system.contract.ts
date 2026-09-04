import { SystemServiceHealth, AuditLog } from '../../types';
import { PaginatedResult } from './reports.contract';

export interface AuditLogFilterParams {
  userId?: string;
  action?: string;
  resource?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ISystemService {
  getSystemHealth(): Promise<SystemServiceHealth[]>;
  getAuditLogs(params?: AuditLogFilterParams): Promise<PaginatedResult<AuditLog>>;
  createAuditLog(action: string, resource: string, resourceId: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING', details?: string): Promise<AuditLog>;
}
