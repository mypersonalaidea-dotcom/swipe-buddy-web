/**
 * LocationMap (legacy wrapper)
 * ─────────────────────────────────────────────────────────────
 * Kept for backward-compatibility. New code should use:
 *   import { MapPicker } from '@/components/map/MapPicker'
 *
 * This component now delegates to MapPicker, which supports
 * both Mapbox and Google Maps via the global MAP_PROVIDER config.
 * ─────────────────────────────────────────────────────────────
 */

import { MapPicker } from './MapPicker';
import type { GeocodeResult } from '@/lib/maps/types';
import type { MapProvider } from '@/lib/maps/config';

interface LocationMapProps {
  location: string;
  radius: number;
  onLocationChange: (location: string, coordinates: [number, number]) => void;
  onRadiusChange: (radius: number) => void;
  /** @deprecated Use global MAP_PROVIDER in src/lib/maps/config.ts instead */
  mapboxToken?: string;
  /** Override map provider for this instance */
  provider?: MapProvider;
}

export const LocationMap = ({
  location,
  radius,
  onLocationChange,
  onRadiusChange,
  provider,
}: LocationMapProps) => {
  const handleLocationChange = (result: GeocodeResult) => {
    onLocationChange(result.fullAddress, result.coordinates);
  };

  return (
    <MapPicker
      provider={provider}
      location={location}
      radius={radius}
      showRadius
      showSearch
      onLocationChange={handleLocationChange}
      onRadiusChange={onRadiusChange}
      height="400px"
    />
  );
};
