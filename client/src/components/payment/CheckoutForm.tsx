import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  onPaymentComplete?: () => void;
}

export const CheckoutForm = ({ onPaymentComplete }: CheckoutFormProps = {}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment Successful',
          description: 'Thank you for your purchase!',
        });
        
        // Call the onPaymentComplete callback if provided
        if (onPaymentComplete) {
          onPaymentComplete();
        }
        
        setLocation('/payment-success');
      } else {
        // Handle other paymentIntent statuses as needed
        setErrorMessage('An unexpected error occurred.');
        toast({
          title: 'Payment Status',
          description: `Payment status: ${paymentIntent?.status || 'unknown'}`,
          variant: 'default',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      toast({
        title: 'Payment Error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
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
};