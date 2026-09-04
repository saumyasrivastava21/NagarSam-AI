import { Report, ReportStatus, Severity, Priority } from '../../types';

export interface CreateReportDTO {
  imageFile?: File;
  imageUrl?: string;
  description: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  address?: string;
  wardId?: string;
  citizenName?: string;
  citizenPhone?: string;
}

export interface ReportFilterParams {
  status?: ReportStatus;
  severity?: Severity;
  priority?: Priority;
  wardId?: string;
  citizenId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IReportsService {
  getReports(params?: ReportFilterParams): Promise<PaginatedResult<Report>>;
  getReportById(id: string): Promise<Report>;
  createReport(dto: CreateReportDTO): Promise<Report>;
  updateReportStatus(id: string, status: ReportStatus, note?: string): Promise<Report>;
  getNearbyReports(lat: number, lng: number, radiusKm?: number): Promise<Report[]>;
}
