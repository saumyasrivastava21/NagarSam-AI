import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIncidents } from '../../hooks/useIncidents';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Incident } from '../../types';
import { Flame, Eye, AlertTriangle } from 'lucide-react';

export const PriorityQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useIncidents({
    sortByPriority: true,
    page,
    limit: 10,
  });

  const columns: Column<Incident>[] = [
    {
      key: 'priorityScore',
      header: 'Score',
      sortable: true,
      render: (i) => (
        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
          i.priorityScore >= 90
            ? 'bg-red-100 text-red-800 ring-1 ring-red-300'
            : i.priorityScore >= 80
            ? 'bg-orange-100 text-orange-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {i.priorityScore} / 100
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Escalation Level',
      render: (i) => <StatusBadge priority={i.priority} size="sm" />,
    },
    {
      key: 'id',
      header: 'Incident ID',
      render: (i) => <span className="font-bold text-primary-700 text-xs">{i.id}</span>,
    },
    {
      key: 'address',
      header: 'Location & Ward',
      render: (i) => (
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{i.address}</p>
          <span className="text-[11px] text-slate-500">{i.wardName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <StatusBadge status={i.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (i) => (
        <Link to={`/officer/incidents/${i.id}`}>
          <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Triage
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Operations Desk', href: '/officer' }, { label: 'Priority Queue' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Dynamic Priority Escalation Queue
          </h1>
          <p className="text-xs text-slate-500">
            Road defects dynamically prioritized via AI cavity dimensions, traffic density, and corroborated hazard counts.
          </p>
        </div>
      </div>

      {/* Priority Legend Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
          <div className="font-black flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-600" />
            <span>P0 - Critical (90-100)</span>
          </div>
          <p className="text-[11px] text-red-700">Immediate hazard on arterial transit roads</p>
        </div>

        <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span>P1 - High (80-89)</span>
          </div>
          <p className="text-[11px] text-orange-700">Primary residential and commercial corridors</p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="font-bold">P2 - Standard (70-79)</div>
          <p className="text-[11px] text-amber-700">Service lanes with moderate vehicular flow</p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
          <div className="font-bold">P3 - Scheduled (&lt;70)</div>
          <p className="text-[11px] text-emerald-700">Minor edge fissures queued for batch paving</p>
        </div>
      </div>

      {/* Queue DataTable */}
      <DataTable
        columns={columns}
        data={result?.data || []}
        keyExtractor={(i) => i.id}
        isLoading={isLoading}
        onRowClick={(i) => navigate(`/officer/incidents/${i.id}`)}
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
