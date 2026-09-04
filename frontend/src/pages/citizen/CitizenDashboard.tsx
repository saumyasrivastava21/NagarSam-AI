import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useReports } from '../../hooks/useReports';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CivicMap } from '../../components/maps/CivicMap';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  PlusCircle,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { data: reportsResult, isLoading } = useReports({
    limit: 6,
  });

  const reports = reportsResult?.data || [];
  const myReports = reports.filter((r) => r.citizenId === currentUser?.id || r.citizenId === 'USR-01');

  const totalMyReports = myReports.length;
  const openCount = myReports.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'CONFIRMED').length;
  const inProgressCount = myReports.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'VERIFYING').length;
  const resolvedCount = myReports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
              Citizen Operations
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Lucknow Ward Network</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {currentUser?.name || 'Citizen'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Track submitted road hazard tickets, inspect AI computer vision bounding boxes, and monitor municipal field repair progress.
          </p>
        </div>

        <Link to="/citizen/report" className="shrink-0">
          <Button variant="accent" size="md" className="font-semibold shadow-sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Report a Road Issue
          </Button>
        </Link>
      </div>

      {/* KPI Stats Row: Clean, restrained numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={totalMyReports}
          subtitle="Submitted tickets"
          icon={<FileText className="w-4 h-4" />}
          variant="primary"
        />
        <StatCard
          title="Under Review"
          value={openCount}
          subtitle="Pending triage"
          icon={<Clock className="w-4 h-4" />}
          variant="accent"
        />
        <StatCard
          title="In Active Repair"
          value={inProgressCount}
          subtitle="Workforce assigned"
          icon={<Wrench className="w-4 h-4" />}
          variant="secondary"
        />
        <StatCard
          title="Verified Resolved"
          value={resolvedCount}
          subtitle="Dual-verified patch"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="default"
        />
      </div>

      {/* Grid: Recent Submissions & Nearby Hazards Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Submissions */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Your Recent Reports ({totalMyReports})
            </h2>
            <Link to="/citizen/reports" className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                </div>
              ))
            ) : myReports.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-dashed border-slate-300 text-center space-y-3">
                <p className="text-xs text-slate-500">You haven't reported any road defect incidents yet.</p>
                <Link to="/citizen/report">
                  <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                    Report Road Defect
                  </Button>
                </Link>
              </div>
            ) : (
              myReports.slice(0, 3).map((report) => (
                <Link key={report.id} to={`/citizen/reports/${report.id}`} className="block group">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 group-hover:border-primary-400 group-hover:shadow-sm transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary-700">{report.id}</span>
                      <StatusBadge status={report.status} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{report.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[200px]">{report.wardName}</span>
                      </span>
                      <StatusBadge severity={report.severity} size="sm" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Nearby Road Hazards Map */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Nearby Lucknow Road Defects
            </h2>
            <Link to="/citizen/nearby" className="text-xs font-semibold text-primary-700 hover:underline flex items-center gap-1">
              <span>Fullscreen Map</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <CivicMap
            items={reports.slice(0, 8)}
            detailRoutePrefix="/citizen/reports"
            height="340px"
          />
        </div>
      </div>
    </div>
  );
};

