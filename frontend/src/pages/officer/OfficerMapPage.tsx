import React, { useState } from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { CivicMap } from '../../components/maps/CivicMap';
import { MapFilters, MapFiltersState, MapLegend } from '../../components/maps/MapFilters';
import { Incident } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Link } from 'react-router-dom';

export const OfficerMapPage: React.FC = () => {
  const [filters, setFilters] = useState<MapFiltersState>({
    status: 'ALL',
    severity: 'ALL',
    wardId: 'ALL',
    search: '',
  });

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const { data: result } = useIncidents({
    status: filters.status === 'ALL' ? undefined : filters.status,
    severity: filters.severity === 'ALL' ? undefined : filters.severity,
    wardId: filters.wardId === 'ALL' ? undefined : filters.wardId,
    search: filters.search,
    limit: 50,
  });

  const incidents = result?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Operations Desk', href: '/officer' }, { label: 'GIS Map' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            GIS Operations & Ward Dispatch Map
          </h1>
          <p className="text-xs text-slate-500">
            Interactive spatial visualization of municipal zones, incident clusters, and active worker assignments.
          </p>
        </div>

        <MapLegend />
      </div>

      <MapFilters filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incident List */}
        <div className="lg:col-span-4 space-y-3 order-2 lg:order-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Filtered Incidents ({incidents.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-50/80 border-primary-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-primary-700">{inc.id}</span>
                    <StatusBadge priority={inc.priority} size="sm" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{inc.title}</h5>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[150px]">{inc.wardName}</span>
                    <Link to={`/officer/incidents/${inc.id}`} className="font-bold text-primary-700 hover:underline">
                      Triage →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map Canvas */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <CivicMap
            items={incidents}
            selectedItem={selectedIncident}
            onSelectItem={(item) => setSelectedIncident(item as Incident)}
            detailRoutePrefix="/officer/incidents"
            height="620px"
          />
        </div>
      </div>
    </div>
  );
};
