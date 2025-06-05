import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Smartphone, Building2, Globe, ArrowLeft, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  processing_time: string;
  fees: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

export default function PaymentGateway() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const tierFromUrl = urlParams.get('tier') || '';
  const typeFromUrl = urlParams.get('type') || '';

  useEffect(() => {
    if (tierFromUrl) {
      setSelectedTier(tierFromUrl);
    }
  }, [tierFromUrl]);

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: "normal",
      name: "Normal",
      price: 0,
      currency: "GBP",
      features: [
        "Basic dating features",
        "Standard matching",
        "Limited messaging",
        "Basic profile visibility"
      ]
    },
    {
      id: "vip",
      name: "VIP",
      price: 199.99,
      currency: "GBP",
      features: [
        "All Normal features",
        "Priority matching",
        "Unlimited messaging",
        "Enhanced profile visibility",
        "Exclusive VIP events",
        "Advanced search filters"
      ],
      popular: true
    },
    {
      id: "vvip",
      name: "VVIP",
      price: 1999.99,
      currency: "GBP",
      features: [
        "All VIP features",
        "Personal dating concierge",
        "Exclusive VVIP events",
        "Priority customer support",
        "Premium verification badge",
        "Access to elite network"
      ]
    }
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: "stripe",
      name: "Credit/Debit Card",
      description: "Visa, Mastercard, American Express",
      icon: <CreditCard className="h-6 w-6" />,
      available: true,
      processing_time: "Instant",
      fees: "2.9% + 30p"
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Pay with your PayPal account",
      icon: <Globe className="h-6 w-6" />,
      available: true,
      processing_time: "Instant",
      fees: "3.4% + 20p"
    },
    {
      id: "apple_pay",
      name: "Apple Pay",
      description: "Quick and secure payment with Touch ID",
      icon: <Smartphone className="h-6 w-6" />,
      available: false,
      processing_time: "Instant",
      fees: "2.9% + 30p"
    },
    {
      id: "google_pay",
      name: "Google Pay",
      description: "Fast checkout with Google Pay",
      icon: <Smartphone className="h-6 w-6" />,
      available: false,
      processing_time: "Instant",
      fees: "2.9% + 30p"
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      description: "Direct bank to bank transfer",
      icon: <Building2 className="h-6 w-6" />,
      available: false,
      processing_time: "1-3 business days",
      fees: "Free"
    }
  ];

  const currentTier = subscriptionTiers.find(tier => tier.id === selectedTier);
  const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod);

  const handlePaymentMethodSelect = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method?.available) {
      toast({
        title: "Payment Method Unavailable",
        description: "This payment method is currently not available. Please select another option.",
        variant: "destructive",
      });
      return;
    }
    setSelectedPaymentMethod(methodId);
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod || !selectedTier) {
      toast({
        title: "Missing Selection",
        description: "Please select both a subscription tier and payment method.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTier === "normal") {
      toast({
        title: "Free Tier Selected",
        description: "Normal tier is free. Redirecting to profile setup...",
      });
      navigate("/dating-profile");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (selectedPaymentMethod === "stripe") {
        navigate(`/checkout?tier=${selectedTier}&type=${typeFromUrl}`);
      } else if (selectedPaymentMethod === "paypal") {
        navigate(`/paypal-checkout?tier=${selectedTier}&type=${typeFromUrl}`);
      } else {
        toast({
          title: "Payment Method Coming Soon",
          description: `${selectedMethod?.name} integration is in development. Please use card payment for now.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dating-profile")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Payment Gateway</h1>
          <p className="text-gray-600 mt-2">Choose your subscription and payment method</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Tiers */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Choose Your Subscription</CardTitle>
                <CardDescription>
                  Select the dating room tier that best fits your needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriptionTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        selectedTier === tier.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      {tier.popular && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-black text-white">
                          Most Popular
                        </Badge>
                      )}
                      <div className="text-center space-y-4">
                        <h3 className="font-bold text-xl">{tier.name}</h3>
                        <div>
                          <span className="text-3xl font-bold">
                            {tier.price === 0 ? "Free" : `£${tier.price}`}
                          </span>
                          {tier.price > 0 && (
                            <span className="text-gray-500 text-sm">/month</span>
                          )}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
                <CardDescription>
                  Choose how you'd like to pay for your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-black bg-gray-50"
                          : method.available
                          ? "border-gray-200 hover:border-gray-300"
                          : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                      }`}
                      onClick={() => handlePaymentMethodSelect(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-gray-600">
                            {method.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold flex items-center">
                              {method.name}
                              {!method.available && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Coming Soon
                                </Badge>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">{method.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Processing: {method.processing_time}</span>
                              <span>•</span>
                              <span>Fees: {method.fees}</span>
                            </div>
                          </div>
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTier && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{currentTier.name} Subscription</span>
                      <span className="font-bold">
                        {currentTier.price === 0 ? "Free" : `£${currentTier.price}`}
                      </span>
                    </div>
                    
                    {currentTier.price > 0 && selectedMethod && (
                      <>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Processing Fee</span>
                          <span>{selectedMethod.fees}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Total</span>
                          <span>£{currentTier.price}</span>
                        </div>
                      </>
                    )}

                    {selectedMethod && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Payment Method:</strong> {selectedMethod.name}
                        </p>
                        <p className="text-sm text-blue-600">
                          Processing time: {selectedMethod.processing_time}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleProcessPayment}
                      disabled={!selectedPaymentMethod || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        "Processing..."
                      ) : currentTier.price === 0 ? (
                        "Continue with Free Tier"
                      ) : (
                        `Pay £${currentTier.price}`
                      )}
                    </Button>

                    {currentTier.price > 0 && (
                      <p className="text-xs text-gray-500 text-center">
                        Your subscription will renew automatically each month. You can cancel anytime from your account settings.
                      </p>
                    )}
                  </>
                )}

                {!currentTier && (
                  <p className="text-gray-500 text-center">
                    Please select a subscription tier to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}