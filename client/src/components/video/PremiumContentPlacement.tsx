import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Layout, Star, TrendingUp } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface PlacementOption {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  reach: string;
  icon: React.ReactNode;
}

interface PremiumContentPlacementProps {
  videoId?: number;
  onComplete?: () => void;
}

export function PremiumContentPlacement({ videoId, onComplete }: PremiumContentPlacementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [customTargeting, setCustomTargeting] = useState(false);
  
  // Placement options
  const placementOptions: PlacementOption[] = [
    {
      id: 'featured',
      name: 'Featured Section',
      description: 'Premium placement at the top of the explore page',
      price: 19.99,
      duration: '7 days',
      reach: '70,000+ impressions',
      icon: <Star className="h-5 w-5 text-amber-500" />
    },
    {
      id: 'trending',
      name: 'Trending Tab',
      description: 'Place your content in the trending videos section',
      price: 14.99,
      duration: '5 days',
      reach: '50,000+ impressions',
      icon: <TrendingUp className="h-5 w-5 text-rose-500" />
    },
    {
      id: 'feed',
      name: 'In-Feed Placement',
      description: 'Native placement in users\' personalized feeds',
      price: 9.99,
      duration: '3 days',
      reach: '30,000+ impressions',
      icon: <Layout className="h-5 w-5 text-blue-500" />
    }
  ];
  
  // Demographic options
  const ageGroups = ["13-17", "18-24", "25-34", "35-44", "45-54", "55+"];
  const interests = ["Fashion", "Gaming", "Technology", "Sports", "Music", "Cooking", "Travel", "Education"];
  
  // Mutation to create a content placement
  const placementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/videos/${videoId}/placement`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Placement created successfully",
        description: "Your premium content has been scheduled for promotion",
      });
      
      // Invalidate queries
      if (videoId) {
        queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
      }
      
      // Call the completion callback
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Failed to create placement",
        description: error.message || "An error occurred while setting up your content placement.",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlacement) {
      toast({
        title: "Please select a placement option",
        variant: "destructive"
      });
      return;
    }
    
    // Form elements
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      placementType: selectedPlacement,
      title: formData.get('title'),
      description: formData.get('description'),
      targetAudience: customTargeting ? {
        ageGroups: formData.getAll('ageGroups'),
        interests: formData.getAll('interests'),
        regions: formData.get('regions')?.toString().split(',')
      } : null
    };
    
    placementMutation.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Premium Content Placement</CardTitle>
        <CardDescription>
          Boost visibility of your premium content with strategic placement
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select Placement Option</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {placementOptions.map((option) => (
                <div 
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
                    selectedPlacement === option.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPlacement(option.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {option.icon}
                    <span className="font-medium">{option.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>£{option.price}</span>
                    <span>{option.duration}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {option.reach}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Promotional Details</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Promotional Title</Label>
                <Input id="title" name="title" placeholder="Enter an attention-grabbing title..." />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Promotional Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Brief description for your promoted content..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Custom Audience Targeting</h3>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="custom-targeting" 
                  checked={customTargeting} 
                  onCheckedChange={setCustomTargeting} 
                />
                <Label htmlFor="custom-targeting">Enable</Label>
              </div>
            </div>
            
            {customTargeting && (
              <div className="space-y-4 bg-secondary/20 p-4 rounded-md">
                <div className="grid gap-2">
                  <Label>Age Groups</Label>
                  <div className="flex flex-wrap gap-2">
                    {ageGroups.map((age) => (
                      <label key={age} className="flex items-center space-x-2">
                        <input type="checkbox" name="ageGroups" value={age} className="form-checkbox" />
                        <span className="text-sm">{age}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <label key={interest} className="flex items-center space-x-2">
                        <input type="checkbox" name="interests" value={interest} className="form-checkbox" />
                        <span className="text-sm">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="regions">Regions (comma separated)</Label>
                  <Input id="regions" name="regions" placeholder="e.g. London, New York, Paris" />
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Placement Summary</h3>
            {selectedPlacement ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Selected Plan:</span>
                  <span className="font-medium">
                    {placementOptions.find(opt => opt.id === selectedPlacement)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">
                    £{placementOptions.find(opt => opt.id === selectedPlacement)?.price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>
                    {placementOptions.find(opt => opt.id === selectedPlacement)?.duration}
                  </span>
                </div>
                {customTargeting && (
                  <div className="flex justify-between">
                    <span>Custom Targeting:</span>
                    <span>Enabled</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Please select a placement option</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" type="button" onClick={onComplete}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedPlacement || placementMutation.isPending}
          >
            {placementMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Create Placement'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default PremiumContentPlacement;