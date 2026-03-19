/**
 * MapPicker
 * ─────────────────────────────────────────────────────────────
 * A complete drop-in map + location picker component.
 *
 * Features:
 *  ✅ Address autocomplete search bar (top of map)
 *  ✅ Interactive map (Mapbox or Google — auto-selected)
 *  ✅ Draggable marker with reverse geocoding
 *  ✅ Optional radius circle with slider
 *  ✅ Selected location display card
 *  ✅ "Use my location" button (browser geolocation)
 *
 * Usage:
 *   <MapPicker
 *     onLocationChange={(result) => {
 *       setAddress(result.fullAddress);
 *       setCoords(result.coordinates);
 *     }}
 *     showRadius
 *     radius={5}
 *     onRadiusChange={setRadius}
 *   />
 *
 *   // Use Google Maps for this specific instance:
 *   <MapPicker provider="google" onLocationChange={...} />
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import { MapPin, Locate, Navigation } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AddressAutocomplete } from './AddressAutocomplete';
import { MapboxMapRenderer } from './MapboxMapRenderer';
import { GoogleMapRenderer } from './GoogleMapRenderer';
import { useMaps } from '@/lib/maps/useMaps';
import { DEFAULT_MAP_CENTER, DEFAULT_RADIUS_KM, DEFAULT_ZOOM, MAP_PROVIDER } from '@/lib/maps/config';
import { cn } from '@/lib/utils';
import type { GeocodeResult, LngLat, MapPickerProps } from '@/lib/maps/types';

export function MapPicker({
  provider,
  center: initialCenter,
  zoom = DEFAULT_ZOOM,
  height = '380px',
  location,
  coordinates: initialCoords,
  radius: initialRadius = DEFAULT_RADIUS_KM,
  showRadius = false,
  onLocationChange,
  onRadiusChange,
  className,
}: MapPickerProps) {
  const activeProvider = provider ?? MAP_PROVIDER;
  const maps = useMaps(activeProvider);

  const [center, setCenter] = useState<LngLat>(
    initialCoords ?? initialCenter ?? DEFAULT_MAP_CENTER,
  );
  const [radius, setRadius] = useState(initialRadius);
  const [selectedResult, setSelectedResult] = useState<GeocodeResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocationSelected = useCallback(
    (result: GeocodeResult) => {
      setCenter(result.coordinates);
      setSelectedResult(result);
      onLocationChange(result);
    },
    [onLocationChange],
  );

  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      setRadius(newRadius);
      onRadiusChange?.(newRadius);
    },
    [onRadiusChange],
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: LngLat = [pos.coords.longitude, pos.coords.latitude];
        try {
          const result = await maps.reverseGeocode(coords);
          handleLocationSelected(result);
        } catch (err) {
          console.error('[MapPicker] Reverse geocode error:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('[MapPicker] Geolocation error:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const MapRenderer =
    activeProvider === 'mapbox' ? MapboxMapRenderer : GoogleMapRenderer;

  return (
    <div className={cn('space-y-3', className)}>
      {/* ── Search bar + Use my location ─────────────────────── */}
      <div className="flex gap-2">
        <AddressAutocomplete
          provider={activeProvider}
          value={location}
          placeholder="Search for an address..."
          onSelect={handleLocationSelected}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          title="Use my current location"
          className="shrink-0"
        >
          {isLocating ? (
            <Navigation className="w-4 h-4 animate-pulse" />
          ) : (
            <Locate className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* ── Map ──────────────────────────────────────────────── */}
      <div className="relative">
        <MapRenderer
          center={center}
          zoom={zoom}
          radius={showRadius ? radius : undefined}
          onMarkerDragEnd={handleLocationSelected}
          height={height}
          className="w-full rounded-lg overflow-hidden border border-border shadow-sm"
        />

        {/* Provider badge — only show when map renders (no error) */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border text-[10px] text-muted-foreground pointer-events-none">
          {activeProvider === 'mapbox' ? '🗺 Mapbox' : '🗺 Google Maps'}
        </div>
      </div>

      {/* ── Radius slider ─────────────────────────────────────── */}
      {showRadius && (
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Search Radius</Label>
            <span className="text-sm font-medium tabular-nums">{radius} km</span>
          </div>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[radius]}
            onValueChange={(v) => handleRadiusChange(v[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>
      )}

      {/* ── Selected location display ─────────────────────────── */}
      {(selectedResult || location) && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="p-1.5 rounded-full bg-primary/10 shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              Selected Location
            </p>
            <p className="text-sm text-foreground leading-snug">
              {selectedResult?.fullAddress ?? location}
            </p>
            {selectedResult?.coordinates && (
              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                {selectedResult.coordinates[1].toFixed(5)}°N,{' '}
                {selectedResult.coordinates[0].toFixed(5)}°E
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
