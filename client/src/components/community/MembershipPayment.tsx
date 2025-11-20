import { useState, lazy, Suspense } from "react";
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

const StripePaymentSection = lazy(() => 
  import("./StripePaymentSection").then(module => ({ default: module.StripePaymentSection }))
);

const PayPalPaymentSection = lazy(() => 
  import("./PayPalPaymentSection").then(module => ({ default: module.PayPalPaymentSection }))
);

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

const PaymentLoadingFallback = () => (
  <div className="flex justify-center items-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
            <Suspense fallback={<PaymentLoadingFallback />}>
              <StripePaymentSection
                tier={tier}
                communityId={communityId}
                onSuccess={onSuccess}
                onCancel={onCancel}
              />
            </Suspense>
          </Card>
        </TabsContent>
        
        <TabsContent value="paypal" className="mt-6">
          <Card className="p-4">
            <Suspense fallback={<PaymentLoadingFallback />}>
              <PayPalPaymentSection
                tier={tier}
                communityId={communityId}
                onSuccess={onSuccess}
                onCancel={onCancel}
              />
            </Suspense>
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