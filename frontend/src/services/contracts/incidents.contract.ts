import { Incident, ReportStatus, Severity, Priority } from '../../types';
import { PaginatedResult } from './reports.contract';

export interface IncidentFilterParams {
  status?: ReportStatus;
  severity?: Severity;
  priority?: Priority;
  wardId?: string;
  departmentId?: string;
  search?: string;
  sortByPriority?: boolean;
  page?: number;
  limit?: number;
}

export interface IIncidentsService {
  getIncidents(params?: IncidentFilterParams): Promise<PaginatedResult<Incident>>;
  getIncidentById(id: string): Promise<Incident>;
  updateIncidentPriority(id: string, priority: Priority, note?: string): Promise<Incident>;
  assignIncidentToDepartment(id: string, departmentId: string, note?: string): Promise<Incident>;
  assignIncidentToWorker(id: string, workerId: string, instructions?: string): Promise<Incident>;
}
