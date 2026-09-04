import { AnalyticsOverview } from '../../types';

export interface ReportsTimeTrend {
  date: string;
  reports: number;
  resolved: number;
}

export interface SeverityDistribution {
  name: string;
  value: number;
  color: string;
}

export interface PriorityDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DepartmentWorkload {
  name: string;
  active: number;
  completed: number;
  efficiency: number;
}

export interface IAnalyticsService {
  getOverview(): Promise<AnalyticsOverview>;
  getReportsTrend(days?: number): Promise<ReportsTimeTrend[]>;
  getSeverityDistribution(): Promise<SeverityDistribution[]>;
  getPriorityDistribution(): Promise<PriorityDistribution[]>;
  getDepartmentWorkload(): Promise<DepartmentWorkload[]>;
}
