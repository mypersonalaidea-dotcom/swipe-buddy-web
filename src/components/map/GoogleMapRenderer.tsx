/**
 * GoogleMapRenderer
 * ─────────────────────────────────────────────────────────────
 * Renders an interactive Google Maps instance with:
 *  - Draggable marker
 *  - Radius circle overlay
 *  - Pan/zoom on center change
 *  - Emits coordinates on marker drag (reverse-geocoded)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { loadGoogleMapsScript } from '@/lib/maps/googleProvider';
import { reverseGeocodeCoords } from '@/lib/maps/useMaps';
import type { GeocodeResult, LngLat } from '@/lib/maps/types';

interface GoogleMapRendererProps {
  center: LngLat;
  zoom: number;
  radius?: number; // km
  onMarkerDragEnd?: (result: GeocodeResult) => void;
  height?: string;
  className?: string;
}

export function GoogleMapRenderer({
  center,
  zoom,
  radius,
  onMarkerDragEnd,
  height = '400px',
  className,
}: GoogleMapRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Initialize
  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsScript().then(() => {
      if (cancelled || !containerRef.current) return;

      const latLng = { lat: center[1], lng: center[0] };

      const map = new google.maps.Map(containerRef.current, {
        center: latLng,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        draggableCursor: 'crosshair',
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'simplified' }] }],
      });

      const marker = new google.maps.Marker({
        position: latLng,
        map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Drag me to set location',
      });

      // Reverse-geocode helper for both drag and click
      const handleMarkerMoved = async (coords: LngLat) => {
        try {
          const result = await reverseGeocodeCoords(coords);
          onMarkerDragEnd?.(result);
          updateCircle(map, coords, currentRadiusRef.current, circleRef);
        } catch (err) {
          console.error('[GoogleMapRenderer] Reverse geocode error:', err);
        }
      };

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (!pos) return;
        handleMarkerMoved([pos.lng(), pos.lat()]);
      });

      // Click anywhere on map → move pin there
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const coords: LngLat = [e.latLng.lng(), e.latLng.lat()];
        marker.setPosition(e.latLng);
        marker.setAnimation(google.maps.Animation.DROP);
        handleMarkerMoved(coords);
      });

      mapRef.current = map;
      markerRef.current = marker;

      if (radius && radius > 0) {
        updateCircle(map, center, radius, circleRef);
      }
    });

    return () => {
      cancelled = true;
      circleRef.current?.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync center changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const latLng = { lat: center[1], lng: center[0] };
    map.panTo(latLng);
    map.setZoom(zoom);
    marker.setPosition(latLng);
    updateCircle(map, center, radius ?? 0, circleRef);
  }, [center, zoom, radius]);

  const currentRadiusRef = useRef(radius ?? 0);
  useEffect(() => {
    currentRadiusRef.current = radius ?? 0;
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

function updateCircle(
  map: google.maps.Map,
  center: LngLat,
  radiusKm: number,
  circleRef: React.MutableRefObject<google.maps.Circle | null>,
) {
  circleRef.current?.setMap(null);

  if (radiusKm <= 0) {
    circleRef.current = null;
    return;
  }

  circleRef.current = new google.maps.Circle({
    map,
    center: { lat: center[1], lng: center[0] },
    radius: radiusKm * 1000, // metres
    fillColor: '#6366f1',
    fillOpacity: 0.18,
    strokeColor: '#6366f1',
    strokeOpacity: 0.7,
    strokeWeight: 2,
  });
}
