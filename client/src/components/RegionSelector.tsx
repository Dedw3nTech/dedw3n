import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

interface RegionSelectorProps {
  currentRegion?: string | null;
  onRegionChange?: (region: string) => void;
}

export default function RegionSelector({ currentRegion, onRegionChange }: RegionSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState(currentRegion || '');
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

  const handleSave = () => {
    if (selectedRegion) {
      updateRegionMutation.mutate(selectedRegion);
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
          onClick={handleSave} 
          disabled={updateRegionMutation.isPending || !selectedRegion}
          className="w-full"
        >
          {updateRegionMutation.isPending ? 'Updating...' : 'Save Region'}
        </Button>
      )}
    </div>
  );
}