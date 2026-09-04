import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { WorkOrder, WorkOrderStatus } from '../../types';
import { Search, Eye } from 'lucide-react';

export const WorkOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useWorkOrders({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search || undefined,
    page,
    limit: 10,
  });

  const columns: Column<WorkOrder>[] = [
    {
      key: 'id',
      header: 'Work Order ID',
      sortable: true,
      render: (w) => <span className="font-bold text-primary-700 text-xs">{w.id}</span>,
    },
    {
      key: 'title',
      header: 'Task & Location',
      render: (w) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-900 truncate max-w-[220px]">{w.title}</p>
          <span className="text-[11px] text-slate-500">{w.locationAddress}</span>
        </div>
      ),
    },
    {
      key: 'assignedWorkerName',
      header: 'Assigned Worker',
      render: (w) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{w.assignedWorkerName}</span>
          <span className="block text-[10px] text-slate-400">{w.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (w) => <StatusBadge priority={w.priority} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => <StatusBadge workOrderStatus={w.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (w) => (
        <Link to={`/officer/work-orders/${w.id}`}>
          <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Inspect
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Operations Desk', href: '/officer' }, { label: 'Work Orders' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Municipal Work Orders Registry
          </h1>
          <p className="text-xs text-slate-500">
            Track field unit repair dispatches, materials, timelines, and post-repair verification sign-offs.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search work order ID, worker, or street..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-56 sm:w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed (Verification Ready)</option>
            <option value="RESOLVED">Resolved & Closed</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={result?.data || []}
        keyExtractor={(w) => w.id}
        isLoading={isLoading}
        onRowClick={(w) => navigate(`/officer/work-orders/${w.id}`)}
        emptyTitle="No Work Orders Found"
        emptyDescription="No field maintenance tasks match the selected criteria."
        pagination={
          result
            ? {
                currentPage: result.page,
                totalPages: result.totalPages,
                onPageChange: setPage,
                totalItems: result.total,
                pageSize: result.limit,
              }
            : undefined
        }
      />
    </div>
  );
};
