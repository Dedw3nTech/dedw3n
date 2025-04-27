import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LockKeyhole, Wallet, CreditCard, AlertTriangle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface PremiumVideoPaywallProps {
  videoId: number;
  title: string;
  creator: string;
  price: number;
  thumbnailUrl?: string;
  onPurchaseComplete: () => void;
}

const PaymentMethodOption = ({ value, icon, label, description }: { 
  value: string, 
  icon: React.ReactNode, 
  label: string, 
  description: string 
}) => {
  return (
    <div className="flex items-start space-x-3 my-1">
      <RadioGroupItem value={value} id={value} />
      <div className="grid gap-1.5">
        <Label htmlFor={value} className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export function PremiumVideoPaywall({ videoId, title, creator, price, thumbnailUrl, onPurchaseComplete }: PremiumVideoPaywallProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  
  // Check if user has access to this video
  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: [`/api/videos/${videoId}/access`],
    queryFn: async () => {
      if (!user) return { hasAccess: false };
      const res = await apiRequest('GET', `/api/videos/${videoId}/access`);
      return res.json();
    },
    enabled: !!user // Only run if user is logged in
  });

  // Mutation to purchase the video
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/videos/${videoId}/purchase`, {
        paymentMethod
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: "You now have access to this premium content.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/access`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/video-purchases'] });
      
      // Trigger the callback
      onPurchaseComplete();
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // If access check is loading
  if (accessLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user has access, don't show paywall
  if (accessData?.hasAccess) {
    return null;
  }

  // If not logged in or no access, show paywall
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <LockKeyhole className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg text-amber-500">Premium Content</CardTitle>
          </div>
          <CardDescription>
            This content is available exclusively to premium members
          </CardDescription>
        </CardHeader>
          
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {thumbnailUrl && (
              <div className="md:w-1/3 relative">
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <LockKeyhole className="h-12 w-12 text-white/70" />
                </div>
                <img 
                  src={thumbnailUrl} 
                  alt={title} 
                  className="w-full h-40 md:h-full object-cover rounded-md opacity-70" 
                />
              </div>
            )}
            
            <div className={thumbnailUrl ? "md:w-2/3" : "w-full"}>
              <h3 className="text-xl font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground mb-3">by {creator}</p>
              
              <div className="bg-secondary/30 p-4 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <span>Price:</span>
                  <span className="text-xl font-bold">£{price.toFixed(2)}</span>
                </div>
              </div>
              
              {!user ? (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-md text-yellow-800 dark:text-yellow-200 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">You need to be logged in to purchase premium content. Please log in or create an account.</p>
                </div>
              ) : (
                <>
                  <h4 className="font-medium mb-2">Select payment method:</h4>
                  <RadioGroup 
                    defaultValue="wallet" 
                    className="space-y-2"
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <PaymentMethodOption 
                      value="wallet" 
                      icon={<Wallet className="h-4 w-4" />} 
                      label="DEDWEN Wallet" 
                      description="Pay directly from your account balance" 
                    />
                    <PaymentMethodOption 
                      value="card" 
                      icon={<CreditCard className="h-4 w-4" />} 
                      label="Credit/Debit Card" 
                      description="Pay with your card (via Stripe)" 
                    />
                  </RadioGroup>
                </>
              )}
            </div>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="flex justify-between pt-4">
          <Button variant="outline">
            Back
          </Button>
          {user ? (
            <Button 
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>Unlock Content (£{price.toFixed(2)})</>
              )}
            </Button>
          ) : (
            <Button variant="default" onClick={() => window.location.href = '/auth'}>
              Sign In to Purchase
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default PremiumVideoPaywall;