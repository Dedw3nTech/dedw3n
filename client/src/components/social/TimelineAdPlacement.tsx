import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader2, Clock, Target, Users, Calendar, Sparkles } from 'lucide-react';

interface TimelineAdPlacementProps {
  contentId?: number;
  contentType?: 'video' | 'product' | 'post';
  onComplete?: () => void;
}

export function TimelineAdPlacement({ contentId, contentType = 'video', onComplete }: TimelineAdPlacementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [placementTab, setPlacementTab] = useState('frequency');
  const [frequency, setFrequency] = useState<number[]>([3]);
  const [enableEnhancedTargeting, setEnableEnhancedTargeting] = useState(false);
  const [adDuration, setAdDuration] = useState('7');
  
  // Mutation to create a timeline ad placement
  const placementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ads/timeline-placement', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ad placement created",
        description: "Your content has been scheduled for timeline placement",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/ads/campaigns'] });
      
      // Trigger callback
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Failed to create ad placement",
        description: error.message || "An error occurred while creating your ad placement.",
        variant: "destructive"
      });
    }
  });
  
  // Handle submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      contentId,
      contentType,
      title: formData.get('title'),
      description: formData.get('description'),
      placementStrategy: placementTab,
      frequency: placementTab === 'frequency' ? frequency[0] : null,
      timeSlots: placementTab === 'timing' ? {
        morning: formData.get('morning') === 'on',
        afternoon: formData.get('afternoon') === 'on',
        evening: formData.get('evening') === 'on',
        night: formData.get('night') === 'on',
      } : null,
      positionPreference: formData.get('position'),
      targeting: enableEnhancedTargeting ? {
        demographics: {
          ageRanges: Array.from(formData.getAll('age')),
          genders: Array.from(formData.getAll('gender')),
        },
        interests: Array.from(formData.getAll('interests')),
        behavior: formData.get('behavior'),
      } : null,
      budget: parseFloat(formData.get('budget') as string),
      duration: parseInt(adDuration),
    };
    
    placementMutation.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Timeline Ad Placement</CardTitle>
        </div>
        <CardDescription>
          Configure how your content appears in users\' social feeds
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Ad Creative Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ad Creative</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Ad Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="Enter a compelling headline..." 
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Ad Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Write a brief, engaging description..."
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Placement Strategy */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Placement Strategy</h3>
            <Tabs 
              defaultValue="frequency" 
              value={placementTab} 
              onValueChange={setPlacementTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="frequency">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Frequency-based</span>
                </TabsTrigger>
                <TabsTrigger value="timing">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Time-based</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="frequency" className="pt-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Display frequency (per user session)</Label>
                      <span className="text-sm font-medium">{frequency[0]} times</span>
                    </div>
                    <Slider
                      defaultValue={[3]}
                      max={10}
                      min={1}
                      step={1}
                      value={frequency}
                      onValueChange={setFrequency}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Less frequent</span>
                      <span>More frequent</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timing" className="pt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Select time slots when your ad should appear in users\' timelines
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="morning" name="morning" className="form-checkbox" />
                      <Label htmlFor="morning">Morning (6AM - 12PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="afternoon" name="afternoon" className="form-checkbox" />
                      <Label htmlFor="afternoon">Afternoon (12PM - 6PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="evening" name="evening" defaultChecked className="form-checkbox" />
                      <Label htmlFor="evening">Evening (6PM - 10PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="night" name="night" className="form-checkbox" />
                      <Label htmlFor="night">Night (10PM - 6AM)</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="grid gap-2 pt-2">
              <Label htmlFor="position">Position Preference</Label>
              <Select name="position" defaultValue="natural">
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top of timeline (Premium)</SelectItem>
                  <SelectItem value="natural">Natural placement within timeline</SelectItem>
                  <SelectItem value="interval">Regular intervals (every X posts)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Where your ad appears in users\' feeds. Premium positions have higher visibility.
              </p>
            </div>
          </div>
          
          {/* Enhanced Targeting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Enhanced Targeting</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="targeting-switch" 
                  checked={enableEnhancedTargeting} 
                  onCheckedChange={setEnableEnhancedTargeting} 
                />
                <Label htmlFor="targeting-switch">Enable</Label>
              </div>
            </div>
            
            {enableEnhancedTargeting && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="demographics">
                  <AccordionTrigger>Demographics</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Age Ranges</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="age-18-24" name="age" value="18-24" className="form-checkbox" />
                            <Label htmlFor="age-18-24" className="text-sm">18-24</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="age-25-34" name="age" value="25-34" className="form-checkbox" defaultChecked />
                            <Label htmlFor="age-25-34" className="text-sm">25-34</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="age-35-44" name="age" value="35-44" className="form-checkbox" defaultChecked />
                            <Label htmlFor="age-35-44" className="text-sm">35-44</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="age-45-54" name="age" value="45-54" className="form-checkbox" />
                            <Label htmlFor="age-45-54" className="text-sm">45-54</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="age-55-plus" name="age" value="55+" className="form-checkbox" />
                            <Label htmlFor="age-55-plus" className="text-sm">55+</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="gender-male" name="gender" value="male" className="form-checkbox" defaultChecked />
                            <Label htmlFor="gender-male" className="text-sm">Male</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="gender-female" name="gender" value="female" className="form-checkbox" defaultChecked />
                            <Label htmlFor="gender-female" className="text-sm">Female</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="gender-other" name="gender" value="other" className="form-checkbox" />
                            <Label htmlFor="gender-other" className="text-sm">Other</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="interests">
                  <AccordionTrigger>Interests & Behaviors</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Interests</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="interest-fashion" name="interests" value="fashion" className="form-checkbox" />
                            <Label htmlFor="interest-fashion" className="text-sm">Fashion</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="interest-tech" name="interests" value="technology" className="form-checkbox" />
                            <Label htmlFor="interest-tech" className="text-sm">Technology</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="interest-fitness" name="interests" value="fitness" className="form-checkbox" />
                            <Label htmlFor="interest-fitness" className="text-sm">Fitness</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="interest-food" name="interests" value="food" className="form-checkbox" />
                            <Label htmlFor="interest-food" className="text-sm">Food</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="interest-travel" name="interests" value="travel" className="form-checkbox" />
                            <Label htmlFor="interest-travel" className="text-sm">Travel</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="interest-gaming" name="interests" value="gaming" className="form-checkbox" />
                            <Label htmlFor="interest-gaming" className="text-sm">Gaming</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="behavior">Behavior Targeting</Label>
                        <Select name="behavior" defaultValue="active">
                          <SelectTrigger id="behavior">
                            <SelectValue placeholder="Select user behavior" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active shoppers</SelectItem>
                            <SelectItem value="content-creators">Content creators</SelectItem>
                            <SelectItem value="frequent-viewers">Frequent video viewers</SelectItem>
                            <SelectItem value="new-users">New platform users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
          
          {/* Budget & Duration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Budget & Duration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Campaign Budget (GBP)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">£</span>
                  <Input 
                    id="budget" 
                    name="budget" 
                    type="number" 
                    min="20" 
                    defaultValue="50" 
                    step="5" 
                    className="pl-8"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum budget: £20
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="duration">Campaign Duration</Label>
                <Select defaultValue="7" onValueChange={setAdDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Preview Section - This would typically include a timeline preview */}
          <div className="border rounded-md p-4 bg-secondary/10">
            <h3 className="text-sm font-medium mb-2">Estimated Impact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">
                  {enableEnhancedTargeting ? '9.5K' : '15K'}
                </div>
                <div className="text-xs text-muted-foreground">Est. Reach</div>
              </div>
              <div className="text-center">
                <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">
                  {enableEnhancedTargeting ? 'High' : 'Medium'}
                </div>
                <div className="text-xs text-muted-foreground">Relevance</div>
              </div>
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">{adDuration} days</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" type="button" onClick={onComplete}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={placementMutation.isPending}
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

export default TimelineAdPlacement;