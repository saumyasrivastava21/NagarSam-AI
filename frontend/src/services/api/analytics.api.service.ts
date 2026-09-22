import { apiClient } from './client';
import {
  IAnalyticsService,
  ReportsTimeTrend,
  SeverityDistribution,
  PriorityDistribution,
  DepartmentWorkload
} from '../contracts/analytics.contract';
import { AnalyticsOverview } from '../../types';

export class ApiAnalyticsService implements IAnalyticsService {
  async getOverview(): Promise<AnalyticsOverview> {
    const res = await apiClient.get<AnalyticsOverview>('/analytics/overview');
    return res.data;
  }

  async getReportsTrend(days?: number): Promise<ReportsTimeTrend[]> {
    const res = await apiClient.get<ReportsTimeTrend[]>('/analytics/trends', { params: { days } });
    return res.data;
  }

  async getSeverityDistribution(): Promise<SeverityDistribution[]> {
    const res = await apiClient.get<SeverityDistribution[]>('/analytics/severity-distribution');
    return res.data;
  }

  async getPriorityDistribution(): Promise<PriorityDistribution[]> {
    const res = await apiClient.get<PriorityDistribution[]>('/analytics/priority-distribution');
    return res.data;
  }

  async getDepartmentWorkload(): Promise<DepartmentWorkload[]> {
    const res = await apiClient.get<DepartmentWorkload[]>('/analytics/department-workload');
    return res.data;
  }
}
