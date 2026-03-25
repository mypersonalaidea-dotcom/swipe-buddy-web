/**
 * MapboxMapRenderer
 * ─────────────────────────────────────────────────────────────
 * Renders an interactive Mapbox GL map with:
 *  - Draggable marker
 *  - Radius circle overlay
 *  - Fly-to animation on location change
 *  - Emits coordinates on marker drag (reverse-geocoded)
 *  - Clear error state when token is missing / invalid
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '@/lib/maps/config';
import { reverseGeocodeCoords } from '@/lib/maps/useMaps';
import type { GeocodeResult, LngLat } from '@/lib/maps/types';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface MapboxMapRendererProps {
  center: LngLat;
  zoom: number;
  radius?: number; // km
  onMarkerDragEnd?: (result: GeocodeResult) => void;
  height?: string;
  className?: string;
}

export function MapboxMapRenderer({
  center,
  zoom,
  radius,
  onMarkerDragEnd,
  height = '400px',
  className,
}: MapboxMapRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const currentCenterRef = useRef<LngLat>(center);
  const currentRadiusRef = useRef(radius ?? 0);
  const [error, setError] = useState<string | null>(null);

  // Track current radius imperatively so drag callback can access it
  useEffect(() => {
    currentRadiusRef.current = radius ?? 0;
    const map = mapRef.current;
    if (map?.isStyleLoaded()) {
      updateCircle(map, currentCenterRef.current, currentRadiusRef.current);
    }
  }, [radius]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    // Validate token
    const token = MAPBOX_TOKEN;
    if (!token) {
      setError('VITE_MAPBOX_TOKEN is not set in .env.local');
      return;
    }
    if (token.startsWith('sk.')) {
      setError(
        'You are using a Mapbox SECRET key (sk.…). ' +
        'Mapbox GL maps require a PUBLIC token (pk.…). ' +
        'Go to account.mapbox.com → Access Tokens and use the Default public token.',
      );
      return;
    }
    if (!token.startsWith('pk.')) {
      setError('VITE_MAPBOX_TOKEN does not look like a valid Mapbox public token (pk.eyJ1...).');
      return;
    }

    setError(null);
    mapboxgl.accessToken = token;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom,
        attributionControl: false,
      });
    } catch (e) {
      setError(String(e));
      return;
    }

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right',
    );

    const marker = new mapboxgl.Marker({ draggable: true, color: '#6366f1' })
      .setLngLat(center)
      .addTo(map);

    // Reverse-geocode helper for both drag and click
    const handleMarkerMoved = async (coords: LngLat) => {
      currentCenterRef.current = coords;
      try {
        const result = await reverseGeocodeCoords(coords);
        onMarkerDragEnd?.(result);
        if (map.isStyleLoaded()) {
          updateCircle(map, coords, currentRadiusRef.current);
        }
      } catch (err) {
        console.error('[MapboxRenderer] Reverse geocode error:', err);
      }
    };

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      handleMarkerMoved([lngLat.lng, lngLat.lat]);
    });

    // Click anywhere on map → move pin there
    map.on('click', (e) => {
      const coords: LngLat = [e.lngLat.lng, e.lngLat.lat];
      marker.setLngLat(coords);
      handleMarkerMoved(coords);
    });

    map.on('load', () => {
      updateCircle(map, center, currentRadiusRef.current);
      // Set crosshair cursor to hint click-to-place
      map.getCanvas().style.cursor = 'crosshair';
    });

    map.on('error', (e) => {
      console.error('[MapboxRenderer] Map error:', e);
      // Surface auth errors
      if (e.error?.message?.toLowerCase().includes('unauthorized') ||
          e.error?.message?.toLowerCase().includes('401')) {
        setError(
          'Mapbox token is invalid or unauthorized. ' +
          'Make sure your VITE_MAPBOX_TOKEN is a valid PUBLIC token (pk.eyJ1...).',
        );
      }
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new center when prop changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    currentCenterRef.current = center;
    marker.setLngLat(center);
    map.flyTo({ center, zoom, speed: 1.4, essential: true });

    if (map.isStyleLoaded()) {
      updateCircle(map, center, radius ?? 0);
    } else {
      map.once('load', () => updateCircle(map, center, radius ?? 0));
    }
  }, [center, zoom, radius]);

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{ height }}
        className={
          className ??
          'w-full rounded-lg border border-destructive/40 bg-destructive/5 flex flex-col items-center justify-center gap-3 p-6 text-center'
        }
      >
        <AlertTriangle className="w-8 h-8 text-destructive/70" />
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-medium text-destructive">Map Error</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
        </div>
        <a
          href="https://account.mapbox.com/access-tokens/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Get your public token <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className={className ?? ''}
    />
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CIRCLE_ID = 'sb-radius-circle';

function updateCircle(map: mapboxgl.Map, center: LngLat, radiusKm: number) {
  try {
    if (map.getLayer(`${CIRCLE_ID}-fill`)) map.removeLayer(`${CIRCLE_ID}-fill`);
    if (map.getLayer(`${CIRCLE_ID}-line`)) map.removeLayer(`${CIRCLE_ID}-line`);
    if (map.getSource(CIRCLE_ID)) map.removeSource(CIRCLE_ID);
  } catch (_) { /* ignore */ }

  if (radiusKm <= 0) return;

  const coords = buildCircleCoords(center, radiusKm);

  map.addSource(CIRCLE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: {},
    },
  });

  map.addLayer({
    id: `${CIRCLE_ID}-fill`,
    type: 'fill',
    source: CIRCLE_ID,
    paint: { 'fill-color': '#6366f1', 'fill-opacity': 0.18 },
  });

  map.addLayer({
    id: `${CIRCLE_ID}-line`,
    type: 'line',
    source: CIRCLE_ID,
    paint: { 'line-color': '#6366f1', 'line-width': 2, 'line-opacity': 0.7 },
  });
}

function buildCircleCoords(center: LngLat, radiusKm: number, points = 64): number[][] {
  const degPerKm = 1 / 111;
  const coords: number[][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([
      center[0] + radiusKm * degPerKm * Math.cos(angle),
      center[1] + radiusKm * degPerKm * Math.sin(angle),
    ]);
  }
  return coords;
}
