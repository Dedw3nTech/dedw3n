import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// Private Vendor Schema - Simplified to match actual form fields
const privateVendorSchema = z.object({
  vendorType: z.literal("private"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// Business Vendor Schema - Simplified to match actual form fields
const businessVendorSchema = z.object({
  vendorType: z.literal("business"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  businessType: z.enum(["sole_proprietorship", "partnership", "corporation", "llc", "other"]),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  
  // Business-specific fields
  vatNumber: z.string().min(5, "VAT number must be at least 5 characters"),
  taxId: z.string().min(5, "Tax ID must be at least 5 characters"),
  businessRegistrationNumber: z.string().min(5, "Registration number must be at least 5 characters"),
  businessLicense: z.string().optional(),
  
  // Additional business information
  yearEstablished: z.string().min(4, "Year established must be 4 digits"),
  numberOfEmployees: z.enum(["1-10", "11-50", "51-100", "101-500", "500+"]),
  businessCategory: z.enum(["retail", "wholesale", "manufacturing", "services", "technology", "other"]),
  annualRevenue: z.enum(["0-100k", "100k-500k", "500k-1M", "1M-5M", "5M+"]),
  
  // Banking and financial
  bankName: z.string().min(2, "Bank name required"),
  bankAccountNumber: z.string().min(5, "Bank account number required"),
  routingNumber: z.string().min(5, "Routing number required"),
});

type PrivateVendorForm = z.infer<typeof privateVendorSchema>;
type BusinessVendorForm = z.infer<typeof businessVendorSchema>;

export default function BecomeVendorPage() {
  const [vendorType, setVendorType] = useState<"private" | "business" | null>(null);
  const [showProxyAlert, setShowProxyAlert] = useState(false);
  const [hasActiveProxy, setHasActiveProxy] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch proxy accounts
  const { data: proxyAccounts } = useQuery({
    queryKey: ['/api/proxy-accounts'],
    enabled: !!user,
  });

  // Check if user already has an active vendor account
  const { data: vendorData } = useQuery({
    queryKey: ["/api/vendors/me"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/me");
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch vendor profile");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Redirect active vendors to add-product page
  useEffect(() => {
    if (vendorData && vendorData.isActive) {
      console.log('[VENDOR-REDIRECT] User already has active vendor account, redirecting to add-product');
      setLocation('/add-product');
    }
  }, [vendorData, setLocation]);

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
    
    // Business Account Validation
    "Business Account Required", "Only Business account holders can create a Business Vendor. Please upgrade your account to Business type first.",
    
    // Profile Completeness Validation
    "Profile Incomplete", "Please complete your profile before activating your vendor account.",
    "Personal Information Required", "Please complete your personal information (name, email, phone, address, city, country, region, date of birth, gender).",
    "Compliance Documents Required", "Please upload required compliance documents (ID document front/back, proof of address, ID selfie).",
    "Financial Information Required", "Please complete your financial information (bank details, card proof).",
    "Complete Profile",
    
    // Placeholders
    "Please provide store name", "Please provide business name", "Provide a description of your store",
    "example@email.com", "Please provide phone number", "https://www.example.com",
    "Please provide street address", "Please provide city", "Please provide state/region", "Please provide postal code", "Please select country",
    "Please provide VAT number", "Please provide tax ID", "Please provide registration number", "Please provide license number",
    "Please provide year", "Please provide contact name", "Please provide contact title", "Please provide secondary email", "Please provide secondary phone",
    "Please provide bank name", "Please provide account number", "Please provide routing number", "Please provide manager name", "Please provide manager ID"
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
    businessAccountRequiredText, businessAccountMessageText,
    profileIncompleteText, profileIncompleteMessageText, personalInfoRequiredText, complianceDocsRequiredText, financialInfoRequiredText, completeProfileText,
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
      website: "",
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
      vatNumber: "",
      taxId: "",
      businessRegistrationNumber: "",
      website: "",
      businessLicense: "",
      yearEstablished: "",
      numberOfEmployees: "1-10",
      businessCategory: "retail",
      annualRevenue: "0-100k",
      bankName: "",
      bankAccountNumber: "",
      routingNumber: "",
    },
  });

  // Registration mutation
  const registerVendorMutation = useMutation({
    mutationFn: async (data: PrivateVendorForm | BusinessVendorForm) => {
      console.log('[VENDOR-ACTIVATION] Sending request to backend:', data);
      const response = await apiRequest("POST", "/api/vendors/register", data);
      const result = await response.json();
      console.log('[VENDOR-ACTIVATION] Backend response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[VENDOR-ACTIVATION] Registration successful:', data);
      toast({
        title: registrationSuccessText,
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
      setLocation("/add-product");
    },
    onError: (error: any) => {
      console.error('[VENDOR-ACTIVATION] Registration failed:', error);
      toast({
        title: registrationFailedText,
        description: error.message || registrationErrorText,
        variant: "destructive",
      });
    },
  });

  // Validate profile completeness before activation (memoized for reactivity)
  const profileValidation = useMemo(() => {
    if (!user) return { isValid: false, missingFields: ['user'], missingCategories: [] };
    
    const missingFields: string[] = [];
    const missingCategories: { category: string; label: string }[] = [];
    
    // Personal Information Check
    const personalInfoComplete = user.name && user.email && user.phone && user.shippingAddress && 
                                  user.shippingCity && user.country && user.region && 
                                  user.dateOfBirth && user.gender;
    if (!personalInfoComplete) {
      missingFields.push('personal');
      missingCategories.push({ category: 'personal', label: 'Personal Information' });
    }
    
    // Compliance Documents Check
    const complianceComplete = user.idDocumentFrontUrl && user.idDocumentBackUrl && 
                                user.proofOfAddressUrl && user.idSelfieUrl;
    if (!complianceComplete) {
      missingFields.push('compliance');
      missingCategories.push({ category: 'compliance', label: 'Compliance Documents' });
    }
    
    // Financial Information Check
    const financialComplete = user.bankName && user.bankAccountNumber && 
                               user.bankRoutingNumber && user.cardProofUrl;
    if (!financialComplete) {
      missingFields.push('financial');
      missingCategories.push({ category: 'financial', label: 'Financial Information' });
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
      missingCategories
    };
  }, [user]);

  // Handle form submissions
  const handlePrivateSubmit = (data: PrivateVendorForm) => {
    console.log('[VENDOR-ACTIVATION] Private vendor form submitted', { data });
    console.log('[VENDOR-ACTIVATION] Profile validation result:', profileValidation);
    
    if (!profileValidation.isValid) {
      let errorMessage = profileIncompleteMessageText;
      
      if (profileValidation.missingFields.includes('personal')) {
        errorMessage = personalInfoRequiredText;
      } else if (profileValidation.missingFields.includes('compliance')) {
        errorMessage = complianceDocsRequiredText;
      } else if (profileValidation.missingFields.includes('financial')) {
        errorMessage = financialInfoRequiredText;
      }
      
      console.log('[VENDOR-ACTIVATION] Profile incomplete - showing error toast');
      toast({
        title: profileIncompleteText,
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/profile')}
            className="bg-white text-black hover:bg-gray-100"
          >
            {completeProfileText}
          </Button>
        )
      });
      return;
    }
    
    console.log('[VENDOR-ACTIVATION] Profile complete - submitting to backend');
    registerVendorMutation.mutate(data);
  };

  const handleBusinessSubmit = (data: BusinessVendorForm) => {
    console.log('[VENDOR-ACTIVATION] Business vendor form submitted', { data });
    console.log('[VENDOR-ACTIVATION] Profile validation result:', profileValidation);
    
    if (!profileValidation.isValid) {
      let errorMessage = profileIncompleteMessageText;
      
      if (profileValidation.missingFields.includes('personal')) {
        errorMessage = personalInfoRequiredText;
      } else if (profileValidation.missingFields.includes('compliance')) {
        errorMessage = complianceDocsRequiredText;
      } else if (profileValidation.missingFields.includes('financial')) {
        errorMessage = financialInfoRequiredText;
      }
      
      console.log('[VENDOR-ACTIVATION] Profile incomplete - showing error toast');
      toast({
        title: profileIncompleteText,
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/profile')}
            className="bg-white text-black hover:bg-gray-100"
          >
            {completeProfileText}
          </Button>
        )
      });
      return;
    }
    
    console.log('[VENDOR-ACTIVATION] Profile complete - submitting to backend');
    registerVendorMutation.mutate(data);
  };

  // Handle business vendor card click - check for account type and proxy accounts
  const handleBusinessVendorClick = () => {
    // Check if user has business account type
    if (user && user.accountType !== 'business') {
      toast({
        title: businessAccountRequiredText,
        description: businessAccountMessageText,
        variant: "destructive"
      });
      return;
    }
    
    if (!proxyAccounts || !Array.isArray(proxyAccounts)) {
      setVendorType("business");
      return;
    }

    const activeBusinessProxy = proxyAccounts.find(
      (account: any) => 
        (account.accountType === 'organization' || account.accountType === 'company') &&
        account.status === 'verified'
    );

    if (activeBusinessProxy) {
      setHasActiveProxy(true);
      setShowProxyAlert(true);
    } else {
      setHasActiveProxy(false);
      setShowProxyAlert(true);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
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
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{becomeVendorText}</h1>
        <p className="text-muted-foreground">{chooseVendorTypeDescText}</p>
      </div>

      {!vendorType && (
        <Card>
          <CardHeader>
            <CardTitle>{chooseVendorTypeText}</CardTitle>
            <CardDescription>Select the type of vendor account you want to create</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={vendorType || ""} 
              onValueChange={(value) => {
                if (value === "business") {
                  handleBusinessVendorClick();
                } else {
                  setVendorType(value as "private" | "business");
                }
              }}
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="private" id="private" className="mt-1" data-testid="radio-private-vendor" />
                <Label htmlFor="private" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-black">{privateVendorText}</div>
                  <p className="text-sm text-muted-foreground mt-1">{privateDescText}</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Sell personal products/services</li>
                    <li>• Simple setup process</li>
                    <li>• Basic analytics</li>
                    <li>• 15% commission</li>
                  </ul>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="business" id="business" className="mt-1" data-testid="radio-business-vendor" />
                <Label htmlFor="business" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-black">{businessVendorText}</div>
                  <p className="text-sm text-muted-foreground mt-1">{businessDescText}</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Sell Business products/services</li>
                    <li>• Bulk product uploads</li>
                    <li>• Basic analytics</li>
                    <li>• 15% commission</li>
                  </ul>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Proxy Account Alert */}
      {showProxyAlert && (
        <div className="max-w-4xl mx-auto mt-6">
          <Alert>
            <AlertTitle className="text-black">
              {hasActiveProxy ? "Switch to Business Account" : "Business Account Required"}
            </AlertTitle>
            <AlertDescription className="text-black">
              {hasActiveProxy 
                ? "You have an active business/organization proxy account. Please switch to your business account to continue with business vendor registration."
                : "You need to create a business or organization proxy account before you can register as a business vendor. Please create a proxy account first to continue."}
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowProxyAlert(false)}
                className="border-black text-black hover:bg-gray-100"
              >
                Close
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Private Vendor Form */}
      {vendorType === "private" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center">
              <h3 className="text-xl font-semibold">{privateVendorText} Registration</h3>
            </div>
            <Button variant="ghost" onClick={() => setVendorType(null)}>
              {backText}
            </Button>
          </div>

          {/* Profile Status Alert */}
          {!profileValidation.isValid && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Profile Incomplete</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Complete your profile before activating your vendor account. Missing:</p>
                <ul className="list-disc list-inside mt-2">
                  {profileValidation.missingCategories.map((cat) => (
                    <li key={cat.category}>{cat.label}</li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/profile')}
                  className="mt-3 bg-white text-black hover:bg-gray-100"
                >
                  Complete Profile Now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Form {...privateForm}>
            <form onSubmit={privateForm.handleSubmit(handlePrivateSubmit)} className="space-y-6">
              {/* Hidden field for vendorType */}
              <input type="hidden" {...privateForm.register('vendorType')} value="private" />
              
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
                        <FormLabel>{storeNameText} *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Textarea {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  className="bg-black text-white hover:bg-gray-800 px-8 py-2"
                  disabled={registerVendorMutation.isPending || !profileValidation.isValid}
                  data-testid="button-activate-private-vendor"
                >
                  {registerVendorMutation.isPending 
                    ? "Activating..." 
                    : !profileValidation.isValid 
                    ? "Complete Profile to Activate" 
                    : "Activate"}
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
              <h3 className="text-xl font-semibold">{businessVendorText} Registration</h3>
            </div>
            <Button variant="ghost" onClick={() => setVendorType(null)}>
              {backText}
            </Button>
          </div>

          {/* Profile Status Alert */}
          {!profileValidation.isValid && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Profile Incomplete</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Complete your profile before activating your vendor account. Missing:</p>
                <ul className="list-disc list-inside mt-2">
                  {profileValidation.missingCategories.map((cat) => (
                    <li key={cat.category}>{cat.label}</li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation('/profile')}
                  className="mt-3 bg-white text-black hover:bg-gray-100"
                >
                  Complete Profile Now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Form {...businessForm}>
            <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-6">
              {/* Hidden field for vendorType */}
              <input type="hidden" {...businessForm.register('vendorType')} value="business" />
              
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
                          <FormLabel>{storeNameText} *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
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
                        <FormLabel>{descriptionText} *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
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
                            <Input {...field} />
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
                            <Input {...field} />
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
                            <Input {...field} />
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
                          <FormLabel>{businessRegNumberText} *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
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
                            <Input {...field} />
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
                          <Input {...field} />
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
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>



              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  className="bg-black text-white hover:bg-gray-800 px-8 py-2"
                  disabled={registerVendorMutation.isPending || !profileValidation.isValid}
                  data-testid="button-activate-business-vendor"
                >
                  {registerVendorMutation.isPending 
                    ? "Activating..." 
                    : !profileValidation.isValid 
                    ? "Complete Profile to Activate" 
                    : "Activate"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}