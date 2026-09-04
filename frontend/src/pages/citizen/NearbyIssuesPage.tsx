import React, { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { CivicMap } from '../../components/maps/CivicMap';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { LUCKNOW_COORDINATES } from '../../constants';
import { calculateDistanceKm, formatDistance } from '../../utils/geo';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles } from 'lucide-react';

export const NearbyIssuesPage: React.FC = () => {
  const [userLocation] = useState<{ lat: number; lng: number }>({
    lat: LUCKNOW_COORDINATES.lat,
    lng: LUCKNOW_COORDINATES.lng,
  });

  const { data: reportsResult } = useReports({ limit: 40 });
  const reports = reportsResult?.data || [];

  const nearbyReports = reports
    .map((r) => ({
      ...r,
      distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, r.latitude, r.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Citizen Portal', href: '/citizen' }, { label: 'Nearby Road Issues' }]} />
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          Nearby Road Issues
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Explore road defects, cracks, potholes, and ongoing municipal repairs within your vicinity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Nearby List */}
        <div className="lg:col-span-4 space-y-3 order-2 lg:order-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sorted by Proximity ({nearbyReports.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {nearbyReports.map((item) => {
              const defect = item.issueType || item.primaryDefect || 'Road Defect';
              const conf = item.aiDetection?.confidence ? Math.round(item.aiDetection.confidence * 100) : null;

              return (
                <Card key={item.id} className="p-3.5 hover:border-primary-300 dark:hover:border-primary-700 transition shadow-civic space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-400">{item.id}</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {formatDistance(item.distanceKm)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 capitalize border border-primary-200 dark:border-primary-800">
                      {defect}
                    </span>
                    {conf !== null && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        {conf}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.address}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <StatusBadge status={item.status} size="sm" />
                    <Link to={`/citizen/reports/${item.id}`} className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
                      View Details →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Map Canvas */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <CivicMap
            items={nearbyReports}
            center={[userLocation.lat, userLocation.lng]}
            zoom={14}
            detailRoutePrefix="/citizen/reports"
            height="580px"
          />
        </div>
      </div>
    </div>
  );
};
