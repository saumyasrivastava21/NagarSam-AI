import {
  IWorkOrdersService,
  CreateWorkOrderDTO,
  WorkOrderFilterParams,
} from '../contracts/workOrders.contract';
import { PaginatedResult } from '../contracts/reports.contract';
import { WorkOrder } from '../../types';
import { apiClient } from './client';

class WorkOrdersApiService implements IWorkOrdersService {
  private normalizeWorkOrder(wo: any): WorkOrder {
    return {
      ...wo,
      locationAddress: wo.locationAddress || wo.address || '',
      beforeImageUrl: wo.beforeImageUrl || wo.before_photo_url || '',
      afterImageUrl: wo.afterImageUrl || wo.after_photo_url || undefined,
      verification: wo.verification || undefined,
      timeline: wo.timeline || [],
    };
  }

  async getWorkOrders(params?: WorkOrderFilterParams): Promise<PaginatedResult<WorkOrder>> {
    const queryParams: Record<string, any> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.assignedWorkerId) queryParams.assignedWorkerId = params.assignedWorkerId;
    if (params?.departmentId) queryParams.departmentId = params.departmentId;
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const response = await apiClient.get('/work-orders', { params: queryParams });
    const result = response.data;
    return {
      ...result,
      data: (result.data || []).map((w: any) => this.normalizeWorkOrder(w)),
    };
  }

  async getWorkOrderById(id: string): Promise<WorkOrder> {
    const response = await apiClient.get(`/work-orders/${id}`);
    return this.normalizeWorkOrder(response.data);
  }

  async createWorkOrder(dto: CreateWorkOrderDTO): Promise<WorkOrder> {
    const response = await apiClient.post('/work-orders', {
      incident_id: dto.incidentId,
      assigned_worker_id: dto.assignedWorkerId,
      instructions: dto.instructions,
      priority: dto.priority,
      due_date: dto.dueDate,
    });
    return this.normalizeWorkOrder(response.data);
  }

  async acceptWorkOrder(id: string): Promise<WorkOrder> {
    const response = await apiClient.post(`/work-orders/${id}/accept`);
    return this.normalizeWorkOrder(response.data);
  }

  async startRepair(id: string): Promise<WorkOrder> {
    const response = await apiClient.post(`/work-orders/${id}/start`);
    return this.normalizeWorkOrder(response.data);
  }

  async completeWorkOrder(
    id: string,
    afterImageFile?: File,
    afterImageUrl?: string,
    notes?: string
  ): Promise<WorkOrder> {
    const formData = new FormData();
    if (afterImageFile) {
      formData.append('after_file', afterImageFile);
    }
    if (afterImageUrl) {
      formData.append('after_image_url', afterImageUrl);
    }
    if (notes) {
      formData.append('notes', notes);
    }
    formData.append('labor_hours', '3.5');

    const response = await apiClient.post(`/work-orders/${id}/complete`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return this.normalizeWorkOrder(response.data);
  }

  async verifyWorkOrder(id: string, approved: boolean, notes?: string): Promise<WorkOrder> {
    const response = await apiClient.post(`/work-orders/${id}/verify`, { approved, notes });
    return this.normalizeWorkOrder(response.data);
  }
}

export const apiWorkOrdersService = new WorkOrdersApiService();
