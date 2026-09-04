import {
  IReportsService,
  CreateReportDTO,
  ReportFilterParams,
  PaginatedResult,
} from '../contracts/reports.contract';
import { Report, ReportStatus, Severity, Priority } from '../../types';
import { mockStore } from './mockStore';
import { calculateDistanceKm } from '../../utils/geo';
import { WARDS_DATA, DEPARTMENTS_DATA } from '../../constants';

export class MockReportsService implements IReportsService {
  async getReports(params?: ReportFilterParams): Promise<PaginatedResult<Report>> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const db = mockStore.getDB();
    let list = [...db.reports];

    if (params?.citizenId) {
      list = list.filter((r) => r.citizenId === params.citizenId);
    }
    if (params?.status) {
      list = list.filter((r) => r.status === params.status);
    }
    if (params?.severity) {
      list = list.filter((r) => r.severity === params.severity);
    }
    if (params?.priority) {
      list = list.filter((r) => r.priority === params.priority);
    }
    if (params?.wardId) {
      list = list.filter((r) => r.wardId === params.wardId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.wardName.toLowerCase().includes(q)
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

  async getReportById(id: string): Promise<Report> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const report = mockStore.getDB().reports.find((r) => r.id === id);
    if (!report) throw new Error(`Report ${id} not found`);
    return report;
  }

  async createReport(dto: CreateReportDTO): Promise<Report> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = mockStore.getCurrentUser();
    const db = mockStore.getDB();

    const reportCount = db.reports.length + 1;
    const reportId = `NS-2026-0010${reportCount < 10 ? '0' + reportCount : reportCount}`;

    // Find nearest ward or default
    const ward = WARDS_DATA.find((w) => w.id === dto.wardId) || WARDS_DATA[0];
    const dept = DEPARTMENTS_DATA[0];

    const fallbackImageUrl = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80';
    const imageUrl = dto.imageUrl || fallbackImageUrl;

    // Simulated RDD2022 model inference
    const confidence = 0.94;
    const severity: Severity = confidence > 0.9 ? 'HIGH' : 'MEDIUM';
    const priority: Priority = severity === 'HIGH' ? 'HIGH' : 'MEDIUM';

    const newReport: Report = {
      id: reportId,
      citizenId: user.id,
      citizenName: user.name || dto.citizenName || 'Citizen Reporter',
      citizenPhone: user.phone || dto.citizenPhone || '+91 98765 43210',
      imageUrl,
      description: dto.description,
      landmark: dto.landmark,
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address || `${ward.name}, Lucknow, Uttar Pradesh`,
      wardId: ward.id,
      wardName: ward.name,
      status: 'SUBMITTED',
      severity,
      priority,
      departmentId: dept.id,
      departmentName: dept.name,
      aiDetection: {
        model_version: 'rdd2022-v1',
        detected: true,
        pothole_detected: true,
        confidence,
        detections: [
          { class: 'pothole', confidence, bbox: [130, 190, 510, 600] },
        ],
        inference_time_ms: 84,
        timestamp: new Date().toISOString(),
      },
      aiPriorityReasoning: {
        recommendation: priority,
        confidenceScore: 92,
        factors: [
          'RDD2022 visual confidence (94%)',
          'Road fissure surface area threshold exceeded',
          'Proximity to municipal bus corridor',
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `TL-${Date.now()}-1`,
          status: 'SUBMITTED',
          title: 'Report Submitted',
          description: 'Citizen report logged with photographic evidence and geolocation.',
          actor: user.name,
          actorRole: 'CITIZEN',
          timestamp: new Date().toISOString(),
        },
        {
          id: `TL-${Date.now()}-2`,
          status: 'UNDER_REVIEW',
          title: 'AI Surface Analysis Complete',
          description: 'RDD2022-v1 confirmed pothole detection with 94% confidence.',
          actor: 'RDD2022-v1 Model',
          actorRole: 'ADMIN',
          timestamp: new Date(Date.now() + 1000).toISOString(),
        },
      ],
    };

    return mockStore.addReport(newReport);
  }

  async updateReportStatus(id: string, status: ReportStatus, note?: string): Promise<Report> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockStore.updateReportStatus(id, status, note);
  }

  async getNearbyReports(lat: number, lng: number, radiusKm = 5): Promise<Report[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const all = mockStore.getDB().reports;
    return all.filter((r) => calculateDistanceKm(lat, lng, r.latitude, r.longitude) <= radiusKm);
  }
}

export const mockReportsService = new MockReportsService();
