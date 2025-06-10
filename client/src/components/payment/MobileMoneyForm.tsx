import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocation } from 'wouter';

type MobileMoneyProvider = {
  id: string;
  name: string;
  countries: string[];
  logo: string;
  minPayment: number;
  maxPayment: number;
};

interface MobileMoneyFormProps {
  amount: number;
  metadata?: any;
  onSuccess?: () => void;
}

export default function MobileMoneyForm({ amount, metadata, onSuccess }: MobileMoneyFormProps) {
  const [providers, setProviders] = useState<MobileMoneyProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED' | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load mobile money providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/payments/mobile-money/providers');
        
        if (response.ok) {
          const data = await response.json();
          setProviders(data);
        } else {
          throw new Error('Failed to load mobile money providers');
        }
      } catch (error) {
        console.error('Error loading mobile money providers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load mobile money payment options',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [toast]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProvider) {
      toast({
        title: 'Error',
        description: 'Please select a mobile money provider',
        variant: 'destructive',
      });
      return;
    }

    if (!phoneNumber || !/^\+?[0-9]{10,15}$/.test(phoneNumber)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number (10-15 digits)',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/payments/mobile-money/initiate', {
        providerId: selectedProvider,
        phoneNumber,
        amount,
        currency: 'GBP',
        metadata,
      });

      const data = await response.json();
      
      if (response.ok) {
        setReferenceId(data.referenceId);
        setInstructions(data.instructions);
        setPaymentStatus('PENDING');
        
        // Start polling for payment status
        startPollingPaymentStatus(data.referenceId);
      } else {
        throw new Error(data.message || 'Failed to initiate mobile money payment');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong with your mobile money payment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Poll for payment status
  const startPollingPaymentStatus = (ref: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/mobile-money/status/${ref}`);
        const data = await response.json();
        
        if (response.ok) {
          setPaymentStatus(data.status as any);
          
          if (data.status === 'COMPLETED') {
            toast({
              title: 'Payment Successful',
              description: 'Your mobile money payment has been processed successfully',
              variant: 'default',
            });
            
            // Verify payment on the server
            await apiRequest('POST', '/api/payments/mobile-money/verify', {
              referenceId: ref,
              amount,
              provider: providers.find(p => p.id === selectedProvider)?.name,
            });
            
            if (onSuccess) {
              onSuccess();
            } else {
              // Navigate to success page
              setLocation('/payment-success');
            }
            return;
          } else if (data.status === 'FAILED') {
            toast({
              title: 'Payment Failed',
              description: 'Your mobile money payment was not successful',
              variant: 'destructive',
            });
            return;
          }
          
          // If still pending, continue polling
          setTimeout(checkStatus, 5000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };
    
    // Start checking after a short delay
    setTimeout(checkStatus, 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading payment options...</p>
      </div>
    );
  }

  if (paymentStatus) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Mobile Money Payment</CardTitle>
          <CardDescription>Reference ID: {referenceId}</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentStatus === 'PENDING' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
              <AlertTitle className="text-yellow-800">Payment Pending</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {instructions}
              </AlertDescription>
            </Alert>
          )}
          
          {paymentStatus === 'COMPLETED' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-800">Payment Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Your payment has been processed successfully.
              </AlertDescription>
            </Alert>
          )}
          
          {paymentStatus === 'FAILED' && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-800">Payment Failed</AlertTitle>
              <AlertDescription className="text-red-700">
                Your payment could not be processed. Please try again with a different payment method.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {paymentStatus === 'PENDING' && (
            <p className="text-sm text-muted-foreground">
              This payment will expire in 15 minutes. Do not close this page.
            </p>
          )}
          
          {paymentStatus === 'FAILED' && (
            <Button variant="outline" onClick={() => setPaymentStatus(null)}>
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base">Select Mobile Money Provider</Label>
          <RadioGroup 
            value={selectedProvider} 
            onValueChange={setSelectedProvider}
            className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2"
          >
            {providers.map((provider) => (
              <div key={provider.id} className="relative">
                <RadioGroupItem
                  value={provider.id}
                  id={provider.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={provider.id}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="flex items-center justify-center w-full mb-2">
                    <img 
                      src={provider.logo} 
                      alt={provider.name} 
                      className="h-8 object-contain" 
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/200x80/4f46e5/ffffff?text=${provider.name}`;
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{provider.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {provider.countries.slice(0, 3).join(', ')}
                      {provider.countries.length > 3 && ` +${provider.countries.length - 3} more`}
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="phoneNumber"
              placeholder="+254 712 345 678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the phone number linked to your mobile money account. Include the country code.
          </p>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full"
            disabled={submitting || !selectedProvider || !phoneNumber}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${amount.toFixed(2)} GBP`
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}