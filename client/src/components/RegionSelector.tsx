import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
}

export default function RegionSelector({ currentRegion, currentCountry, currentCity, onRegionChange, onCountryChange, onCityChange, showErrors = false }: RegionSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState(currentRegion || '');
  const [selectedCountry, setSelectedCountry] = useState(currentCountry || '');
  const [selectedCity, setSelectedCity] = useState(currentCity || '');
  
  const isRegionMissing = showErrors && !selectedRegion;
  const isCountryMissing = showErrors && !selectedCountry;
  const isCityMissing = showErrors && !selectedCity.trim();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRegionMutation = useMutation({
    mutationFn: async (region: string) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ region }),
      });

      if (!response.ok) {
        throw new Error('Failed to update region');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Region Updated',
        description: 'Your region has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      onRegionChange?.(selectedRegion);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update region. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateCountryMutation = useMutation({
    mutationFn: async (country: string) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ country }),
      });

      if (!response.ok) {
        throw new Error('Failed to update country');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Country Updated',
        description: 'Your country has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      onCountryChange?.(selectedCountry);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update country. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: async (city: string) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ city }),
      });

      if (!response.ok) {
        throw new Error('Failed to update city');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'City Updated',
        description: 'Your city has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      onCityChange?.(selectedCity);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update city. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveRegion = () => {
    if (selectedRegion) {
      updateRegionMutation.mutate(selectedRegion);
    }
  };

  const handleSaveCountry = () => {
    if (selectedCountry) {
      updateCountryMutation.mutate(selectedCountry);
    }
  };

  const handleSaveCity = () => {
    if (selectedCity.trim()) {
      updateCityMutation.mutate(selectedCity.trim());
    }
  };

  const handleSaveAllLocation = async () => {
    try {
      // Save all location fields in sequence
      if (selectedRegion && selectedRegion !== currentRegion) {
        await updateRegionMutation.mutateAsync(selectedRegion);
      }
      if (selectedCountry && selectedCountry !== currentCountry) {
        await updateCountryMutation.mutateAsync(selectedCountry);
      }
      if (selectedCity.trim() && selectedCity.trim() !== (currentCity || '')) {
        await updateCityMutation.mutateAsync(selectedCity.trim());
      }
    } catch (error) {
      console.error('Failed to save location data:', error);
    }
  };

  // Check if any location field has changed
  const hasLocationChanges = 
    (selectedRegion !== currentRegion) ||
    (selectedCountry !== currentCountry) ||
    (selectedCity.trim() !== (currentCity || ''));

  // Check if any mutation is pending
  const isAnyMutationPending = 
    updateRegionMutation.isPending ||
    updateCountryMutation.isPending ||
    updateCityMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region" className={isRegionMissing ? 'text-red-600' : ''}>
          Select Your Region {showErrors && <span className="text-red-600">*</span>}
        </Label>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
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
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
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
          onChange={(e) => setSelectedCity(e.target.value)}
          className={isCityMissing ? 'border-red-500 focus:border-red-500' : ''}
        />
        {isCityMissing && (
          <p className="text-red-600 text-sm">Please enter your city name</p>
        )}
      </div>
      
      {hasLocationChanges && (
        <Button 
          onClick={handleSaveAllLocation} 
          disabled={isAnyMutationPending || (!selectedRegion || !selectedCountry || !selectedCity.trim())}
          className="w-full"
        >
          {isAnyMutationPending ? 'Saving...' : 'Save'}
        </Button>
      )}
    </div>
  );
}