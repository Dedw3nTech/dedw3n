import { useState } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Heart, Calendar, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SubscriptionWallProps {
  children: React.ReactNode;
  featureName?: string;
}

export function SubscriptionWall({ children, featureName = 'Dating' }: SubscriptionWallProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { subscription, activateSubscription, activateTrial } = useSubscription();
  const { user } = useAuth();
  
  if (subscription.isActive) {
    return <>{children}</>;
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Premium Feature: {featureName}</CardTitle>
          <CardDescription className="text-base mt-2">
            Unlock our premium {featureName.toLowerCase()} feature to connect with others and find your perfect match.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Heart className="mr-2 h-5 w-5 text-primary" />
                Premium Benefits
              </h3>
              <ul className="space-y-3">
                <li className="flex">
                  <Check className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Connect with matches in real-time</span>
                </li>
                <li className="flex">
                  <Check className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Send and receive unlimited gifts</span>
                </li>
                <li className="flex">
                  <Check className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Access to advanced matching algorithm</span>
                </li>
                <li className="flex">
                  <Check className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>See who liked your profile</span>
                </li>
                <li className="flex">
                  <Check className="mr-2 h-5 w-5 text-primary shrink-0" />
                  <span>Priority customer support</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Premium Subscription</h3>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get unlimited access to all premium features
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold">£20</span>
                  <span className="text-muted-foreground ml-1">/month</span>
                </div>
                <Button onClick={() => activateSubscription()} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
                <h3 className="font-medium mb-2">14-Day Free Trial</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try all premium features for free, no commitment required
                </p>
                <div className="flex items-center text-sm mb-4">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Automatic reminder before trial ends</span>
                </div>
                <Button variant="outline" onClick={() => activateTrial()} className="w-full">
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
          
          {showDetails && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
              <p className="text-sm text-muted-foreground">
                Your subscription will renew automatically at £20 per month until cancelled. You can cancel anytime 
                from your account settings. The 14-day free trial is available for new users only.
                After the trial period, your subscription will automatically convert to the £20/month paid subscription
                unless cancelled before the trial ends.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button 
            variant="link" 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide details' : 'View subscription details'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}