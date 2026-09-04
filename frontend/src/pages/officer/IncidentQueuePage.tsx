import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIncidents } from '../../hooks/useIncidents';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Incident, Priority, ReportStatus } from '../../types';
import { WARDS_DATA, ROAD_DEFECT_CLASSES } from '../../constants';
import { formatDate } from '../../utils/formatters';
import { Search, Eye, Flame } from 'lucide-react';

export const IncidentQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [defectFilter, setDefectFilter] = useState<string | 'ALL'>('ALL');
  const [wardFilter, setWardFilter] = useState<string | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useIncidents({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
    wardId: wardFilter === 'ALL' ? undefined : wardFilter,
    search: search || undefined,
    page,
    limit: 10,
  });

  const incidentList = (result?.data || []).filter((i) => {
    if (defectFilter === 'ALL') return true;
    const type = i.issueType || i.primaryDefect || '';
    return type.toLowerCase() === defectFilter.toLowerCase();
  });

  const columns: Column<Incident>[] = [
    {
      key: 'id',
      header: 'Incident ID',
      sortable: true,
      render: (i) => <span className="font-bold text-primary-700 dark:text-primary-400 text-xs">{i.id}</span>,
    },
    {
      key: 'issueType',
      header: 'Issue Type',
      render: (i) => {
        const type = i.issueType || i.primaryDefect || 'Road Defect';
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 capitalize border border-primary-200 dark:border-primary-800">
            {type}
          </span>
        );
      },
    },
    {
      key: 'title',
      header: 'Location & Ward',
      render: (i) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">{i.address}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{i.wardName}</span>
        </div>
      ),
    },
    {
      key: 'confidence',
      header: 'AI Conf.',
      render: (i) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          {((i.aiDetection?.confidence || 0.94) * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (i) => <StatusBadge severity={i.severity} size="sm" />,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (i) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge priority={i.priority} size="sm" />
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            {i.priorityScore}/100
          </span>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: (i) => (
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px] block">
          {i.departmentName || 'Zone Operations'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <StatusBadge status={i.status} size="sm" />,
    },
    {
      key: 'createdAt',
      header: 'Reported',
      render: (i) => <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(i.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (i) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link to={`/officer/incidents/${i.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
              Triage
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Operations Desk', href: '/officer' }, { label: 'Incident Queue' }]} />
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Municipal Road Incident Queue & Triage Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review multi-class AI defect inferences, adjust priority scores, and dispatch work orders.
          </p>
        </div>

        <Link to="/officer/priority">
          <Button variant="accent" size="sm" leftIcon={<Flame className="w-4 h-4" />}>
            Priority Escalation Queue
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident ID, address or ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-slate-800 dark:text-slate-100 bg-transparent placeholder:text-slate-400 focus:outline-none w-48 sm:w-60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Defect Type Filter */}
          <select
            value={defectFilter}
            onChange={(e) => setDefectFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            aria-label="Filter by defect type"
          >
            <option value="ALL">All Defect Types</option>
            {ROAD_DEFECT_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls.charAt(0).toUpperCase() + cls.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ASSIGNED">Work Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="VERIFYING">Verifying</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">P0 Critical</option>
            <option value="HIGH">P1 High</option>
            <option value="MEDIUM">P2 Standard</option>
            <option value="LOW">P3 Scheduled</option>
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
          >
            <option value="ALL">All Wards</option>
            {WARDS_DATA.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Incidents DataTable */}
      <DataTable
        columns={columns}
        data={incidentList}
        keyExtractor={(i) => i.id}
        isLoading={isLoading}
        onRowClick={(i) => navigate(`/officer/incidents/${i.id}`)}
        emptyTitle="No Incidents in Queue"
        emptyDescription="All incoming incidents in this filter category have been resolved."
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
        renderMobileCard={(i) => (
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-primary-700 dark:text-primary-400">{i.id}</span>
              <StatusBadge priority={i.priority} size="sm" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 capitalize">
                {i.issueType || i.primaryDefect || 'Road Defect'}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{i.title}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>{i.wardName}</span>
              <StatusBadge status={i.status} size="sm" />
            </div>
          </div>
        )}
      />
    </div>
  );
};
