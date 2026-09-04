import React from 'react';
import { useSystemHealth } from '../../hooks/useUsers';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Server, Database, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const SystemHealthPage: React.FC = () => {
  const { data: services, refetch } = useSystemHealth();

  const handleRefresh = () => {
    refetch();
    toast.success('Service health telemetry refreshed.');
  };

  const getIcon = (name: string) => {
    if (name.includes('Database') || name.includes('Spatial')) return <Database className="w-5 h-5 text-primary-600" />;
    if (name.includes('AI') || name.includes('RDD2022')) return <Cpu className="w-5 h-5 text-amber-600" />;
    if (name.includes('Storage')) return <HardDrive className="w-5 h-5 text-secondary-600" />;
    return <Server className="w-5 h-5 text-slate-700" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Administration', href: '/admin' }, { label: 'System Health' }]} />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Microservice Health & Infrastructure Telemetry
          </h1>
          <p className="text-xs text-slate-500">
            Real-time latency, uptime percentage, and worker queue depths.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Run Telemetry Check
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(services || []).map((srv) => (
          <Card key={srv.name} className="p-5 shadow-civic space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  {getIcon(srv.name)}
                </div>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{srv.name}</h3>
              </div>
              <Badge variant={srv.status === 'HEALTHY' ? 'success' : 'danger'} size="sm" dot>
                {srv.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Latency</span>
                <span className="font-bold text-slate-900">{srv.latencyMs} ms</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Uptime</span>
                <span className="font-bold text-emerald-600">{srv.uptimePercentage}%</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Queue</span>
                <span className="font-bold text-slate-900">{srv.queueLength}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Last polled: {srv.lastChecked}</span>
              <span className="text-emerald-600 font-bold">● Nominal</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
