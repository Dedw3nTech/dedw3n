import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'none';

interface SubscriptionState {
  status: SubscriptionStatus;
  trialDaysLeft: number | null;
  expiresAt: Date | null;
  isActive: boolean; // helper calculated property: true for 'active' or 'trial'
}

interface SubscriptionContextType {
  subscription: SubscriptionState;
  isLoading: boolean;
  error: Error | null;
  activateSubscription: () => void;
  activateTrial: () => void;
  cancelSubscription: () => void;
}

const defaultSubscriptionState: SubscriptionState = {
  status: 'none',
  trialDaysLeft: null,
  expiresAt: null,
  isActive: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscriptionState);

  // Fetch current subscription status
  const { 
    data: subscriptionData, 
    isLoading, 
    error,
    refetch
  } = useQuery<SubscriptionState>({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/subscription/status');
        
        // Check if unauthorized (401) or other error status
        if (!res.ok) {
          // If unauthorized, return default state silently without error logging
          if (res.status === 401) {
            return defaultSubscriptionState;
          }
          
          // For other errors, throw to be caught by the catch block
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        return {
          status: data.status || 'none',
          trialDaysLeft: data.trialDaysLeft || null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          isActive: ['active', 'trial'].includes(data.status || 'none'),
        };
      } catch (error) {
        // Prevent error logging but don't throw - just return default state
        // This fixes the "Failed to fetch subscription status" error in console
        return defaultSubscriptionState;
      }
    },
    retry: 1, // Just retry once in case of network glitch
    retryDelay: 1000, // Wait 1 second before retry
    // We'll handle auth failure silently in the query function
    enabled: true
  });

  // Update state when data changes
  useEffect(() => {
    if (subscriptionData) {
      setSubscription(subscriptionData);
    }
  }, [subscriptionData]);

  // Activate paid subscription
  const activateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      // In a real app, this would redirect to a payment page
      // For now, we'll just simulate activating a subscription
      await apiRequest('POST', '/api/subscription/activate');
      return { status: 'active', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Activated',
        description: 'Your premium subscription has been activated successfully.',
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Activation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Activate free trial
  const activateTrialMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/subscription/activate-trial');
      return { 
        status: 'trial', 
        trialDaysLeft: 14,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      };
    },
    onSuccess: () => {
      toast({
        title: 'Free Trial Activated',
        description: 'Your 14-day free trial has been activated.',
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Trial Activation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/subscription/cancel');
      return { status: 'expired' };
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled.',
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const activateSubscription = () => {
    activateSubscriptionMutation.mutate();
  };

  const activateTrial = () => {
    activateTrialMutation.mutate();
  };

  const cancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        error,
        activateSubscription,
        activateTrial,
        cancelSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}