import React from 'react';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CompletedJobsPage: React.FC = () => {
  const { data: result } = useWorkOrders();

  const completed = (result?.data || []).filter(
    (w) => w.status === 'COMPLETED' || w.status === 'RESOLVED' || w.status === 'VERIFYING'
  );

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Field Console', href: '/worker' }, { label: 'Completed Repairs' }]} />
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
          Completed Field Repairs & Verification Log
        </h1>
        <p className="text-xs text-slate-500">
          History of road defect repairs executed by your unit with AI verification scores.
        </p>
      </div>

      <div className="space-y-4">
        {completed.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400">
            No completed repairs recorded in this session.
          </Card>
        ) : (
          completed.map((job) => (
            <Card key={job.id} className="p-5 shadow-civic space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.locationAddress}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge workOrderStatus={job.status} size="sm" />
                </div>
              </div>

              {/* Before vs After thumbnail view */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Before (Original Defect)</span>
                  <div className="rounded-lg overflow-hidden border border-slate-200 h-32 bg-slate-900">
                    <img src={job.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">After (Repaired Surface)</span>
                  <div className="rounded-lg overflow-hidden border border-slate-200 h-32 bg-slate-900">
                    {job.afterImageUrl ? (
                      <img src={job.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">Photo pending</div>
                    )}
                  </div>
                </div>
              </div>

              {job.verification && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Verification Score: {((job.verification.verificationScore || 0.93) * 100).toFixed(0)}%</span>
                  </div>
                  <Link to={`/worker/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                      Inspect Details
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
