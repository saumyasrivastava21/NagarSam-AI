import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { useAuthStore } from '../../stores/useAuthStore';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { WorkOrderStatus } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { MapPin, ArrowRight, Search } from 'lucide-react';

export const AssignedJobsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const { data: result } = useWorkOrders({
    assignedWorkerId: currentUser?.role === 'FIELD_WORKER' ? currentUser.id : undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search || undefined,
  });

  const jobs = result?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Field Console', href: '/worker' }, { label: 'Assigned Jobs' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Assigned Field Repair Jobs
          </h1>
          <p className="text-xs text-slate-500">
            Field work orders dispatched to your maintenance unit.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by job ID or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-56"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            No work orders currently match the selected criteria.
          </div>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="p-5 shadow-civic hover:border-amber-400 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">{job.id}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge priority={job.priority} size="sm" />
                  <StatusBadge workOrderStatus={job.status} size="sm" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.locationAddress}</span>
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600">
                <strong>Instructions:</strong> {job.instructions}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Due: {formatDateTime(job.dueDate)}</span>
                <Link to={`/worker/jobs/${job.id}`}>
                  <Button variant="accent" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open Console
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
