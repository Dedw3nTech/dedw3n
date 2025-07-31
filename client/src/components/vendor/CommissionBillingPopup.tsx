import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, CreditCard, Clock, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface CommissionBillingPopupProps {
  vendorId: number;
  isOpen: boolean;
  onClose: () => void;
  pendingPayments?: {
    totalAmount: number;
    paymentCount: number;
    dueDate: string;
    payments: Array<{
      id: number;
      month: number;
      year: number;
      commissionAmount: string;
      dueDate: string;
    }>;
  } | null;
}

interface PaymentFormProps {
  pendingPayments: NonNullable<CommissionBillingPopupProps['pendingPayments']>;
  onPaymentSuccess: () => void;
}

// Payment form component that handles Stripe payment
function PaymentForm({ pendingPayments, onPaymentSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/commission-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-User-ID': localStorage.getItem('userId') || '',
          },
          body: JSON.stringify({
            amount: pendingPayments.totalAmount,
            paymentIds: pendingPayments.payments.map(p => p.id),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } else {
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    };

    createPaymentIntent();
  }, [pendingPayments.totalAmount, pendingPayments.payments, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
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
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your commission payment has been processed successfully!",
        });
        onPaymentSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3">Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center mb-3">
          <Banknote className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Payment Summary</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Commission payments:</span>
            <span>{pendingPayments.paymentCount} month(s)</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total amount:</span>
            <span>{formatPrice(pendingPayments.totalAmount)}</span>
          </div>
        </div>
      </div>

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
            Pay {formatPrice(pendingPayments.totalAmount)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function CommissionBillingPopup({
  vendorId,
  isOpen,
  onClose,
  pendingPayments,
}: CommissionBillingPopupProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    onClose();
    // Refresh commission dashboard data
    window.location.reload();
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!pendingPayments) {
    return null;
  }

  const daysUntilDue = getDaysUntilDue(pendingPayments.dueDate);
  const isOverdue = daysUntilDue < 0;
  const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle
              className={`h-6 w-6 mr-2 ${
                isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-blue-500'
              }`}
            />
            Commission Payment Due
          </DialogTitle>
          <DialogDescription>
            {isOverdue
              ? 'Your commission payment is overdue. Please pay immediately to avoid account suspension.'
              : 'You have outstanding commission payments that require your attention.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary Card */}
          <Card className={`border-2 ${
            isOverdue ? 'border-red-200 bg-red-50' : 
            isUrgent ? 'border-orange-200 bg-orange-50' : 
            'border-blue-200 bg-blue-50'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Outstanding Payments</span>
                <Badge variant={isOverdue ? "destructive" : isUrgent ? "secondary" : "default"}>
                  {pendingPayments.paymentCount} Payment{pendingPayments.paymentCount > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription>
                Commission payments for your marketplace sales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount Due</p>
                  <p className="text-2xl font-bold">{formatPrice(pendingPayments.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Due Date</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-semibold">{formatDueDate(pendingPayments.dueDate)}</span>
                  </div>
                  {daysUntilDue >= 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days remaining`}
                    </p>
                  )}
                  {isOverdue && (
                    <p className="text-sm text-red-600 mt-1 font-semibold">
                      {Math.abs(daysUntilDue)} days overdue
                    </p>
                  )}
                </div>
              </div>

              {/* Grace Period Warning */}
              {isOverdue && (
                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="font-semibold text-red-800">7-Day Grace Period</p>
                      <p className="text-sm text-red-700">
                        Your account will be suspended if payment is not received within 7 days of the due date.
                        Pay now to keep your vendor account active.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <div className="space-y-3">
            <h4 className="font-semibold">Payment Breakdown</h4>
            {pendingPayments.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {new Date(2024, payment.month - 1).toLocaleDateString('en-GB', { month: 'long' })} {payment.year}
                  </p>
                  <p className="text-sm text-gray-600">Commission payment</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(Number(payment.commissionAmount))}</p>
                  <p className="text-sm text-gray-500">Due: {formatDueDate(payment.dueDate)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Form or Pay Button */}
          {showPaymentForm ? (
            <Elements stripe={stripePromise}>
              <PaymentForm
                pendingPayments={pendingPayments}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </Elements>
          ) : (
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="flex-1 bg-black hover:bg-gray-800"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                size="lg"
              >
                Pay Later
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}