import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
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

export const PayPalPaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  return (
    <PayPalScriptProvider options={{ 
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID as string,
      currency: tier.currency
    }}>
      <div className="py-4">
        <PayPalButtons
          disabled={isProcessing}
          createOrder={async () => {
            try {
              setIsProcessing(true);
              const response = await apiRequest(
                "POST",
                `/api/membership/payment/paypal/create-order`,
                {
                  tierId: tier.id,
                  communityId,
                  amount: tier.price,
                  currency: tier.currency,
                }
              );
              
              const data = await response.json();
              return data.id;
            } catch (error: any) {
              toast({
                title: "Error",
                description: "Could not create PayPal order. Please try again.",
                variant: "destructive",
              });
              setIsProcessing(false);
              throw error;
            }
          }}
          onApprove={async (data: any) => {
            try {
              const response = await apiRequest(
                "POST",
                `/api/membership/payment/paypal/capture`,
                { orderId: data.orderID }
              );
              
              await apiRequest(
                "POST",
                `/api/communities/${communityId}/memberships`,
                { tierId: tier.id, paymentMethod: "paypal" }
              );
              
              toast({
                title: "Payment Successful",
                description: "Your membership has been activated",
              });
              
              onSuccess();
            } catch (error: any) {
              toast({
                title: "Error",
                description: "Payment verification failed. Please contact support.",
                variant: "destructive",
              });
            } finally {
              setIsProcessing(false);
            }
          }}
          onError={(error: any) => {
            toast({
              title: "Payment Error",
              description: "An error occurred during PayPal processing",
              variant: "destructive",
            });
            setIsProcessing(false);
          }}
          onCancel={() => {
            toast({
              title: "Payment Cancelled",
              description: "Your payment was cancelled",
              variant: "default",
            });
            setIsProcessing(false);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
};
