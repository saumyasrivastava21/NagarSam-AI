import {
  IReportsService,
  CreateReportDTO,
  ReportFilterParams,
  PaginatedResult,
} from '../contracts/reports.contract';
import { Report, ReportStatus, Severity, Priority, RoadDefectDetection } from '../../types';
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

    // Preserve citizen observation vs AI primary defect
    const citizenIssueType = dto.issueType || 'longitudinal crack';
    // eslint-disable-next-line prefer-const
    let aiDetection: RoadDefectDetection | undefined = dto.aiDetection;
    const aiPrimaryDefect = dto.primaryDefect || aiDetection?.primary_defect || aiDetection?.primaryDefectClass || citizenIssueType;

    if (!aiDetection) {
      const targetClass = aiPrimaryDefect;
      let targetClassId = 0;
      let bbox: [number, number, number, number] = [120, 180, 500, 480];

      if (targetClass.includes('pothole')) {
        targetClassId = 4;
        bbox = [140, 200, 520, 610];
      } else if (targetClass.includes('transverse')) {
        targetClassId = 1;
        bbox = [100, 250, 700, 380];
      } else if (targetClass.includes('alligator')) {
        targetClassId = 2;
        bbox = [150, 160, 580, 520];
      } else if (targetClass.includes('corruption')) {
        targetClassId = 3;
        bbox = [180, 220, 620, 540];
      }

      const simConfidence = 0.88;
      aiDetection = {
        model_name: 'NagarSam Road Defect Detector',
        model_version: 'RDD2022-YOLO11m-demo',
        source: 'mock',
        detected: true,
        pothole_detected: targetClass.includes('pothole'),
        confidence: simConfidence,
        primaryDefectClass: targetClass,
        primary_defect: targetClass,
        primary_confidence: simConfidence,
        detections: [
          {
            class: targetClass,
            class_id: targetClassId,
            class_name: targetClass,
            confidence: simConfidence,
            bbox,
          },
        ],
        inference_time_ms: 78,
        timestamp: new Date().toISOString(),
        isMock: true,
        image_width: 800,
        image_height: 600,
      };
    }

    const confidence = aiDetection?.confidence || 0.88;
    const severity: Severity = aiPrimaryDefect === 'pothole' ? 'CRITICAL' : aiPrimaryDefect === 'alligator crack' ? 'HIGH' : 'MEDIUM';
    const priority: Priority = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : 'MEDIUM';

    const newReport: Report = {
      id: reportId,
      citizenId: user.id,
      citizenName: user.name || dto.citizenName || 'Citizen Reporter',
      citizenPhone: user.phone || dto.citizenPhone || '+91 98765 43210',
      imageUrl,
      issueType: citizenIssueType,
      primaryDefect: aiPrimaryDefect,
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
      aiDetection,
      aiPriorityReasoning: {
        recommendation: priority,
        confidenceScore: Math.round(confidence * 100),
        factors: [
          `RDD2022 visual confidence (${(confidence * 100).toFixed(0)}%) for ${aiPrimaryDefect}`,
          'Road fissure surface area threshold analyzed',
          'Corridor transit density evaluated',
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
          title: 'AI Defect Analysis Logged',
          description: `Defect verified as ${aiPrimaryDefect} (${(confidence * 100).toFixed(0)}% confidence).`,
          actor: aiDetection?.model_name || 'RDD2022 AI Engine',
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
