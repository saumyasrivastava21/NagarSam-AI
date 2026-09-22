import { IIncidentsService, IncidentFilterParams } from '../contracts/incidents.contract';
import { PaginatedResult } from '../contracts/reports.contract';
import { Incident, Priority } from '../../types';
import { apiClient } from './client';

class IncidentsApiService implements IIncidentsService {
  private normalizeIncident(inc: any): Incident {
    return {
      ...inc,
      imageUrl: inc.imageUrl || '',
      aiDetection: inc.aiDetection || undefined,
      aiFactors: inc.aiFactors || [],
      timeline: inc.timeline || [],
    };
  }

  async getIncidents(params?: IncidentFilterParams): Promise<PaginatedResult<Incident>> {
    const queryParams: Record<string, any> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.severity) queryParams.severity = params.severity;
    if (params?.priority) queryParams.priority = params.priority;
    if (params?.wardId) queryParams.wardId = params.wardId;
    if (params?.departmentId) queryParams.departmentId = params.departmentId;
    if (params?.search) queryParams.search = params.search;
    if (params?.sortByPriority) queryParams.sortByPriority = params.sortByPriority;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const response = await apiClient.get('/incidents', { params: queryParams });
    const result = response.data;
    return {
      ...result,
      data: (result.data || []).map((i: any) => this.normalizeIncident(i)),
    };
  }

  async getIncidentById(id: string): Promise<Incident> {
    const response = await apiClient.get(`/incidents/${id}`);
    return this.normalizeIncident(response.data);
  }

  async updateIncidentPriority(id: string, priority: Priority, note?: string): Promise<Incident> {
    const response = await apiClient.patch(`/incidents/${id}/priority`, { priority, note });
    return this.normalizeIncident(response.data);
  }

  async assignIncidentToDepartment(id: string, departmentId: string, note?: string): Promise<Incident> {
    const response = await apiClient.patch(`/incidents/${id}/department`, { department_id: departmentId, note });
    return this.normalizeIncident(response.data);
  }

  async assignIncidentToWorker(id: string, workerId: string, instructions?: string): Promise<Incident> {
    const response = await apiClient.post(`/incidents/${id}/assign`, {
      worker_id: workerId,
      instructions,
      due_in_hours: 48,
    });
    return this.normalizeIncident(response.data);
  }
}

export const apiIncidentsService = new IncidentsApiService();
