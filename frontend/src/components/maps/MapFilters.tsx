import React from 'react';
import { Severity, ReportStatus } from '../../types';
import { WARDS_DATA, ROAD_DEFECT_CLASSES } from '../../constants';

export interface MapFiltersState {
  status?: ReportStatus | 'ALL';
  severity?: Severity | 'ALL';
  defectType?: string | 'ALL';
  wardId?: string | 'ALL';
  search?: string;
}

export interface MapFiltersProps {
  filters: MapFiltersState;
  onChange: (filters: MapFiltersState) => void;
  className?: string;
}

export const MapFilters: React.FC<MapFiltersProps> = ({ filters, onChange, className }) => {
  return (
    <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-civic flex flex-wrap items-center gap-2.5 text-xs ${className || ''}`}>
      {/* Search */}
      <input
        type="text"
        placeholder="Filter by address or ID..."
        value={filters.search || ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 w-44 sm:w-52"
      />

      {/* Defect Type Filter */}
      <select
        value={filters.defectType || 'ALL'}
        onChange={(e) => onChange({ ...filters, defectType: e.target.value })}
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none cursor-pointer"
        aria-label="Filter by road defect category"
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
        value={filters.status || 'ALL'}
        onChange={(e) => onChange({ ...filters, status: e.target.value as any })}
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none cursor-pointer"
      >
        <option value="ALL">All Statuses</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="ASSIGNED">Work Assigned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="VERIFYING">Verifying</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      {/* Severity Filter */}
      <select
        value={filters.severity || 'ALL'}
        onChange={(e) => onChange({ ...filters, severity: e.target.value as any })}
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none cursor-pointer"
      >
        <option value="ALL">All Severities</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      {/* Ward Filter */}
      <select
        value={filters.wardId || 'ALL'}
        onChange={(e) => onChange({ ...filters, wardId: e.target.value })}
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
      >
        <option value="ALL">All Lucknow Wards</option>
        {WARDS_DATA.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export const MapLegend: React.FC<{ className?: string }> = ({ className }) => {
  const items = [
    { label: 'Critical', color: '#DC2626' },
    { label: 'High', color: '#EA580C' },
    { label: 'Medium', color: '#D97706' },
    { label: 'Low', color: '#16A34A' },
    { label: 'Resolved', color: '#10B981' },
  ];

  return (
    <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 ${className || ''}`}>
      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
