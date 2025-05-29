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
}

export default function RegionSelector({ currentRegion, currentCountry, currentCity, onRegionChange, onCountryChange, onCityChange }: RegionSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState(currentRegion || '');
  const [selectedCountry, setSelectedCountry] = useState(currentCountry || '');
  const [selectedCity, setSelectedCity] = useState(currentCity || '');
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region">Select Your Region</Label>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger>
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
      </div>
      
      {selectedRegion !== currentRegion && (
        <Button 
          onClick={handleSaveRegion} 
          disabled={updateRegionMutation.isPending || !selectedRegion}
          className="w-full"
        >
          {updateRegionMutation.isPending ? 'Updating...' : 'Save Region'}
        </Button>
      )}

      <div className="space-y-2">
        <Label htmlFor="country">Select Your Country</Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger>
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
      </div>
      
      {selectedCountry !== currentCountry && (
        <Button 
          onClick={handleSaveCountry} 
          disabled={updateCountryMutation.isPending || !selectedCountry}
          className="w-full"
        >
          {updateCountryMutation.isPending ? 'Updating...' : 'Save Country'}
        </Button>
      )}

      <div className="space-y-2">
        <Label htmlFor="city">Your City</Label>
        <Input
          id="city"
          type="text"
          placeholder="Enter your city name"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        />
      </div>
      
      {selectedCity.trim() !== (currentCity || '') && (
        <Button 
          onClick={handleSaveCity} 
          disabled={updateCityMutation.isPending || !selectedCity.trim()}
          className="w-full"
        >
          {updateCityMutation.isPending ? 'Updating...' : 'Save City'}
        </Button>
      )}
    </div>
  );
}