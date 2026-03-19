/**
 * MapboxMapRenderer
 * ─────────────────────────────────────────────────────────────
 * Renders an interactive Mapbox GL map with:
 *  - Draggable marker
 *  - Radius circle overlay
 *  - Fly-to animation on location change
 *  - Emits coordinates on marker drag (reverse-geocoded)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getProviderKey } from '@/lib/maps/config';
import { mapboxReverseGeocode } from '@/lib/maps/mapboxProvider';
import type { GeocodeResult, LngLat } from '@/lib/maps/types';

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

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      mapboxgl.accessToken = getProviderKey('mapbox');
    } catch (e) {
      console.warn('[MapboxRenderer] No token set:', e);
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-right');

    const marker = new mapboxgl.Marker({ draggable: true, color: '#6366f1' })
      .setLngLat(center)
      .addTo(map);

    marker.on('dragend', async () => {
      const lngLat = marker.getLngLat();
      const coords: LngLat = [lngLat.lng, lngLat.lat];
      currentCenterRef.current = coords;
      try {
        const result = await mapboxReverseGeocode(coords);
        onMarkerDragEnd?.(result);
        updateCircle(map, coords, currentRadiusRef.current);
      } catch (err) {
        console.error('[MapboxRenderer] Reverse geocode error:', err);
      }
    });

    map.on('load', () => {
      updateCircle(map, center, radius ?? 0);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
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

  // Track current radius imperatively so drag callback can access it
  const currentRadiusRef = useRef(radius ?? 0);
  useEffect(() => {
    currentRadiusRef.current = radius ?? 0;
    const map = mapRef.current;
    if (map?.isStyleLoaded()) {
      updateCircle(map, currentCenterRef.current, currentRadiusRef.current);
    }
  }, [radius]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={className ?? 'w-full rounded-lg overflow-hidden border border-border'}
    />
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CIRCLE_ID = 'sb-radius-circle';

function updateCircle(map: mapboxgl.Map, center: LngLat, radiusKm: number) {
  // Remove old layers/sources
  if (map.getLayer(`${CIRCLE_ID}-fill`)) map.removeLayer(`${CIRCLE_ID}-fill`);
  if (map.getLayer(`${CIRCLE_ID}-line`)) map.removeLayer(`${CIRCLE_ID}-line`);
  if (map.getSource(CIRCLE_ID)) map.removeSource(CIRCLE_ID);

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
