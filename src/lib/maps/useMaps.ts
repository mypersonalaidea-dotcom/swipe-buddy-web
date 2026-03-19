/**
 * ============================================================
 * useMaps — unified hook for all geocoding operations
 * ============================================================
 * Automatically routes calls to the correct provider based on:
 *   1. The `provider` argument passed to the hook
 *   2. Falling back to the global MAP_PROVIDER in config.ts
 *
 * Usage:
 *   const maps = useMaps();               // uses global default
 *   const maps = useMaps('google');       // force Google for this hook
 *
 *   const suggestions = await maps.autocomplete('Connaught Place');
 *   const result      = await maps.resolve(suggestion);
 *   const result      = await maps.geocode('India Gate, New Delhi');
 *   const result      = await maps.reverseGeocode([77.229, 28.612]);
 * ============================================================
 */

import { useCallback } from 'react';
import { MAP_PROVIDER, type MapProvider } from './config';
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
  /** The active provider for this hook instance */
  provider: MapProvider;

  /**
   * Get autocomplete suggestions as the user types.
   * @param query  - partial address string
   * @param options - optional country restriction (e.g. 'in')
   */
  autocomplete: (
    query: string,
    options?: { country?: string; proximity?: LngLat },
  ) => Promise<PlaceSuggestion[]>;

  /**
   * Resolve a PlaceSuggestion (from autocomplete dropdown) into full details.
   */
  resolve: (suggestion: PlaceSuggestion) => Promise<GeocodeResult>;

  /**
   * Forward geocode: convert address string → coordinates + details.
   */
  geocode: (address: string, options?: { country?: string }) => Promise<GeocodeResult>;

  /**
   * Reverse geocode: convert coordinates → address string + details.
   */
  reverseGeocode: (coords: LngLat) => Promise<GeocodeResult>;
}

/**
 * Hook that returns provider-agnostic geocoding functions.
 * @param overrideProvider  Optional — override the global MAP_PROVIDER for this instance.
 */
export function useMaps(overrideProvider?: MapProvider): UseMapsReturn {
  const provider: MapProvider = overrideProvider ?? MAP_PROVIDER;

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

  return { provider, autocomplete, resolve, geocode, reverseGeocode };
}

// ── Convenience standalone functions (no React context required) ──────────

export async function geocodeAddress(
  address: string,
  provider: MapProvider = MAP_PROVIDER,
): Promise<GeocodeResult> {
  if (provider === 'mapbox') return mapboxGeocode(address);
  return googleGeocode(address);
}

export async function reverseGeocodeCoords(
  coords: LngLat,
  provider: MapProvider = MAP_PROVIDER,
): Promise<GeocodeResult> {
  if (provider === 'mapbox') return mapboxReverseGeocode(coords);
  return googleReverseGeocode(coords);
}
