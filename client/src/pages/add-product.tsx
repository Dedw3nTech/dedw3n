import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Plus } from 'lucide-react';
import CurrencyInput from '@/components/ui/currency-input';

// Product form schema
const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  discountPrice: z.coerce.number().nonnegative().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL" }),
  inventory: z.coerce.number().int().nonnegative({ message: "Inventory must be a non-negative number" }),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  // New Shopify-style fields
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  offeringType: z.enum(['product', 'service']).default('product'),
  vendor: z.string().optional(),
  collections: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  weight: z.coerce.number().positive().optional(),
  weightUnit: z.enum(['kg', 'lb', 'oz', 'g']).default('kg'),
  dimensions: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().default(true),
  continueSellingWhenOutOfStock: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  shippingCarrier: z.string().optional(),
  shippingIncluded: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  productCode: z.string().optional(),
  // Service-specific fields
  serviceDuration: z.string().optional(),
  serviceType: z.enum(['onetime', 'recurring', 'subscription', 'consultation']).optional(),
  serviceLocation: z.enum(['online', 'onsite', 'office', 'flexible']).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVendor, setIsVendor] = useState(false);
  const [vendorId, setVendorId] = useState<number | null>(null);

  // Comprehensive Add Product Page Text Collection for Translation
  const addProductTexts = [
    // Page Headers & Navigation
    "Add Product / Service",
    "Add Product",
    "Add Service", 
    "What are you offering?",
    "Product",
    "Service",
    
    // Authentication & Access
    "Please log in to add a product",
    "Login",
    "Become a Vendor",
    "You need to create a vendor account before you can add products.",
    "Create Vendor Account",
    "As a vendor, you'll be able to:",
    "List and sell your products on our marketplace",
    "Manage your inventory and orders", 
    "Receive payments directly to your account",
    "Build your brand and customer base",
    
    // Form Sections
    "Title",
    "Short sleeve t-shirt",
    "Product description...",
    "Description",
    "Media",
    "Product Image",
    "https://example.com/image.jpg",
    "Pricing",
    "Price",
    "Compare-at price",
    "Include shipping costs in price",
    "Choose whether shipping costs are included in the product price or calculated separately at checkout",
    
    // Inventory Section
    "Inventory",
    "Track quantity",
    "Continue selling when out of stock",
    "This won't affect Shopify POS. Staff will see a warning, but can complete sales when available inventory reaches zero and below.",
    "Quantity",
    
    // Shipping Section
    "Shipping",
    "This is a physical product",
    "Weight",
    "Unit",
    "Dimensions",
    "Dimensions (L × W × H)",
    "10 × 5 × 2 cm",
    "Length x Width x Height",
    "Shipping Carrier",
    "Select shipping carrier",
    "Customs information",
    "Add customs information",
    "Country/Region of origin",
    "HS code",
    "Search by product keyword or HS code",
    
    // SEO Section
    "Search engine listing preview",
    "Add a title and description to see how this product might appear in a search engine listing",
    "Page title",
    "Meta description",
    
    // Organization Section
    "Organization",
    "Product type",
    "Vendor",
    "Collections",
    "Tags",
    
    // Product Status
    "Product status",
    "Active",
    "Draft",
    "Archived",
    
    // Product Availability  
    "Product availability",
    "Available on all channels",
    "Unavailable on all channels",
    "Available on selected channels",
    
    // Publishing
    "Publishing",
    "Online Store",
    "Point of Sale",
    "Shop",
    "Facebook & Instagram",
    "Google",
    "Available",
    "Unavailable",
    "Set availability date",
    
    // Service-specific fields
    "Service Duration",
    "Service Type",
    "Service Location",
    "In-person",
    "Online", 
    "Both",
    "Consultation",
    "Installation",
    "Repair",
    "Maintenance", 
    "Training",
    "Other",
    
    // Action Buttons
    "Save product",
    "Save as draft",
    "Preview",
    "Delete product",
    "Duplicate",
    "View product",
    
    // Status Messages
    "Product Added",
    "Your product has been added successfully.",
    "Product created successfully with code:",
    "Error",
    "Failed to add product:",
    "Vendor Account Created", 
    "Your vendor account has been created successfully. You can now add products.",
    "Failed to create vendor account:",
    
    // Form Validation
    "Product name must be at least 3 characters",
    "Description must be at least 10 characters", 
    "Price must be positive",
    "Please select a category",
    
    // Common UI Elements
    "Loading...",
    "Save",
    "Cancel",
    "Edit", 
    "Delete",
    "Back",
    "Next",
    "Submit",
    "Reset",
    "Clear",
    "Apply",
    "Other",
    
    // Weight Units
    "kg",
    "lb", 
    "oz",
    "g"
  ];

  // Use Master Translation System for optimal performance and persistence
  const { translations, isLoading: isTranslating } = useMasterBatchTranslation(addProductTexts);

  // Helper function to get translated text
  const t = (text: string) => translations?.[text] || text;

  // Form initialization
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discountPrice: undefined,
      category: '',
      imageUrl: '',
      inventory: 1,
      isNew: true,
      isOnSale: false,
      // New Shopify-style field defaults
      status: 'active',
      offeringType: 'product',
      vendor: '',
      collections: [],
      tags: [],
      weight: undefined,
      weightUnit: 'kg',
      dimensions: '',
      sku: '',
      barcode: '',
      trackQuantity: true,
      continueSellingWhenOutOfStock: false,
      requiresShipping: true,
      shippingCarrier: '',
      shippingIncluded: false,
      seoTitle: '',
      seoDescription: '',
      serviceDuration: '',
      serviceType: undefined,
      serviceLocation: undefined,
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
  });

  // Check if user is a vendor
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        return;
      }

      try {
        // Check if user is already a vendor
        const response = await apiRequest('GET', '/api/vendors');
        const vendors = await response.json();
        const userVendor = vendors.find((v: any) => v.userId === user.id);
        
        if (userVendor) {
          setIsVendor(true);
          setVendorId(userVendor.id);
        } else {
          // User is not a vendor
          setIsVendor(false);
        }
      } catch (error) {
        console.error('Error checking vendor status:', error);
      }
    };

    checkVendorStatus();
  }, [user]);

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (data: { storeName: string, description: string }) => {
      const response = await apiRequest('POST', '/api/vendors', data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsVendor(true);
      setVendorId(data.id);
      toast({
        title: t('Vendor Account Created'),
        description: t('Your vendor account has been created successfully. You can now add products.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: `${t('Failed to create vendor account:')} ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await apiRequest('POST', '/api/vendors/products', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('Product Added'),
        description: data.productCode 
          ? `${t('Product created successfully with code:')} ${data.productCode}`
          : t('Your product has been added successfully.'),
      });
      
      // Update form with the generated product code if available
      if (data.productCode) {
        form.setValue('productCode', data.productCode);
      }
      
      // Invalidate products query
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      
      // Don't navigate immediately to show the generated product code
      setTimeout(() => {
        setLocation(`/product/${data.id}`);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: `${t('Failed to add product:')} ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // On form submit
  const onSubmit = (values: ProductFormValues) => {
    // Check if user has isVendor flag set to true (system-level vendor status)
    if (!isVendor && !(user && user.isVendor === true)) {
      toast({
        title: t('Error'),
        description: t('You need to create a vendor account first.'),
        variant: 'destructive',
      });
      return;
    }
    
    // If user has isVendor but no vendorId, we'll handle this on the server side
    // The server will create a temporary vendor profile if needed
    createProductMutation.mutate(values);
  };

  // Handle vendor creation
  const handleCreateVendor = () => {
    const storeName = prompt('Enter your store name:');
    if (!storeName) return;
    
    const description = prompt('Enter a brief description of your store:');
    if (!description) return;
    
    createVendorMutation.mutate({ storeName, description });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("Add Product")}</CardTitle>
            <CardDescription>{t("Please log in to add a product")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')}>{t("Login")}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Display vendor registration prompt if user is not a vendor and doesn't have isVendor flag
  if (!isVendor && !(user && user.isVendor === true) && !createVendorMutation.isPending) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("Become a Vendor")}</CardTitle>
            <CardDescription>
              {t("You need to create a vendor account before you can add products.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {t("As a vendor, you'll be able to:")}
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>{t("List and sell your products on our marketplace")}</li>
              <li>{t("Manage your inventory and orders")}</li>
              <li>{t("Receive payments directly to your account")}</li>
              <li>{t("Build your brand and customer base")}</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateVendor}>{t("Create Vendor Account")}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loader while vendor creation is in progress
  if (createVendorMutation.isPending) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">{t("Add Product / Service")}</h1>
      </div>
      
      {/* Offering Type Selection */}
      <div className="mb-6">
        <Form {...form}>
          <FormField
            control={form.control}
            name="offeringType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t("What are you offering?")}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="product" id="product" />
                      <label htmlFor="product" className="text-sm font-medium cursor-pointer">
                        {t("Product")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="service" id="service" />
                      <label htmlFor="service" className="text-sm font-medium cursor-pointer">
                        {t("Service")}
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Title Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Title")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("Short sleeve t-shirt")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>{t("Description")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("Product description...")} 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Media Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Media")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Product Image")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("https://example.com/image.jpg")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Pricing Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Pricing")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Price")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Compare-at price")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="shippingIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("Include shipping costs in price")}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t("Choose whether shipping costs are included in the product price or calculated separately at checkout")}
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
                </CardContent>
              </Card>

              {/* Inventory Section - Only show for products */}
              {form.watch('offeringType') === 'product' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Inventory")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("SKU (Stock Keeping Unit)")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("SKU-001")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Barcode (ISBN, UPC, GTIN, etc.)")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("1234567890123")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="trackQuantity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("Track quantity")}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t("Deduct stock as items are sold")}
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

                  {form.watch('trackQuantity') && (
                    <>
                      <FormField
                        control={form.control}
                        name="inventory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Quantity")}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="continueSellingWhenOutOfStock"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">{t("Continue selling when out of stock")}</FormLabel>
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
                    </>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Shipping Section - Only show for products */}
              {form.watch('offeringType') === 'product' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Shipping")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requiresShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("This is a physical product")}</FormLabel>
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

                  {form.watch('requiresShipping') && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("Weight")}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    min="0" 
                                    placeholder="0.0" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="weightUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("Unit")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="lb">lb</SelectItem>
                                    <SelectItem value="oz">oz</SelectItem>
                                    <SelectItem value="g">g</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="dimensions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Dimensions (L × W × H)")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("10 × 5 × 2 cm")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shippingCarrier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Shipping Carrier")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("Select shipping carrier")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="dhl">DHL</SelectItem>
                                  <SelectItem value="fedex">FedEx</SelectItem>
                                  <SelectItem value="ups">UPS</SelectItem>
                                  <SelectItem value="royal-mail">Royal Mail</SelectItem>
                                  <SelectItem value="usps">USPS</SelectItem>
                                  <SelectItem value="dpd">DPD</SelectItem>
                                  <SelectItem value="hermes">Hermes</SelectItem>
                                  <SelectItem value="aramex">Aramex</SelectItem>
                                  <SelectItem value="tnt">TNT</SelectItem>
                                  <SelectItem value="gls">GLS</SelectItem>
                                  <SelectItem value="other">{t("Other")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                      <Button type="button" variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("Add customs information")}
                      </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}
              
              {/* Variants - Only show for products */}
              {form.watch('offeringType') === 'product' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Variants")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("Add options like size or color")}
                  </Button>
                </CardContent>
              </Card>
              )}

              {/* Service-specific fields */}
              {form.watch('offeringType') === 'service' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("Service Details")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="serviceDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Service Duration")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 1 hour, 30 minutes")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Service Type")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="onetime">{t("One-time Service")}</SelectItem>
                                <SelectItem value="recurring">{t("Recurring Service")}</SelectItem>
                                <SelectItem value="subscription">{t("Subscription")}</SelectItem>
                                <SelectItem value="consultation">{t("Consultation")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="serviceLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Service Location")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("Select location type")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="online">{t("Online/Remote")}</SelectItem>
                              <SelectItem value="onsite">{t("On-site/Client Location")}</SelectItem>
                              <SelectItem value="office">{t("My Office/Studio")}</SelectItem>
                              <SelectItem value="flexible">{t("Flexible")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Product Organization */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Product organization")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Product category")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
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
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Vendor")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("Vendor name")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" disabled={createProductMutation.isPending} className="w-full">
                {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save product")}
              </Button>
            </form>
          </Form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Form {...form}>
            <Card>
              <CardHeader>
                <CardTitle>{t("Product status")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Status")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t("Active")}</SelectItem>
                          <SelectItem value="draft">{t("Draft")}</SelectItem>
                          <SelectItem value="archived">{t("Archived")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>



            <Card>
              <CardHeader>
                <CardTitle>Product badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-normal">New Product</FormLabel>
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

                <FormField
                  control={form.control}
                  name="isOnSale"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-normal">On Sale</FormLabel>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Code</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="productCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unique Product Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Generated automatically when published"
                          disabled
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormDescription>
                        Save changes to automatically generate a unique product code. Format: 001{"{userId}"}{"{day}"}/{"{month}"}/{"{year}"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </div>
  );
}