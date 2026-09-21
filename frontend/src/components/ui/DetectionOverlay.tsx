import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { RoadDefectDetection, BoundingBox } from '../../types';
import {
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Tag,
  Crosshair,
  Layers,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDefectClass } from '../../utils/defectClasses';

export interface DetectionOverlayProps {
  imageUrl: string;
  detection?: RoadDefectDetection;
  inferenceStatus?: 'idle' | 'loading' | 'completed' | 'failed';
  className?: string;
  showToggle?: boolean;
}

// Color schemes per defect class
const DEFECT_COLOR_MAP: Record<string, {
  border: string;
  borderColor: string;
  bg: string;
  pill: string;
  badge: string;
  text: string;
  glow: string;
}> = {
  'pothole': {
    border: 'border-red-500',
    borderColor: '#ef4444',
    bg: 'bg-red-500/10 hover:bg-red-500/20',
    pill: 'bg-red-600',
    badge: 'bg-red-950/80 text-red-200',
    text: 'text-red-400',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.45)]',
  },
  'longitudinal crack': {
    border: 'border-amber-500',
    borderColor: '#f59e0b',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    pill: 'bg-amber-600',
    badge: 'bg-amber-950/80 text-amber-200',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.45)]',
  },
  'transverse crack': {
    border: 'border-blue-500',
    borderColor: '#3b82f6',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    pill: 'bg-blue-600',
    badge: 'bg-blue-950/80 text-blue-200',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.45)]',
  },
  'alligator crack': {
    border: 'border-purple-500',
    borderColor: '#a855f7',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20',
    pill: 'bg-purple-600',
    badge: 'bg-purple-950/80 text-purple-200',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.45)]',
  },
  'other corruption': {
    border: 'border-emerald-500',
    borderColor: '#10b981',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    pill: 'bg-emerald-600',
    badge: 'bg-emerald-950/80 text-emerald-200',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.45)]',
  },
};

const DEFAULT_COLOR = {
  border: 'border-sky-500',
  borderColor: '#0284c7',
  bg: 'bg-sky-500/10 hover:bg-sky-500/20',
  pill: 'bg-sky-600',
  badge: 'bg-sky-950/80 text-sky-200',
  text: 'text-sky-400',
  glow: 'shadow-[0_0_12px_rgba(2,132,199,0.45)]',
};

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  imageUrl,
  detection,
  inferenceStatus,
  className,
  showToggle = true,
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [naturalDims, setNaturalDims] = useState<{ width: number; height: number } | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredDefectIndex, setHoveredDefectIndex] = useState<number | null>(null);
  const [selectedDefectIndex, setSelectedDefectIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterClass, setFilterClass] = useState<string>('all');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  const isLoading = inferenceStatus === 'loading';
  const isDetected = detection ? (detection.detected ?? (detection.detections && detection.detections.length > 0)) : false;

  // Use natural image dimensions if available, fallback to detection metadata, then default 800x600
  const imgRefWidth = detection?.image_width || naturalDims?.width || 800;
  const imgRefHeight = detection?.image_height || naturalDims?.height || 600;

  // Filtered detections
  const activeDetections = useMemo(() => {
    if (!detection?.detections) return [];
    if (filterClass === 'all') return detection.detections;
    return detection.detections.filter(d => {
      const cls = (d.class_name || d.class || '').toLowerCase();
      return cls === filterClass.toLowerCase();
    });
  }, [detection?.detections, filterClass]);

  // Unique detected classes for filtering
  const availableClasses = useMemo(() => {
    if (!detection?.detections) return [];
    const classes = new Set<string>();
    detection.detections.forEach(d => {
      const name = d.class_name || d.class;
      if (name) classes.add(name);
    });
    return Array.from(classes);
  }, [detection?.detections]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedDefectIndex(null);
  }, []);

  // Zoom to a specific defect box
  const handleFocusDefect = useCallback((d: BoundingBox, idx: number) => {
    setSelectedDefectIndex(idx);
    const [x1, y1, x2, y2] = d.bbox;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    const normCenterX = centerX / imgRefWidth; // 0 to 1
    const normCenterY = centerY / imgRefHeight; // 0 to 1

    const targetZoom = 2.5;
    setZoom(targetZoom);

    // Calculate offset to center the defect
    const offsetX = (0.5 - normCenterX) * 300 * targetZoom;
    const offsetY = (0.5 - normCenterY) * 200 * targetZoom;
    setPan({ x: Math.max(-200, Math.min(200, offsetX)), y: Math.max(-150, Math.min(150, offsetY)) });
  }, [imgRefWidth, imgRefHeight]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || isFullscreen) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))));
      } else {
        setZoom((prev) => {
          const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
    }
  }, [isFullscreen]);

  // Drag pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const maxPan = (zoom - 1) * 200;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  }, [isDragging, zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation for full screen escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleResetZoom]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group select-none flex flex-col',
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none max-h-screen h-screen' : '',
        className
      )}
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header Bar / Model Info */}
      <div className="relative z-20 px-3 py-2 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-transparent flex items-center justify-between gap-2 flex-wrap">
        {detection && !detection.error ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200 text-[11px] sm:text-xs">
                Dual YOLO (Pothole + General Defect)
              </span>
              <span className="text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/50 px-1.5 py-0.2 rounded">
                LIVE
              </span>
              <span className="text-slate-500">·</span>
              <span className={cn('font-bold text-[11px] sm:text-xs', isDetected ? 'text-emerald-400' : 'text-slate-400')}>
                {isDetected
                  ? `${((detection.confidence || detection.detections?.[0]?.confidence || 0) * 100).toFixed(0)}% Conf.`
                  : 'No Defects'}
              </span>
            </div>

            <div className="hidden sm:inline-flex bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 text-xs px-2 py-1 rounded-lg">
              ⚡ {detection.inference_time_ms} ms
            </div>

            {detection.detections.length > 1 && (
              <div className="bg-indigo-950/90 backdrop-blur-md border border-indigo-700/80 text-indigo-200 text-xs px-2 py-1 rounded-lg font-medium">
                {detection.detections.length} Defects Found
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Crosshair className="w-3.5 h-3.5 text-primary-400" />
            <span>AI Road Defect Inspector</span>
          </div>
        )}

        {/* Zoom & Inspection Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-0.5 shadow-md ml-auto">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            title="Zoom Out"
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-slate-800 rounded transition"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Level Readout / Reset */}
          <button
            type="button"
            onClick={handleResetZoom}
            title="Click to reset zoom"
            className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-200 hover:text-primary-400 hover:bg-slate-800 rounded transition"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            title="Zoom In"
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-slate-800 rounded transition"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Reset button when zoomed */}
          {zoom > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom & Pan"
              className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

          {/* Toggle Labels */}
          {isDetected && (
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              title={showLabels ? 'Hide Defect Labels' : 'Show Defect Labels'}
              className={cn(
                'p-1 rounded transition',
                showLabels ? 'text-primary-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
              )}
            >
              <Tag className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Expand */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Inspect in Fullscreen'}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Pan & Zoom */}
      <div
        className={cn(
          'relative flex-1 w-full overflow-hidden flex items-center justify-center min-h-[220px]',
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {imgError ? (
          <div className="w-full h-48 bg-slate-900 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
            <AlertCircle className="w-6 h-6 text-slate-600" />
            <span>Image preview unavailable</span>
          </div>
        ) : (
          <div
            ref={imageWrapperRef}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className="relative inline-block max-w-full max-h-full"
          >
            <img
              src={imageUrl}
              alt="Road defect surface view"
              onLoad={(e) => {
                setNaturalDims({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                });
              }}
              className={cn(
                'block w-full h-auto object-contain mx-auto transition-opacity duration-200',
                isFullscreen ? 'max-h-[82vh]' : 'max-h-[480px]'
              )}
              onError={() => setImgError(true)}
            />

            {/* Bounding Boxes Layer - Pixel-perfect alignment inside image coordinates */}
            {showBoxes && detection && isDetected && !detection.error && (
              <div
                className="absolute inset-0 pointer-events-none"
                aria-label="AI defect bounding boxes overlay"
              >
                {activeDetections.map((d, index) => {
                  const classKey = (d.class_name || d.class || '').toLowerCase();
                  const colorTheme = DEFECT_COLOR_MAP[classKey] || DEFAULT_COLOR;
                  const displayLabel = formatDefectClass(d.class_name || d.class);
                  const sourceTag = d.model_source
                    ? d.model_source === 'pothole'
                      ? 'Pothole Detector'
                      : 'General Detector'
                    : null;

                  // Compute percentage coordinates relative to exact image dimensions
                  const [x1, y1, x2, y2] = d.bbox;
                  const leftPct = Math.max(0, Math.min(100, (x1 / imgRefWidth) * 100));
                  const topPct = Math.max(0, Math.min(100, (y1 / imgRefHeight) * 100));
                  const widthPct = Math.max(1, Math.min(100 - leftPct, ((x2 - x1) / imgRefWidth) * 100));
                  const heightPct = Math.max(1, Math.min(100 - topPct, ((y2 - y1) / imgRefHeight) * 100));

                  const isHovered = hoveredDefectIndex === index;
                  const isSelected = selectedDefectIndex === index;
                  const isNearTop = topPct < 7;

                  return (
                    <div
                      key={index}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                      }}
                      onMouseEnter={() => setHoveredDefectIndex(index)}
                      onMouseLeave={() => setHoveredDefectIndex(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFocusDefect(d, index);
                      }}
                      className={cn(
                        'absolute border-2 rounded-[3px] animate-bbox transition-all duration-150 pointer-events-auto cursor-pointer',
                        colorTheme.border,
                        colorTheme.bg,
                        isHovered || isSelected
                          ? cn(colorTheme.glow, 'z-40 ring-2 ring-white/60 bg-white/10')
                          : 'z-10'
                      )}
                    >
                      {/* Corner Target Reticles */}
                      <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white pointer-events-none" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white pointer-events-none" />
                      <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white pointer-events-none" />
                      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white pointer-events-none" />

                      {/* Defect Class Label */}
                      {showLabels && (
                        <div
                          className={cn(
                            'absolute text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 whitespace-nowrap backdrop-blur-sm pointer-events-none transition-all',
                            colorTheme.pill,
                            isNearTop ? 'top-1 left-1' : '-top-6 left-0',
                            isHovered || isSelected ? 'scale-105 z-50 ring-1 ring-white/70' : ''
                          )}
                        >
                          <span className="tracking-tight">{displayLabel}</span>
                          <span className={cn('px-1 py-0.2 rounded text-[9px] font-semibold', colorTheme.badge)}>
                            {(d.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}

                      {/* Rich Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 bg-slate-900/95 text-white text-[10px] px-2.5 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none flex items-center gap-1.5">
                          <span className={cn('font-semibold', colorTheme.text)}>{displayLabel}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-emerald-400 font-mono">{(d.confidence * 100).toFixed(1)}%</span>
                          {sourceTag && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-300 text-[9px]">{sourceTag}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay while inference runs */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-primary-400 rounded-full animate-spin" />
            <span className="text-white text-sm font-semibold animate-pulse">Analyzing with Dual YOLO...</span>
            <span className="text-slate-400 text-xs">Running pothole &amp; road defect models</span>
          </div>
        )}

        {/* Error state if inference failed in production mode */}
        {detection?.error && (
          <div className="absolute inset-x-0 bottom-0 bg-red-900/90 backdrop-blur-md p-3 text-white text-xs flex items-center gap-2 z-30">
            <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
            <span>{detection.error}</span>
          </div>
        )}

        {/* Partial status alert if one model failed */}
        {detection?.status === 'partial' && (
          <div className="absolute inset-x-0 top-0 bg-amber-900/90 backdrop-blur-md p-2 text-amber-100 text-[11px] flex items-center justify-between px-4 z-20">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Dual-Model Partial Inference: Results from active model displayed.</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Defect Chips / Quick Jump & Controls */}
      {detection && isDetected && !detection.error && (
        <div className="relative z-20 px-3 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          {/* Defect Quick Select Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full text-xs no-scrollbar">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Layers className="w-3 h-3 text-primary-400" />
              Defects ({detection.detections.length}):
            </span>

            {/* Class filter if multiple classes */}
            {availableClasses.length > 1 && (
              <button
                type="button"
                onClick={() => setFilterClass(filterClass === 'all' ? availableClasses[0] : 'all')}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition',
                  filterClass === 'all'
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-primary-950 border border-primary-600 text-primary-300'
                )}
              >
                {filterClass === 'all' ? 'All Classes' : `Filter: ${formatDefectClass(filterClass)}`}
              </button>
            )}

            {/* Individual Defect Badges for quick focus */}
            {activeDetections.map((d, idx) => {
              const classKey = (d.class_name || d.class || '').toLowerCase();
              const colorTheme = DEFECT_COLOR_MAP[classKey] || DEFAULT_COLOR;
              const isSelected = selectedDefectIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleFocusDefect(d, idx)}
                  onMouseEnter={() => setHoveredDefectIndex(idx)}
                  onMouseLeave={() => setHoveredDefectIndex(null)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium transition flex items-center gap-1 whitespace-nowrap border',
                    isSelected
                      ? cn('border-white text-white font-bold', colorTheme.pill)
                      : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:text-white'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorTheme.borderColor }} />
                  <span>#{idx + 1} {formatDefectClass(d.class_name || d.class)}</span>
                  <span className="text-[9px] opacity-75">{(d.confidence * 100).toFixed(0)}%</span>
                </button>
              );
            })}
          </div>

          {/* Toggle Bounding Box Button */}
          {showToggle && (
            <button
              type="button"
              onClick={() => setShowBoxes(!showBoxes)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 transition shadow-sm ml-auto"
              aria-label={showBoxes ? 'Hide AI bounding boxes' : 'Show AI bounding boxes'}
            >
              {showBoxes ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-primary-400" />}
              <span>{showBoxes ? 'Hide Boxes' : 'Show AI Detections'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

