import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CreditCard, Calendar, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface CommissionPaymentData {
  redirectUrl: string;
  paymentIntentId: string;
  amount: string;
  dueDate: string;
  status: string;
}

interface CommissionPeriod {
  id: number;
  month: number;
  year: number;
  commissionAmount: string;
  commissionRate: string;
  commissionTier: string;
  dueDate: string;
  status: string;
}

const CommissionPaymentForm = ({ 
  paymentData, 
  commissionPeriod 
}: { 
  paymentData: CommissionPaymentData;
  commissionPeriod: CommissionPeriod;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/vendor-dashboard?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded, notify backend
        await apiRequest('POST', '/api/commission/payment-success', {
          paymentIntentId: paymentData.paymentIntentId
        });
        
        toast({
          title: "Payment Successful",
          description: "Your commission payment has been processed successfully!",
        });
        
        setLocation('/vendor-dashboard');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Commission Payment Required
          </CardTitle>
          <CardDescription>
            Complete your monthly commission payment to maintain your vendor account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">{commissionPeriod.month}/{commissionPeriod.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Tier</p>
              <Badge variant="outline">{commissionPeriod.commissionTier}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="font-medium">{commissionPeriod.commissionRate}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(commissionPeriod.dueDate)}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount Due:</span>
            <span>{formatCurrency(paymentData.amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Alert */}
      {paymentData.status === 'charging' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your commission payment is now due. Complete payment to avoid account suspension.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
          <CardDescription>
            Secure payment powered by Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay ${formatCurrency(paymentData.amount)}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>💳 We accept all major credit and debit cards</p>
            <p>📧 You will receive a payment confirmation via email</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CommissionPayment() {
  const { periodId } = useParams();
  const [, setLocation] = useLocation();
  const [paymentData, setPaymentData] = useState<CommissionPaymentData | null>(null);
  const [commissionPeriod, setCommissionPeriod] = useState<CommissionPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        // Get current vendor
        const vendorResponse = await apiRequest('GET', '/api/vendors/me');
        const vendor = vendorResponse.vendor;

        if (!vendor) {
          throw new Error('Vendor not found');
        }

        // Get payment URL data
        const response = await apiRequest(
          'GET', 
          `/api/vendors/${vendor.id}/commission/${periodId}/payment-url`
        );
        
        setPaymentData(response);

        // Get commission dashboard to find the specific period
        const dashboardResponse = await apiRequest(
          'GET', 
          `/api/vendors/${vendor.id}/commission-dashboard`
        );
        
        const period = dashboardResponse.commissionPeriods.find(
          (p: CommissionPeriod) => p.id === parseInt(periodId as string)
        );

        if (!period) {
          throw new Error('Commission period not found');
        }

        setCommissionPeriod(period);
      } catch (err: any) {
        console.error('Error fetching payment data:', err);
        setError(err.message || 'Failed to load payment information');
        toast({
          title: "Error",
          description: "Failed to load payment information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (periodId) {
      fetchPaymentData();
    }
  }, [periodId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentData || !commissionPeriod) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || 'Unable to load payment information'}
            </p>
            <Button onClick={() => setLocation('/vendor-dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Commission Payment</h1>
          <p className="text-muted-foreground">
            Complete your monthly commission payment
          </p>
        </div>

        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret: paymentData.paymentIntentId,
            appearance: {
              theme: 'stripe'
            }
          }}
        >
          <CommissionPaymentForm 
            paymentData={paymentData} 
            commissionPeriod={commissionPeriod}
          />
        </Elements>
      </div>
    </div>
  );
}