import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReports } from '../../hooks/useReports';
import { useAuthStore } from '../../stores/useAuthStore';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Report, ReportStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ROAD_DEFECT_CLASSES } from '../../constants';
import { PlusCircle, Eye, Search } from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [defectFilter, setDefectFilter] = useState<string | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useReports({
    citizenId: currentUser?.role === 'CITIZEN' ? currentUser.id : undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search || undefined,
    page,
    limit: 10,
  });

  // Client filter for defect type if selected
  const reportsList = (result?.data || []).filter((r) => {
    if (defectFilter === 'ALL') return true;
    const type = r.issueType || r.primaryDefect || '';
    return type.toLowerCase() === defectFilter.toLowerCase();
  });

  const columns: Column<Report>[] = [
    {
      key: 'id',
      header: 'Report ID',
      sortable: true,
      render: (r) => <span className="font-bold text-primary-700 dark:text-primary-400 text-xs">{r.id}</span>,
    },
    {
      key: 'defectType',
      header: 'Defect Type',
      render: (r) => {
        const type = r.issueType || r.primaryDefect || 'Road Defect';
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 capitalize border border-slate-200 dark:border-slate-700">
            {type}
          </span>
        );
      },
    },
    {
      key: 'address',
      header: 'Location & Ward',
      render: (r) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">{r.address}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{r.wardName}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      sortable: true,
      render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (r) => <StatusBadge severity={r.severity} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (r) => (
        <Link to={`/citizen/reports/${r.id}`}>
          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Track
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Citizen Portal', href: '/citizen' }, { label: 'My Reports' }]} />
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            My Road Issue Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View submitted reports, check AI defect detection confidence, and follow repair progress.
          </p>
        </div>

        <Link to="/citizen/report">
          <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Report a Road Issue
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search report ID or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-slate-800 dark:text-slate-100 bg-transparent placeholder:text-slate-400 focus:outline-none w-48 sm:w-64"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Status Filter */}
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
        </div>
      </div>

      {/* Reports Table */}
      <DataTable
        columns={columns}
        data={reportsList}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        onRowClick={(r) => navigate(`/citizen/reports/${r.id}`)}
        emptyTitle="No Road Issues Found"
        emptyDescription="You haven't submitted any reports matching the selected filters."
        emptyActionLabel="Report a Road Issue"
        onEmptyAction={() => navigate('/citizen/report')}
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
        renderMobileCard={(r) => (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-primary-700 dark:text-primary-400">{r.id}</span>
              <StatusBadge status={r.status} size="sm" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 capitalize">
                {r.issueType || r.primaryDefect || 'Road Defect'}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{r.address}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>{formatDate(r.createdAt)}</span>
              <StatusBadge severity={r.severity} size="sm" />
            </div>
          </div>
        )}
      />
    </div>
  );
};
