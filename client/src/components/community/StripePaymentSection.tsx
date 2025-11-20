import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type MembershipTier = {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  benefits: string[];
  durationDays: number;
  tierType: string;
};

type PaymentProps = {
  tier: MembershipTier;
  communityId: number;
  onSuccess: () => void;
  onCancel: () => void;
};

const StripePaymentForm = ({ tier, communityId, onSuccess }: PaymentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
          return_url: window.location.origin + "/community/payment-success",
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing",
          variant: "destructive",
        });
        setIsProcessing(false);
      } else {
        toast({
          title: "Payment Successful",
          description: "Your membership has been activated",
        });
        
        await apiRequest(
          "POST",
          `/api/communities/${communityId}/memberships`,
          { tierId: tier.id, paymentMethod: "stripe" }
        );
        
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during payment processing",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>Pay {tier.price} {tier.currency}</>
        )}
      </Button>
    </form>
  );
};

export const StripePaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const stripePromise = getStripePromise();

  if (!stripePromise) {
    return (
      <div className="flex justify-center items-center py-8 text-center">
        <div>
          <p className="text-red-600 font-semibold">Payment provider not available</p>
          <p className="text-sm text-gray-600 mt-2">Please contact support or try another payment method.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest(
          "POST",
          `/api/membership/payment/stripe/create-intent`,
          {
            tierId: tier.id,
            communityId,
            amount: tier.price,
            currency: tier.currency,
          }
        );

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Could not initialize payment. Please try again.",
          variant: "destructive",
        });
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [tier.id, communityId, tier.price, tier.currency, onCancel]);

  if (isLoading || !clientSecret) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm
        tier={tier}
        communityId={communityId}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};
