import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Store, User, Building, Mail, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

// Private Vendor Schema
const privateVendorSchema = z.object({
  vendorType: z.literal("private"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// Business Vendor Schema
const businessVendorSchema = z.object({
  vendorType: z.literal("business"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  businessType: z.enum(["sole_proprietorship", "partnership", "corporation", "llc", "other"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  taxId: z.string().min(5, "Tax ID must be at least 5 characters"),
  businessRegistrationNumber: z.string().min(5, "Registration number must be at least 5 characters"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  businessLicense: z.string().optional(),
});

type PrivateVendorForm = z.infer<typeof privateVendorSchema>;
type BusinessVendorForm = z.infer<typeof businessVendorSchema>;

export default function VendorRegisterPage() {
  const [vendorType, setVendorType] = useState<"private" | "business" | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Private Vendor Form
  const privateForm = useForm<PrivateVendorForm>({
    resolver: zodResolver(privateVendorSchema),
    defaultValues: {
      vendorType: "private",
      storeName: "",
      description: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      website: "",
    },
  });

  // Auto-fill private vendor form with user profile data
  useEffect(() => {
    if (user && vendorType === "private") {
      privateForm.reset({
        vendorType: "private",
        storeName: user.name ? `${user.name}'s Store` : "",
        description: "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        country: user.country || "",
        website: user.website || "",
      });
    }
  }, [user, vendorType, privateForm]);

  // Business Vendor Form
  const businessForm = useForm<BusinessVendorForm>({
    resolver: zodResolver(businessVendorSchema),
    defaultValues: {
      vendorType: "business",
      storeName: "",
      businessName: "",
      description: "",
      businessType: "sole_proprietorship",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      taxId: "",
      businessRegistrationNumber: "",
      website: "",
      businessLicense: "",
    },
  });

  const registerVendorMutation = useMutation({
    mutationFn: async (data: PrivateVendorForm | BusinessVendorForm) => {
      const response = await apiRequest("POST", "/api/vendors/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: data.message,
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

  const onPrivateSubmit = (data: PrivateVendorForm) => {
    // Map private vendor form data to match server schema expectations
    const serverData = {
      ...data,
      businessName: data.storeName, // Map storeName to businessName for server
      businessType: "individual", // Set default business type for private vendors
    };
    registerVendorMutation.mutate(serverData);
  };

  const onBusinessSubmit = (data: BusinessVendorForm) => {
    registerVendorMutation.mutate(data);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardContent className="pt-6">
          {/* Vendor Type Selection */}
          {!vendorType && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Choose Your Vendor Type</h3>
                <p className="text-gray-600 mb-8">
                  Select the type of vendor account that best describes your business
                </p>
              </div>
              
              <RadioGroup 
                value={vendorType || ""} 
                onValueChange={(value) => setVendorType(value as "private" | "business")}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Private Vendor Option */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="private" 
                    className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <RadioGroupItem value="private" id="private" className="mb-4" />
                    <User className="h-12 w-12 text-primary mb-3" />
                    <span className="text-lg font-semibold">Private Vendor</span>
                    <span className="text-sm text-gray-600 text-center mt-2">
                      Perfect for individuals selling personal items, handmade products, or small-scale businesses
                    </span>
                    <ul className="text-xs text-gray-500 mt-3 space-y-1">
                      <li>• Simplified registration process</li>
                      <li>• Individual seller profile</li>
                      <li>• Basic tax reporting</li>
                      <li>• Personal contact information</li>
                    </ul>
                  </Label>
                </div>

                {/* Business Vendor Option */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="business" 
                    className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <RadioGroupItem value="business" id="business" className="mb-4" />
                    <Building className="h-12 w-12 text-primary mb-3" />
                    <span className="text-lg font-semibold">Business Vendor</span>
                    <span className="text-sm text-gray-600 text-center mt-2">
                      Ideal for registered businesses, companies, and professional retailers
                    </span>
                    <ul className="text-xs text-gray-500 mt-3 space-y-1">
                      <li>• Comprehensive business profile</li>
                      <li>• Business verification required</li>
                      <li>• Advanced tax documentation</li>
                      <li>• Professional seller features</li>
                    </ul>
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex justify-center pt-6">
                <Button 
                  onClick={() => setLocation("/vendor-dashboard")}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Private Vendor Form */}
          {vendorType === "private" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-primary mr-2" />
                  <h3 className="text-xl font-semibold">Private Vendor Registration</h3>
                </div>
                <Button 
                  className="bg-black text-white hover:bg-gray-800"
                  size="sm"
                  onClick={() => setVendorType(null)}
                >
                  Change to Business Vendor
                </Button>
              </div>

              <Form {...privateForm}>
                <form onSubmit={privateForm.handleSubmit(onPrivateSubmit)} className="space-y-6">
                  {/* Store Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      Store Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={privateForm.control}
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
                        control={privateForm.control}
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
                      <FormField
                        control={privateForm.control}
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
                    <h4 className="text-lg font-semibold flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={privateForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={privateForm.control}
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
                    <h4 className="text-lg font-semibold flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Address
                    </h4>
                    <FormField
                      control={privateForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Your Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={privateForm.control}
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
                        control={privateForm.control}
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
                        control={privateForm.control}
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
                        control={privateForm.control}
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

                  {/* Submit Button */}
                  <div className="flex justify-center space-x-4 pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setVendorType(null)}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-black text-white hover:bg-gray-800"
                      disabled={registerVendorMutation.isPending}
                    >
                      {registerVendorMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Business Vendor Form */}
          {vendorType === "business" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center">
                  <Building className="h-6 w-6 text-primary mr-2" />
                  <h3 className="text-xl font-semibold">Business Vendor Registration</h3>
                </div>
                <Button 
                  className="bg-black text-white hover:bg-gray-800"
                  size="sm"
                  onClick={() => setVendorType(null)}
                >
                  Change to Private Vendor
                </Button>
              </div>

              <Form {...businessForm}>
                <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
                  {/* Store Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      Store Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={businessForm.control}
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
                        control={businessForm.control}
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
                      control={businessForm.control}
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
                        control={businessForm.control}
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
                        control={businessForm.control}
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
                    <h4 className="text-lg font-semibold flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={businessForm.control}
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
                        control={businessForm.control}
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
                    <h4 className="text-lg font-semibold flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Business Address
                    </h4>
                    <FormField
                      control={businessForm.control}
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
                        control={businessForm.control}
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
                        control={businessForm.control}
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
                        control={businessForm.control}
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
                        control={businessForm.control}
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

                  {/* Business Documentation */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Business Documentation
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={businessForm.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID / EIN *</FormLabel>
                            <FormControl>
                              <Input placeholder="12-3456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={businessForm.control}
                        name="businessRegistrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Registration Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="BR123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={businessForm.control}
                      name="businessLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business License (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="License number or details" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center space-x-4 pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setVendorType(null)}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-black text-white hover:bg-gray-800"
                      disabled={registerVendorMutation.isPending}
                    >
                      {registerVendorMutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}