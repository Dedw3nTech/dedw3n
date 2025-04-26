import { useState } from 'react';
import { useLocation } from 'wouter';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet. Wait for it to load
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      // Show error to your customer
      setErrorMessage(error.message || 'An unexpected error occurred.');
      toast({
        title: 'Payment Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // The payment has been processed!
      try {
        // Notify the server about the successful payment
        await apiRequest('POST', '/api/payments/success', {
          paymentIntentId: paymentIntent.id,
        });

        // Clear the cart (would be implemented in a real application)
        // await apiRequest('DELETE', '/api/cart');

        toast({
          title: 'Payment Successful',
          description: 'Your order has been placed successfully!',
        });

        // Redirect to success page
        setLocation('/payment-success');
      } catch (err: any) {
        toast({
          title: 'Error',
          description: `Payment was successful, but there was an error processing your order: ${err.message}`,
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    } else {
      // Some other unexpected status
      setErrorMessage('An unexpected error occurred.');
      toast({
        title: 'Payment Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="p-4 text-sm bg-red-50 text-red-800 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="flex justify-end">
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}