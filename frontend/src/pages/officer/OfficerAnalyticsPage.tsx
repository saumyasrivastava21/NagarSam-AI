import React from 'react';
import {
  useAnalyticsOverview,
  useReportsTrend,
  useSeverityDistribution,
  usePriorityDistribution,
  useDepartmentWorkload,
} from '../../hooks/useAnalytics';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { ReportsChart } from '../../components/charts/ReportsChart';
import {
  SeverityChart,
  PriorityChart,
  DepartmentWorkloadChart,
  DefectDistributionChart,
} from '../../components/charts/SeverityChart';
import { Clock, ShieldCheck, Activity, Award } from 'lucide-react';

export const OfficerAnalyticsPage: React.FC = () => {
  const { data: overview } = useAnalyticsOverview();
  const { data: trendData } = useReportsTrend(7);
  const { data: severityData } = useSeverityDistribution();
  const { data: priorityData } = usePriorityDistribution();
  const { data: workloadData } = useDepartmentWorkload();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Operations Desk', href: '/officer' }, { label: 'Analytics & Trends' }]} />
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          Civic Road Infrastructure Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Executive performance indicators, multi-class defect trends, AI detection metrics, and department throughput.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg. Resolution Time"
          value="18.4 hrs"
          subtitle="Simulated average resolution"
          icon={<Clock className="w-5 h-5" />}
          variant="primary"
          trend={{ value: '3.2 hrs faster', isPositive: true }}
        />
        <StatCard
          title="RDD2022 Inference"
          value="84 ms"
          subtitle="Sub-100ms real-time latency"
          icon={<Activity className="w-5 h-5" />}
          variant="secondary"
        />
        <StatCard
          title="Overall Resolution"
          value={`${overview?.resolutionRatePercentage || 67}%`}
          subtitle="30+ Lucknow cases"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title="Top Division"
          value="RMD Division"
          subtitle="94% patch efficiency"
          icon={<Award className="w-5 h-5" />}
          variant="accent"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Reported vs. Resolved Road Issues (7-Day Velocity)
            </h3>
            <ReportsChart data={trendData || []} height={280} />
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Defect Class Distribution</h3>
            <DefectDistributionChart height={240} />
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Severity Distribution</h3>
            <SeverityChart data={severityData || []} height={240} />
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Priority Triage Breakdown</h3>
            <PriorityChart data={priorityData || []} height={240} />
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Department Workload & Throughput</h3>
            <DepartmentWorkloadChart data={workloadData || []} height={240} />
          </Card>
        </div>
      </div>
    </div>
  );
};
