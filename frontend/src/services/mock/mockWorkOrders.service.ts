import {
  IWorkOrdersService,
  CreateWorkOrderDTO,
  WorkOrderFilterParams,
} from '../contracts/workOrders.contract';
import { PaginatedResult } from '../contracts/reports.contract';
import { WorkOrder } from '../../types';
import { mockStore } from './mockStore';

export class MockWorkOrdersService implements IWorkOrdersService {
  async getWorkOrders(params?: WorkOrderFilterParams): Promise<PaginatedResult<WorkOrder>> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const db = mockStore.getDB();
    let list = [...db.workOrders];

    if (params?.assignedWorkerId) {
      list = list.filter((w) => w.assignedWorkerId === params.assignedWorkerId);
    }
    if (params?.status) {
      list = list.filter((w) => w.status === params.status);
    }
    if (params?.departmentId) {
      list = list.filter((w) => w.departmentId === params.departmentId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (w) =>
          w.id.toLowerCase().includes(q) ||
          w.title.toLowerCase().includes(q) ||
          w.locationAddress.toLowerCase().includes(q) ||
          w.assignedWorkerName.toLowerCase().includes(q)
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

  async getWorkOrderById(id: string): Promise<WorkOrder> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const wo = mockStore.getDB().workOrders.find((w) => w.id === id);
    if (!wo) throw new Error(`WorkOrder ${id} not found`);
    return wo;
  }

  async createWorkOrder(dto: CreateWorkOrderDTO): Promise<WorkOrder> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const incident = await mockStore.assignIncidentToWorker(dto.incidentId, dto.assignedWorkerId, dto.instructions);
    const wo = mockStore.getDB().workOrders.find((w) => w.incidentId === incident.id);
    if (!wo) throw new Error('Failed to instantiate work order');
    return wo;
  }

  async acceptWorkOrder(id: string): Promise<WorkOrder> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockStore.updateWorkOrderStatus(id, 'ACCEPTED', 'Field Worker accepted assignment.');
  }

  async startRepair(id: string): Promise<WorkOrder> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockStore.updateWorkOrderStatus(id, 'IN_PROGRESS', 'Field Worker arrived on site and commenced repair operations.');
  }

  async completeWorkOrder(
    id: string,
    _afterImageFile?: File,
    afterImageUrl?: string,
    notes?: string
  ): Promise<WorkOrder> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const sampleAfter = afterImageUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80';
    return mockStore.completeWorkOrderWithVerification(id, sampleAfter, notes);
  }

  async verifyWorkOrder(id: string, approved: boolean, notes?: string): Promise<WorkOrder> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockStore.verifyAndCloseWorkOrder(id, approved, notes);
  }
}

export const mockWorkOrdersService = new MockWorkOrdersService();
