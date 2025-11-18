import { useEffect, useState, useMemo } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, CreditCard, Globe, Smartphone, Building2, Check } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/contexts/CurrencyContext";
import PayPalButton from "@/components/PayPalButton";
import { SEOHead } from "@/components/seo/SEOHead";

// Stripe Payment Form Component
const StripeCheckoutForm = ({ tier, onSuccess }: { tier: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
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
          return_url: `${window.location.origin}/dating-profile?payment=success&tier=${tier}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: `Successfully upgraded to ${tier.toUpperCase()} dating room!`,
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: translateText("Error"),
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case "vip": return "£199.99";
      case "vvip": return "£1,999.99";
      default: return "N/A";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-black hover:bg-gray-800 text-white"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {getTierPrice(tier)}
          </>
        )}
      </Button>
    </form>
  );
};

// PayPal Payment Form Component
const PayPalCheckoutForm = ({ tier, onSuccess }: { tier: string; onSuccess: () => void }) => {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case "vip": return 199.99;
      case "vvip": return 1999.99;
      default: return 0;
    }
  };

  const getTierPriceFormatted = (tier: string) => {
    return formatPrice(getTierPrice(tier));
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-solid border-blue-200 rounded-lg p-6 bg-blue-50">
        <div className="flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">PayPal Payment</h3>
        </div>
        <p className="text-blue-800 text-center mb-4">
          Secure payment with PayPal - {getTierPriceFormatted(tier)}
        </p>
        <div className="flex justify-center">
          <PayPalButton 
            amount={getTierPrice(tier).toString()}
            currency="GBP"
            intent="CAPTURE"
          />
        </div>
      </div>
    </div>
  );
};

// Bank Transfer Form Component
const BankTransferForm = ({ tier, onSuccess }: { tier: string; onSuccess: () => void }) => {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [transferDetails, setTransferDetails] = useState({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    reference: ""
  });

  const handleBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Bank Transfer Instructions",
      description: "Bank transfer details will be sent to your email for manual processing.",
    });
    
    setTimeout(onSuccess, 2000);
  };

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case "vip": return formatPrice(199.99);
      case "vvip": return formatPrice(1999.99);
      default: return "N/A";
    }
  };

  return (
    <form onSubmit={handleBankTransfer} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Bank Transfer Instructions</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Account Name:</strong> Dedw3n Limited</p>
          <p><strong>Sort Code:</strong> 12-34-56</p>
          <p><strong>Account Number:</strong> 12345678</p>
          <p><strong>Reference:</strong> DATING-{tier.toUpperCase()}-{Date.now()}</p>
          <p><strong>Amount:</strong> {getTierPrice(tier)}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="accountHolder">Account Holder Name</Label>
          <Input
            id="accountHolder"
            value={transferDetails.accountHolder}
            onChange={(e) => setTransferDetails({...transferDetails, accountHolder: e.target.value})}
            placeholder="Your full name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="bankName">Your Bank Name</Label>
          <Input
            id="bankName"
            value={transferDetails.bankName}
            onChange={(e) => setTransferDetails({...transferDetails, bankName: e.target.value})}
            placeholder="Your bank name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="accountNumber">Your Account Number (Last 4 digits)</Label>
          <Input
            id="accountNumber"
            value={transferDetails.accountNumber}
            onChange={(e) => setTransferDetails({...transferDetails, accountNumber: e.target.value})}
            placeholder="****"
            maxLength={4}
            required
          />
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full bg-black hover:bg-gray-800 text-white"
      >
        <Building2 className="mr-2 h-4 w-4" />
        Confirm Bank Transfer Details
      </Button>
    </form>
  );
};

// Main Checkout Component
export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [tier, setTier] = useState("");
  const [type, setType] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const { translateText } = useMasterTranslation();

  const stripePromise = getStripePromise();

  // Get URL parameters and initialize payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentMethodParam = urlParams.get("payment_method");
    const tierParam = urlParams.get("tier");
    const typeParam = urlParams.get("type");

    // Default to marketplace checkout if no specific parameters
    if (!paymentMethodParam || !tierParam) {
      setPaymentMethod("marketplace");
      setTier("standard");
      setType("marketplace");
      setIsLoading(false);
      return;
    }

    setPaymentMethod(paymentMethodParam);
    setTier(tierParam);
    setType(typeParam || "");

    // Initialize payment intent for Stripe
    if (paymentMethodParam === "stripe") {
      initializeStripePayment(tierParam);
    } else {
      setIsLoading(false);
    }
  }, [setLocation]);

  const initializeStripePayment = async (selectedTier: string) => {
    try {
      const amount = selectedTier === "vip" ? 19999 : 199999; // in pence
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        amount: amount / 100, // convert back to pounds for API
        tier: selectedTier,
        type: "dating_room_subscription"
      });
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: translateText("Error"),
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setLocation("/payment-gateway");
    } finally {
      setIsLoading(false);
    }
  };

  const getTierDetails = (tier: string) => {
    switch (tier) {
      case "vip":
        return {
          name: "VIP Dating Room",
          price: formatPrice(199.99),
          period: "per month",
          features: [
            "Advanced matching algorithms",
            "Priority profile visibility", 
            "Unlimited messaging",
            "Video chat features",
            "Enhanced search filters"
          ]
        };
      case "vvip":
        return {
          name: "VVIP Dating Room",
          price: formatPrice(1999.99),
          period: "per month",
          features: [
            "Exclusive VVIP member pool",
            "Personal dating concierge",
            "Premium profile features",
            "Private video events",
            "Background verification",
            "Priority customer support"
          ]
        };
      case "standard":
        return {
          name: "Marketplace Checkout",
          price: "Cart Total",
          period: "",
          features: [
            "Secure payment processing",
            "Multiple payment options",
            "Order tracking",
            "Customer support"
          ]
        };
      default:
        return {
          name: "Checkout",
          price: "N/A",
          period: "",
          features: []
        };
    }
  };

  const getPaymentMethodDetails = (method: string) => {
    switch (method) {
      case "stripe":
        return { name: "Credit/Debit Card", icon: <CreditCard className="h-5 w-5" /> };
      case "paypal":
        return { name: "PayPal", icon: <Globe className="h-5 w-5" /> };
      case "bank_transfer":
        return { name: "Bank Transfer", icon: <Building2 className="h-5 w-5" /> };
      case "apple_pay":
        return { name: "Apple Pay", icon: <Smartphone className="h-5 w-5" /> };
      case "google_pay":
        return { name: "Google Pay", icon: <Smartphone className="h-5 w-5" /> };
      default:
        return { name: "Unknown Method", icon: <CreditCard className="h-5 w-5" /> };
    }
  };

  const handlePaymentSuccess = () => {
    setTimeout(() => {
      setLocation("/dating-profile?payment=success");
    }, 2000);
  };

  const renderPaymentForm = () => {
    // Marketplace checkout - show payment options
    if (paymentMethod === "marketplace") {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Choose Payment Method</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stripe Option */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-black">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-6 w-6" />
                <div>
                  <h4 className="font-medium">Credit/Debit Card</h4>
                  <p className="text-sm text-gray-600">Secure payment with Stripe</p>
                </div>
              </div>
            </Card>
            
            {/* PayPal Option */}
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-500">
              <div className="flex items-center space-x-3">
                <Globe className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-medium">PayPal</h4>
                  <p className="text-sm text-gray-600">Pay with PayPal account</p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="space-y-4">
            <PayPalButton
              amount="29.99"
              currency="GBP"
              intent="CAPTURE"
            />
          </div>
        </div>
      );
    }
    
    if (paymentMethod === "stripe" && stripePromise && clientSecret) {
      return (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#000000',
              }
            }
          }}
        >
          <StripeCheckoutForm tier={tier} onSuccess={handlePaymentSuccess} />
        </Elements>
      );
    } else if (paymentMethod === "paypal") {
      return <PayPalCheckoutForm tier={tier} onSuccess={handlePaymentSuccess} />;
    } else if (paymentMethod === "bank_transfer") {
      return <BankTransferForm tier={tier} onSuccess={handlePaymentSuccess} />;
    } else {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">This payment method is not yet available.</p>
          <Button 
            onClick={() => setLocation("/payment-gateway")}
            variant="outline"
            className="mt-4"
          >
            Choose Different Payment Method
          </Button>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tierDetails = getTierDetails(tier);
  const paymentDetails = getPaymentMethodDetails(paymentMethod);

  return (
    <>
      <SEOHead 
        title="Secure Checkout - Dedw3n"
        description="Complete your secure checkout with multiple payment options. Stripe, PayPal, bank transfer, and cryptocurrency accepted."
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(paymentMethod === "marketplace" ? "/cart" : "/payment-gateway")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translateText(paymentMethod === "marketplace" ? 'Back to Cart' : 'Back to Payment Gateway')}
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {translateText('Complete Your Purchase')}
            </h1>
            <p className="text-gray-600">
              {translateText('Upgrade to')} {translateText(tierDetails.name)} {translateText('using')} {translateText(paymentDetails.name)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{tierDetails.name}</h3>
                      <p className="text-sm text-gray-600">{tierDetails.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{tierDetails.price}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-3">Payment Method</h4>
                    <div className="flex items-center gap-2 text-gray-700">
                      {paymentDetails.icon}
                      <span>{paymentDetails.name}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-3">Included Features</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {tierDetails.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>{tierDetails.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {paymentDetails.icon}
                  {paymentDetails.name} Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPaymentForm()}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Your payment information is secure and encrypted. We do not store your payment details.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}