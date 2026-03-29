import type { MapProvider } from './config';

/** A geographic coordinate pair [longitude, latitude] */
export type LngLat = [number, number];

/** A resolved address with all location details */
export interface ResolvedAddress {
  /** Full human-readable address string */
  fullAddress: string;
  /** Short display name / place name */
  displayName: string;
  /** Coordinates [lng, lat] */
  coordinates: LngLat;
  /** Individual address components (best-effort, provider may omit some) */
  components: {
    streetNumber?: string;
    route?: string;       // street name
    locality?: string;   // city
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

/** An autocomplete suggestion returned while typing */
export interface PlaceSuggestion {
  /** Unique identifier (place_id for Google, feature id for Mapbox) */
  id: string;
  /** Display text shown in dropdown */
  displayText: string;
  /** Secondary line (e.g., city, state) shown below main text */
  secondaryText?: string;
  /** Raw provider-specific data, used internally to resolve coordinates */
  _raw: unknown;
}

/** Result after resolving / selecting a suggestion */
export interface GeocodeResult extends ResolvedAddress {
  /** Which provider resolved this result */
  provider: MapProvider;
}

/** Props shared by all map components */
export interface MapComponentProps {
  /** Override the global MAP_PROVIDER for this specific instance */
  provider?: MapProvider;
  /** Starting center coordinates [lng, lat] */
  center?: LngLat;
  /** Starting zoom level */
  zoom?: number;
  /** Height of the map container (CSS value) */
  height?: string;
  className?: string;
}

/** Props for the address autocomplete component */
export interface AddressAutocompleteProps extends Omit<MapComponentProps, 'height' | 'zoom'> {
  /** Current value (full address string) */
  value?: string;
  /** Placeholder for the input */
  placeholder?: string;
  /** Called when the user selects a suggestion */
  onSelect: (result: GeocodeResult) => void;
  /** Called when the input text changes (before selection) */
  onChange?: (value: string) => void;
  /** Restrict results to a country code (e.g. 'in' for India) */
  countryCode?: string;
  disabled?: boolean;
  id?: string;
}

/** Props for the full map picker component */
export interface MapPickerProps extends MapComponentProps {
  /** Currently selected location */
  location?: string;
  /** Currently selected coordinates */
  coordinates?: LngLat;
  /** Radius in km */
  radius?: number;
  /** Whether to show the radius slider */
  showRadius?: boolean;
  /** Whether to show the search/geocoder input on the map */
  showSearch?: boolean;
  /** Whether the map is in read-only mode */
  disabled?: boolean;
  /** Called when the user selects a location */
  onLocationChange?: (result: GeocodeResult) => void;
  /** Called when radius slider changes */
  onRadiusChange?: (radius: number) => void;
}
