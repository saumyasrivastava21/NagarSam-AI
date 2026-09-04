import React, { useState } from 'react';
import { CivicMap } from '../../components/maps/CivicMap';
import { MapFilters, MapFiltersState, MapLegend } from '../../components/maps/MapFilters';
import { useReports } from '../../hooks/useReports';
import { Report } from '../../types';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { MapPin } from 'lucide-react';

export const PublicMapPage: React.FC = () => {
  const [filters, setFilters] = useState<MapFiltersState>({
    status: 'ALL',
    severity: 'ALL',
    wardId: 'ALL',
    search: '',
  });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data: reportsResult, isLoading } = useReports({
    status: filters.status === 'ALL' ? undefined : filters.status,
    severity: filters.severity === 'ALL' ? undefined : filters.severity,
    wardId: filters.wardId === 'ALL' ? undefined : filters.wardId,
    search: filters.search,
    limit: 50,
  });

  const reports = reportsResult?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Breadcrumbs items={[{ label: 'Civic GIS Map' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Public Civic GIS Infrastructure Map
          </h1>
          <p className="text-xs text-slate-500">
            Real-time geospatial visualization of road defects and verified repairs across Lucknow.
          </p>
        </div>

        <MapLegend />
      </div>

      {/* Filter Bar */}
      <MapFilters filters={filters} onChange={setFilters} />

      {/* Main Grid: List Panel + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Incident List */}
        <div className="lg:col-span-4 space-y-3 order-2 lg:order-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Incidents ({reports.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click to inspect</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                </Card>
              ))
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No incidents match your filter criteria.
              </div>
            ) : (
              reports.map((r) => {
                const isSelected = selectedReport?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50/80 border-primary-400 shadow-sm'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-primary-700">{r.id}</span>
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">{r.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{r.wardName}</span>
                      </span>
                      <StatusBadge severity={r.severity} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Map Canvas */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <CivicMap
            items={reports}
            selectedItem={selectedReport}
            onSelectItem={(item) => setSelectedReport(item as Report)}
            height="620px"
          />
        </div>
      </div>
    </div>
  );
};
