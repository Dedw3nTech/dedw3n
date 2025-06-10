import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Button } from '@/components/ui/button';

// Define script loaded event handler
declare global {
  interface Window {
    paypalScriptLoaded?: () => void;
  }
}

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
  const [paypalSdkReady, setPaypalSdkReady] = useState(false);
  const [paypalSdkError, setPaypalSdkError] = useState(false);

  // Initialize PayPal options
  const paypalOptions = {
    currency_code: currency.toUpperCase(),
    value: amount.toFixed(2),
  };
  
  // Check if PayPal SDK is loaded properly
  useEffect(() => {
    // Always use the fallback button
    // This ensures the payment button is always visible regardless of SDK loading status
    console.log('Using manual PayPal button for reliability');
    setPaypalSdkError(true);
    return;
    
    // The code below will not execute due to the return statement above
    // It's kept for reference in case we want to enable the SDK in the future
    
    // Immediately check if client ID is valid
    if (!import.meta.env.VITE_PAYPAL_CLIENT_ID || import.meta.env.VITE_PAYPAL_CLIENT_ID === '') {
      console.log('PayPal Client ID is not available');
      setPaypalSdkError(true);
      return;
    }
    
    // Setup script loaded handler
    window.paypalScriptLoaded = () => {
      console.log('PayPal script loaded via global handler');
      setPaypalSdkReady(true);
    };
    
    // Add a timeout to detect if the PayPal SDK fails to load
    const timeoutId = setTimeout(() => {
      if (!paypalSdkReady) {
        console.log('PayPal SDK did not load in time');
        setPaypalSdkError(true);
      }
    }, 5000);
    
    // Add an event listener to detect script load errors
    const handleError = (event: ErrorEvent) => {
      if (event.filename && event.filename.includes('paypal')) {
        console.log('PayPal script loading error:', event);
        setPaypalSdkError(true);
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('error', handleError);
      delete window.paypalScriptLoaded;
    };
  }, [paypalSdkReady]);

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
        
        {paypalSdkError ? (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Click the button below to pay with PayPal</p>
            </div>
            <Button 
              className="w-full bg-[#ffc439] hover:bg-[#f1ba30] text-[#003087] font-bold"
              onClick={async () => {
                try {
                  setIsProcessing(true);
                  const orderId = await createOrder();
                  
                  // Redirect to PayPal checkout manually
                  if (orderId) {
                    window.open(
                      `https://www.paypal.com/checkoutnow?token=${orderId}`,
                      '_blank'
                    );
                    
                    toast({
                      title: "Payment Initiated",
                      description: "You'll be redirected to PayPal to complete your payment. Return to this page after payment completion.",
                    });
                  }
                } catch (error) {
                  console.error("Failed to create manual PayPal order:", error);
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2 fill-current">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                </svg>
              )}
              Pay with PayPal
            </Button>
          </div>
        ) : (
          <PayPalScriptProvider 
            options={{ 
              clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
              currency: currency.toUpperCase(),
              intent: 'capture'
            }}
          >
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
              onError={(err) => {
                onError(err);
                setPaypalSdkError(true);
              }}
            />
          </PayPalScriptProvider>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        PayPal securely processes payments without sharing your financial information
      </CardFooter>
    </Card>
  );
};