/**
 * AddressAutocomplete
 * ─────────────────────────────────────────────────────────────
 * A polished address search input with a live dropdown.
 * Works with BOTH Mapbox and Google Maps via the useMaps hook.
 *
 * Usage:
 *   <AddressAutocomplete
 *     value={address}
 *     placeholder="Search for address..."
 *     onSelect={(result) => {
 *       setAddress(result.fullAddress);
 *       setCoords(result.coordinates);
 *     }}
 *   />
 *
 *   // Force a specific provider just for this component:
 *   <AddressAutocomplete provider="google" onSelect={...} />
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Loader2, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMaps } from '@/lib/maps/useMaps';
import type { AddressAutocompleteProps } from '@/lib/maps/types';
import type { PlaceSuggestion } from '@/lib/maps/types';

export function AddressAutocomplete({
  value = '',
  placeholder = 'Search for an address...',
  onSelect,
  onChange,
  provider,
  countryCode,
  disabled = false,
  id,
  className,
}: AddressAutocompleteProps) {
  const maps = useMaps(provider);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external `value` prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await maps.autocomplete(query, { country: countryCode });
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        console.error('[AddressAutocomplete]', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [maps, countryCode],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.(val);

    // Debounce API calls by 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    setIsLoading(true);
    setIsOpen(false);
    try {
      const result = await maps.resolve(suggestion);
      setInputValue(result.fullAddress);
      onSelect(result);
    } catch (err) {
      console.error('[AddressAutocomplete] resolve error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            'w-full pl-10 pr-10 h-10 rounded-md border border-input bg-background text-sm',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            'transition-all duration-150',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          aria-expanded={isOpen}
        />

        {/* Spinner / Clear button */}
        <div className="absolute right-3">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear address"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          id="address-suggestions"
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg',
            'overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150',
          )}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                // Prevent blur before click
                e.preventDefault();
                handleSelect(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-accent focus:bg-accent outline-none',
                index === activeIndex && 'bg-accent',
                index !== suggestions.length - 1 && 'border-b border-border',
              )}
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {suggestion.displayText}
                </p>
                {suggestion.secondaryText && (
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.secondaryText}
                  </p>
                )}
              </div>
            </button>
          ))}

          {/* Provider badge */}
          <div className="px-4 py-1.5 border-t border-border bg-muted/40 flex items-center justify-end gap-1">
            <span className="text-[10px] text-muted-foreground">
              Powered by {maps.provider === 'mapbox' ? 'Mapbox' : 'Google Maps'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
