import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Building2, Smartphone, Banknote } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  processingTime: string;
  fees: string;
  supported: boolean;
}

interface PaymentGatewaySelectorProps {
  amount: number;
  currency: string;
  onPaymentMethodSelect: (method: string) => void;
  selectedMethod: string;
}

export default function PaymentGatewaySelector({
  amount,
  currency,
  onPaymentMethodSelect,
  selectedMethod,
}: PaymentGatewaySelectorProps) {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay securely with Visa, Mastercard, or American Express',
      processingTime: 'Instant',
      fees: '2.9% + 30p',
      supported: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Banknote,
      description: 'Pay with your PayPal account or linked cards',
      processingTime: 'Instant',
      fees: '3.4% + 20p',
      supported: true,
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Direct bank transfer via UK Faster Payments',
      processingTime: '1-2 business days',
      fees: 'Free',
      supported: true,
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'Pay via M-Pesa, Orange Money, or MTN Mobile Money',
      processingTime: 'Instant',
      fees: '1.5% + 10p',
      supported: true,
    },
  ];

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculateFees = (method: PaymentMethod, amount: number) => {
    switch (method.id) {
      case 'stripe':
        return (amount * 0.029) + 0.3;
      case 'paypal':
        return (amount * 0.034) + 0.2;
      case 'bank_transfer':
        return 0;
      case 'mobile_money':
        return (amount * 0.015) + 0.1;
      default:
        return 0;
    }
  };

  const getTotalAmount = (method: PaymentMethod, amount: number) => {
    const fees = calculateFees(method, amount);
    return amount + fees;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Payment Method</h3>
        <p className="text-gray-600">
          Total Amount: <span className="font-bold">{formatAmount(amount, currency)}</span>
        </p>
      </div>

      <RadioGroup
        value={selectedMethod}
        onValueChange={onPaymentMethodSelect}
        className="space-y-4"
      >
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const fees = calculateFees(method, amount);
          const total = getTotalAmount(method, amount);

          return (
            <div key={method.id} className="relative">
              <Label htmlFor={method.id} className="cursor-pointer">
                <Card className={`transition-all duration-200 hover:shadow-md ${
                  selectedMethod === method.id 
                    ? 'ring-2 ring-blue-500 border-blue-200' 
                    : 'border-gray-200'
                } ${!method.supported ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <RadioGroupItem
                          value={method.id}
                          id={method.id}
                          disabled={!method.supported}
                          className="mt-1"
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            selectedMethod === method.id 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{method.name}</h4>
                              {!method.supported && (
                                <Badge variant="secondary">Coming Soon</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {method.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>⏱️ {method.processingTime}</span>
                              <span>💳 {method.fees}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {fees > 0 && (
                          <p className="text-sm text-gray-500 mb-1">
                            + {formatAmount(fees, currency)} fees
                          </p>
                        )}
                        <p className="font-bold text-lg">
                          {formatAmount(total, currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 rounded-full p-1">
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Secure Payment Processing</h4>
            <p className="text-sm text-blue-800">
              All payments are processed securely using industry-standard encryption. 
              Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {selectedMethod === 'bank_transfer' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Bank Transfer Instructions</h4>
            <div className="space-y-2 text-sm text-orange-800">
              <p><strong>Account Name:</strong> Dedw3n Limited</p>
              <p><strong>Sort Code:</strong> 04-00-04</p>
              <p><strong>Account Number:</strong> 12345678</p>
              <p><strong>Reference:</strong> COM-{Date.now()}</p>
              <p className="mt-3 font-medium">
                Please use the reference number above when making your transfer.
                Payment confirmation may take 1-2 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMethod === 'mobile_money' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-900 mb-2">Mobile Money Options</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="font-semibold text-green-700">M-Pesa</div>
                  <div className="text-xs text-gray-600">Kenya</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="font-semibold text-orange-700">Orange Money</div>
                  <div className="text-xs text-gray-600">West Africa</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="font-semibold text-yellow-700">MTN Mobile</div>
                  <div className="text-xs text-gray-600">East Africa</div>
                </div>
              </div>
              <p className="text-sm text-green-800">
                You'll receive SMS instructions with payment details after selecting this option.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}