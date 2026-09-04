import React, { useState } from 'react';
import { CivicMap } from '../maps/CivicMap';
import { Button } from '../ui/Button';
import { Navigation, MapPin, CheckCircle2 } from 'lucide-react';
import { LUCKNOW_COORDINATES } from '../../constants';

export interface LocationPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  onChange: (lat: number, lng: number, address: string) => void;
  error?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  address,
  onChange,
  error,
}) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          setIsLocating(false);
          onChange(lat, lng, `GPS Location (${lat}, ${lng}), Lucknow Corridor`);
        },
        () => {
          // Fallback to Lucknow city center if permission denied or unavailable
          setIsLocating(false);
          onChange(
            LUCKNOW_COORDINATES.lat,
            LUCKNOW_COORDINATES.lng,
            'Hazratganj Main Junction, Lucknow, UP'
          );
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      onChange(
        LUCKNOW_COORDINATES.lat,
        LUCKNOW_COORDINATES.lng,
        'Hazratganj Main Junction, Lucknow, UP'
      );
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    const cleanLat = parseFloat(lat.toFixed(5));
    const cleanLng = parseFloat(lng.toFixed(5));
    onChange(cleanLat, cleanLng, `Selected Road Point (${cleanLat}, ${cleanLng}), Lucknow`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Road Location & Coordinates
          </label>
          <p className="text-xs text-slate-500">
            Click directly on the map or tap the auto-detect button.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          isLoading={isLocating}
          leftIcon={<Navigation className="w-3.5 h-3.5 text-primary-600" />}
        >
          Use My Current Location
        </Button>
      </div>

      {/* Interactive Map */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <CivicMap
          height="280px"
          center={[latitude || LUCKNOW_COORDINATES.lat, longitude || LUCKNOW_COORDINATES.lng]}
          zoom={14}
          allowClickToPick={true}
          onPickLocation={handleMapClick}
          pickedLocation={[latitude, longitude]}
        />
      </div>

      {/* Selected Coordinates Status Pill */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800">{address || 'No location picked yet'}</span>
            <div className="text-slate-500 text-[11px]">
              Lat: {latitude ? latitude.toFixed(5) : '—'} · Lng: {longitude ? longitude.toFixed(5) : '—'}
            </div>
          </div>
        </div>
        {latitude && longitude ? (
          <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pinned</span>
          </span>
        ) : null}
      </div>

      {error && <p className="text-xs text-danger-600 font-medium">• {error}</p>}
    </div>
  );
};
