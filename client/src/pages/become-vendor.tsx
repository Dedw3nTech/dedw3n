import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Store, Users, Building, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

// Private Vendor Schema - Simple form for individual sellers
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

// Business Vendor Schema - Comprehensive form with all business fields
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
  
  // Business-specific fields
  vatNumber: z.string().min(5, "VAT number must be at least 5 characters"),
  taxId: z.string().min(5, "Tax ID must be at least 5 characters"),
  businessRegistrationNumber: z.string().min(5, "Registration number must be at least 5 characters"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  businessLicense: z.string().optional(),
  
  // Additional business information
  yearEstablished: z.string().min(4, "Year established must be 4 digits"),
  numberOfEmployees: z.enum(["1-10", "11-50", "51-100", "101-500", "500+"]),
  businessCategory: z.enum(["retail", "wholesale", "manufacturing", "services", "technology", "other"]),
  annualRevenue: z.enum(["0-100k", "100k-500k", "500k-1M", "1M-5M", "5M+"]),
  
  // Contact information
  primaryContactName: z.string().min(2, "Primary contact name required"),
  primaryContactTitle: z.string().min(2, "Primary contact title required"),
  secondaryEmail: z.string().email("Invalid secondary email").optional().or(z.literal("")),
  secondaryPhone: z.string().optional(),
  
  // Banking and financial
  bankName: z.string().min(2, "Bank name required"),
  bankAccountNumber: z.string().min(5, "Bank account number required"),
  routingNumber: z.string().min(5, "Routing number required"),
  
  // Sales manager
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

export default function BecomeVendorPage() {
  const [vendorType, setVendorType] = useState<"private" | "business" | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check for query parameter to auto-select vendor type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam === 'business' || typeParam === 'private') {
      setVendorType(typeParam);
    }
  }, []);

  // Master Translation System
  const vendorTexts = [
    // Page header
    "Become a Vendor", "Choose the type of vendor account that fits your business",
    
    // Vendor types
    "Private Vendor", "Business Vendor", "Individual Seller", "Professional Business",
    "Perfect for individuals selling personal items", "Ideal for registered businesses and companies",
    
    // Form sections
    "Store Information", "Contact Information", "Business Information", "Financial Information",
    "Sales Manager", "Additional Details",
    
    // Form fields - Basic
    "Store Name", "Business Name", "Description", "Email", "Phone", "Website",
    "Address", "City", "State", "Zip Code", "Country",
    
    // Business fields
    "VAT Number", "Tax ID", "Business Registration Number", "Business License",
    "Year Established", "Number of Employees", "Business Category", "Annual Revenue",
    "Primary Contact Name", "Primary Contact Title", "Secondary Email", "Secondary Phone",
    "Bank Name", "Bank Account Number", "Routing Number",
    
    // Business types
    "Business Type", "Sole Proprietorship", "Partnership", "Corporation", "LLC", "Other",
    
    // Employee ranges
    "1-10", "11-50", "51-100", "101-500", "500+",
    
    // Categories
    "Retail", "Wholesale", "Manufacturing", "Services", "Technology", "Other",
    
    // Revenue ranges
    "0-100k", "100k-500k", "500k-1M", "1M-5M", "5M+",
    
    // Sales manager
    "Do you have a Sales Manager?", "Sales Manager Name", "Sales Manager ID",
    "Sales managers earn additional commission on your sales",
    
    // Buttons and actions
    "Back", "Submit Application", "Submitting...", "Choose Vendor Type",
    "Registration Successful", "Registration Failed", "Failed to register as vendor",
    
    // Placeholders
    "Enter your store name", "Enter your business name", "Describe your business...",
    "your@email.com", "+1234567890", "https://yourwebsite.com",
    "123 Main Street", "City", "State", "12345", "Country",
    "VAT123456789", "TAX123456789", "REG123456789", "License Number",
    "2020", "John Doe", "CEO", "bank@email.com", "+1987654321",
    "Bank of America", "1234567890", "123456789", "Manager Name", "MGR123"
  ];

  const { translations: t } = useMasterBatchTranslation(vendorTexts);

  // Extract translations
  const [
    becomeVendorText, chooseVendorTypeDescText, privateVendorText, businessVendorText,
    individualSellerText, professionalBusinessText, privateDescText, businessDescText,
    storeInfoText, contactInfoText, businessInfoText, financialInfoText, salesManagerText, additionalDetailsText,
    storeNameText, businessNameText, descriptionText, emailText, phoneText, websiteText,
    addressText, cityText, stateText, zipCodeText, countryText,
    vatNumberText, taxIdText, businessRegNumberText, businessLicenseText,
    yearEstablishedText, numberOfEmployeesText, businessCategoryText, annualRevenueText,
    primaryContactNameText, primaryContactTitleText, secondaryEmailText, secondaryPhoneText,
    bankNameText, bankAccountNumberText, routingNumberText,
    businessTypeText, soleProprietorshipText, partnershipText, corporationText, llcText, otherText,
    employees1to10Text, employees11to50Text, employees51to100Text, employees101to500Text, employees500PlusText,
    retailText, wholesaleText, manufacturingText, servicesText, technologyText, otherCategoryText,
    revenue0to100kText, revenue100kto500kText, revenue500kto1MText, revenue1Mto5MText, revenue5MPlusText,
    hasSalesManagerText, salesManagerNameText, salesManagerIdText, salesManagerCommissionText,
    backText, submitApplicationText, submittingText, chooseVendorTypeText,
    registrationSuccessText, registrationFailedText, registrationErrorText,
    // Placeholders
    storeNamePlaceholderText, businessNamePlaceholderText, descriptionPlaceholderText,
    emailPlaceholderText, phonePlaceholderText, websitePlaceholderText,
    addressPlaceholderText, cityPlaceholderText, statePlaceholderText, zipCodePlaceholderText, countryPlaceholderText,
    vatNumberPlaceholderText, taxIdPlaceholderText, businessRegNumberPlaceholderText, businessLicensePlaceholderText,
    yearEstablishedPlaceholderText, primaryContactNamePlaceholderText, primaryContactTitlePlaceholderText,
    secondaryEmailPlaceholderText, secondaryPhonePlaceholderText,
    bankNamePlaceholderText, bankAccountNumberPlaceholderText, routingNumberPlaceholderText,
    salesManagerNamePlaceholderText, salesManagerIdPlaceholderText
  ] = t;

  // Private Vendor Form
  const privateForm = useForm<PrivateVendorForm>({
    resolver: zodResolver(privateVendorSchema),
    defaultValues: {
      vendorType: "private",
      storeName: "",
      description: "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
      country: user?.country || "",
      website: user?.website || "",
      hasSalesManager: false,
      salesManagerName: "",
      salesManagerId: "",
    },
  });

  // Business Vendor Form
  const businessForm = useForm<BusinessVendorForm>({
    resolver: zodResolver(businessVendorSchema),
    defaultValues: {
      vendorType: "business",
      storeName: "",
      businessName: "",
      description: "",
      businessType: "sole_proprietorship",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
      country: user?.country || "",
      vatNumber: "",
      taxId: "",
      businessRegistrationNumber: "",
      website: user?.website || "",
      businessLicense: "",
      yearEstablished: "",
      numberOfEmployees: "1-10",
      businessCategory: "retail",
      annualRevenue: "0-100k",
      primaryContactName: user?.name || "",
      primaryContactTitle: "",
      secondaryEmail: "",
      secondaryPhone: "",
      bankName: "",
      bankAccountNumber: "",
      routingNumber: "",
      hasSalesManager: false,
      salesManagerName: "",
      salesManagerId: "",
    },
  });

  // Registration mutation
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

  // Handle form submissions
  const handlePrivateSubmit = (data: PrivateVendorForm) => {
    registerVendorMutation.mutate(data);
  };

  const handleBusinessSubmit = (data: BusinessVendorForm) => {
    registerVendorMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>{becomeVendorText}</CardTitle>
            <CardDescription>
              Please log in to become a vendor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">

      {!vendorType && (
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Private Vendor Option */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setVendorType("private")}>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle className="flex items-center justify-center gap-2">
                {privateVendorText}
              </CardTitle>
              <CardDescription className="text-base">
                {individualSellerText}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{privateDescText}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Simple registration process</li>
                <li>• Individual seller profile</li>
                <li>• Basic tax reporting</li>
                <li>• Personal contact information</li>
              </ul>
            </CardContent>
          </Card>

          {/* Business Vendor Option */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setVendorType("business")}>
            <CardHeader className="text-center">
              <Building className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle className="flex items-center justify-center gap-2">
                {businessVendorText}
              </CardTitle>
              <CardDescription className="text-base">
                {professionalBusinessText}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{businessDescText}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Comprehensive business profile</li>
                <li>• Business verification required</li>
                <li>• Advanced tax documentation</li>
                <li>• Professional seller features</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Private Vendor Form */}
      {vendorType === "private" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-xl font-semibold">{privateVendorText} Registration</h3>
            </div>
            <Button variant="outline" onClick={() => setVendorType(null)}>
              {backText}
            </Button>
          </div>

          <Form {...privateForm}>
            <form onSubmit={privateForm.handleSubmit(handlePrivateSubmit)} className="space-y-6">
              {/* Store Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{storeInfoText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={privateForm.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{storeNameText}</FormLabel>
                        <FormControl>
                          <Input placeholder={storeNamePlaceholderText} {...field} />
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
                        <FormLabel>{descriptionText}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={descriptionPlaceholderText} {...field} />
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
                        <FormLabel>{websiteText} (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder={websitePlaceholderText} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{contactInfoText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={privateForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{emailText}</FormLabel>
                          <FormControl>
                            <Input placeholder={emailPlaceholderText} {...field} />
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
                          <FormLabel>{phoneText}</FormLabel>
                          <FormControl>
                            <Input placeholder={phonePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={privateForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{addressText}</FormLabel>
                        <FormControl>
                          <Input placeholder={addressPlaceholderText} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={privateForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{cityText}</FormLabel>
                          <FormControl>
                            <Input placeholder={cityPlaceholderText} {...field} />
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
                          <FormLabel>{stateText}</FormLabel>
                          <FormControl>
                            <Input placeholder={statePlaceholderText} {...field} />
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
                          <FormLabel>{zipCodeText}</FormLabel>
                          <FormControl>
                            <Input placeholder={zipCodePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={privateForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{countryText}</FormLabel>
                        <FormControl>
                          <Input placeholder={countryPlaceholderText} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Sales Manager */}
              <Card>
                <CardHeader>
                  <CardTitle>{salesManagerText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={privateForm.control}
                    name="hasSalesManager"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{hasSalesManagerText}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {salesManagerCommissionText}
                          </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={privateForm.control}
                        name="salesManagerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{salesManagerNameText}</FormLabel>
                            <FormControl>
                              <Input placeholder={salesManagerNamePlaceholderText} {...field} />
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
                            <FormLabel>{salesManagerIdText}</FormLabel>
                            <FormControl>
                              <Input placeholder={salesManagerIdPlaceholderText} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  className="bg-black text-white hover:bg-gray-800 px-8 py-2"
                  disabled={registerVendorMutation.isPending}
                >
                  {registerVendorMutation.isPending ? submittingText : submitApplicationText}
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
              <h3 className="text-xl font-semibold">{businessVendorText} Registration</h3>
            </div>
            <Button variant="outline" onClick={() => setVendorType(null)}>
              {backText}
            </Button>
          </div>

          <Form {...businessForm}>
            <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-6">
              {/* Store Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{storeInfoText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{storeNameText}</FormLabel>
                          <FormControl>
                            <Input placeholder={storeNamePlaceholderText} {...field} />
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
                          <FormLabel>{businessNameText}</FormLabel>
                          <FormControl>
                            <Input placeholder={businessNamePlaceholderText} {...field} />
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
                        <FormLabel>{descriptionText}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={descriptionPlaceholderText} {...field} />
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
                          <FormLabel>{businessTypeText}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sole_proprietorship">{soleProprietorshipText}</SelectItem>
                              <SelectItem value="partnership">{partnershipText}</SelectItem>
                              <SelectItem value="corporation">{corporationText}</SelectItem>
                              <SelectItem value="llc">{llcText}</SelectItem>
                              <SelectItem value="other">{otherText}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{websiteText} (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder={websitePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{businessInfoText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{vatNumberText}</FormLabel>
                          <FormControl>
                            <Input placeholder={vatNumberPlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{taxIdText}</FormLabel>
                          <FormControl>
                            <Input placeholder={taxIdPlaceholderText} {...field} />
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
                          <FormLabel>{businessRegNumberText}</FormLabel>
                          <FormControl>
                            <Input placeholder={businessRegNumberPlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="businessLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{businessLicenseText} (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder={businessLicensePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="yearEstablished"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{yearEstablishedText}</FormLabel>
                          <FormControl>
                            <Input placeholder={yearEstablishedPlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="numberOfEmployees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{numberOfEmployeesText}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-10">{employees1to10Text}</SelectItem>
                              <SelectItem value="11-50">{employees11to50Text}</SelectItem>
                              <SelectItem value="51-100">{employees51to100Text}</SelectItem>
                              <SelectItem value="101-500">{employees101to500Text}</SelectItem>
                              <SelectItem value="500+">{employees500PlusText}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="businessCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{businessCategoryText}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="retail">{retailText}</SelectItem>
                              <SelectItem value="wholesale">{wholesaleText}</SelectItem>
                              <SelectItem value="manufacturing">{manufacturingText}</SelectItem>
                              <SelectItem value="services">{servicesText}</SelectItem>
                              <SelectItem value="technology">{technologyText}</SelectItem>
                              <SelectItem value="other">{otherCategoryText}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="annualRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{annualRevenueText}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0-100k">{revenue0to100kText}</SelectItem>
                              <SelectItem value="100k-500k">{revenue100kto500kText}</SelectItem>
                              <SelectItem value="500k-1M">{revenue500kto1MText}</SelectItem>
                              <SelectItem value="1M-5M">{revenue1Mto5MText}</SelectItem>
                              <SelectItem value="5M+">{revenue5MPlusText}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{contactInfoText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="primaryContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{primaryContactNameText}</FormLabel>
                          <FormControl>
                            <Input placeholder={primaryContactNamePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="primaryContactTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{primaryContactTitleText}</FormLabel>
                          <FormControl>
                            <Input placeholder={primaryContactTitlePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{emailText}</FormLabel>
                          <FormControl>
                            <Input placeholder={emailPlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="secondaryEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{secondaryEmailText} (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder={secondaryEmailPlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{phoneText}</FormLabel>
                          <FormControl>
                            <Input placeholder={phonePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="secondaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{secondaryPhoneText} (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder={secondaryPhonePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={businessForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{addressText}</FormLabel>
                        <FormControl>
                          <Input placeholder={addressPlaceholderText} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{cityText}</FormLabel>
                          <FormControl>
                            <Input placeholder={cityPlaceholderText} {...field} />
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
                          <FormLabel>{stateText}</FormLabel>
                          <FormControl>
                            <Input placeholder={statePlaceholderText} {...field} />
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
                          <FormLabel>{zipCodeText}</FormLabel>
                          <FormControl>
                            <Input placeholder={zipCodePlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={businessForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{countryText}</FormLabel>
                        <FormControl>
                          <Input placeholder={countryPlaceholderText} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{financialInfoText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={businessForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{bankNameText}</FormLabel>
                        <FormControl>
                          <Input placeholder={bankNamePlaceholderText} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={businessForm.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{bankAccountNumberText}</FormLabel>
                          <FormControl>
                            <Input placeholder={bankAccountNumberPlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={businessForm.control}
                      name="routingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{routingNumberText}</FormLabel>
                          <FormControl>
                            <Input placeholder={routingNumberPlaceholderText} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sales Manager */}
              <Card>
                <CardHeader>
                  <CardTitle>{salesManagerText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={businessForm.control}
                    name="hasSalesManager"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{hasSalesManagerText}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {salesManagerCommissionText}
                          </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={businessForm.control}
                        name="salesManagerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{salesManagerNameText}</FormLabel>
                            <FormControl>
                              <Input placeholder={salesManagerNamePlaceholderText} {...field} />
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
                            <FormLabel>{salesManagerIdText}</FormLabel>
                            <FormControl>
                              <Input placeholder={salesManagerIdPlaceholderText} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  className="bg-black text-white hover:bg-gray-800 px-8 py-2"
                  disabled={registerVendorMutation.isPending}
                >
                  {registerVendorMutation.isPending ? submittingText : submitApplicationText}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}