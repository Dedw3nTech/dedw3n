/**
 * CitySearchAutocomplete Component
 * Enhanced city search with Google Maps API integration and autocomplete functionality
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, MapPin, CheckCircle, X } from 'lucide-react';
import { cityDataService, type City } from '@/services/cityDataService';
// Translation hook - simplified for now
const useMasterBatchTranslation = (strings: string[], priority: string) => {
  return { translations: strings }; // Return original strings as fallback
};

interface CitySearchAutocompleteProps {
  countryCode: string;
  countryName?: string;
  currentCity?: string;
  onCitySelect: (city: City) => void;
  placeholder?: string;
  disabled?: boolean;
  showErrors?: boolean;
  required?: boolean;
  className?: string;
}

export const CitySearchAutocomplete: React.FC<CitySearchAutocompleteProps> = ({
  countryCode,
  countryName,
  currentCity = '',
  onCitySelect,
  placeholder,
  disabled = false,
  showErrors = false,
  required = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(currentCity);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasValidated, setHasValidated] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Translation strings
  const translationStrings = useMemo(() => [
    "Search for your city...",
    "Type to search cities",
    "No cities found",
    "Loading cities...",
    "Select a city",
    "City search unavailable",
    "Invalid city selection",
    "Please select a city",
    "Selected city:",
    "Clear selection",
    "Search in",
    "cities available"
  ], []);

  const { translations } = useMasterBatchTranslation(translationStrings, 'high');
  
  const t = translationStrings.reduce((acc, str, index) => {
    acc[str] = translations[index] || str;
    return acc;
  }, {} as Record<string, string>);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!countryCode) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const cities = await cityDataService.searchCities({
          countryCode,
          query: searchQuery,
          limit: 10,
          includeCoordinates: true,
        });

        setSuggestions(cities);
        setIsOpen(cities.length > 0);

        if (cities.length === 0) {
          setError("No cities found");
        }
      } catch (err) {
        console.error('[CITY-SEARCH] Search failed:', err);
        setError("City search unavailable");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, countryCode]);

  // Handle city selection
  const handleCitySelect = async (city: City) => {
    setSelectedCity(city);
    setSearchQuery(city.name);
    setIsOpen(false);
    setError(null);
    setHasValidated(true);

    // Validate the selected city
    try {
      const isValid = await cityDataService.validateCity(city.name, countryCode);
      if (!isValid) {
        setError(t["Invalid city selection"]);
        return;
      }
    } catch (err) {
      console.warn('[CITY-SEARCH] Validation failed:', err);
    }

    onCitySelect(city);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedCity(null);
    setHasValidated(false);
    
    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setError(null);
    }
  };

  // Handle clear selection
  const handleClear = () => {
    setSearchQuery('');
    setSelectedCity(null);
    setSuggestions([]);
    setIsOpen(false);
    setError(null);
    setHasValidated(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validation state
  const isValid = selectedCity && hasValidated && !error;
  const isInvalid = showErrors && required && (!selectedCity || error);
  const showValidation = hasValidated || (showErrors && required);

  const inputPlaceholder = placeholder || 
    (countryName ? 
      `${t["Search in"]} ${countryName}...` : 
      t["Search for your city..."]
    );

  return (
    <div ref={containerRef} className={`relative space-y-2 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={inputPlaceholder}
          disabled={disabled || !countryCode}
          className={`pl-10 pr-10 ${
            showValidation ? (
              isValid ? 'border-green-500 focus:ring-green-500' :
              isInvalid ? 'border-red-500 focus:ring-red-500' :
              ''
            ) : ''
          }`}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
        />

        {/* Clear button */}
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Validation indicator */}
        {showValidation && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            {isValid && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Dropdown suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city) => (
            <div
              key={city.placeId}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleCitySelect(city)}
            >
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {city.name}
                  </div>
                  {city.administrativeArea && (
                    <div className="text-sm text-gray-500 truncate">
                      {city.administrativeArea}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {city.source === 'google' ? (
                      <span className="inline-flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Live data
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Local data
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div className="text-sm text-red-600 flex items-center">
          <X className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}

      {isValid && selectedCity && (
        <div className="text-sm text-green-600 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t["Selected city:"]} <strong className="ml-1">{selectedCity.name}</strong>
          {selectedCity.administrativeArea && (
            <span className="text-gray-500 ml-1">
              , {selectedCity.administrativeArea}
            </span>
          )}
        </div>
      )}

      {/* Empty state help */}
      {!countryCode && (
        <div className="text-sm text-gray-500">
          {t["Please select a country first"]}
        </div>
      )}

      {/* Loading state */}
      {isLoading && searchQuery && (
        <div className="text-sm text-blue-600 flex items-center">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          {t["Loading cities..."]}
        </div>
      )}
    </div>
  );
};