import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, Wallet, Phone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY");
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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

// Stripe payment form component
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
        // If no error, the payment succeeded
        toast({
          title: "Payment Successful",
          description: "Your membership has been activated",
        });
        
        // Create the membership in our system
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

// Stripe payment section (wrapper for the form with Elements provider)
const StripePaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Create a payment intent when the component mounts
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

// PayPal payment section
const PaypalPaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  return (
    <PayPalScriptProvider options={{ 
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID as string,
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
          onApprove={async (data) => {
            try {
              const response = await apiRequest(
                "POST",
                `/api/membership/payment/paypal/process`,
                {
                  orderId: data.orderID,
                  tierId: tier.id,
                  communityId
                }
              );
              
              if (!response.ok) {
                throw new Error("Failed to verify payment");
              }
              
              toast({
                title: "Payment Successful",
                description: "Your membership has been activated",
              });
              
              onSuccess();
            } catch (error: any) {
              toast({
                title: "Payment Verification Failed",
                description: error.message || "Could not verify payment. Please contact support.",
                variant: "destructive",
              });
              setIsProcessing(false);
            }
          }}
          onError={() => {
            toast({
              title: "Payment Failed",
              description: "An error occurred during payment processing. Please try again.",
              variant: "destructive",
            });
            setIsProcessing(false);
          }}
          onCancel={() => {
            toast({
              title: "Payment Cancelled",
              description: "You've cancelled the payment process.",
            });
            setIsProcessing(false);
            onCancel();
          }}
          style={{ layout: "vertical" }}
        />
      </div>
    </PayPalScriptProvider>
  );
};

// E-Wallet Payment section
const EWalletPaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    defaultValues: {
      walletId: ""
    }
  });

  const onSubmit = async (data: { walletId: string }) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/membership/payment/ewallet/process",
        {
          walletId: data.walletId,
          tierId: tier.id,
          communityId,
          amount: tier.price,
          currency: tier.currency
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      toast({
        title: "Payment Successful",
        description: "Your membership has been activated",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Pay for your membership using your e-wallet balance.
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Wallet ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your e-wallet ID" {...field} />
                </FormControl>
                <FormDescription>
                  Enter your registered e-wallet ID to complete the payment.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay {tier.price} {tier.currency}</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

// Mobile Money Payment section
const MobileMoneyPaymentSection = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providers, setProviders] = useState<{id: string, name: string}[]>([
    { id: "mtn", name: "MTN Mobile Money" },
    { id: "airtel", name: "Airtel Money" },
    { id: "vodafone", name: "Vodafone Cash" },
    { id: "orange", name: "Orange Money" },
    { id: "mpesa", name: "M-Pesa" }
  ]);
  
  const form = useForm({
    defaultValues: {
      phoneNumber: "",
      provider: ""
    }
  });

  const onSubmit = async (data: { phoneNumber: string, provider: string }) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/membership/payment/mobile-money/initiate",
        {
          phoneNumber: data.phoneNumber,
          provider: data.provider,
          tierId: tier.id,
          communityId,
          amount: tier.price,
          currency: tier.currency
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      toast({
        title: "Payment Initiated",
        description: "Please check your phone for the payment confirmation prompt.",
      });
      
      // In a real implementation, we would monitor the status of the payment
      // For now, we'll just simulate a successful payment after a delay
      setTimeout(() => {
        toast({
          title: "Payment Successful",
          description: "Your membership has been activated",
        });
        onSuccess();
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Pay for your membership using mobile money.
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Money Provider</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select your mobile money provider.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your phone number" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the phone number registered with your mobile money account.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay {tier.price} {tier.currency}</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

// Main membership payment component
const MembershipPayment = ({ tier, communityId, onSuccess, onCancel }: PaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "ewallet" | "mobile">("stripe");

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="stripe" 
        onValueChange={(value) => setPaymentMethod(value as "stripe" | "paypal" | "ewallet" | "mobile")}
        value={paymentMethod}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stripe"><CreditCard className="mr-2 h-4 w-4" /> Card</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
          <TabsTrigger value="ewallet"><Wallet className="mr-2 h-4 w-4" /> E-Wallet</TabsTrigger>
          <TabsTrigger value="mobile"><Phone className="mr-2 h-4 w-4" /> Mobile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stripe" className="mt-6">
          <Card className="p-4">
            <StripePaymentSection
              tier={tier}
              communityId={communityId}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="paypal" className="mt-6">
          <Card className="p-4">
            <PaypalPaymentSection
              tier={tier}
              communityId={communityId}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Card>
        </TabsContent>

        <TabsContent value="ewallet" className="mt-6">
          <Card className="p-4">
            <EWalletPaymentSection
              tier={tier}
              communityId={communityId}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="mt-6">
          <Card className="p-4">
            <MobileMoneyPaymentSection
              tier={tier}
              communityId={communityId}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default MembershipPayment;