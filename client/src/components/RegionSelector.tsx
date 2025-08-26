import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

// API functions to fetch data from our comprehensive city database
const fetchRegions = async (): Promise<string[]> => {
  const response = await fetch('/api/cities/regions');
  if (!response.ok) throw new Error('Failed to fetch regions');
  return response.json();
};

const fetchCountriesByRegion = async (region: string): Promise<string[]> => {
  const response = await fetch(`/api/cities/by-region/${encodeURIComponent(region)}`);
  if (!response.ok) throw new Error('Failed to fetch countries');
  return response.json();
};

const fetchCitiesByCountry = async (country: string): Promise<string[]> => {
  const response = await fetch(`/api/cities/by-country/${encodeURIComponent(country)}`);
  if (!response.ok) throw new Error('Failed to fetch cities');
  return response.json();
};

const searchCities = async (country: string, query: string): Promise<string[]> => {
  if (!query || query.length < 1) return [];
  const response = await fetch(`/api/cities/search/${encodeURIComponent(country)}?q=${encodeURIComponent(query)}&limit=10`);
  if (!response.ok) throw new Error('Failed to search cities');
  return response.json();
};

interface RegionSelectorProps {
  currentRegion?: string | null;
  currentCountry?: string | null;
  currentCity?: string | null;
  onRegionChange?: (region: string) => void;
  onCountryChange?: (country: string) => void;
  onCityChange?: (city: string) => void;
  showErrors?: boolean;
  disabled?: boolean;
}

// Enhanced City Selector Component with Google Maps integration
interface EnhancedCitySelectorProps {
  selectedCountry: string;
  selectedCity: string;
  availableCities: string[];
  onCityChange: (city: string) => void;
  disabled: boolean;
  isCityMissing: boolean;
  showErrors: boolean;
  citiesLoading: boolean;
  translations: Record<string, string>;
}

function EnhancedCitySelector({
  selectedCountry,
  selectedCity,
  availableCities,
  onCityChange,
  disabled,
  isCityMissing,
  showErrors,
  citiesLoading,
  translations: t
}: EnhancedCitySelectorProps) {
  const [inputValue, setInputValue] = useState(selectedCity || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Search for cities as user types
  const { data: suggestions = [], isLoading: searchLoading } = useQuery({
    queryKey: ['citySearch', selectedCountry, searchTerm],
    queryFn: () => searchCities(selectedCountry, searchTerm),
    enabled: !!selectedCountry && !!searchTerm && searchTerm.length > 0,
    staleTime: 1000 * 30, // Cache for 30 seconds
  });

  // Update input value when selectedCity changes from parent
  useEffect(() => {
    setInputValue(selectedCity || '');
  }, [selectedCity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleCitySelect = (city: string) => {
    setInputValue(city);
    onCityChange(city);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowSuggestions(false);
      // Update parent with current input value when user finishes typing
      if (inputValue !== selectedCity) {
        onCityChange(inputValue);
      }
    }, 200);
  };

  const handleInputFocus = () => {
    if (inputValue.length > 0) {
      setSearchTerm(inputValue);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {t.city || 'City'}
      </label>
      
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={t.selectCity || 'Type your city name...'}
          disabled={disabled}
          className={`w-full ${showErrors && isCityMissing ? 'border-red-500' : ''}`}
        />
        
        {/* Autocomplete suggestions dropdown */}
        {showSuggestions && searchTerm && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchLoading ? (
              <div className="px-3 py-2 text-gray-500">Searching...</div>
            ) : (
              suggestions.map((city, index) => (
                <div
                  key={`${city}-${index}`}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    handleCitySelect(city);
                  }}
                >
                  {city}
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Show message when no suggestions found */}
        {showSuggestions && searchTerm && !searchLoading && suggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="px-3 py-2 text-gray-500">No cities found. You can still type your city name.</div>
          </div>
        )}
      </div>
      
      {showErrors && isCityMissing && (
        <p className="text-red-500 text-sm">{t.cityRequired || 'City is required'}</p>
      )}
    </div>
  );
}

export default function RegionSelector({
  currentRegion,
  currentCountry,
  currentCity,
  onRegionChange,
  onCountryChange,
  onCityChange,
  showErrors = false,
  disabled = false
}: RegionSelectorProps) {
  const { t } = useTranslation();
  
  // React Query hooks for fetching data from API
  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const { data: availableCountries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ['countries', currentRegion],
    queryFn: () => fetchCountriesByRegion(currentRegion!),
    enabled: !!currentRegion,
    staleTime: 1000 * 60 * 60,
  });

  const { data: availableCities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['cities', currentCountry],
    queryFn: () => fetchCitiesByCountry(currentCountry!),
    enabled: !!currentCountry,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // Check if fields are missing (for error display)
  const isRegionMissing = showErrors && !currentRegion;
  const isCountryMissing = showErrors && !currentCountry;
  const isCityMissing = showErrors && !currentCity;

  // Reset dependent fields when parent field changes
  const handleRegionChange = (region: string) => {
    onRegionChange?.(region);
    onCountryChange?.(''); // Reset country when region changes
    onCityChange?.(''); // Reset city when region changes
  };

  const handleCountryChange = (country: string) => {
    onCountryChange?.(country);
    onCityChange?.(''); // Reset city when country changes
  };

  const handleCityChange = (city: string) => {
    onCityChange?.(city);
  };

  return (
    <div className="space-y-4">
      {/* Region Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {t('region') || 'Region'}
        </label>
        <Select
          value={currentRegion || ''}
          onValueChange={handleRegionChange}
          disabled={disabled}
        >
          <SelectTrigger className={`w-full ${isRegionMissing ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select your region" />
          </SelectTrigger>
          <SelectContent>
            {regionsLoading ? (
              <SelectItem value="__loading__" disabled>Loading regions...</SelectItem>
            ) : (
              regions.sort().map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {isRegionMissing && (
          <p className="text-red-500 text-sm">{t('regionRequired') || 'Region is required'}</p>
        )}
      </div>

      {/* Country Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {t('country') || 'Country'}
        </label>
        <Select
          value={currentCountry || ''}
          onValueChange={handleCountryChange}
          disabled={disabled || !currentRegion || countriesLoading}
        >
          <SelectTrigger className={`w-full ${isCountryMissing ? 'border-red-500' : ''}`}>
            <SelectValue placeholder={
              !currentRegion 
                ? 'Select region first'
                : countriesLoading
                ? 'Loading countries...'
                : 'Select your country'
            } />
          </SelectTrigger>
          <SelectContent>
            {countriesLoading ? (
              <SelectItem value="__loading__" disabled>Loading countries...</SelectItem>
            ) : (
              availableCountries.sort().map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {isCountryMissing && (
          <p className="text-red-500 text-sm">{t('countryRequired') || 'Country is required'}</p>
        )}
      </div>

      {/* City Selection with Enhanced Google Maps Integration */}
      {currentCountry && (
        <EnhancedCitySelector
          selectedCountry={currentCountry}
          selectedCity={currentCity || ''}
          availableCities={availableCities}
          onCityChange={handleCityChange}
          disabled={disabled}
          isCityMissing={isCityMissing}
          showErrors={showErrors}
          citiesLoading={citiesLoading}
          translations={{
            city: t('city') || 'City',
            selectCity: t('selectCity') || 'Select your City',
            cityRequired: t('cityRequired') || 'City is required'
          }}
        />
      )}
    </div>
  );
}