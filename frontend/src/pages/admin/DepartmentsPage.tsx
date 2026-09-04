import React from 'react';
import { useDepartments, useWards } from '../../hooks/useUsers';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Building2, MapPin, Phone, Mail, User } from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const { data: departments } = useDepartments();
  const { data: wards } = useWards();

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs items={[{ label: 'Administration', href: '/admin' }, { label: 'Departments & Wards' }]} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
          Municipal Departments & Lucknow Ward Registry
        </h1>
        <p className="text-xs text-slate-500">
          Operational divisions and municipal zones responsible for road maintenance and spatial dispatch.
        </p>
      </div>

      {/* Departments Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-600" />
          <span>Municipal Operational Divisions</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(departments || []).map((dept) => (
            <Card key={dept.id} className="p-5 shadow-civic space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{dept.name}</h3>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-amber-700 block">{dept.activeIncidentsCount} Active</span>
                  <span className="text-[11px] text-slate-400">{dept.completedIncidentsCount} Resolved</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Head: <strong>{dept.headName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept.contactPhone}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Wards Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-secondary-600" />
          <span>Lucknow Municipal Ward Boundaries (10 Zones)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(wards || []).map((w) => (
            <div key={w.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{w.name}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {w.zone}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Corporator: <strong className="text-slate-700">{w.corporatorName}</strong>
              </div>
              <div className="text-[11px] text-slate-400">{w.corporatorPhone}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
