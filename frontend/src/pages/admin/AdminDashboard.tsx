import React from 'react';
import {
  useAnalyticsOverview,
  useReportsTrend,
  useSeverityDistribution,
  useDepartmentWorkload,
} from '../../hooks/useAnalytics';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { ReportsChart } from '../../components/charts/ReportsChart';
import { SeverityChart, DepartmentWorkloadChart } from '../../components/charts/SeverityChart';
import {
  Users,
  Activity,
  Cpu,
  Sliders,
  ScrollText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const { data: overview } = useAnalyticsOverview();
  const { data: trendData } = useReportsTrend(7);
  const { data: severityData } = useSeverityDistribution();
  const { data: workloadData } = useDepartmentWorkload();

  return (
    <div className="space-y-6">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Platform Governance
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">System Administrator Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Infrastructure, Model Registry & Audit Console
          </h1>
          <p className="text-xs text-slate-500">
            Monitor model registries, configure AI inference thresholds, supervise health telemetry, and inspect audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/admin/models">
            <Button variant="outline" size="sm" leftIcon={<Cpu className="w-4 h-4 text-primary-600" />}>
              Model Registry
            </Button>
          </Link>
          <Link to="/admin/ai">
            <Button variant="primary" size="sm" className="font-semibold" leftIcon={<Sliders className="w-4 h-4" />}>
              AI Thresholds
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Users"
          value="20 Accounts"
          subtitle="4 configured roles"
          icon={<Users className="w-4 h-4" />}
          variant="primary"
        />
        <StatCard
          title="AI Inference Jobs"
          value={overview?.aiJobsToday || 14}
          subtitle="84ms avg inference latency"
          icon={<Cpu className="w-4 h-4" />}
          variant="secondary"
        />
        <StatCard
          title="System Availability"
          value="99.96%"
          subtitle="5 healthy microservices"
          icon={<Activity className="w-4 h-4" />}
          variant="default"
        />
        <StatCard
          title="Audit Trail Logs"
          value="30 Events"
          subtitle="Immutable event trace"
          icon={<ScrollText className="w-4 h-4" />}
          variant="accent"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Cross-Ward Reports & Resolution Trends
            </h3>
            <ReportsChart data={trendData || []} height={260} />
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Defect Severity Ratio</h3>
            <SeverityChart data={severityData || []} height={240} />
          </Card>
        </div>

        <div className="lg:col-span-12">
          <Card className="p-5 shadow-civic space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Department Workload & Performance</h3>
            <DepartmentWorkloadChart data={workloadData || []} height={240} />
          </Card>
        </div>
      </div>
    </div>
  );
};

