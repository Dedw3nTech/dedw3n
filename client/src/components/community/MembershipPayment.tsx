import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Loader2, CreditCard, CircleDollarSign } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

type MembershipTier = {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  benefits: string[];
  durationDays: number;
  tierType: string;
};

type PaymentProps = {
  tier: MembershipTier;
  communityId: number;
  onSuccess: () => void;
  onCancel: () => void;
};

// Stripe Payment Form Component
const StripeCheckoutForm = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Return URL where the customer should be redirected after payment
          return_url: window.location.origin + '/payment-success',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message || 'An error occurred during payment.',
          variant: 'destructive',
        });
        setIsLoading(false);
      } else {
        // The payment was successful
        toast({
          title: 'Payment Successful',
          description: 'Your membership has been activated!',
        });
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: 'Payment Error',
        description: err.message || 'An error occurred during payment processing.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 justify-end mt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          Pay Now
        </Button>
      </div>
    </form>
  );
};

const StripePaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/membership/payment/stripe/create-intent', {
          tierId: tier.id,
          communityId,
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: 'Payment Setup Failed',
          description: error.message || 'Failed to set up payment.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [tier.id, communityId, toast]);

  if (loading || !clientSecret) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};

const PaypalPaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customId, setCustomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const createPaypalOrder = async () => {
      try {
        const response = await apiRequest('POST', '/api/membership/payment/paypal/create-order', {
          tierId: tier.id,
          communityId,
        });
        const data = await response.json();
        setOrderId(data.id);
        setCustomId(data.customId);
      } catch (error: any) {
        toast({
          title: 'PayPal Setup Failed',
          description: error.message || 'Failed to set up PayPal payment.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    createPaypalOrder();
  }, [tier.id, communityId, toast]);

  const handlePaymentSuccess = async (details: any) => {
    try {
      // Process the successful payment on the server
      const response = await apiRequest('POST', '/api/membership/payment/paypal/process', {
        orderId: details.id,
        customId,
      });
      
      if (response.ok) {
        toast({
          title: 'Payment Successful',
          description: 'Your membership has been activated!',
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Processing Failed',
        description: error.message || 'Failed to process payment confirmation.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="paypal-button-container">
      <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
        <PayPalButtons
          createOrder={() => Promise.resolve(orderId as string)}
          onApprove={(data, actions) => {
            return (actions.order?.capture() || Promise.resolve({}))
              .then(handlePaymentSuccess);
          }}
          onCancel={() => {
            toast({
              title: 'Payment Cancelled',
              description: 'You have cancelled the payment process.',
            });
            onCancel();
          }}
          onError={(err) => {
            toast({
              title: 'PayPal Error',
              description: 'An error occurred with PayPal. Please try again later.',
              variant: 'destructive',
            });
            console.error('PayPal error:', err);
            onCancel();
          }}
          style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
        />
      </PayPalScriptProvider>
      <Button 
        variant="outline" 
        className="w-full mt-4" 
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
};

const MembershipPayment = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | null>(null);

  const formatCurrency = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subscribe to {tier.name}</CardTitle>
        <CardDescription>
          {formatCurrency(tier.price, tier.currency)} for {tier.durationDays} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!paymentMethod ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => setPaymentMethod('stripe')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with Card
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setPaymentMethod('paypal')}
            >
              <CircleDollarSign className="mr-2 h-4 w-4" />
              Pay with PayPal
            </Button>
          </div>
        ) : paymentMethod === 'stripe' ? (
          <StripePaymentSection 
            tier={tier} 
            communityId={communityId} 
            onSuccess={onSuccess} 
            onCancel={() => setPaymentMethod(null)} 
          />
        ) : (
          <PaypalPaymentSection 
            tier={tier} 
            communityId={communityId} 
            onSuccess={onSuccess} 
            onCancel={() => setPaymentMethod(null)} 
          />
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Secure payment processing by Stripe and PayPal.</p>
      </CardFooter>
    </Card>
  );
};

export default MembershipPayment;