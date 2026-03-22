/**
 * ============================================================
 * useMaps — unified hook for all geocoding operations
 * ============================================================
 * Automatically routes calls to the correct provider:
 *
 *   • Autocomplete / geocoding → GEOCODE_PROVIDER (Mapbox)
 *   • Map rendering            → MAP_PROVIDER (Google)
 *
 * The hook returns functions that always use the geocoding
 * provider. The map renderer is chosen separately in
 * MapPicker.tsx and other map-rendering components.
 *
 * Usage:
 *   const maps = useMaps();
 *   const suggestions = await maps.autocomplete('Connaught Place');
 *   const result      = await maps.resolve(suggestion);
 *   const result      = await maps.geocode('India Gate, New Delhi');
 *   const result      = await maps.reverseGeocode([77.229, 28.612]);
 * ============================================================
 */

import { useCallback } from 'react';
import { GEOCODE_PROVIDER, MAP_PROVIDER, type MapProvider } from './config';
import type { GeocodeResult, LngLat, PlaceSuggestion } from './types';

import {
  mapboxAutocomplete,
  mapboxResolve,
  mapboxGeocode,
  mapboxReverseGeocode,
} from './mapboxProvider';

import {
  googleAutocomplete,
  googleResolve,
  googleGeocode,
  googleReverseGeocode,
} from './googleProvider';

export interface UseMapsReturn {
  /** The provider used for geocoding / autocomplete */
  provider: MapProvider;

  /** The provider used for map rendering */
  mapProvider: MapProvider;

  /**
   * Get autocomplete suggestions as the user types.
   * Uses GEOCODE_PROVIDER (Mapbox).
   */
  autocomplete: (
    query: string,
    options?: { country?: string; proximity?: LngLat },
  ) => Promise<PlaceSuggestion[]>;

  /**
   * Resolve a PlaceSuggestion (from autocomplete dropdown) into full details.
   * Uses GEOCODE_PROVIDER (Mapbox).
   */
  resolve: (suggestion: PlaceSuggestion) => Promise<GeocodeResult>;

  /**
   * Forward geocode: convert address string → coordinates + details.
   * Uses GEOCODE_PROVIDER (Mapbox).
   */
  geocode: (address: string, options?: { country?: string }) => Promise<GeocodeResult>;

  /**
   * Reverse geocode: convert coordinates → address string + details.
   * Uses GEOCODE_PROVIDER (Mapbox).
   */
  reverseGeocode: (coords: LngLat) => Promise<GeocodeResult>;
}

/**
 * Hook that returns geocoding functions using the configured GEOCODE_PROVIDER.
 * @param overrideGeoProvider  Optional — override the global GEOCODE_PROVIDER for this instance.
 */
export function useMaps(overrideGeoProvider?: MapProvider): UseMapsReturn {
  const provider: MapProvider = overrideGeoProvider ?? GEOCODE_PROVIDER;

  const autocomplete = useCallback(
    (query: string, options?: { country?: string; proximity?: LngLat }) => {
      if (provider === 'mapbox') return mapboxAutocomplete(query, options);
      return googleAutocomplete(query, options);
    },
    [provider],
  );

  const resolve = useCallback(
    (suggestion: PlaceSuggestion) => {
      if (provider === 'mapbox') return mapboxResolve(suggestion);
      return googleResolve(suggestion);
    },
    [provider],
  );

  const geocode = useCallback(
    (address: string, options?: { country?: string }) => {
      if (provider === 'mapbox') return mapboxGeocode(address, options);
      return googleGeocode(address);
    },
    [provider],
  );

  const reverseGeocode = useCallback(
    (coords: LngLat) => {
      if (provider === 'mapbox') return mapboxReverseGeocode(coords);
      return googleReverseGeocode(coords);
    },
    [provider],
  );

  return { provider, mapProvider: MAP_PROVIDER, autocomplete, resolve, geocode, reverseGeocode };
}

// ── Convenience standalone functions (no React context required) ──────────

export async function geocodeAddress(
  address: string,
  provider: MapProvider = GEOCODE_PROVIDER,
): Promise<GeocodeResult> {
  if (provider === 'mapbox') return mapboxGeocode(address);
  return googleGeocode(address);
}

export async function reverseGeocodeCoords(
  coords: LngLat,
  provider: MapProvider = GEOCODE_PROVIDER,
): Promise<GeocodeResult> {
  if (provider === 'mapbox') return mapboxReverseGeocode(coords);
  return googleReverseGeocode(coords);
}
