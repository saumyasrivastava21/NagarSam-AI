import {
  IAnalyticsService,
  ReportsTimeTrend,
  SeverityDistribution,
  PriorityDistribution,
  DepartmentWorkload,
} from '../contracts/analytics.contract';
import { AnalyticsOverview } from '../../types';
import { mockStore } from './mockStore';

export class MockAnalyticsService implements IAnalyticsService {
  async getOverview(): Promise<AnalyticsOverview> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const db = mockStore.getDB();
    const totalReports = db.reports.length;
    const openIncidents = db.incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'REJECTED').length;
    const criticalIncidents = db.incidents.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length;
    const inProgressJobs = db.workOrders.filter((w) => w.status === 'IN_PROGRESS' || w.status === 'ACCEPTED').length;
    const resolvedIncidents = db.incidents.filter((i) => i.status === 'RESOLVED').length;

    return {
      totalReports,
      openIncidents,
      criticalIncidents,
      inProgressJobs,
      resolvedIncidents,
      resolutionRatePercentage: Math.round((resolvedIncidents / Math.max(1, totalReports)) * 100),
      averageResolutionHours: 18.4,
      reportsToday: 6,
      aiJobsToday: 14,
      systemHealthSummary: 'Nominal Operations',
    };
  }

  async getReportsTrend(_days = 7): Promise<ReportsTimeTrend[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [
      { date: 'Aug 29', reports: 4, resolved: 3 },
      { date: 'Aug 30', reports: 7, resolved: 5 },
      { date: 'Aug 31', reports: 6, resolved: 6 },
      { date: 'Sep 01', reports: 9, resolved: 7 },
      { date: 'Sep 02', reports: 8, resolved: 8 },
      { date: 'Sep 03', reports: 12, resolved: 9 },
      { date: 'Sep 04', reports: 6, resolved: 4 },
    ];
  }

  async getSeverityDistribution(): Promise<SeverityDistribution[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const db = mockStore.getDB();
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    db.reports.forEach((r) => {
      counts[r.severity] = (counts[r.severity] || 0) + 1;
    });

    return [
      { name: 'Critical', value: counts.CRITICAL, color: '#DC2626' },
      { name: 'High', value: counts.HIGH, color: '#EA580C' },
      { name: 'Medium', value: counts.MEDIUM, color: '#D97706' },
      { name: 'Low', value: counts.LOW, color: '#16A34A' },
    ];
  }

  async getPriorityDistribution(): Promise<PriorityDistribution[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const db = mockStore.getDB();
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    db.incidents.forEach((i) => {
      counts[i.priority] = (counts[i.priority] || 0) + 1;
    });

    return [
      { name: 'P0 - Immediate', value: counts.CRITICAL, color: '#DC2626' },
      { name: 'P1 - High', value: counts.HIGH, color: '#EA580C' },
      { name: 'P2 - Standard', value: counts.MEDIUM, color: '#D97706' },
      { name: 'P3 - Scheduled', value: counts.LOW, color: '#16A34A' },
    ];
  }

  async getDepartmentWorkload(): Promise<DepartmentWorkload[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [
      { name: 'Road Maintenance (RMD)', active: 14, completed: 82, efficiency: 94 },
      { name: 'Public Works (PWD)', active: 8, completed: 65, efficiency: 89 },
      { name: 'Street Infrastructure (SID)', active: 5, completed: 41, efficiency: 91 },
      { name: 'Emergency Unit (ERU)', active: 3, completed: 29, efficiency: 98 },
    ];
  }
}

export const mockAnalyticsService = new MockAnalyticsService();
