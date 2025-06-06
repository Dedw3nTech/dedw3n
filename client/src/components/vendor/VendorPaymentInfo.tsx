import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Building2, Wallet, Shield, CheckCircle } from "lucide-react";

const paymentInfoSchema = z.object({
  // Bank Account Information
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  routingNumber: z.string().min(1, "Routing number is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  accountType: z.enum(["checking", "savings"]),
  
  // Mobile Money Information
  mobileMoneyProvider: z.string().optional(),
  mobileMoneyNumber: z.string().optional(),
  
  // PayPal Information
  paypalEmail: z.string().email().optional().or(z.literal("")),
  
  // Tax Information
  taxId: z.string().optional(),
  businessType: z.enum(["individual", "business", "corporation"]).optional(),
  
  // Additional Information
  preferredPaymentMethod: z.enum(["bank", "mobile_money", "paypal"]),
  paymentSchedule: z.enum(["daily", "weekly", "monthly"]),
  minimumPayoutAmount: z.number().min(0).default(10),
});

type PaymentInfoForm = z.infer<typeof paymentInfoSchema>;

interface VendorPaymentInfoProps {
  vendorId: number;
}

export function VendorPaymentInfo({ vendorId }: VendorPaymentInfoProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<PaymentInfoForm>({
    resolver: zodResolver(paymentInfoSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      accountHolderName: "",
      accountType: "checking",
      mobileMoneyProvider: "",
      mobileMoneyNumber: "",
      paypalEmail: "",
      taxId: "",
      businessType: "individual",
      preferredPaymentMethod: "bank",
      paymentSchedule: "weekly",
      minimumPayoutAmount: 10,
    },
  });

  // Fetch existing payment info
  const { data: paymentInfo, isLoading } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/payment-info`],
    enabled: !!vendorId,
  });

  // Update payment info mutation
  const updatePaymentInfoMutation = useMutation({
    mutationFn: async (data: PaymentInfoForm) => {
      const response = await apiRequest("PUT", `/api/vendors/${vendorId}/payment-info`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment information updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/payment-info`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentInfoForm) => {
    updatePaymentInfoMutation.mutate(data);
  };

  const mobileMoneyProviders = [
    "M-Pesa", "MTN Mobile Money", "Airtel Money", "Vodacom M-Pesa", 
    "Orange Money", "Tigo Pesa", "Ecocash", "Wave", "Moov Money", "Other"
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Information
            </div>
            <div className="flex items-center space-x-2">
              {paymentInfo && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Verified
                </div>
              )}
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage your payment methods and banking information for receiving payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Preferred Payment Method */}
                <FormField
                  control={form.control}
                  name="preferredPaymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Bank Account Information */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    <h3 className="text-lg font-medium">Bank Account Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bank name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter account holder name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter account number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="routingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Routing Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter routing number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Mobile Money Information */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Wallet className="mr-2 h-5 w-5" />
                    <h3 className="text-lg font-medium">Mobile Money Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mobileMoneyProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Money Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mobileMoneyProviders.map((provider) => (
                                <SelectItem key={provider} value={provider}>
                                  {provider}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobileMoneyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Money Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter mobile money number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* PayPal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">PayPal Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="paypalEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PayPal Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter PayPal email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Tax Information */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    <h3 className="text-lg font-medium">Tax Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID / EIN</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tax ID or EIN" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="corporation">Corporation</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Payout Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payout Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentSchedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Schedule</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment schedule" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimumPayoutAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Payout Amount (£)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updatePaymentInfoMutation.isPending}
                  >
                    {updatePaymentInfoMutation.isPending ? "Saving..." : "Save Payment Info"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              {paymentInfo ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Preferred Payment Method</Label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {paymentInfo.preferredPaymentMethod?.replace('_', ' ')}
                    </p>
                  </div>
                  
                  {paymentInfo.bankName && (
                    <div>
                      <Label className="text-sm font-medium">Bank Account</Label>
                      <p className="text-sm text-muted-foreground">
                        {paymentInfo.bankName} - ****{paymentInfo.accountNumber?.slice(-4)}
                      </p>
                    </div>
                  )}

                  {paymentInfo.mobileMoneyProvider && (
                    <div>
                      <Label className="text-sm font-medium">Mobile Money</Label>
                      <p className="text-sm text-muted-foreground">
                        {paymentInfo.mobileMoneyProvider} - {paymentInfo.mobileMoneyNumber}
                      </p>
                    </div>
                  )}

                  {paymentInfo.paypalEmail && (
                    <div>
                      <Label className="text-sm font-medium">PayPal</Label>
                      <p className="text-sm text-muted-foreground">
                        {paymentInfo.paypalEmail}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Payment Schedule</Label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {paymentInfo.paymentSchedule}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Minimum Payout</Label>
                    <p className="text-sm text-muted-foreground">
                      £{paymentInfo.minimumPayoutAmount}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No payment information configured
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsEditing(true)}
                  >
                    Add Payment Information
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}