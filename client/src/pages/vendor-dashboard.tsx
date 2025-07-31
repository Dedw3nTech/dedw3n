import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Users, 
  Truck, 
  Settings, 
  Store,
  Loader2,
  PlusCircle,
  DollarSign,
  ShoppingCart,
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  Building
} from "lucide-react";

import VendorCommissionDashboard from "@/components/vendor/VendorCommissionDashboard";
import VendorProductManagement from "@/components/vendor/VendorProductManagement";
import VendorOrderManagement from "@/components/vendor/VendorOrderManagement";
import VendorSettings from "@/components/vendor/VendorSettings";
import { DeleteStoreModal } from "@/components/ui/delete-store-modal";

export default function VendorDashboard() {
  // Master Translation mega-batch for Vendor Dashboard (60+ texts)
  const vendorTexts = useMemo(() => [
    // Dashboard Navigation (8 texts)
    "Dashboard", "Products", "Orders", "Customers", "Shipping", "Analytics", "Settings", "Marketing",
    
    // Overview Section (12 texts)
    "Overview", "Total Sales", "Active Products", "Pending Orders", "Total Customers", "Revenue This Month",
    "Sales Analytics", "Performance Metrics", "Growth Rate", "Conversion Rate", "Average Order Value", "Customer Satisfaction",
    
    // Product Management (16 texts)
    "Product Management", "Add New Product", "Edit Product", "Delete Product", "View Details", "Product Status",
    "In Stock", "Out of Stock", "Low Stock", "Draft", "Published", "Featured", "On Sale", "Product Categories", "Inventory", "Pricing",
    
    // Order Management (12 texts)
    "Order Management", "Recent Orders", "Order Status", "Pending", "Processing", "Shipped", "Delivered", "Cancelled",
    "View Order", "Update Status", "Print Invoice", "Track Shipment",
    
    // Customer Management (8 texts)
    "Customer Management", "Customer List", "Customer Details", "Order History", "Customer Reviews", "Contact Customer", "Customer Support", "VIP Customers",
    
    // Analytics & Reports (12 texts)
    "Sales Reports", "Performance Analytics", "Revenue Charts", "Product Performance", "Customer Insights", "Traffic Analysis",
    "Export Data", "Monthly Report", "Yearly Report", "Real-time Data", "Dashboard Widgets", "Custom Reports",
    
    // Store Management (4 texts)
    "Add Product", "Delete Store", "Deleting...", "Using Private Vendor account", "Using Business Vendor account",
    
    // Delete Store Modal (8 texts) 
    "Delete Store Confirmation", "Are you sure you want to permanently delete your", "vendor store?",
    "This action cannot be undone. All your products and data will be permanently removed.",
    "private", "business", "Cancel", "Delete Store",
    
    // Business Store Button (1 text)
    "Open Business Store"
  ], []);

  // All hooks must be called at the top level, before any conditional logic
  const { user } = useAuth();
  const { formatPriceFromGBP } = useCurrency();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("products");
  const [isDeletingStore, setIsDeletingStore] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [discountFormOpen, setDiscountFormOpen] = useState(false);
  const [discountFormType, setDiscountFormType] = useState<"discount-code" | "automatic">("discount-code");

  const { translations: translatedTexts, isLoading } = useMasterBatchTranslation(vendorTexts);
  
  // Fetch vendor profile only if user is authenticated
  const { data: vendorData, isLoading: isLoadingVendor, error: vendorError } = useQuery({
    queryKey: ["/api/vendors/me"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/me");
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        if (response.status === 401) {
          setLocation('/');
          return null;
        }
        throw new Error("Failed to fetch vendor profile");
      }
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const vendor = vendorData?.vendor;

  // Fetch summary data
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/vendors/summary"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/summary");
      if (!response.ok) {
        throw new Error("Failed to fetch summary data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Create unified vendor management mutation
  const createBusinessVendorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/vendors/manage", {
        action: "create-business"
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectTo) {
        setLocation(data.redirectTo);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create business vendor account",
        variant: "destructive"
      });
    }
  });

  // Delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/vendors/store");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Store Deleted",
        description: "Your vendor store has been permanently closed and deleted.",
        variant: "default"
      });
      // Redirect to home page after successful deletion
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete store",
        variant: "destructive"
      });
    }
  });

  // Handle delete store with confirmation
  const handleDeleteStore = () => {
    if (!vendor) return;
    setShowDeleteModal(true);
  };

  // Handle confirmed delete store
  const handleConfirmDeleteStore = async () => {
    setShowDeleteModal(false);
    setIsDeletingStore(true);
    try {
      await deleteStoreMutation.mutateAsync();
    } finally {
      setIsDeletingStore(false);
    }
  };

  // Handle opening business store (redirect to business vendor registration)
  const handleOpenBusinessStore = () => {
    setLocation('/become-vendor?type=business');
  };

  // Set vendor ID when data is loaded
  useEffect(() => {
    if (vendor?.id) {
      setVendorId(vendor.id);
    }
  }, [vendor]);
  
  // Authentication wall - redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);
  
  const finalTexts = translatedTexts || vendorTexts;
  
  // Extract translations with proper indexing
  const dashboardText = finalTexts[0] || "Dashboard";
  const productsText = finalTexts[1] || "Products";
  const ordersText = finalTexts[2] || "Orders";
  const customersText = finalTexts[3] || "Customers";
  const shippingText = finalTexts[4] || "Shipping";
  const analyticsText = finalTexts[5] || "Analytics";
  const settingsText = finalTexts[6] || "Settings";
  const marketingText = finalTexts[7] || "Marketing";

  // Helper function to get translated text with proper typing
  const t = (text: string): string => {
    if (Array.isArray(translatedTexts)) {
      const index = vendorTexts.indexOf(text);
      return index !== -1 ? translatedTexts[index] || text : text;
    }
    return text;
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading translations...</div>;
  }

  // Show loading screen while checking authentication
  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>{t("Vendor Dashboard")}</CardTitle>
            <CardDescription>
              {t("Please log in to access your vendor dashboard")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              {t("You need to be authenticated to access vendor features and manage your store.")}
            </p>
            <Button onClick={() => setLocation('/')}>
              {t("Go to Login")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle becoming a vendor
  const handleBecomeVendor = () => {
    setLocation('/become-vendor');
  };

  // Handle business vendor creation
  const handleCreateBusinessVendor = () => {
    createBusinessVendorMutation.mutate();
  };

  // Show loading while vendor data is being fetched
  if (isLoadingVendor) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>{t("Loading Vendor Dashboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {t("Verifying your vendor access...")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle vendor authentication errors
  if (vendorError) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>Vendor Access Error</CardTitle>
            <CardDescription>
              Failed to verify your vendor status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              There was an error checking your vendor account. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not a vendor yet - show registration options
  if (!vendor) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4">
        <div className="text-center mb-8">
          <Store className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Become a Vendor</h1>
          <p className="text-lg text-muted-foreground">
            Start selling your products on our marketplace
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Private Vendor
              </CardTitle>
              <CardDescription>
                Perfect for individuals selling personal items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Sell personal items</li>
                <li>• Simple setup process</li>
                <li>• Basic analytics</li>
                <li>• 10% commission</li>
              </ul>
              <Button onClick={handleBecomeVendor} className="w-full">
                Become Private Vendor
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Business Vendor
              </CardTitle>
              <CardDescription>
                For businesses and professional sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Advanced store management</li>
                <li>• Bulk product uploads</li>
                <li>• Detailed analytics</li>
                <li>• Promotional tools</li>
              </ul>
              <Button 
                onClick={handleCreateBusinessVendor}
                disabled={createBusinessVendorMutation.isPending}
                className="w-full"
              >
                {createBusinessVendorMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Business Vendor"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{dashboardText}</h1>
          <p className="text-muted-foreground">
            {vendor.vendorType === 'private' ? t("Using Private Vendor account") : t("Using Business Vendor account")}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Show Open Business Store button only for private vendors */}
          {vendor.vendorType === 'private' && (
            <Button 
              variant="outline" 
              onClick={handleOpenBusinessStore}
              className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            >
              <Building className="mr-2 h-4 w-4" />
              {t("Open Business Store")}
            </Button>
          )}
          <Button 
            variant="destructive" 
            onClick={handleDeleteStore}
            disabled={isDeletingStore}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeletingStore ? t("Deleting...") : t("Delete Store")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Total Products")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? "..." : summary?.totalProducts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Total Orders")}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? "..." : summary?.totalOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Total Revenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? "..." : formatPriceFromGBP(summary?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Pending Orders")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? "..." : summary?.pendingOrders || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            {productsText}
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Truck className="mr-2 h-4 w-4" />
            {t("Shipping & Orders")}
          </TabsTrigger>
          <TabsTrigger value="commission">
            <DollarSign className="mr-2 h-4 w-4" />
            {t("Commission")}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            {settingsText}
          </TabsTrigger>
        </TabsList>



        <TabsContent value="products">
          <VendorProductManagement vendorId={vendorId!} />
        </TabsContent>

        <TabsContent value="orders">
          <VendorOrderManagement vendorId={vendorId!} />
        </TabsContent>



        <TabsContent value="commission">
          <VendorCommissionDashboard vendorId={vendorId!} />
        </TabsContent>

        <TabsContent value="settings">
          <VendorSettings vendorId={vendorId!} />
        </TabsContent>
      </Tabs>

      {/* Delete Store Modal */}
      <DeleteStoreModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteStore}
        vendorType={vendor?.vendorType || 'private'}
        isDeleting={isDeletingStore}
      />
    </div>
  );
}