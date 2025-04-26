import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the PaymentIntent client secret from the URL query parameters
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    // If we have a clientSecret in the URL, it means the user came back to this page after trying to complete payment
    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        if (!paymentIntent) return;
        
        switch (paymentIntent.status) {
          case 'succeeded':
            setMessage('Payment succeeded!');
            // Notify the server about the successful payment
            handlePaymentSuccess(paymentIntent.id);
            break;
          case 'processing':
            setMessage('Your payment is processing.');
            break;
          case 'requires_payment_method':
            setMessage('Your payment was not successful, please try again.');
            break;
          default:
            setMessage('Something went wrong.');
            break;
        }
      });
    }
  }, [stripe]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      await apiRequest('POST', '/api/payments/success', { paymentIntentId });
      // Clear the cart or perform other actions after successful payment
      // Redirect to success page
      setLocation('/payment-success');
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);

    // Complete payment when the submit button is clicked
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return to the same page for handling the result
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An unexpected error occurred');
      } else {
        setMessage('An unexpected error occurred.');
      }
      
      toast({
        title: 'Payment Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // The payment has succeeded
      toast({
        title: 'Payment Successful',
        description: 'Thank you for your purchase!',
      });
      
      // Handle the successful payment
      await handlePaymentSuccess(paymentIntent.id);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {/* Show error message to the user */}
      {message && (
        <div className={`p-4 rounded-md ${message.includes('succeeded') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}