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
import { Label } from '@/components/ui/label';
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Upload, X, Video as VideoIcon, CheckCircle } from 'lucide-react';
import CurrencyInput from '@/components/ui/currency-input';
import { VendorCreationDialog } from '@/components/VendorCreationDialog';


// Product form schema
const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  discountPrice: z.coerce.number().nonnegative().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  imageUrl: z.string().optional().refine((val) => {
    // Allow empty string or valid URL
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Please enter a valid image URL or leave empty"),
  inventory: z.coerce.number().int().nonnegative({ message: "Inventory must be a non-negative number" }),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  // New Shopify-style fields
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  offeringType: z.enum(['product', 'service', 'vehicle', 'real_estate', 'xl_xxl_product', 'request_product', 'request_service']).default('product'),
  vendor: z.string().optional(),
  collections: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  weight: z.coerce.number().min(0).max(999.999).optional().refine(
    (val) => val === undefined || Number((val * 1000).toFixed(0)) / 1000 === val,
    { message: "Weight must have at most 3 decimal places" }
  ),
  weightUnit: z.enum(['kg', 'lb', 'oz', 'g']).default('kg'),
  dimensions: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().default(true),
  continueSellingWhenOutOfStock: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  videoUrl: z.string().optional(),
  vatIncluded: z.boolean().default(false),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  marketplace: z.enum(['c2c', 'b2c', 'b2b', 'raw', 'rqst']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  productCode: z.string().optional(),
  // Service-specific fields
  serviceDuration: z.string().optional(),
  serviceType: z.enum(['onetime', 'recurring', 'subscription', 'consultation']).optional(),
  serviceLocation: z.enum(['online', 'onsite', 'office', 'flexible']).optional(),
  // Vehicle-specific fields
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  vehicleMileage: z.string().optional(),
  // Property-specific fields  
  propertyType: z.string().optional(),
  propertySize: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  propertyAge: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVendor, setIsVendor] = useState(false);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [customFields, setCustomFields] = useState<Array<{id: string, name: string, value: string}>>([]);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [hasShownAutoFillNotification, setHasShownAutoFillNotification] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Parse URL parameters for prefill data
  const urlParams = new URLSearchParams(window.location.search);
  const prefillData = urlParams.get('prefill');
  let parsedPrefillData = null;

  if (prefillData) {
    try {
      parsedPrefillData = JSON.parse(decodeURIComponent(prefillData));
    } catch (error) {
      console.error('Error parsing prefill data:', error);
    }
  }

  // State for media uploads
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [uploadedVideo, setUploadedVideo] = useState<{ file: File; preview: string } | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Comprehensive Add Product Page Text Collection for Translation
  const addProductTexts = [
    // Page Headers & Navigation
    "Add Product / Service",
    "Add Product",
    "Add Service", 
    "What are you offering?",
    "Product",
    "Service",
    "Vehicle",
    "Real Estate", 
    "XL/XXL Product",
    "Request Product",
    "Request Service",
    
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
    
    // Marketplace Selection
    "Marketplace",
    "Select marketplace",
    "C2C (Consumer to Consumer)",
    "For individual sellers",
    "B2C (Business to Consumer)", 
    "For businesses selling to consumers",
    "B2B (Business to Business)",
    "For businesses selling to other businesses",
    "Choose which marketplace to list your product on",
    "Media",
    "Upload up to 12 images and 1 video for your product",
    "Product Images",
    "images",
    "Upload Images",
    "Image URLs",
    "Upload images",
    "PNG, JPG, GIF up to 5MB each",
    "Main",
    "Primary Image URL",
    "https://example.com/image.jpg",
    "Provide a URL to your main product image",
    "Additional Image URLs",
    "Image",
    "Add Image URL",
    "Product Video",
    "video",
    "Upload Video",
    "Video URL",
    "Upload video",
    "MP4, MOV, AVI up to 50MB",
    "https://example.com/video.mp4",
    "Provide a URL to your product video",
    "Product Image",
    "Pricing",
    "Price",
    "Compare-at price",
    
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
    
    // Product/Service/Vehicle/Real Estate/XL-XXL Badges
    "Product badges",
    "Service badges",
    "Vehicle badges",
    "Property badges",
    "XL/XXL Product badges",
    
    // Vehicle Details
    "Vehicle Details",
    "Make",
    "Model",
    "Year", 
    "Mileage",
    "e.g., Toyota, BMW",
    "e.g., Camry, X5",
    "e.g., 2020",
    "e.g., 50,000 km",
    
    // Real Estate Details
    "Property Details",
    "Property Type",
    "Size (sq ft/m²)",
    "Bedrooms",
    "Bathrooms", 
    "Age (years)",
    "House",
    "Apartment",
    "Condo",
    "Land",
    "Commercial",
    "e.g., 1200 sq ft",
    "e.g., 3",
    "e.g., 2",
    "e.g., 5",
    
    // Action Buttons
    "Publish",
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
    "g",
    
    // Dimension Units and Placeholders
    "cm",
    "inches",
    "10 × 5 × 2",
    "4 × 2 × 1",
    
    // Shipping Price Types
    "Shipping Price Type",
    "Fixed Shipping Price",
    "Variable Shipping Price",
    "1.5% Dedw3n Shipping Fee will be applied",
    
    // Regional Shipping
    "Regional Shipping",
    "Select regions to ship to and set custom prices",
    "Based on your profile location",
    "Enable shipping to this region",
    
    // Vendor Field
    "Auto-filled from vendor account",
    "Automatically populated based on your vendor account and marketplace selection",
    
    // Upload Button
    "Upload Product",
    "Uploading...",
    "Product Saved & Published",
    "Product saved and published successfully with code:",
    "Your product has been saved and published to the marketplace successfully.",
    "Failed to save and publish product:"
  ];

  // Use Master Translation System for optimal performance and persistence
  const { translations, isLoading: isTranslating } = useMasterBatchTranslation(addProductTexts);

  // Helper function to get translated text
  const t = (text: string): string => {
    if (!translations || Array.isArray(translations)) return text;
    return (translations as Record<string, string>)[text] || text;
  };

  // Helper function to extract all images from prefill data
  const getAutoFilledImages = (): string[] => {
    if (!parsedPrefillData) return [];
    
    const images: string[] = [];
    
    // Add primary image URL
    if (parsedPrefillData.imageUrl && parsedPrefillData.imageUrl !== '/placeholder-image.jpg') {
      images.push(parsedPrefillData.imageUrl);
    }
    
    // Add additional images if they exist in prefill data
    if (parsedPrefillData.images && Array.isArray(parsedPrefillData.images)) {
      parsedPrefillData.images.forEach((img: string) => {
        if (img && img !== '/placeholder-image.jpg' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Add gallery images if they exist
    if (parsedPrefillData.gallery && Array.isArray(parsedPrefillData.gallery)) {
      parsedPrefillData.gallery.forEach((img: string) => {
        if (img && img !== '/placeholder-image.jpg' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Add imageUrls array if it exists
    if (parsedPrefillData.imageUrls && Array.isArray(parsedPrefillData.imageUrls)) {
      parsedPrefillData.imageUrls.forEach((img: string) => {
        if (img && img !== '/placeholder-image.jpg' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    return images.slice(0, 12); // Limit to maximum 12 images
  };

  // Helper function to get count of auto-filled images
  const getAutoFilledImageCount = (): number => {
    return getAutoFilledImages().length;
  };

  // Form initialization with prefill support
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: parsedPrefillData?.name || '',
      description: parsedPrefillData?.description || '',
      price: parsedPrefillData?.price || 0,
      discountPrice: undefined,
      category: parsedPrefillData?.category || '',
      imageUrl: parsedPrefillData?.imageUrl || '',
      inventory: parsedPrefillData?.stock || 1,
      isNew: true,
      isOnSale: false,
      // New Shopify-style field defaults
      status: 'active',
      offeringType: parsedPrefillData?.type || 'product',
      vendor: '',
      collections: [],
      tags: [],
      weight: parsedPrefillData?.weight || undefined,
      weightUnit: 'kg',
      dimensions: '',
      sku: '',
      barcode: '',
      trackQuantity: true,
      continueSellingWhenOutOfStock: false,
      requiresShipping: true,
      marketplace: 'c2c', // Default to C2C
      seoTitle: '',
      seoDescription: '',
      serviceDuration: '',
      serviceType: undefined,
      serviceLocation: undefined,
      vatIncluded: false,
      vatRate: undefined,
      // Vehicle fields
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      vehicleMileage: '',
      // Property fields
      propertyType: '',
      propertySize: '',
      bedrooms: '',
      bathrooms: '',
      propertyAge: '',
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      return await apiRequest('/api/categories');
    },
  });

  // Get user's vendor accounts to determine marketplace availability
  const { data: vendorAccountsData } = useQuery<{vendorAccounts: any[]}>({
    queryKey: ['/api/vendors/user/accounts'],
    enabled: !!user,
  });

  // Determine available marketplaces based on vendor type and offering type
  const getAvailableMarketplaces = () => {
    const offeringType = form.watch('offeringType');
    
    // If request_product or request_service is selected, only show RQST marketplace
    if (offeringType === 'request_product' || offeringType === 'request_service') {
      return [{ value: 'rqst', label: 'RQST (Request)', description: 'For product and service requests' }];
    }
    
    // Safety check for null/undefined data
    if (!vendorAccountsData || !vendorAccountsData.vendorAccounts || !Array.isArray(vendorAccountsData.vendorAccounts)) {
      return [{ value: 'c2c', label: 'C2C (Consumer to Consumer)', description: 'For individual sellers' }];
    }
    
    const vendorAccounts = vendorAccountsData.vendorAccounts;
    const hasPrivateVendor = vendorAccounts.some((account: any) => account.vendorType === 'private');
    const hasBusinessVendor = vendorAccounts.some((account: any) => account.vendorType === 'business');
    
    const marketplaces = [];
    
    if (hasPrivateVendor) {
      marketplaces.push({ value: 'c2c', label: 'C2C (Consumer to Consumer)', description: 'For individual sellers' });
    }
    
    if (hasBusinessVendor) {
      marketplaces.push(
        { value: 'b2c', label: 'B2C (Business to Consumer)', description: 'For businesses selling to consumers' },
        { value: 'b2b', label: 'B2B (Business to Business)', description: 'For businesses selling to other businesses' }
      );
    }
    
    return marketplaces;
  };

  const availableMarketplaces = getAvailableMarketplaces();
  
  // Set default marketplace when available marketplaces change
  useEffect(() => {
    if (availableMarketplaces.length > 0 && !form.getValues('marketplace')) {
      form.setValue('marketplace', availableMarketplaces[0].value as 'c2c' | 'b2c' | 'b2b' | 'raw' | 'rqst');
    }
  }, [availableMarketplaces, form]);

  // Auto-select RQST marketplace when request options are selected
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'offeringType') {
        const offeringType = value.offeringType;
        if (offeringType === 'request_product' || offeringType === 'request_service') {
          form.setValue('marketplace', 'rqst');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-fill vendor name based on marketplace selection
  useEffect(() => {
    if (vendorAccountsData?.vendorAccounts && vendorAccountsData.vendorAccounts.length > 0) {
      const selectedMarketplace = form.getValues('marketplace');
      const vendorAccounts = vendorAccountsData.vendorAccounts;
      
      let targetVendor;
      if (selectedMarketplace === 'c2c') {
        // C2C requires private vendor account
        targetVendor = vendorAccounts.find((account: any) => account.vendorType === 'private');
      } else if (selectedMarketplace === 'b2c' || selectedMarketplace === 'b2b') {
        // B2C and B2B require business vendor account
        targetVendor = vendorAccounts.find((account: any) => account.vendorType === 'business');
      }
      
      // Fallback to first available vendor account
      if (!targetVendor) {
        targetVendor = vendorAccounts[0];
      }
      
      const vendorName = targetVendor?.storeName || targetVendor?.businessName || '';
      if (vendorName) {
        form.setValue('vendor', vendorName);
      }
    }
  }, [vendorAccountsData, form]);

  // Check if user is a vendor
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        return;
      }

      try {
        // Check if user is already a vendor
        const vendors = await apiRequest('/api/vendors');
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

  // Show success message when form is pre-filled from RQST (only once)
  useEffect(() => {
    if (parsedPrefillData && parsedPrefillData.name && !hasShownAutoFillNotification) {
      toast({
        title: "Product Data Auto-Filled",
        description: `Product "${parsedPrefillData.name}" data has been automatically filled with ${getAutoFilledImageCount()} image(s). Review and click Publish to add to your store.`,
        duration: 5000,
      });
      
      setHasShownAutoFillNotification(true);
      
      // Auto-populate ALL image URLs from original request
      const autoFilledImages = getAutoFilledImages();
      if (autoFilledImages.length > 0) {
        setImageUrls(autoFilledImages);
        
        // Update form with primary image URL
        form.setValue('imageUrl', autoFilledImages[0]);
      }
      
      // Auto-populate video URL if provided
      if (parsedPrefillData.videoUrl && parsedPrefillData.videoUrl !== '/placeholder-video.mp4') {
        form.setValue('videoUrl', parsedPrefillData.videoUrl);
      }
    }
  }, [parsedPrefillData, hasShownAutoFillNotification]);

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
      console.log('🚀 Starting product creation with images:', { 
        uploadedImagesCount: uploadedImages.length,
        imageUrl: data.imageUrl 
      });
      
      let finalImageUrl = data.imageUrl;
      
      // If there are uploaded images, upload the first one to server
      if (uploadedImages.length > 0 && uploadedImages[0].file) {
        console.log('📸 Uploading image to server...');
        try {
          // Convert File to base64 for upload
          const file = uploadedImages[0].file;
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const imageData = await base64Promise;
          
          // Upload to server using existing image upload API
          const uploadResponse = await fetch('/api/image/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData,
              imageType: 'product'
            }),
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          console.log('✅ Image uploaded successfully:', uploadResult);
          
          // Use the uploaded image URL
          finalImageUrl = uploadResult.imageUrl;
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          // Use fallback image if upload fails
          finalImageUrl = '/attached_assets/D3 black logo.png';
        }
      }
      
      // Transform frontend field names to backend expected field names
      const backendData = {
        ...data,
        name: data.name, // Use the correct 'name' field from schema
        // Use uploaded image URL or fallback
        imageUrl: finalImageUrl || '/attached_assets/D3 black logo.png',
        // All fields properly mapped from schema
      };
      
      console.log('💾 Sending product data to backend:', backendData);
      const response = await apiRequest('POST', '/api/vendors/products', backendData);
      return response.json();
    },
    onSuccess: (data) => {
      // Update form with the generated product code if available
      if (data.productCode) {
        form.setValue('productCode', data.productCode);
      }
      
      // Invalidate products query
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      
      // Store success data and show modal
      setSuccessData(data);
      setShowSuccessDialog(true);
    },
    onError: (error: any) => {
      // Show error popup with detailed information
      const errorMessage = error.message || 'Unknown error occurred';
      
      toast({
        title: t('❌ Upload Failed'),
        description: `${t('Failed to publish product:')} ${errorMessage}`,
        variant: 'destructive',
        duration: 8000,
      });
      
      // Show detailed error alert dialog
      alert(`❌ UPLOAD FAILED!\n\nError Details: ${errorMessage}\n\nPlease check:\n• All required fields are filled\n• Valid image URL or upload\n• Internet connection\n• Try again or contact support`);
      
      console.error('Product upload error:', error);
    },
  });

  // Add custom field handler
  const addCustomField = () => {
    const newField = {
      id: `custom_${Date.now()}`,
      name: '',
      value: ''
    };
    setCustomFields(prev => [...prev, newField]);
  };

  // Remove custom field handler
  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  // Update custom field handler
  const updateCustomField = (id: string, field: 'name' | 'value', newValue: string) => {
    setCustomFields(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: newValue } : f
    ));
  };

  // Media upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: Array<{ file: File; preview: string }> = [];
    const remainingSlots = 12 - uploadedImages.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview });
      }
    }

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
    }

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const imageToRemove = prev[index];
      URL.revokeObjectURL(imageToRemove.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/') && file.size <= 50 * 1024 * 1024) { // 50MB limit
      if (uploadedVideo) {
        URL.revokeObjectURL(uploadedVideo.preview);
      }
      const preview = URL.createObjectURL(file);
      setUploadedVideo({ file, preview });
    }

    // Reset input
    e.target.value = '';
  };

  const removeVideo = () => {
    if (uploadedVideo) {
      URL.revokeObjectURL(uploadedVideo.preview);
      setUploadedVideo(null);
    }
  };

  // Image URL handlers
  const addImageUrl = () => {
    setImageUrls(prev => [...prev, '']);
  };

  const updateImageUrl = (index: number, url: string) => {
    setImageUrls(prev => prev.map((u, i) => i === index ? url : u));
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      // Cleanup image previews
      uploadedImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
      // Cleanup video preview
      if (uploadedVideo) {
        URL.revokeObjectURL(uploadedVideo.preview);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
      if (uploadedVideo) {
        URL.revokeObjectURL(uploadedVideo.preview);
      }
    };
  }, [uploadedImages, uploadedVideo]);

  // On form submit
  const onSubmit = (values: ProductFormValues) => {
    console.log('🚀 Form submission started!', values);
    console.log('📸 Images to process:', {
      uploadedImagesCount: uploadedImages.length,
      imageUrl: values.imageUrl,
      firstImageFile: uploadedImages[0]?.file?.name || 'none'
    });
    console.log('🔍 Vendor status check:', { 
      isVendor, 
      userIsVendor: user?.isVendor, 
      vendorAccountsData: vendorAccountsData,
      hasVendorAccounts: vendorAccountsData?.vendorAccounts?.length > 0 
    });
    
    // Check if user has vendor accounts from the API response
    if (!vendorAccountsData?.vendorAccounts?.length) {
      console.log('❌ No vendor accounts found, showing error');
      toast({
        title: t('Error'),
        description: t('You need to create a vendor account first.'),
        variant: 'destructive',
      });
      return;
    }
    
    // Add custom fields to submission data
    const submitData = {
      ...values,
      customFields: customFields.filter(field => field.name && field.value)
    };
    
    // If user has isVendor but no vendorId, we'll handle this on the server side
    // The server will create a temporary vendor profile if needed
    createProductMutation.mutate(submitData);
  };

  // Handle vendor creation
  const handleCreateVendor = () => {
    setShowVendorDialog(true);
  };

  const handleVendorSubmit = (data: { storeName: string; description: string }) => {
    createVendorMutation.mutate(data);
    setShowVendorDialog(false);
  };

  // Handle success dialog confirmation
  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    if (successData?.id) {
      setLocation(`/product/${successData.id}`);
    }
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

      {/* Pre-filled Data Indicator */}
      {parsedPrefillData && parsedPrefillData.name && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Product Data Auto-Filled from RQST
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Product "{parsedPrefillData.name}" has been automatically filled. Review the details below and click Publish to add to your store.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Offering Type Selection */}
          <div className="mb-6">
            <FormField
              control={form.control}
              name="offeringType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t("What are you offering/requesting ?")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-3 gap-4"
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
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vehicle" id="vehicle" />
                        <label htmlFor="vehicle" className="text-sm font-medium cursor-pointer">
                          {t("Vehicle")}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="real_estate" id="real_estate" />
                        <label htmlFor="real_estate" className="text-sm font-medium cursor-pointer">
                          {t("Real Estate")}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="xl_xxl_product" id="xl_xxl_product" />
                        <label htmlFor="xl_xxl_product" className="text-sm font-medium cursor-pointer">
                          {t("XL/XXL Product")}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="request_product" id="request_product" />
                        <label htmlFor="request_product" className="text-sm font-medium cursor-pointer">
                          {t("Request Product")}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="request_service" id="request_service" />
                        <label htmlFor="request_service" className="text-sm font-medium cursor-pointer">
                          {t("Request Service")}
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
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
                  
                  <FormField
                    control={form.control}
                    name="marketplace"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>{t("Marketplace")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select marketplace")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableMarketplaces.map((marketplace) => (
                              <SelectItem key={marketplace.value} value={marketplace.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{t(marketplace.label)}</span>
                                  <span className="text-sm text-muted-foreground">{t(marketplace.description)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("Choose which marketplace to list your product on")}
                        </FormDescription>
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
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("Upload up to 12 images and 1 video for your product")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{t("Product Images")}</h3>
                      <span className="text-sm text-muted-foreground">
                        {uploadedImages.length}/12 {t("images")}
                      </span>
                    </div>
                    
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">{t("Upload Images")}</TabsTrigger>
                        <TabsTrigger value="url">{t("Image URLs")}</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload" className="space-y-4">
                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label htmlFor="image-upload" className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  {t("Upload images")}
                                </span>
                                <span className="mt-1 block text-sm text-gray-500">
                                  {t("PNG, JPG, GIF up to 5MB each")}
                                </span>
                              </label>
                              <input
                                id="image-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploadedImages.length >= 12}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Uploaded Images Grid */}
                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image.preview}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                  {index === 0 ? t("Main") : `${index + 1}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="url" className="space-y-4">
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Primary Image URL")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("https://example.com/image.jpg")} {...field} />
                              </FormControl>
                              <FormDescription>
                                {t("Provide a URL to your main product image")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Additional Image URLs */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">{t("Additional Image URLs")}</Label>
                          {imageUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`${t("Image")} ${index + 2} URL`}
                                value={url}
                                onChange={(e) => updateImageUrl(index, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeImageUrl(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {imageUrls.length < 11 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addImageUrl}
                              className="w-full"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {t("Add Image URL")}
                            </Button>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  {/* Video Upload Section */}
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{t("Product Video")}</h3>
                      <span className="text-sm text-muted-foreground">
                        {uploadedVideo ? "1/1" : "0/1"} {t("video")}
                      </span>
                    </div>
                    
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">{t("Upload Video")}</TabsTrigger>
                        <TabsTrigger value="url">{t("Video URL")}</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload" className="space-y-4">
                        {!uploadedVideo ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center">
                              <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <label htmlFor="video-upload" className="cursor-pointer">
                                  <span className="mt-2 block text-sm font-medium text-gray-900">
                                    {t("Upload video")}
                                  </span>
                                  <span className="mt-1 block text-sm text-gray-500">
                                    {t("MP4, MOV, AVI up to 50MB")}
                                  </span>
                                </label>
                                <input
                                  id="video-upload"
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={handleVideoUpload}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <video
                              src={uploadedVideo.preview}
                              className="w-full h-48 object-cover rounded-lg border"
                              controls
                            />
                            <button
                              type="button"
                              onClick={removeVideo}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="url" className="space-y-4">
                        <FormField
                          control={form.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Video URL")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("https://example.com/video.mp4")} {...field} />
                              </FormControl>
                              <FormDescription>
                                {t("Provide a URL to your product video")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
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
                    name="vatIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("VAT included in price")}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t("Enable to include VAT/tax")}
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
                  
                  {form.watch('vatIncluded') && (
                    <FormField
                      control={form.control}
                      name="vatRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("VAT Rate (%)")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="20.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            {t("Standard UK VAT rate is 20%")}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                </CardContent>
              </Card>

              {/* Inventory Section - Only show for products, vehicles, and XL/XXL products */}
              {(form.watch('offeringType') === 'product' || form.watch('offeringType') === 'vehicle' || form.watch('offeringType') === 'xl_xxl_product') && (
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

              {/* Shipping Section - Only show for products, vehicles, and XL/XXL products */}
              {(form.watch('offeringType') === 'product' || form.watch('offeringType') === 'vehicle' || form.watch('offeringType') === 'xl_xxl_product') && (
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
                                    step="0.001"
                                    min="0"
                                    max="999.999"
                                    placeholder="0.000" 
                                    {...field} 
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '') {
                                        field.onChange(undefined);
                                      } else {
                                        const numValue = parseFloat(value);
                                        // Allow up to 3 decimal places (0.999 max for grams)
                                        const roundedValue = Math.round(numValue * 1000) / 1000;
                                        field.onChange(roundedValue);
                                      }
                                    }}
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
                        <div className="grid grid-cols-2 gap-4">
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

                        </div>
                        
                      <Button type="button" variant="outline" className="w-full" onClick={addCustomField}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("Add customs information")}
                      </Button>
                      
                      {/* Display custom fields */}
                      {customFields.length > 0 && (
                        <div className="space-y-3 mt-4">
                          {customFields.map((field) => (
                            <div key={field.id} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                              <Input
                                placeholder="Field name"
                                value={field.name}
                                onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Field value"
                                  value={field.value}
                                  onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCustomField(field.id)}
                                  className="px-3"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}
              
              {/* Variants - Only show for products, vehicles, and XL/XXL products */}
              {(form.watch('offeringType') === 'product' || form.watch('offeringType') === 'vehicle' || form.watch('offeringType') === 'xl_xxl_product') && (
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

              {/* Vehicle-specific fields */}
              {form.watch('offeringType') === 'vehicle' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("Vehicle Details")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleMake"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Make")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., Toyota, BMW")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicleModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Model")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., Camry, X5")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Year")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 2020")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicleMileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Mileage")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 50,000 km")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Real Estate-specific fields */}
              {form.watch('offeringType') === 'real_estate' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("Property Details")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="propertyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Property Type")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="house">{t("House")}</SelectItem>
                                <SelectItem value="apartment">{t("Apartment")}</SelectItem>
                                <SelectItem value="condo">{t("Condo")}</SelectItem>
                                <SelectItem value="land">{t("Land")}</SelectItem>
                                <SelectItem value="commercial">{t("Commercial")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="propertySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Size (sq ft/m²)")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 1200 sq ft")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Bedrooms")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 3")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Bathrooms")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 2")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="propertyAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Age (years)")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 5")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                            {categories.map((category: {id: number, name: string}) => (
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
                          <Input 
                            placeholder={t("Auto-filled from vendor account")} 
                            {...field}
                            disabled
                            className="bg-gray-50 cursor-not-allowed"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("Automatically populated based on your vendor account and marketplace selection")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
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
                <CardTitle>
                  {form.watch('offeringType') === 'service' ? t('Service badges') : 
                   form.watch('offeringType') === 'vehicle' ? t('Vehicle badges') :
                   form.watch('offeringType') === 'real_estate' ? t('Property badges') :
                   form.watch('offeringType') === 'xl_xxl_product' ? t('XL/XXL Product badges') : t('Product badges')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => {
                    const isService = form.watch('offeringType') === 'service';
                    return (
                      <FormItem className={`flex flex-row items-center justify-between ${isService ? 'opacity-50' : ''}`}>
                        <div className="space-y-0.5">
                          <FormLabel className={`text-sm font-normal ${isService ? 'text-gray-400' : ''}`}>
                            {form.watch('offeringType') === 'vehicle' ? 'New Vehicle' : 
                             form.watch('offeringType') === 'real_estate' ? 'New Property' :
                             form.watch('offeringType') === 'xl_xxl_product' ? 'New XL/XXL Product' : 'New Product'}
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={isService ? undefined : field.onChange}
                            disabled={isService}
                            className={isService ? 'cursor-not-allowed' : ''}
                          />
                        </FormControl>
                      </FormItem>
                    );
                  }}
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
                        Save changes to automatically generate a unique product code. Format: {"{productCount}"}{"{userId}"}{"{day}"}{"{month}"}{"{year}"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            </div>
          </div>
          
          {/* Publish Button */}
          <div className="flex justify-center mt-8">
            <Button 
              type="submit" 
              disabled={createProductMutation.isPending} 
              className="w-full max-w-md bg-black hover:bg-gray-800 text-white"
              onClick={(e) => {
                console.log('🔘 Publish button clicked!', e);
                console.log('📊 Form state:', form.formState);
                console.log('📝 Form values:', form.getValues());
                console.log('❌ Form errors:', form.formState.errors);
              }}
            >
              {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createProductMutation.isPending ? t("Publishing...") : t("Publish")}
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Vendor Creation Dialog */}
      <VendorCreationDialog
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
        onSubmit={handleVendorSubmit}
        isLoading={createVendorMutation.isPending}
      />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-green-600 text-center">
              SUCCESS!
            </DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <p className="text-lg font-medium">
                Your product "{successData?.name || form.getValues('name')}" has been published!
              </p>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p><strong>Product Code:</strong> {successData?.productCode || 'Generated'}</p>
                <p><strong>Marketplace:</strong> {successData?.marketplace?.toUpperCase() || 'C2C'}</p>
              </div>
              <p className="text-gray-600">
                Redirecting to product page...
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={handleSuccessConfirm}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}