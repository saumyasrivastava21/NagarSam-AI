import React, { useState } from 'react';
import { useAuditLogs } from '../../hooks/useUsers';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Badge } from '../../components/ui/Badge';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { Search } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useAuditLogs({
    search: search || undefined,
    page,
    limit: 10,
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (l) => <span className="text-xs text-slate-500 font-mono">{formatDateTime(l.timestamp)}</span>,
    },
    {
      key: 'userName',
      header: 'Actor & Role',
      render: (l) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900 block">{l.userName}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{l.userRole}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Executed',
      render: (l) => (
        <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
          {l.action}
        </span>
      ),
    },
    {
      key: 'resource',
      header: 'Resource & ID',
      render: (l) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{l.resource}</span>
          <span className="text-slate-400 block text-[11px] font-mono">{l.resourceId}</span>
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Status',
      render: (l) => (
        <Badge variant={l.result === 'SUCCESS' ? 'success' : 'danger'} size="sm" dot>
          {l.result}
        </Badge>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (l) => <span className="text-[11px] font-mono text-slate-400">{l.ipAddress}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Administration', href: '/admin' }, { label: 'Audit Logs' }]} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
          Immutable Civic Platform Audit Log
        </h1>
        <p className="text-xs text-slate-500">
          Cryptographically auditable trail of all complaint submissions, priority overrides, assignments, and verification checks.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, or resource ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-64"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={result?.data || []}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
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
