import {
  IReportsService,
  CreateReportDTO,
  ReportFilterParams,
  PaginatedResult,
} from '../contracts/reports.contract';
import { Report, ReportStatus } from '../../types';
import { calculateDistanceKm } from '../../utils/geo';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiReportsService implements IReportsService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('/api/v1/storage/')) {
      const backendRoot = this.baseUrl.replace(/\/api\/v1\/?$/, '');
      return `${backendRoot}${url}`;
    }
    return url;
  }

  private normalizeReport(r: any): Report {
    return {
      ...r,
      imageUrl: this.resolveImageUrl(r.imageUrl || r.image_url),
      aiDetection: r.aiDetection || r.ai_detection,
    };
  }

  async getReports(params?: ReportFilterParams): Promise<PaginatedResult<Report>> {
    const searchParams = new URLSearchParams();
    if (params?.citizenId) searchParams.append('citizenId', params.citizenId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.wardId) searchParams.append('wardId', params.wardId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/reports${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch reports (${response.status}): ${response.statusText}`);
    }
    const result = await response.json();
    return {
      ...result,
      data: (result.data || []).map((r: any) => this.normalizeReport(r)),
    };
  }

  async getReportById(id: string): Promise<Report> {
    const response = await fetch(`${this.baseUrl}/reports/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Report ${id} not found.`);
      }
      throw new Error(`Failed to fetch report ${id} (${response.status})`);
    }
    const report = await response.json();
    return this.normalizeReport(report);
  }

  async createReport(dto: CreateReportDTO): Promise<Report> {
    const formData = new FormData();
    if (dto.imageFile) {
      formData.append('file', dto.imageFile);
    }
    if (dto.imageUrl) {
      formData.append('image_url', dto.imageUrl);
    }
    formData.append('citizen_name', dto.citizenName || 'Citizen Reporter');
    formData.append('citizen_phone', dto.citizenPhone || '+91 98765 43210');
    formData.append('issue_type', dto.issueType || 'longitudinal crack');
    if (dto.primaryDefect) {
      formData.append('primary_defect', dto.primaryDefect);
    }
    formData.append('description', dto.description);
    if (dto.landmark) {
      formData.append('landmark', dto.landmark);
    }
    formData.append('latitude', dto.latitude.toString());
    formData.append('longitude', dto.longitude.toString());
    formData.append('address', dto.address || 'Lucknow, Uttar Pradesh');
    formData.append('ward_id', dto.wardId || 'WARD-01');

    if (dto.aiDetection) {
      formData.append('ai_detection_json', JSON.stringify(dto.aiDetection));
    }

    const response = await fetch(`${this.baseUrl}/reports`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Report submission failed (${response.status}): ${errorText || response.statusText}`);
    }

    const created = await response.json();
    return this.normalizeReport(created);
  }

  async updateReportStatus(id: string, status: ReportStatus, note?: string): Promise<Report> {
    const response = await fetch(`${this.baseUrl}/reports/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, note }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update status for report ${id}`);
    }

    const updated = await response.json();
    return this.normalizeReport(updated);
  }

  async getNearbyReports(lat: number, lng: number, radiusKm = 5): Promise<Report[]> {
    const all = await this.getReports({ limit: 100 });
    return all.data.filter((r) => calculateDistanceKm(lat, lng, r.latitude, r.longitude) <= radiusKm);
  }
}

export const apiReportsService = new ApiReportsService();
