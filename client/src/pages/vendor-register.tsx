import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Store, User, Building, Mail, MapPin, CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

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
  hasSalesManager: z.boolean().default(false),
  salesManagerName: z.string().optional(),
  salesManagerId: z.string().optional(),
}).refine((data) => {
  if (data.hasSalesManager) {
    return data.salesManagerName && data.salesManagerName.trim().length > 0 &&
           data.salesManagerId && data.salesManagerId.trim().length > 0;
  }
  return true;
}, {
  message: "Sales Manager name and ID are required when Sales Manager is selected",
  path: ["salesManagerName"],
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
  hasSalesManager: z.boolean().default(false),
  salesManagerName: z.string().optional(),
  salesManagerId: z.string().optional(),
}).refine((data) => {
  if (data.hasSalesManager) {
    return data.salesManagerName && data.salesManagerName.trim().length > 0 &&
           data.salesManagerId && data.salesManagerId.trim().length > 0;
  }
  return true;
}, {
  message: "Sales Manager name and ID are required when Sales Manager is selected",
  path: ["salesManagerName"],
});

type PrivateVendorForm = z.infer<typeof privateVendorSchema>;
type BusinessVendorForm = z.infer<typeof businessVendorSchema>;

export default function VendorRegisterPage() {
  const [vendorType, setVendorType] = useState<"private" | "business" | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Master Translation System - Single mega-batch call (88 → 1 API call)
  const vendorRegisterTexts = [
    // Vendor Type Selection (8 texts)
    "Choose Your Vendor Type", "Select the type of vendor account that best describes your business",
    "Your Existing Vendor Accounts", "Private Vendor", "Business Vendor", 
    "Account Already Created", "Active", "Back to Dashboard",
    
    // Private Vendor Section (7 texts)
    "Private Vendor Registration", "Change to Business Vendor", 
    "Perfect for individuals selling personal items, handmade products, or small-scale businesses",
    "Simplified registration process", "Individual seller profile", "Basic tax reporting",
    "Personal contact information",
    
    // Business Vendor Section (8 texts)
    "Business Vendor Registration", "Change to Private Vendor",
    "Ideal for registered businesses, companies, and professional retailers",
    "Comprehensive business profile", "Business verification required", 
    "Advanced tax documentation", "Professional seller features",
    
    // Form Fields (17 texts)
    "Store Information", "Store Name", "Business Name", "Description", "Business Type",
    "Contact Information", "Email", "Phone", "Address", "City", "State", "Zip Code",
    "Country", "Website", "Tax ID", "Business Registration Number", "Business License",
    
    // Sales Manager (4 texts)
    "Sales Manager", "Do you have a Sales Manager?", "Sales Manager Name", "Sales Manager ID",
    
    // Actions & Buttons (6 texts)
    "Back", "Submit Application", "Submitting...", "Registration Successful",
    "Registration Failed", "Failed to register as vendor. Please try again.",
    
    // Business Types (5 texts)
    "Sole Proprietorship", "Partnership", "Corporation", "LLC", "Other",
    
    // Placeholders (19 texts)
    "Your Store Name", "Your Business Name", "Describe your business",
    "Describe your store and the products you sell...", "https://yourwebsite.com",
    "Your Email", "Your Phone", "Your Address", "Your City", "Your State",
    "Your Zip Code", "Your Country", "Your Website", "Your Tax ID", 
    "Your Registration Number", "Optional", 
    "Sales Managers earn an additional 2.5% commission on your sales",
    "Enter full name", "Enter ID number"
  ];

  const { translations: t } = useMasterBatchTranslation(vendorRegisterTexts);
  
  // Extract translations with descriptive variable names for readability
  const [
    chooseVendorTypeText, selectVendorDescText, yourExistingAccountsText, privateVendorText, 
    businessVendorText, accountAlreadyCreatedText, activeText, backToDashboardText,
    
    privateVendorRegText, changeToBusinessText, privateDescText, simplifiedRegText, 
    individualSellerText, basicTaxText, personalContactText,
    
    businessVendorRegText, changeToPrivateText, businessDescText, comprehensiveProfileText,
    businessVerificationText, advancedTaxText, professionalFeaturesText,
    
    storeInfoText, storeNameText, businessNameText, descriptionText, businessTypeText,
    contactInfoText, emailText, phoneText, addressText, cityText, stateText, zipCodeText,
    countryText, websiteText, taxIdText, businessRegNumText, businessLicenseText,
    
    salesManagerText, hasSalesManagerText, salesManagerNameText, salesManagerIdText,
    
    backText, submitApplicationText, submittingText, registrationSuccessText,
    registrationFailedText, registrationErrorText,
    
    soleProprietorshipText, partnershipText, corporationText, llcText, otherText,
    
    yourStoreNameText, yourBusinessNameText, describeBusinessText, describeStoreText,
    websitePlaceholderText, yourEmailText, yourPhoneText, yourAddressText, yourCityText,
    yourStateText, yourZipCodeText, yourCountryText, yourWebsiteText, yourTaxIdText,
    yourRegNumberText, optionalText, salesManagerCommissionText, enterFullNameText, enterIdNumberText
  ] = t;

  // Check existing vendor accounts
  const { data: vendorStatus } = useQuery({
    queryKey: ["/api/vendors/manage", "check-status"],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/vendors/manage", {
        action: "check-status"
      });
      return response.json();
    },
    enabled: !!user,
  });

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
      hasSalesManager: false,
      salesManagerName: "",
      salesManagerId: "",
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
      hasSalesManager: false,
      salesManagerName: "",
      salesManagerId: "",
    },
  });

  const registerVendorMutation = useMutation({
    mutationFn: async (data: PrivateVendorForm | BusinessVendorForm) => {
      const response = await apiRequest("POST", "/api/vendors/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: registrationSuccessText,
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
      setLocation("/vendor-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: registrationFailedText,
        description: error.message || registrationErrorText,
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
                <h3 className="text-xl font-semibold mb-4">{chooseVendorTypeText}</h3>
                <p className="text-gray-600 mb-8">
                  {selectVendorDescText}
                </p>
                
                {/* Existing Vendor Accounts Status */}
                {vendorStatus && vendorStatus.vendorAccounts && vendorStatus.vendorAccounts.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">{yourExistingAccountsText}</h4>
                    <div className="space-y-2">
                      {vendorStatus.vendorAccounts.map((vendor: any) => (
                        <div key={vendor.id} className="flex items-center justify-between text-sm">
                          <span className="text-blue-700 capitalize">{vendor.vendorType === 'private' ? privateVendorText : businessVendorText}</span>
                          <span className="text-green-600 font-medium">✓ {activeText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <RadioGroup 
                value={vendorType || ""} 
                onValueChange={(value) => {
                  // Prevent selection of existing vendor types
                  if (value === "private" && vendorStatus?.hasPrivateVendor) {
                    return;
                  }
                  if (value === "business" && vendorStatus?.hasBusinessVendor) {
                    return;
                  }
                  setVendorType(value as "private" | "business");
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Private Vendor Option */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="private" 
                    className={`flex flex-col items-center p-6 border-2 rounded-lg transition-colors relative ${
                      vendorStatus?.hasPrivateVendor 
                        ? "border-green-200 bg-green-50 cursor-not-allowed opacity-75" 
                        : "border-gray-200 cursor-pointer hover:border-primary"
                    }`}
                  >
                    {vendorStatus?.hasPrivateVendor ? (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    ) : (
                      <RadioGroupItem 
                        value="private" 
                        id="private" 
                        className="mb-4"
                        disabled={vendorStatus?.hasPrivateVendor}
                      />
                    )}
                    <User className={`h-12 w-12 mb-3 ${vendorStatus?.hasPrivateVendor ? "text-green-600" : "text-primary"}`} />
                    <span className="text-lg font-semibold">{privateVendorText}</span>
                    {vendorStatus?.hasPrivateVendor && (
                      <span className="text-sm text-green-600 font-medium mb-2">
                        ✓ {accountAlreadyCreatedText}
                      </span>
                    )}
                    <span className="text-sm text-gray-600 text-center mt-2">
                      {privateDescText}
                    </span>
                    <ul className="text-xs text-gray-500 mt-3 space-y-1">
                      <li>• {simplifiedRegText}</li>
                      <li>• {individualSellerText}</li>
                      <li>• {basicTaxText}</li>
                      <li>• {personalContactText}</li>
                    </ul>
                  </Label>
                </div>

                {/* Business Vendor Option */}
                <div className="space-y-2">
                  <Label 
                    htmlFor="business" 
                    className={`flex flex-col items-center p-6 border-2 rounded-lg transition-colors relative ${
                      vendorStatus?.hasBusinessVendor 
                        ? "border-green-200 bg-green-50 cursor-not-allowed opacity-75" 
                        : "border-gray-200 cursor-pointer hover:border-primary"
                    }`}
                  >
                    {vendorStatus?.hasBusinessVendor ? (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    ) : (
                      <RadioGroupItem 
                        value="business" 
                        id="business" 
                        className="mb-4"
                        disabled={vendorStatus?.hasBusinessVendor}
                      />
                    )}
                    <Building className={`h-12 w-12 mb-3 ${vendorStatus?.hasBusinessVendor ? "text-green-600" : "text-primary"}`} />
                    <span className="text-lg font-semibold">{businessVendorText}</span>
                    {vendorStatus?.hasBusinessVendor && (
                      <span className="text-sm text-green-600 font-medium mb-2">
                        ✓ {accountAlreadyCreatedText}
                      </span>
                    )}
                    <span className="text-sm text-gray-600 text-center mt-2">
                      {businessDescText}
                    </span>
                    <ul className="text-xs text-gray-500 mt-3 space-y-1">
                      <li>• {comprehensiveProfileText}</li>
                      <li>• {businessVerificationText}</li>
                      <li>• {advancedTaxText}</li>
                      <li>• {professionalFeaturesText}</li>
                    </ul>
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex justify-center pt-6">
                <Button 
                  onClick={() => setLocation("/vendor-dashboard")}
                  variant="outline"
                >
                  {backToDashboardText}
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
                  <h3 className="text-xl font-semibold">{privateVendorRegText}</h3>
                </div>
                <Button 
                  className="bg-black text-white hover:bg-gray-800"
                  size="sm"
                  onClick={() => setVendorType(null)}
                >
                  {changeToBusinessText}
                </Button>
              </div>

              <Form {...privateForm}>
                <form onSubmit={privateForm.handleSubmit(onPrivateSubmit)} className="space-y-6">
                  {/* Store Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Store className="h-5 w-5 mr-2" />
                      {storeInfoText}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={privateForm.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{storeNameText} *</FormLabel>
                            <FormControl>
                              <Input placeholder={yourStoreNameText} {...field} />
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
                            <FormLabel>{descriptionText} *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={describeStoreText}
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
                            <FormLabel>{websiteText} ({optionalText})</FormLabel>
                            <FormControl>
                              <Input placeholder={websitePlaceholderText} {...field} />
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
                      {contactInfoText}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={privateForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{emailText} *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder={yourEmailText} {...field} />
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
                            <FormLabel>{phoneText} *</FormLabel>
                            <FormControl>
                              <Input placeholder={yourPhoneText} {...field} />
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
                      {addressText}
                    </h4>
                    <FormField
                      control={privateForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{addressText} *</FormLabel>
                          <FormControl>
                            <Input placeholder={yourAddressText} {...field} />
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
                            <FormLabel>{cityText} *</FormLabel>
                            <FormControl>
                              <Input placeholder={yourCityText} {...field} />
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
                            <FormLabel>{stateText} *</FormLabel>
                            <FormControl>
                              <Input placeholder={yourStateText} {...field} />
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
                            <FormLabel>{zipCodeText} *</FormLabel>
                            <FormControl>
                              <Input placeholder={yourZipCodeText} {...field} />
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
                            <FormLabel>{countryText} *</FormLabel>
                            <FormControl>
                              <Input placeholder={yourCountryText} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sales Manager Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {salesManagerText}
                    </h4>
                    <FormField
                      control={privateForm.control}
                      name="hasSalesManager"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {hasSalesManagerText}
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              {salesManagerCommissionText}
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {privateForm.watch("hasSalesManager") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
                        <FormField
                          control={privateForm.control}
                          name="salesManagerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{salesManagerNameText} *</FormLabel>
                              <FormControl>
                                <Input placeholder={enterFullNameText} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={privateForm.control}
                          name="salesManagerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{salesManagerIdText} *</FormLabel>
                              <FormControl>
                                <Input placeholder={enterIdNumberText} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
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

                  {/* Sales Manager Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Sales Manager
                    </h4>
                    <FormField
                      control={businessForm.control}
                      name="hasSalesManager"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Do you have a Sales Manager?
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Sales Managers earn an additional 2.5% commission on your sales
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {businessForm.watch("hasSalesManager") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
                        <FormField
                          control={businessForm.control}
                          name="salesManagerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sales Manager Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={businessForm.control}
                          name="salesManagerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sales Manager ID Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter ID number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
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