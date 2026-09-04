import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Wrench, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const WorkerDashboard: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { data: result, isLoading } = useWorkOrders();

  const allJobs = result?.data || [];
  const assignedJobs = allJobs.filter((w) => w.assignedWorkerId === currentUser?.id || w.assignedWorkerId === 'USR-03');

  const pendingCount = assignedJobs.filter((w) => w.status === 'ASSIGNED' || w.status === 'ACCEPTED').length;
  const inProgressCount = assignedJobs.filter((w) => w.status === 'IN_PROGRESS').length;
  const completedCount = assignedJobs.filter((w) => w.status === 'COMPLETED' || w.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Field Worker Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Field Unit Dispatch
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Mobile Outdoor Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {currentUser?.name || 'Field Worker'}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg">
            Acknowledge dispatched repair orders, navigate to road defect GPS coordinates, and upload post-repair photographs for AI verification.
          </p>
        </div>

        <Link to="/worker/jobs" className="shrink-0">
          <Button variant="outline" size="md" className="font-semibold text-slate-800 border-slate-300 hover:bg-slate-50">
            View Assigned Jobs ({assignedJobs.length})
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Assigned / Pending"
          value={pendingCount}
          icon={<Clock className="w-4 h-4" />}
          variant="accent"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={<Wrench className="w-4 h-4" />}
          variant="primary"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="secondary"
        />
      </div>

      {/* Urgent Jobs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Today's Assigned Repair Orders
            </h2>
            <p className="text-xs text-slate-500">Prioritized by municipal operations center for immediate execution.</p>
          </div>
          <Link to="/worker/jobs" className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1">
            <span>All Field Jobs</span>
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
          ) : assignedJobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              No repair jobs currently assigned to your field unit.
            </div>
          ) : (
            assignedJobs.slice(0, 4).map((job) => (
              <div key={job.id} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">{job.id}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge priority={job.priority} size="sm" />
                    <StatusBadge workOrderStatus={job.status} size="sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.locationAddress}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 font-medium">
                  <strong className="text-slate-800">Field Instructions:</strong> {job.instructions}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">Target: {formatDateTime(job.dueDate)}</span>
                  <Link to={`/worker/jobs/${job.id}`}>
                    <Button variant="accent" size="sm" className="font-semibold" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Open Job Console
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

