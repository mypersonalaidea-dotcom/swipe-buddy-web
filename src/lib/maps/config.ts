/**
 * ============================================================
 * 🗺️  MAPS GLOBAL CONFIGURATION
 * ============================================================
 *
 * Change MAP_PROVIDER to switch between 'mapbox' and 'google'
 * globally across the entire app.
 *
 * Keys are picked up from your .env.local file:
 *   VITE_MAPBOX_TOKEN=pk.eyJ1...
 *   VITE_GOOGLE_MAPS_API_KEY=AIza...
 *
 * You can also override the provider per-usage by passing
 * { provider: 'google' } explicitly to the <MapPicker /> or
 * <AddressAutocomplete /> components.
 * ============================================================
 */

export type MapProvider = 'mapbox' | 'google';

/** ✅ CHANGE THIS to switch the default map provider app-wide */
export const MAP_PROVIDER: MapProvider = 'google';

/** Mapbox public access token */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

/** Google Maps JavaScript API key (must have Maps JS, Places, Geocoding APIs enabled) */
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/**
 * Default map center coordinates.
 * [longitude, latitude] — defaults to New Delhi, India.
 */
export const DEFAULT_MAP_CENTER: [number, number] = [77.209, 28.6139];

/** Default zoom level (0-22 for Mapbox, 1-21 for Google) */
export const DEFAULT_ZOOM = 12;

/** Default search radius in km */
export const DEFAULT_RADIUS_KM = 5;

/**
 * Returns the active API key for the given provider.
 * Throws a descriptive error if the key is missing.
 */
export function getProviderKey(provider: MapProvider): string {
  if (provider === 'mapbox') {
    if (!MAPBOX_TOKEN) {
      throw new Error(
        '[Maps] Missing VITE_MAPBOX_TOKEN in .env.local.\n' +
          'Get your free token at https://account.mapbox.com/access-tokens/',
      );
    }
    return MAPBOX_TOKEN;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      '[Maps] Missing VITE_GOOGLE_MAPS_API_KEY in .env.local.\n' +
        'Create one at https://console.cloud.google.com/ and enable:\n' +
        '  • Maps JavaScript API\n' +
        '  • Places API\n' +
        '  • Geocoding API',
    );
  }
  return GOOGLE_MAPS_API_KEY;
}
