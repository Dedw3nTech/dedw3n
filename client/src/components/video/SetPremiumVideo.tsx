import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define schema for premium video settings
const premiumVideoSchema = z.object({
  isPremium: z.boolean().default(false),
  price: z
    .number()
    .min(0.99, { message: "Price must be at least £0.99" })
    .max(99.99, { message: "Price cannot exceed £99.99" })
    .optional()
    .nullable()
    .default(4.99),
});

type PremiumVideoFormValues = z.infer<typeof premiumVideoSchema>;

interface SetPremiumVideoProps {
  videoId: number;
  initialValues?: { isPremium: boolean; price: number | null };
  onComplete?: () => void;
}

export function SetPremiumVideo({ videoId, initialValues, onComplete }: SetPremiumVideoProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPremium, setIsPremium] = useState(initialValues?.isPremium || false);

  // Set up form with default values
  const form = useForm<PremiumVideoFormValues>({
    resolver: zodResolver(premiumVideoSchema),
    defaultValues: {
      isPremium: initialValues?.isPremium || false,
      price: initialValues?.price || 4.99,
    },
  });

  // Mutation to update video premium status
  const updateMutation = useMutation({
    mutationFn: async (data: PremiumVideoFormValues) => {
      const res = await apiRequest('PATCH', `/api/videos/${videoId}`, {
        isPremium: data.isPremium,
        price: data.isPremium ? data.price : null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Video settings updated",
        description: isPremium 
          ? "This video is now set as premium content" 
          : "This video is now available to everyone",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
      
      // Trigger the callback if provided
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Failed to update video settings",
        description: error.message || "An error occurred while updating the video.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: PremiumVideoFormValues) => {
    updateMutation.mutate(data);
  };

  // Toggle premium status
  const handlePremiumToggle = (checked: boolean) => {
    setIsPremium(checked);
    form.setValue('isPremium', checked);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg">Premium Content Settings</CardTitle>
        </div>
        <CardDescription>
          Make this video available exclusively to paying viewers
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="premium-toggle">Set as Premium Content</Label>
                <FormDescription>
                  Viewers will need to pay to access this video
                </FormDescription>
              </div>
              <FormField
                control={form.control}
                name="isPremium"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        id="premium-toggle"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handlePremiumToggle(checked);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            {isPremium && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (GBP)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">£</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.99"
                          max="99.99"
                          className="pl-8"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            field.onChange(value);
                          }}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set the price viewers will pay to access this content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          
          <CardFooter className="border-t pt-6">
            <Button 
              type="submit" 
              className="ml-auto"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default SetPremiumVideo;