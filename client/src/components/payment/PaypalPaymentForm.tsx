import { useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PaypalPaymentFormProps {
  amount: number;
  currency?: string;
  onPaymentComplete: () => void;
  metadata: {
    userId: number;
    items: string;
    shipping: string;
  };
}

export const PaypalPaymentForm = ({ 
  amount, 
  currency = 'GBP',
  metadata,
  onPaymentComplete 
}: PaypalPaymentFormProps) => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Initialize PayPal options
  const paypalOptions = {
    currency_code: currency.toUpperCase(),
    value: amount.toFixed(2),
  };

  // Create order handler
  const createOrder = async () => {
    setIsProcessing(true);
    setErrorMessage(undefined);
    
    try {
      // Call our backend to create a PayPal order
      const response = await apiRequest('POST', '/api/payments/paypal/create-order', {
        amount,
        currency: currency.toUpperCase(),
        metadata
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create PayPal order');
      }
      
      const order = await response.json();
      return order.id;
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create PayPal order');
      toast({
        title: 'PayPal Error',
        description: error.message || 'Failed to create PayPal order',
        variant: 'destructive',
      });
      setIsProcessing(false);
      throw error;
    }
  };

  // Approve order handler
  const onApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    try {
      // Call backend to capture the payment
      const response = await apiRequest('POST', '/api/payments/paypal/capture-order', {
        orderID: data.orderID,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to capture payment');
      }
      
      const captureData = await response.json();
      
      // Payment successful
      toast({
        title: 'Payment Successful',
        description: 'Your order has been placed successfully!',
      });
      
      // Clear cart and update data
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      // Call the onPaymentComplete callback
      onPaymentComplete();
      
      // Redirect to success page
      setLocation('/payment-success');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to capture payment');
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to capture payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Error handler
  const onError = (err: Record<string, unknown>) => {
    const errorMessage = 'PayPal encountered an error. Please try again later.';
    setErrorMessage(errorMessage);
    toast({
      title: 'PayPal Error',
      description: errorMessage,
      variant: 'destructive',
    });
    setIsProcessing(false);
    console.error('PayPal error:', err);
    console.log('PayPal config:', {
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID ? 'Set' : 'Not set',
      currency
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Pay with PayPal
        </CardTitle>
        <CardDescription>
          Pay securely using your PayPal account or credit card
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="mb-2">Total: {formatPrice(amount)}</p>
          <p className="text-muted-foreground text-xs">
            You will be redirected to PayPal to complete your payment
          </p>
        </div>
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {isProcessing && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <PayPalScriptProvider options={{ 
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
          currency: currency.toUpperCase(),
          intent: 'capture'
        }}>
          <PayPalButtons
            style={{ 
              layout: 'vertical',
              shape: 'rect',
              color: 'gold'
            }}
            disabled={isProcessing}
            forceReRender={[amount, currency]}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
          />
        </PayPalScriptProvider>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        PayPal securely processes payments without sharing your financial information
      </CardFooter>
    </Card>
  );
};