/**
 * Maps module — public API
 * Import everything you need from '@/lib/maps'
 */

// Config
export { MAP_PROVIDER, GEOCODE_PROVIDER, MAPBOX_TOKEN, GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER, DEFAULT_ZOOM, DEFAULT_RADIUS_KM } from './config';
export type { MapProvider } from './config';

// Types
export type {
  LngLat,
  ResolvedAddress,
  PlaceSuggestion,
  GeocodeResult,
  MapPickerProps,
  AddressAutocompleteProps,
  MapComponentProps,
} from './types';

// Hook
export { useMaps, geocodeAddress, reverseGeocodeCoords } from './useMaps';
export type { UseMapsReturn } from './useMaps';

// Provider functions (advanced use)
export { mapboxAutocomplete, mapboxGeocode, mapboxReverseGeocode } from './mapboxProvider';
export {
  googleAutocomplete,
  googleGeocode,
  googleReverseGeocode,
  loadGoogleMapsScript,
} from './googleProvider';
