import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const response = await fetch(`/api/cities/by-country/${encodeURIComponent(country)}?limit=200`);
  if (!response.ok) throw new Error('Failed to fetch cities');
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
  translations: t
}: EnhancedCitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Filter cities based on search term
  const filteredCities = availableCities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setSearchTerm('');
  };

  const handleCustomCity = () => {
    if (searchTerm.trim()) {
      onCityChange(searchTerm.trim());
      setSearchTerm('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {t.city || 'City'}
      </label>
      
      <div className="space-y-2">
        <Select
          value={selectedCity}
          onValueChange={handleCitySelect}
          disabled={disabled}
        >
          <SelectTrigger className={`w-full ${showErrors && isCityMissing ? 'border-red-500' : ''}`}>
            <SelectValue placeholder={
              citiesLoading 
                ? 'Loading cities...' 
                : t.selectCity || 'Select your City'
            } />
          </SelectTrigger>
          <SelectContent>
            {citiesLoading ? (
              <SelectItem value="__loading__" disabled>Loading cities...</SelectItem>
            ) : (
              <>
                {availableCities.slice(0, 100).map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
                {availableCities.length > 100 && (
                  <SelectItem value="__search_more__" disabled>
                    ... and {availableCities.length - 100} more cities available
                  </SelectItem>
                )}
              </>
            )}
          </SelectContent>
        </Select>
        
        
        {showCustomInput && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type your city name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="button" onClick={handleCustomCity} size="sm">
              Add
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { setShowCustomInput(false); setSearchTerm(''); }}
              size="sm"
            >
              Cancel
            </Button>
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