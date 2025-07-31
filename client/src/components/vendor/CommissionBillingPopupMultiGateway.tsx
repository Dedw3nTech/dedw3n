import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, CreditCard, Clock, Banknote, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import PaymentGatewaySelector from './PaymentGatewaySelector';
import MultiPaymentProcessor from './MultiPaymentProcessor';

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

export default function CommissionBillingPopup({
  vendorId,
  isOpen,
  onClose,
  pendingPayments,
}: CommissionBillingPopupProps) {
  const [currentStep, setCurrentStep] = useState<'summary' | 'payment_method' | 'payment_form'>('summary');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const handlePaymentSuccess = () => {
    setCurrentStep('summary');
    onClose();
    toast({
      title: "Payment Successful",
      description: "Your commission payment has been processed successfully!",
    });
    // Refresh the page to update the commission dashboard
    window.location.reload();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {currentStep !== 'summary' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(currentStep === 'payment_form' ? 'payment_method' : 'summary')}
                className="mr-2 p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <AlertTriangle
              className={`h-6 w-6 mr-2 ${
                isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-blue-500'
              }`}
            />
            Commission Payment Due
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'summary' && (
              isOverdue
                ? 'Your commission payment is overdue. Please pay immediately to avoid account suspension.'
                : 'You have outstanding commission payments that require your attention.'
            )}
            {currentStep === 'payment_method' && 'Choose your preferred payment method'}
            {currentStep === 'payment_form' && 'Complete your payment securely'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Payment Summary */}
          {currentStep === 'summary' && (
            <>
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

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => setCurrentStep('payment_method')}
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
            </>
          )}

          {/* Step 2: Payment Method Selection */}
          {currentStep === 'payment_method' && (
            <>
              <PaymentGatewaySelector
                amount={pendingPayments.totalAmount}
                currency="GBP"
                onPaymentMethodSelect={setSelectedPaymentMethod}
                selectedMethod={selectedPaymentMethod}
              />
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setCurrentStep('payment_form')}
                  className="flex-1 bg-black hover:bg-gray-800"
                  size="lg"
                  disabled={!selectedPaymentMethod}
                >
                  Continue to Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('summary')}
                  size="lg"
                >
                  Back
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Payment Form */}
          {currentStep === 'payment_form' && (
            <MultiPaymentProcessor
              amount={pendingPayments.totalAmount}
              currency="GBP"
              paymentMethod={selectedPaymentMethod}
              commissionPeriodIds={pendingPayments.payments.map(p => p.id)}
              vendorId={vendorId}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}