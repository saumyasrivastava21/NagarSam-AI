import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Report, Incident, Severity, ReportStatus } from '../../types';
import { LUCKNOW_COORDINATES, SEVERITY_CONFIG } from '../../constants';
import { StatusBadge } from '../ui/StatusBadge';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Sparkles, AlertCircle } from 'lucide-react';

// Custom SVG map marker generator based on severity/status
const createCustomMarkerIcon = (severity: Severity, status?: ReportStatus) => {
  const isResolved = status === 'RESOLVED';
  const color = isResolved ? '#10B981' : SEVERITY_CONFIG[severity]?.color || '#0F3870';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
      <circle cx="16" cy="16" r="3.5" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
};

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

export interface CivicMapProps {
  items?: (Report | Incident)[];
  selectedItem?: Report | Incident | null;
  onSelectItem?: (item: Report | Incident) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  allowClickToPick?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
  pickedLocation?: [number, number] | null;
  detailRoutePrefix?: string; // e.g. '/citizen/reports' or '/officer/incidents'
  className?: string;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  items = [],
  selectedItem,
  onSelectItem,
  center = [LUCKNOW_COORDINATES.lat, LUCKNOW_COORDINATES.lng],
  zoom = 13,
  height = '500px',
  allowClickToPick = false,
  onPickLocation,
  pickedLocation,
  detailRoutePrefix = '/map',
  className,
}) => {
  return (
    <div style={{ height }} className={`w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-civic relative z-0 ${className || ''}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeMapView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allowClickToPick && onPickLocation && (
          <ClickHandler onPick={onPickLocation} />
        )}

        {/* Selected / Picked Marker */}
        {pickedLocation && (
          <Marker
            position={pickedLocation}
            icon={createCustomMarkerIcon('CRITICAL')}
          >
            <Popup>
              <div className="p-2 text-xs">
                <strong className="text-slate-900 block font-bold">Selected Road Location</strong>
                <span className="text-slate-500">
                  {pickedLocation[0].toFixed(5)}, {pickedLocation[1].toFixed(5)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Incident / Report Markers */}
        {items.map((item) => {
          if (!item.latitude || !item.longitude) return null;
          const link = `${detailRoutePrefix}/${item.id}`;
          const defectType = ('issueType' in item && item.issueType) || ('primaryDefect' in item && item.primaryDefect) || 'Road Defect';
          const confidence = item.aiDetection?.confidence ? Math.round(item.aiDetection.confidence * 100) : null;
          const priorityScore = ('priorityScore' in item && item.priorityScore) ? item.priorityScore : null;

          return (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={createCustomMarkerIcon(item.severity, item.status)}
              zIndexOffset={selectedItem?.id === item.id ? 1000 : 0}
              eventHandlers={{
                click: () => onSelectItem && onSelectItem(item),
              }}
            >
              <Popup>
                <div className="p-3 max-w-[270px] space-y-2 text-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-primary-700">{item.id}</span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  {/* Defect Category & Severity */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-primary-50 text-primary-800 font-semibold px-2 py-0.5 rounded text-[11px] capitalize border border-primary-200">
                      {defectType}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">
                      {item.severity}
                    </span>
                  </div>

                  <h6 className="text-xs font-medium text-slate-900 line-clamp-2">
                    {'title' in item ? item.title : item.description}
                  </h6>

                  {/* AI Confidence & Priority if available */}
                  {(confidence !== null || priorityScore !== null) && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded">
                      {confidence !== null && (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <Sparkles className="w-3 h-3" />
                          {confidence}% AI
                        </span>
                      )}
                      {priorityScore !== null && (
                        <span className="flex items-center gap-1 text-amber-700 font-semibold">
                          <AlertCircle className="w-3 h-3" />
                          Priority: {priorityScore}/100
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.address}</span>
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {item.wardName}
                    </span>
                    <Link
                      to={link}
                      className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
