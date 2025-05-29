import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const REGIONS = [
  'Africa',
  'South Asia', 
  'East Asia',
  'Oceania',
  'North America',
  'Central America',
  'South America',
  'Middle East',
  'Europe',
  'Central Asia'
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

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
  const [selectedRegion, setSelectedRegion] = useState(currentRegion || '');
  const [selectedCountry, setSelectedCountry] = useState(currentCountry || '');
  const [selectedCity, setSelectedCity] = useState(currentCity || '');

  // Sync local state with props when they change
  useEffect(() => {
    setSelectedRegion(currentRegion || '');
    setSelectedCountry(currentCountry || '');
    setSelectedCity(currentCity || '');
  }, [currentRegion, currentCountry, currentCity]);
  
  const isRegionMissing = showErrors && !selectedRegion;
  const isCountryMissing = showErrors && !selectedCountry;
  const isCityMissing = showErrors && !selectedCity.trim();

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    onRegionChange?.(value);
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    onCountryChange?.(value);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedCity(value);
    onCityChange?.(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region" className={isRegionMissing ? 'text-red-600' : ''}>
          Select Your Region {showErrors && <span className="text-red-600">*</span>}
        </Label>
        <Select value={selectedRegion} onValueChange={handleRegionChange} disabled={disabled}>
          <SelectTrigger className={isRegionMissing ? 'border-red-500 focus:border-red-500' : ''}>
            <SelectValue placeholder="Choose your region" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isRegionMissing && (
          <p className="text-red-600 text-sm">Please select a region</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="country" className={isCountryMissing ? 'text-red-600' : ''}>
          Select Your Country {showErrors && <span className="text-red-600">*</span>}
        </Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className={isCountryMissing ? 'border-red-500 focus:border-red-500' : ''}>
            <SelectValue placeholder="Choose your country" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isCountryMissing && (
          <p className="text-red-600 text-sm">Please select a country</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city" className={isCityMissing ? 'text-red-600' : ''}>
          Your City {showErrors && <span className="text-red-600">*</span>}
        </Label>
        <Input
          id="city"
          type="text"
          placeholder="Enter your city name"
          value={selectedCity}
          onChange={handleCityChange}
          disabled={disabled}
          className={isCityMissing ? 'border-red-500 focus:border-red-500' : ''}
        />
        {isCityMissing && (
          <p className="text-red-600 text-sm">Please enter your city name</p>
        )}
      </div>
    </div>
  );
}