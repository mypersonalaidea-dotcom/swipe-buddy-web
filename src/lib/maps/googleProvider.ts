/**
 * ============================================================
 * Google Maps Provider Implementation
 * ============================================================
 * Uses Google Maps JavaScript SDK (loaded via script tag) for:
 *  - Address autocomplete (Places Autocomplete Service)
 *  - Coordinate → address lookup (Geocoder)
 *  - Full address → coordinate (Geocoder)
 *
 * Required Google APIs (enable in Cloud Console):
 *   ✅ Maps JavaScript API
 *   ✅ Places API
 *   ✅ Geocoding API
 * ============================================================
 */

import { getProviderKey } from './config';
import type { GeocodeResult, LngLat, PlaceSuggestion, ResolvedAddress } from './types';

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Dynamically loads the Google Maps JS SDK (once, deduped).
 * Resolves when `window.google.maps` is ready.
 */
export function loadGoogleMapsScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    // Already loaded
    if (window.google?.maps) {
      resolve();
      return;
    }

    const key = getProviderKey('google');
    const callbackName = '__swipebuddy_gmaps_cb__';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[callbackName] = () => {
      resolve();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[callbackName];
    };

    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${key}` +
      `&libraries=places,geometry&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('[Google Maps] Failed to load SDK'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Parse a Google GeocoderResult into our internal ResolvedAddress.
 */
function parseGeocoderResult(result: google.maps.GeocoderResult): ResolvedAddress {
  const components: ResolvedAddress['components'] = {};

  for (const comp of result.address_components) {
    const types = comp.types;
    if (types.includes('street_number')) components.streetNumber = comp.long_name;
    else if (types.includes('route')) components.route = comp.long_name;
    else if (types.includes('locality')) components.locality = comp.long_name;
    else if (types.includes('administrative_area_level_1')) components.state = comp.long_name;
    else if (types.includes('country')) components.country = comp.long_name;
    else if (types.includes('postal_code')) components.postalCode = comp.long_name;
  }

  const loc = result.geometry.location;
  const coords: LngLat = [loc.lng(), loc.lat()];

  return {
    fullAddress: result.formatted_address,
    displayName:
      result.address_components.find((c) => c.types.includes('locality'))?.long_name ??
      result.formatted_address,
    coordinates: coords,
    components,
  };
}

/** --- Autocomplete (Places) ------------------------------------------- */

/** Internal cache so we reuse the AutocompleteService */
let autocompleteService: google.maps.places.AutocompleteService | null = null;

/**
 * Fetch address autocomplete suggestions using the Places API.
 */
export async function googleAutocomplete(
  query: string,
  options: { country?: string } = {},
): Promise<PlaceSuggestion[]> {
  if (!query || query.length < 2) return [];

  await loadGoogleMapsScript();

  if (!autocompleteService) {
    autocompleteService = new google.maps.places.AutocompleteService();
  }

  return new Promise((resolve, reject) => {
    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      types: ['geocode'],
      ...(options.country
        ? { componentRestrictions: { country: options.country } }
        : {}),
    };

    autocompleteService!.getPlacePredictions(request, (predictions, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS ||
        !predictions
      ) {
        resolve([]);
        return;
      }
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        reject(new Error(`[Google Places] Status: ${status}`));
        return;
      }

      resolve(
        predictions.map((p): PlaceSuggestion => ({
          id: p.place_id,
          displayText: p.structured_formatting.main_text,
          secondaryText: p.structured_formatting.secondary_text,
          _raw: p,
        })),
      );
    });
  });
}

/** Internal Geocoder instance */
let geocoder: google.maps.Geocoder | null = null;

/**
 * Resolve a PlaceSuggestion (from autocomplete) into a full GeocodeResult.
 * Uses the place_id to get precise coordinates.
 */
export async function googleResolve(suggestion: PlaceSuggestion): Promise<GeocodeResult> {
  await loadGoogleMapsScript();

  if (!geocoder) geocoder = new google.maps.Geocoder();

  const placeId = (suggestion._raw as google.maps.places.AutocompletePrediction).place_id;

  return new Promise((resolve, reject) => {
    geocoder!.geocode({ placeId }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
        reject(new Error(`[Google Geocoder] Failed for placeId ${placeId}: ${status}`));
        return;
      }
      resolve({ ...parseGeocoderResult(results[0]), provider: 'google' });
    });
  });
}

/**
 * Forward geocode: address string → coordinates.
 */
export async function googleGeocode(address: string): Promise<GeocodeResult> {
  await loadGoogleMapsScript();
  if (!geocoder) geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder!.geocode({ address }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
        reject(new Error(`[Google Geocoder] Forward geocode failed: ${status}`));
        return;
      }
      resolve({ ...parseGeocoderResult(results[0]), provider: 'google' });
    });
  });
}

/**
 * Reverse geocode: [lng, lat] → address.
 */
export async function googleReverseGeocode(coords: LngLat): Promise<GeocodeResult> {
  await loadGoogleMapsScript();
  if (!geocoder) geocoder = new google.maps.Geocoder();

  const latLng: google.maps.LatLngLiteral = { lat: coords[1], lng: coords[0] };

  return new Promise((resolve, reject) => {
    geocoder!.geocode({ location: latLng }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
        reject(new Error(`[Google Geocoder] Reverse geocode failed: ${status}`));
        return;
      }
      resolve({ ...parseGeocoderResult(results[0]), provider: 'google' });
    });
  });
}
