import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Clock, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PayPalButton from './PayPalButton';
import { getStripePromise } from '@/lib/stripe';

interface MultiPaymentProcessorProps {
  amount: number;
  currency: string;
  paymentMethod: string;
  commissionPeriodIds: number[];
  vendorId: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

// Stripe Payment Component
function StripePaymentForm({ 
  clientSecret, 
  onPaymentSuccess, 
  onPaymentError,
  amount,
  currency 
}: {
  clientSecret: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  amount: number;
  currency: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/vendor-dashboard?tab=commission&payment=success`,
        },
      });

      if (error) {
        onPaymentError(error.message || 'Payment failed');
      } else {
        onPaymentSuccess();
      }
    } catch (error) {
      onPaymentError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-black hover:bg-gray-800"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay {new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)}
          </>
        )}
      </Button>
    </form>
  );
}

// Bank Transfer Component
function BankTransferInstructions({ amount, currency, reference }: {
  amount: number;
  currency: string;
  reference: string;
}) {
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const handleConfirmPayment = async () => {
    // In a real implementation, this would trigger a verification process
    setPaymentConfirmed(true);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Bank transfers typically take 1-2 business days to process. 
          Your account will be updated once payment is confirmed.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Bank Transfer Details</CardTitle>
          <CardDescription>
            Use these details to transfer {new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-600">Account Name</p>
              <p className="font-mono">Dedw3n Limited</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Sort Code</p>
              <p className="font-mono">04-00-04</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Account Number</p>
              <p className="font-mono">12345678</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Reference</p>
              <p className="font-mono text-blue-600">{reference}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Important Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Please include the reference number in your transfer</li>
              <li>• Transfer the exact amount: {new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)}</li>
              <li>• Save your transfer receipt for your records</li>
              <li>• Contact support if your payment isn't reflected within 3 business days</li>
            </ul>
          </div>

          {!paymentConfirmed ? (
            <Button 
              onClick={handleConfirmPayment} 
              className="w-full"
              variant="outline"
            >
              I have made the transfer
            </Button>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Thank you! We'll verify your payment and update your account within 1-2 business days.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Mobile Money Component
function MobileMoneyPayment({ amount, currency, onPaymentSuccess }: {
  amount: number;
  currency: string;
  onPaymentSuccess: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const providers = [
    { id: 'mpesa', name: 'M-Pesa', countries: ['Kenya'], color: 'green' },
    { id: 'orange', name: 'Orange Money', countries: ['Senegal', 'Mali', 'Niger'], color: 'orange' },
    { id: 'mtn', name: 'MTN Mobile Money', countries: ['Ghana', 'Uganda', 'Rwanda'], color: 'yellow' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedProvider === provider.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedProvider(provider.id)}
          >
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto mb-2 rounded-full bg-${provider.color}-100`} />
              <h4 className="font-semibold text-sm">{provider.name}</h4>
              <p className="text-xs text-gray-600">{provider.countries.join(', ')}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedProvider && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+254 700 000 000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll receive an SMS prompt on your phone to authorize the payment of{' '}
              {new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)}.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            disabled={isProcessing || !phoneNumber}
            className="w-full bg-black hover:bg-gray-800"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              `Send Payment Request`
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function MultiPaymentProcessor({
  amount,
  currency,
  paymentMethod,
  commissionPeriodIds,
  vendorId,
  onPaymentSuccess,
  onPaymentError,
}: MultiPaymentProcessorProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    if (paymentMethod === 'stripe') {
      // Create Stripe payment intent
      const createPaymentIntent = async () => {
        try {
          const response = await fetch('/api/commission-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Client-User-ID': localStorage.getItem('userId') || '',
            },
            body: JSON.stringify({
              amount,
              currency,
              commissionPeriodIds,
              vendorId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setClientSecret(data.clientSecret);
          } else {
            onPaymentError('Failed to initialize payment');
          }
        } catch (error) {
          onPaymentError('Failed to initialize payment');
        }
      };

      createPaymentIntent();
    } else if (paymentMethod === 'bank_transfer') {
      // Generate payment reference
      setPaymentReference(`COM-${vendorId}-${Date.now()}`);
    }
  }, [paymentMethod, amount, currency, commissionPeriodIds, vendorId, onPaymentError]);

  const stripePromise = getStripePromise();

  switch (paymentMethod) {
    case 'stripe':
      if (!stripePromise) {
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Stripe payment is not available. Please contact support or choose another payment method.
            </AlertDescription>
          </Alert>
        );
      }
      if (!clientSecret) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="ml-3">Initializing payment...</span>
          </div>
        );
      }
      return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm
            clientSecret={clientSecret}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
            amount={amount}
            currency={currency}
          />
        </Elements>
      );

    case 'paypal':
      return (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll be redirected to PayPal to complete your payment securely.
            </AlertDescription>
          </Alert>
          <PayPalButton
            amount={amount.toString()}
            currency={currency}
            intent="capture"
          />
        </div>
      );

    case 'bank_transfer':
      return (
        <BankTransferInstructions
          amount={amount}
          currency={currency}
          reference={paymentReference}
        />
      );

    case 'mobile_money':
      return (
        <MobileMoneyPayment
          amount={amount}
          currency={currency}
          onPaymentSuccess={onPaymentSuccess}
        />
      );

    default:
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a payment method to continue.
          </AlertDescription>
        </Alert>
      );
  }
}