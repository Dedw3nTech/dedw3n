import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Store, Building, Phone, Mail, MapPin } from "lucide-react";

const vendorRegistrationSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  businessType: z.string().min(1, "Please select a business type"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(5, "Please enter a valid address"),
  city: z.string().min(2, "Please enter a valid city"),
  state: z.string().min(2, "Please enter a valid state"),
  zipCode: z.string().min(5, "Please enter a valid zip code"),
  country: z.string().min(2, "Please enter a valid country"),
  taxId: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
});

type VendorRegistrationForm = z.infer<typeof vendorRegistrationSchema>;

export default function VendorRegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VendorRegistrationForm>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      storeName: "",
      businessName: "",
      description: "",
      businessType: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      taxId: "",
      website: "",
    },
  });

  const registerVendorMutation = useMutation({
    mutationFn: async (data: VendorRegistrationForm) => {
      const response = await fetch("/api/vendors/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your vendor application has been submitted successfully. You'll receive an email confirmation shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
      setLocation("/vendor-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register as vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorRegistrationForm) => {
    registerVendorMutation.mutate(data);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Become a Vendor</CardTitle>
          <CardDescription>
            Join our marketplace and start selling your products to customers worldwide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Store Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  Store Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Store Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Business Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your store and the products you sell..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            {...field}
                          >
                            <option value="">Select Business Type</option>
                            <option value="individual">Individual</option>
                            <option value="sole_proprietorship">Sole Proprietorship</option>
                            <option value="partnership">Partnership</option>
                            <option value="corporation">Corporation</option>
                            <option value="llc">LLC</option>
                            <option value="other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="business@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Business Address
                </h3>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Business Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Tax Information
                </h3>
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID / EIN (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="12-3456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    size="lg"
                    className="bg-black text-white hover:bg-gray-800 w-full min-w-[200px]"
                    disabled={registerVendorMutation.isPending}
                  >
                    {registerVendorMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    className="w-full"
                    onClick={() => setLocation("/vendor-dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}