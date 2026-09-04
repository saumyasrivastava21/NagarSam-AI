import React from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsOverview, useReportsTrend, useSeverityDistribution } from '../../hooks/useAnalytics';
import { useIncidents } from '../../hooks/useIncidents';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ReportsChart } from '../../components/charts/ReportsChart';
import { SeverityChart } from '../../components/charts/SeverityChart';
import {
  AlertTriangle,
  Flame,
  Wrench,
  CheckCircle2,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { data: overview } = useAnalyticsOverview();
  const { data: trendData } = useReportsTrend(7);
  const { data: severityData } = useSeverityDistribution();
  const { data: incidentsResult } = useIncidents({ limit: 6 });

  const recentIncidents = incidentsResult?.data || [];

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
              Operations Control
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Lucknow Municipal Corporation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Incident Triage & Operations Overview
          </h1>
          <p className="text-xs text-slate-500">
            Monitor real-time incoming road damage incidents, AI priority rankings, and field unit progress across all 8 zones.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/officer/incidents">
            <Button variant="primary" size="sm" className="font-semibold" leftIcon={<AlertTriangle className="w-4 h-4" />}>
              Incident Queue
            </Button>
          </Link>
          <Link to="/officer/map">
            <Button variant="outline" size="sm" leftIcon={<MapPin className="w-4 h-4" />}>
              GIS Map
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Incidents"
          value={overview?.totalReports || 30}
          subtitle="All reported road defects"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="primary"
          trend={{ value: '12% from last week', isPositive: true }}
        />
        <StatCard
          title="P0 Critical Priority"
          value={overview?.criticalIncidents || 6}
          subtitle="Immediate dispatch required"
          icon={<Flame className="w-4 h-4" />}
          variant="danger"
        />
        <StatCard
          title="Active Repairs"
          value={overview?.inProgressJobs || 8}
          subtitle="Assigned to field crews"
          icon={<Wrench className="w-4 h-4" />}
          variant="accent"
        />
        <StatCard
          title="Resolution Velocity"
          value={`${overview?.resolutionRatePercentage || 67}%`}
          subtitle="Avg resolution: 18.4 hrs"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="default"
          trend={{ value: '8% efficiency gain', isPositive: true }}
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Trend Chart */}
        <div className="lg:col-span-8">
          <Card className="p-5 shadow-civic space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  7-Day Incident Triage & Resolution Velocity
                </h3>
                <p className="text-xs text-slate-500">Incoming citizen reports vs verified closures</p>
              </div>
              <Link to="/officer/analytics" className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1">
                <span>Analytics</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ReportsChart data={trendData || []} height={260} />
          </Card>
        </div>

        {/* Severity Breakdown */}
        <div className="lg:col-span-4">
          <Card className="p-5 shadow-civic space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Severity Distribution
              </h3>
              <p className="text-xs text-slate-500">RDD2022 AI classification breakdown</p>
            </div>
            <SeverityChart data={severityData || []} height={240} />
          </Card>
        </div>
      </div>

      {/* Critical Incidents Requiring Action */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              High Priority Incidents Requiring Dispatch
            </h2>
            <p className="text-xs text-slate-500">Flagged by AI reasoning engine as high transit impact.</p>
          </div>
          <Link to="/officer/priority" className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1">
            <span>Priority Queue</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentIncidents.slice(0, 3).map((inc) => (
            <div key={inc.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-400 hover:shadow-sm transition space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary-700">{inc.id}</span>
                <StatusBadge priority={inc.priority} size="sm" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{inc.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{inc.description}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-600">{inc.wardName}</span>
                <Link to={`/officer/incidents/${inc.id}`} className="font-semibold text-primary-700 hover:underline flex items-center gap-1">
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

