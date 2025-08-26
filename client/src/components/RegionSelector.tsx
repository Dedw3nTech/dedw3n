import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { COMPREHENSIVE_CITIES_BY_COUNTRY } from '../data/enhancedCityData';

// Regional organization of countries for better UX
const COUNTRIES_BY_REGION: Record<string, string[]> = {
  'North America': [
    'Canada', 'United States', 'Mexico', 'Guatemala', 'Belize', 'El Salvador', 'Honduras',
    'Nicaragua', 'Costa Rica', 'Panama'
  ],
  'Asia': [
    'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei',
    'Cambodia', 'China', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel',
    'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon',
    'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman',
    'Pakistan', 'Palestine', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore',
    'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand',
    'Timor-Leste', 'Turkey', 'Turkmenistan', 'United Arab Emirates', 'Uzbekistan',
    'Vietnam', 'Yemen'
  ],
  'Africa': [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
    'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Democratic Republic of the Congo',
    'Republic of the Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea',
    'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau',
    'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
    'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger',
    'Nigeria', 'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles',
    'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania',
    'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ],
  'South America': [
    'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay',
    'Peru', 'Suriname', 'Uruguay', 'Venezuela'
  ],
  'Middle East': [
    'Bahrain', 'Cyprus', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman',
    'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'United Arab Emirates', 'Yemen'
  ],
  'Europe': [
    'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium',
    'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia',
    'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland',
    'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia', 'Malta',
    'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'Norway', 'Poland', 'Portugal',
    'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
    'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'
  ],
  'Central Asia': [
    'Kazakhstan', 'Kyrgyzstan', 'Mongolia', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'
  ]
};



// Using comprehensive global city database from enhancedCityData.ts
// This includes thousands of cities, towns, and villages from all 195+ countries
const CITIES_BY_COUNTRY = COMPREHENSIVE_CITIES_BY_COUNTRY;

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
            <SelectValue placeholder={t.selectCity || 'Select your city'} />
          </SelectTrigger>
          <SelectContent>
            {availableCities.slice(0, 50).map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
            {availableCities.length > 50 && (
              <SelectItem value="__search_more__" disabled>
                ... and {availableCities.length - 50} more cities
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {availableCities.length > 50 && (
          <div className="text-sm text-gray-600">
            Showing first 50 cities out of {availableCities.length} available.
            {!showCustomInput && (
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto ml-1"
                onClick={() => setShowCustomInput(true)}
              >
                Search or add custom city
              </Button>
            )}
          </div>
        )}
        
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
  
  // Get countries for the selected region
  const getCountriesForRegion = (region: string): string[] => {
    return COUNTRIES_BY_REGION[region] || [];
  };

  // Get cities for the selected country
  const getCitiesForCountry = (country: string): string[] => {
    return CITIES_BY_COUNTRY[country] || [];
  };

  // Check if fields are missing (for error display)
  const isRegionMissing = showErrors && !currentRegion;
  const isCountryMissing = showErrors && !currentCountry;
  const isCityMissing = showErrors && !currentCity;

  // Available options based on current selections
  const availableCountries = currentRegion ? getCountriesForRegion(currentRegion) : [];
  const availableCities = currentCountry ? getCitiesForCountry(currentCountry) : [];

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
            {Object.keys(COUNTRIES_BY_REGION).sort().map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
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
          disabled={disabled || !currentRegion}
        >
          <SelectTrigger className={`w-full ${isCountryMissing ? 'border-red-500' : ''}`}>
            <SelectValue placeholder={
              !currentRegion 
                ? 'Select region first'
                : 'Select your country'
            } />
          </SelectTrigger>
          <SelectContent>
            {availableCountries.sort().map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
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
            selectCity: t('selectCity') || 'Select or type your city',
            cityRequired: t('cityRequired') || 'City is required'
          }}
        />
      )}
    </div>
  );
}