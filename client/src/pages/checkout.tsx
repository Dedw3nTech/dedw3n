import { useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ tier, onSuccess }: { tier: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
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
        // Payment succeeded
        toast({
          title: "Payment Successful",
          description: `Successfully upgraded to ${tier.toUpperCase()} dating room!`,
        });
        onSuccess();
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

  const getTierDetails = (tier: string) => {
    switch (tier) {
      case "vip":
        return {
          name: "VIP Dating Room",
          price: "£199.99",
          period: "per month",
          features: [
            "Advanced matching algorithms",
            "Priority profile visibility",
            "Unlimited messaging",
            "Video chat features"
          ]
        };
      case "vvip":
        return {
          name: "VVIP Dating Room",
          price: "£1,999.99",
          period: "per month",
          features: [
            "Exclusive VVIP member pool",
            "Personal dating concierge",
            "Premium profile features",
            "Private video events",
            "Background verification"
          ]
        };
      default:
        return {
          name: "Unknown Tier",
          price: "N/A",
          period: "",
          features: []
        };
    }
  };

  const tierDetails = getTierDetails(tier);

  return (
    <div className="space-y-6">
      {/* Order Summary */}
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
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Included Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {tierDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  Pay {tierDetails.price}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [tier, setTier] = useState("");

  // Get URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientSecretParam = urlParams.get("clientSecret");
    const tierParam = urlParams.get("tier");

    if (!clientSecretParam || !tierParam) {
      // Redirect back to dating profile if missing parameters
      setLocation("/dating-profile");
      return;
    }

    setClientSecret(clientSecretParam);
    setTier(tierParam);
  }, [setLocation]);

  const handlePaymentSuccess = () => {
    // Redirect back to dating profile after successful payment
    setTimeout(() => {
      setLocation("/dating-profile?payment=success");
    }, 2000);
  };

  if (!clientSecret || !tier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dating-profile")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dating Profile
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upgrade Your Dating Room
            </h1>
            <p className="text-gray-600">
              Complete your payment to activate your {tier.toUpperCase()} dating room access
            </p>
          </div>
        </div>

        {/* Payment Form */}
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
          <CheckoutForm tier={tier} onSuccess={handlePaymentSuccess} />
        </Elements>

        {/* Security Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your payment is secured by Stripe. We do not store your payment information.</p>
        </div>
      </div>
    </div>
  );
}