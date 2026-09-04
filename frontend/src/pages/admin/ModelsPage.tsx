import React from 'react';
import { useModels } from '../../hooks/useUsers';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ROAD_DEFECT_CLASSES } from '../../constants';
import { Cpu, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ModelsPage: React.FC = () => {
  const { data: models } = useModels();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Administration', href: '/admin' }, { label: 'Model Registry' }]} />
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            NagarSam Road Defect AI Engine Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-class road defect object detection models, inference benchmark evaluations, and candidate weights.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('Model candidate benchmark metrics refreshed.')}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Benchmarks
        </Button>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <h4 className="font-bold">Model Architecture & Environment Status</h4>
          <p className="leading-relaxed text-amber-800 dark:text-amber-300">
            Current status: <strong>Development / Mock Environment</strong>. The <strong>RDD2022-v1</strong> YOLO model candidate is evaluated for 5 distinct road defect categories at 84ms inference latency on 1024x1024 frames. Live production inference workers will connect in Phase 2.
          </p>
        </div>
      </div>

      {/* Supported Classes Card */}
      <Card className="p-5 shadow-civic space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-600" />
          <span>Supported Road Defect Classes (5 Categories)</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The RDD2022 multi-class detection pipeline classifies visual road damage into the following categories:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {ROAD_DEFECT_CLASSES.map((cls, idx) => (
            <div
              key={cls}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1"
            >
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">Class {idx + 1}</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">{cls}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Models Grid */}
      <div className="space-y-4">
        {(models || []).map((mod) => (
          <Card key={mod.id} className="p-5 shadow-civic space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{mod.name}</h3>
                    <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                      {mod.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{mod.framework} · {mod.task}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Development / Mock
                </span>
                <Badge
                  variant={
                    mod.status === 'PRODUCTION_CANDIDATE'
                      ? 'success'
                      : mod.status === 'EVALUATING'
                      ? 'warning'
                      : 'default'
                  }
                  size="sm"
                  dot
                >
                  {mod.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">mAP@50 Accuracy</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{(mod.mAP50 * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Avg. Latency</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">⚡ {mod.inferenceTimeMs} ms</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Input Dimensions</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{mod.inputSize}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Param Count</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{mod.parameters}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
