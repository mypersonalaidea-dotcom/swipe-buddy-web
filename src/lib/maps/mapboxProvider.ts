/**
 * ============================================================
 * Mapbox Provider Implementation
 * ============================================================
 * Wraps Mapbox Geocoding REST API for:
 *  - Address autocomplete (forward-geocoding suggestions)
 *  - Coordinate → address lookup (reverse-geocoding)
 *  - Full geocode (address → coordinates)
 *
 * Does NOT import mapbox-gl directly (that's the map renderer).
 * The map renderer is handled in MapboxMapRenderer.tsx.
 * ============================================================
 */

import { getProviderKey } from './config';
import type { GeocodeResult, LngLat, PlaceSuggestion, ResolvedAddress } from './types';

const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Build a query URL for the Mapbox Geocoding API.
 */
function buildUrl(
  query: string,
  options: { country?: string; proximity?: LngLat; limit?: number } = {},
): string {
  const token = getProviderKey('mapbox');
  const params = new URLSearchParams({
    access_token: token,
    autocomplete: 'true',
    language: 'en',
    limit: String(options.limit ?? 5),
  });
  if (options.country) params.set('country', options.country);
  if (options.proximity) {
    params.set('proximity', `${options.proximity[0]},${options.proximity[1]}`);
  }
  return `${BASE_URL}/${encodeURIComponent(query)}.json?${params.toString()}`;
}

/**
 * Parse a Mapbox feature into our internal ResolvedAddress shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFeature(feature: any): ResolvedAddress {
  const components: ResolvedAddress['components'] = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ctx of feature.context ?? []) {
    if (ctx.id.startsWith('postcode')) components.postalCode = ctx.text;
    else if (ctx.id.startsWith('place')) components.locality = ctx.text;
    else if (ctx.id.startsWith('region')) components.state = ctx.text;
    else if (ctx.id.startsWith('country')) components.country = ctx.text;
  }

  // For address-type features, extract street info from properties
  if (feature.place_type?.includes('address')) {
    components.streetNumber = feature.address;
    components.route = feature.text;
  }

  return {
    fullAddress: feature.place_name,
    displayName: feature.text,
    coordinates: [feature.center[0], feature.center[1]] as LngLat,
    components,
  };
}

/**
 * Fetch autocomplete suggestions from Mapbox for a partial query.
 */
export async function mapboxAutocomplete(
  query: string,
  options: { country?: string; proximity?: LngLat } = {},
): Promise<PlaceSuggestion[]> {
  if (!query || query.length < 2) return [];

  const url = buildUrl(query, { ...options, limit: 5 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[Mapbox] Geocoding failed: ${res.status}`);

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.features ?? []).map((f: any): PlaceSuggestion => ({
    id: f.id,
    displayText: f.text,
    secondaryText: f.place_name.replace(`${f.text}, `, ''),
    _raw: f,
  }));
}

/**
 * Resolve a suggestion (selected from dropdown) into a full GeocodeResult.
 */
export async function mapboxResolve(suggestion: PlaceSuggestion): Promise<GeocodeResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feature = suggestion._raw as any;
  return {
    ...parseFeature(feature),
    provider: 'mapbox',
  };
}

/**
 * Forward geocode: convert an address string → coordinates + details.
 */
export async function mapboxGeocode(
  address: string,
  options: { country?: string } = {},
): Promise<GeocodeResult> {
  const url = buildUrl(address, { ...options, limit: 1 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[Mapbox] Forward geocode failed: ${res.status}`);

  const data = await res.json();
  if (!data.features?.length) throw new Error(`[Mapbox] No results for: "${address}"`);

  return {
    ...parseFeature(data.features[0]),
    provider: 'mapbox',
  };
}

/**
 * Reverse geocode: convert [lng, lat] → address string + details.
 */
export async function mapboxReverseGeocode(coords: LngLat): Promise<GeocodeResult> {
  const token = getProviderKey('mapbox');
  const url = `${BASE_URL}/${coords[0]},${coords[1]}.json?access_token=${token}&language=en&limit=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`[Mapbox] Reverse geocode failed: ${res.status}`);

  const data = await res.json();
  if (!data.features?.length) throw new Error('[Mapbox] No results for coordinates');

  return {
    ...parseFeature(data.features[0]),
    provider: 'mapbox',
  };
}
