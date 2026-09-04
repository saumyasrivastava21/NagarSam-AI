import React, { useState } from 'react';
import { RoadDefectDetection } from '../../types';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

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
  const isDetected = detection ? (detection.detected ?? detection.pothole_detected) : false;

  return (
    <div className={cn('relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group select-none', className)}>
      <img
        src={imageUrl}
        alt="Road defect surface view"
        className="w-full h-full object-cover max-h-[450px] transition-transform duration-300"
      />

      {/* Bounding Boxes Layer */}
      {showBoxes && detection && isDetected && (
        <div className="absolute inset-0 pointer-events-none" aria-label="AI defect bounding boxes overlay">
          {detection.detections.map((d, index) => {
            const classKey = d.class.toLowerCase();
            const colorTheme = DEFECT_COLOR_MAP[classKey] || DEFAULT_COLOR;

            // Normalize bbox coordinates (assuming 800x600 coordinate reference space)
            const [x1, y1, x2, y2] = d.bbox;
            const leftPct = (x1 / 800) * 100;
            const topPct = (y1 / 600) * 100;
            const widthPct = ((x2 - x1) / 800) * 100;
            const heightPct = ((y2 - y1) / 600) * 100;

            return (
              <div
                key={index}
                style={{
                  left: `${Math.max(5, Math.min(leftPct, 80))}%`,
                  top: `${Math.max(5, Math.min(topPct, 75))}%`,
                  width: `${Math.max(20, Math.min(widthPct, 60))}%`,
                  height: `${Math.max(20, Math.min(heightPct, 50))}%`,
                }}
                className={cn(
                  'absolute border-2 rounded-md animate-bbox shadow-lg',
                  colorTheme.border,
                  colorTheme.bg,
                  colorTheme.shadow
                )}
              >
                {/* Defect Class Pill */}
                <div
                  className={cn(
                    'absolute -top-7 left-0 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5 whitespace-nowrap',
                    colorTheme.pill
                  )}
                >
                  <span className="capitalize tracking-wide">{d.class}</span>
                  <span className={cn('px-1 py-0.2 rounded text-[10px]', colorTheme.badge)}>
                    {(d.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Model Info Badge Overlay */}
      {detection && (
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-200">{detection.model_version || 'RDD2022-v1'}</span>
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
      {showToggle && detection && (
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
