import {
  IIncidentsService,
  IncidentFilterParams,
} from '../contracts/incidents.contract';
import { PaginatedResult } from '../contracts/reports.contract';
import { Incident, Priority } from '../../types';
import { mockStore } from './mockStore';

export class MockIncidentsService implements IIncidentsService {
  async getIncidents(params?: IncidentFilterParams): Promise<PaginatedResult<Incident>> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const db = mockStore.getDB();
    let list = [...db.incidents];

    if (params?.status) {
      list = list.filter((i) => i.status === params.status);
    }
    if (params?.severity) {
      list = list.filter((i) => i.severity === params.severity);
    }
    if (params?.priority) {
      list = list.filter((i) => i.priority === params.priority);
    }
    if (params?.wardId) {
      list = list.filter((i) => i.wardId === params.wardId);
    }
    if (params?.departmentId) {
      list = list.filter((i) => i.departmentId === params.departmentId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          i.wardName.toLowerCase().includes(q)
      );
    }

    if (params?.sortByPriority) {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      list.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0) || b.priorityScore - a.priorityScore);
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

  async getIncidentById(id: string): Promise<Incident> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const incident = mockStore.getDB().incidents.find((i) => i.id === id);
    if (!incident) throw new Error(`Incident ${id} not found`);
    return incident;
  }

  async updateIncidentPriority(id: string, priority: Priority, note?: string): Promise<Incident> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const incident = mockStore.getDB().incidents.find((i) => i.id === id);
    if (!incident) throw new Error(`Incident ${id} not found`);

    incident.priority = priority;
    incident.updatedAt = new Date().toISOString();
    incident.timeline.push({
      id: `TL-${Date.now()}`,
      status: incident.status,
      title: `Priority escalated to ${priority}`,
      description: note || `Operational review by municipal officer`,
      actor: mockStore.getCurrentUser().name,
      actorRole: mockStore.getCurrentUser().role,
      timestamp: new Date().toISOString(),
    });

    mockStore.addAuditLog('UPDATE_PRIORITY', 'Incident', incident.id, 'SUCCESS', `Set priority to ${priority}`);
    return incident;
  }

  async assignIncidentToDepartment(id: string, departmentId: string, note?: string): Promise<Incident> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const incident = mockStore.getDB().incidents.find((i) => i.id === id);
    if (!incident) throw new Error(`Incident ${id} not found`);

    incident.departmentId = departmentId;
    incident.updatedAt = new Date().toISOString();
    incident.timeline.push({
      id: `TL-${Date.now()}`,
      status: incident.status,
      title: `Rerouted to Department ${departmentId}`,
      description: note || `Department reassignment`,
      actor: mockStore.getCurrentUser().name,
      actorRole: mockStore.getCurrentUser().role,
      timestamp: new Date().toISOString(),
    });

    return incident;
  }

  async assignIncidentToWorker(id: string, workerId: string, instructions?: string): Promise<Incident> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return mockStore.assignIncidentToWorker(id, workerId, instructions);
  }
}

export const mockIncidentsService = new MockIncidentsService();
