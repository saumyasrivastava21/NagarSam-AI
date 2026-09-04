import { WorkOrder, WorkOrderStatus, Priority } from '../../types';
import { PaginatedResult } from './reports.contract';

export interface CreateWorkOrderDTO {
  incidentId: string;
  assignedWorkerId: string;
  instructions: string;
  priority: Priority;
  dueDate: string;
}

export interface WorkOrderFilterParams {
  status?: WorkOrderStatus;
  assignedWorkerId?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IWorkOrdersService {
  getWorkOrders(params?: WorkOrderFilterParams): Promise<PaginatedResult<WorkOrder>>;
  getWorkOrderById(id: string): Promise<WorkOrder>;
  createWorkOrder(dto: CreateWorkOrderDTO): Promise<WorkOrder>;
  acceptWorkOrder(id: string): Promise<WorkOrder>;
  startRepair(id: string): Promise<WorkOrder>;
  completeWorkOrder(id: string, afterImageFile?: File, afterImageUrl?: string, notes?: string): Promise<WorkOrder>;
  verifyWorkOrder(id: string, approved: boolean, notes?: string): Promise<WorkOrder>;
}
