import { ISystemService, AuditLogFilterParams } from '../contracts/system.contract';
import { PaginatedResult } from '../contracts/reports.contract';
import { SystemServiceHealth, AuditLog } from '../../types';
import { mockStore } from './mockStore';

export class MockSystemService implements ISystemService {
  async getSystemHealth(): Promise<SystemServiceHealth[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockStore.getDB().systemHealth;
  }

  async getAuditLogs(params?: AuditLogFilterParams): Promise<PaginatedResult<AuditLog>> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const db = mockStore.getDB();
    let list = [...db.auditLogs];

    if (params?.userId) {
      list = list.filter((l) => l.userId === params.userId);
    }
    if (params?.action) {
      list = list.filter((l) => l.action === params.action);
    }
    if (params?.resource) {
      list = list.filter((l) => l.resource === params.resource);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.id.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async createAuditLog(
    action: string,
    resource: string,
    resourceId: string,
    result: 'SUCCESS' | 'FAILURE' | 'WARNING',
    details?: string
  ): Promise<AuditLog> {
    return mockStore.addAuditLog(action, resource, resourceId, result, details);
  }
}

export const mockSystemService = new MockSystemService();
