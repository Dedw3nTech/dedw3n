import React from 'react';
import { SocialConsole } from '@/components/social/SocialConsole';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';

export default function SocialConsolePage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8 flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect non-vendors to upgrade page
  if (!user || !user.isVendor) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex flex-col items-center justify-center h-96 text-center max-w-lg mx-auto">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Vendor Access Required</h1>
          <p className="text-muted-foreground mb-6">
            The Social+ Console is exclusively available to vendor accounts. Upgrade your account to access advanced premium content placement and campaign management tools.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/social')}>
              Return to Social
            </Button>
            <Button onClick={() => navigate('/settings?upgrade=vendor')}>
              Upgrade Account
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render console for vendors
  return (
    <div className="container max-w-7xl py-8">
      <SocialConsole />
    </div>
  );
}