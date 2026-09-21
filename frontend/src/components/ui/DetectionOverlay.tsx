import React, { useState } from 'react';
import { RoadDefectDetection } from '../../types';
import { Sparkles, Eye, EyeOff, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDefectClass } from '../../utils/defectClasses';

export interface DetectionOverlayProps {
  imageUrl: string;
  detection?: RoadDefectDetection;
  className?: string;
  showToggle?: boolean;
}

// Color schemes per defect class
const DEFECT_COLOR_MAP: Record<string, { border: string; bg: string; shadow: string; pill: string; badge: string }> = {
  'pothole': {
    border: 'border-red-500',
    bg: 'bg-red-500/15',
    shadow: 'shadow-red-500/20',
    pill: 'bg-red-600',
    badge: 'bg-red-800/80',
  },
  'longitudinal crack': {
    border: 'border-amber-500',
    bg: 'bg-amber-500/15',
    shadow: 'shadow-amber-500/20',
    pill: 'bg-amber-600',
    badge: 'bg-amber-800/80',
  },
  'transverse crack': {
    border: 'border-blue-500',
    bg: 'bg-blue-500/15',
    shadow: 'shadow-blue-500/20',
    pill: 'bg-blue-600',
    badge: 'bg-blue-800/80',
  },
  'alligator crack': {
    border: 'border-purple-500',
    bg: 'bg-purple-500/15',
    shadow: 'shadow-purple-500/20',
    pill: 'bg-purple-600',
    badge: 'bg-purple-800/80',
  },
  'other corruption': {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/15',
    shadow: 'shadow-emerald-500/20',
    pill: 'bg-emerald-600',
    badge: 'bg-emerald-800/80',
  },
};

const DEFAULT_COLOR = {
  border: 'border-sky-500',
  bg: 'bg-sky-500/15',
  shadow: 'shadow-sky-500/20',
  pill: 'bg-sky-600',
  badge: 'bg-sky-800/80',
};

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  imageUrl,
  detection,
  className,
  showToggle = true,
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const isDetected = detection ? (detection.detected ?? (detection.detections && detection.detections.length > 0)) : false;

  const imgRefWidth = detection?.image_width || 800;
  const imgRefHeight = detection?.image_height || 600;

  return (
    <div className={cn('relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group select-none', className)}>
      <img
        src={imageUrl}
        alt="Road defect surface view"
        className="w-full h-full object-cover max-h-[450px] transition-transform duration-300"
      />

      {/* Error state if inference failed in production mode */}
      {detection?.error && (
        <div className="absolute inset-x-0 bottom-0 bg-red-900/90 backdrop-blur-md p-3 text-white text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
          <span>{detection.error}</span>
        </div>
      )}

      {/* Partial status alert if one model failed */}
      {detection?.status === 'partial' && (
        <div className="absolute inset-x-0 top-0 bg-amber-900/90 backdrop-blur-md p-2 text-amber-100 text-[11px] flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Dual-Model Partial Inference: Results from active model displayed.</span>
          </div>
        </div>
      )}

      {/* Bounding Boxes Layer */}
      {showBoxes && detection && isDetected && !detection.error && (
        <div className="absolute inset-0 pointer-events-none" aria-label="AI defect bounding boxes overlay">
          {detection.detections.map((d, index) => {
            const classKey = (d.class_name || d.class || '').toLowerCase();
            const colorTheme = DEFECT_COLOR_MAP[classKey] || DEFAULT_COLOR;
            const displayLabel = formatDefectClass(d.class_name || d.class);
            const sourceTag = d.model_source ? (d.model_source === 'pothole' ? 'Pothole Detector' : 'General Detector') : null;

            // Compute percentage coordinates relative to original image dimensions
            const [x1, y1, x2, y2] = d.bbox;
            const leftPct = Math.max(0, Math.min(100, (x1 / imgRefWidth) * 100));
            const topPct = Math.max(0, Math.min(100, (y1 / imgRefHeight) * 100));
            const widthPct = Math.max(2, Math.min(100 - leftPct, ((x2 - x1) / imgRefWidth) * 100));
            const heightPct = Math.max(2, Math.min(100 - topPct, ((y2 - y1) / imgRefHeight) * 100));

            return (
              <div
                key={index}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
                className={cn(
                  'absolute border-2 rounded-md animate-bbox shadow-lg',
                  colorTheme.border,
                  colorTheme.bg,
                  colorTheme.shadow
                )}
              >
                {/* Defect Class Pill with Model Source Indicator */}
                <div
                  className={cn(
                    'absolute -top-7 left-0 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5 whitespace-nowrap',
                    colorTheme.pill
                  )}
                >
                  <span className="tracking-wide">{displayLabel}</span>
                  <span className={cn('px-1 py-0.2 rounded text-[10px]', colorTheme.badge)}>
                    {(d.confidence * 100).toFixed(0)}%
                  </span>
                  {sourceTag && (
                    <span className="bg-black/30 text-[9px] px-1 py-0.2 rounded font-normal text-slate-200">
                      {sourceTag}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Model Info Badge Overlay */}
      {detection && !detection.error && (
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-200">
              Dual YOLO (Pothole + General Defect)
            </span>
            <span className="text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/50 px-1.5 py-0.2 rounded">
              LIVE
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-400 font-bold">
              {(detection.confidence * 100).toFixed(0)}% Conf.
            </span>
          </div>

          <div className="hidden sm:inline-flex bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-slate-300 text-xs px-2 py-1 rounded-lg">
            ⚡ {detection.inference_time_ms} ms
          </div>

          {detection.detections.length > 1 && (
            <div className="bg-indigo-900/85 backdrop-blur-md border border-indigo-700/80 text-indigo-200 text-xs px-2 py-1 rounded-lg">
              {detection.detections.length} Defects Found
            </div>
          )}
        </div>
      )}

      {/* Toggle Bounding Box Button */}
      {showToggle && detection && isDetected && !detection.error && (
        <button
          type="button"
          onClick={() => setShowBoxes(!showBoxes)}
          className="absolute bottom-3 right-3 bg-slate-900/85 hover:bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-slate-700 flex items-center gap-1.5 transition shadow focus:ring-2 focus:ring-primary-500"
          aria-label={showBoxes ? 'Hide AI bounding boxes' : 'Show AI bounding boxes'}
        >
          {showBoxes ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-primary-400" />}
          <span>{showBoxes ? 'Hide Bounding Boxes' : 'Show AI Detections'}</span>
        </button>
      )}
    </div>
  );
};
