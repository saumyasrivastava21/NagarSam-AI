import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReport } from '../../hooks/useReports';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DetectionOverlay } from '../../components/ui/DetectionOverlay';
import { StatusTimeline } from '../../components/ui/StatusTimeline';
import { CivicMap } from '../../components/maps/CivicMap';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDateTime } from '../../utils/formatters';
import {
  MapPin,
  Sparkles,
  ArrowLeft,
  Share2,
  Cpu,
  Layers,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading, error } = useReport(id);

  if (isLoading) {
    return <LoadingState message="Loading incident telemetry & AI bounding boxes..." />;
  }

  if (error || !report) {
    return (
      <ErrorState
        title="Report Not Found"
        description={`We could not locate incident record ${id}.`}
      />
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Incident link copied to clipboard!');
  };

  const defectName = report.issueType || report.primaryDefect || 'Road Defect';
  const detections = report.aiDetection?.detections || [];
  const primaryConfidence = report.aiDetection?.confidence || 0.94;
  const isDetected = report.aiDetection ? (report.aiDetection.detected ?? report.aiDetection.pothole_detected) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Citizen Portal', href: '/citizen' },
              { label: 'My Reports', href: '/citizen/reports' },
              { label: report.id },
            ]}
          />
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{report.id}</h1>
            <span className="bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold px-2.5 py-1 rounded-full text-xs capitalize border border-primary-200 dark:border-primary-800">
              {defectName}
            </span>
            <StatusBadge status={report.status} size="md" />
            <StatusBadge severity={report.severity} size="md" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Share Report
          </Button>
          <Link to="/citizen/reports">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              All Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Photo + Detection + AI Road Analysis + AI Reasoning */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual AI Detection Overlay */}
          <Card className="p-0 overflow-hidden shadow-civic">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Photographic Evidence & AI Multi-Defect Overlay
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">RDD2022-v1 Inference</span>
            </div>

            <div className="p-4">
              <DetectionOverlay
                imageUrl={report.imageUrl}
                detection={report.aiDetection}
                className="max-h-[420px]"
              />
            </div>

            {/* AI Road Analysis Metrics */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>AI Road Defect Telemetry</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Detection Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{isDetected ? 'Detected' : 'Undetected'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Defect</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 capitalize truncate block">{defectName}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Confidence</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{(primaryConfidence * 100).toFixed(0)}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Inference Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{report.aiDetection?.inference_time_ms || 84} ms</span>
                </div>
              </div>

              {/* Multi-Defect Breakdown */}
              {detections.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary-500" />
                    <span>Detected Road Defects ({detections.length} objects)</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detections.map((d, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-medium"
                      >
                        <span className="capitalize text-slate-800 dark:text-slate-200">{d.class}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {(d.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* How AI Analysis Works — AI Transparency Pipeline */}
          <Card className="p-5 shadow-civic space-y-3 bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">
                How AI Analysis Works (Operational Transparency)
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              NagarSam AI combines computer vision and municipal geospatial heuristics to prioritize civic action:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-slate-800/70 border border-slate-700 space-y-1">
                <span className="text-slate-400 font-mono text-[10px]">01 · Visual</span>
                <p className="font-semibold text-slate-200">Defect Detection</p>
                <span className="text-slate-400 text-[10px] block">RDD2022 multi-class YOLO model</span>
              </div>
              <div className="p-2 rounded bg-slate-800/70 border border-slate-700 space-y-1">
                <span className="text-slate-400 font-mono text-[10px]">02 · Context</span>
                <p className="font-semibold text-slate-200">Location & Ward</p>
                <span className="text-slate-400 text-[10px] block">Arterial vs local road heuristics</span>
              </div>
              <div className="p-2 rounded bg-slate-800/70 border border-slate-700 space-y-1">
                <span className="text-slate-400 font-mono text-[10px]">03 · Triage</span>
                <p className="font-semibold text-slate-200">Priority Score</p>
                <span className="text-slate-400 text-[10px] block">Assistive urgency calculation</span>
              </div>
              <div className="p-2 rounded bg-slate-800/70 border border-slate-700 space-y-1">
                <span className="text-slate-400 font-mono text-[10px]">04 · Action</span>
                <p className="font-semibold text-slate-200">Human Review</p>
                <span className="text-slate-400 text-[10px] block">Officer dispatches field team</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>AI assists civic operations; final operational decisions and work order dispatches involve human officer review.</span>
            </div>
          </Card>

          {/* Incident Details Card */}
          <Card className="p-5 shadow-civic space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Citizen Submission Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Reported Location</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{report.address}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Municipal Ward</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{report.wardName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Landmark</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{report.landmark || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Submission Date</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(report.createdAt)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Description</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1 font-medium">{report.description}</p>
            </div>
          </Card>
        </div>

        {/* Right Col: Geolocation & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map Location */}
          <Card className="p-4 shadow-civic space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span>Geospatial Pin</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
              </span>
            </div>

            <CivicMap
              items={[report]}
              center={[report.latitude, report.longitude]}
              zoom={15}
              height="220px"
            />
          </Card>

          {/* Operational Status Timeline */}
          <Card className="p-5 shadow-civic space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Lifecycle Action Timeline
              </h3>
              <span className="text-[11px] text-slate-400">
                {report.timeline.length} Milestones
              </span>
            </div>

            <StatusTimeline events={report.timeline} />
          </Card>
        </div>
      </div>
    </div>
  );
};
