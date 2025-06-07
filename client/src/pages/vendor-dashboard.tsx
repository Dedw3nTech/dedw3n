import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedBatchTranslation } from "@/hooks/use-unified-translation";
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
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  Settings, 
  BarChart,
  Store,
  Loader2,
  PlusCircle,
  TrendingUp,
  Tag,
  Megaphone,
  DollarSign
} from "lucide-react";

// Import vendor components
import ProductsList from "@/components/vendor/ProductsList";
import OrdersList from "@/components/vendor/OrdersList";
import CustomersList from "@/components/vendor/CustomersList";
import ShippingManager from "@/components/vendor/ShippingManager";
import StoreSettingsForm from "@/components/vendor/StoreSettingsForm";
import VendorAnalytics from "@/components/vendor/VendorAnalytics";
import { VendorPaymentInfo } from "@/components/vendor/VendorPaymentInfo";
import { VendorBadge } from "@/components/vendor/VendorBadge";
import { BadgeProgress } from "@/components/vendor/BadgeProgress";
import { calculateBadgeLevel } from "@/lib/vendor-badges";
import DiscountForm from "@/components/vendor/DiscountForm";
import DiscountList from "@/components/vendor/DiscountList";
import MarketingCampaigns from "@/components/vendor/MarketingCampaigns";
import VendorCommissionDashboard from "@/components/vendor/VendorCommissionDashboard";

export default function VendorDashboard() {
  const { user } = useAuth();
  const { formatPriceFromGBP } = useCurrency();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [discountFormOpen, setDiscountFormOpen] = useState(false);
  const [discountFormType, setDiscountFormType] = useState<"discount-code" | "automatic">("discount-code");

  // Comprehensive Vendor Dashboard Text Collection for Translation
  const vendorTexts = [
    // Main Navigation & Headers
    "Vendor Dashboard",
    "Dashboard",
    "Products",
    "Customers", 
    "Shipping",
    "Marketing",
    "Settings",
    "Analytics",
    "Payment Info",
    "Promotions",
    "Commission",
    "Overview",
    "Orders",
    
    // Authentication & Access
    "Loading Vendor Dashboard",
    "Verifying your vendor access...",
    "Please log in to access your vendor dashboard",
    "You need to be authenticated to access vendor features and manage your store.",
    "Go to Login",
    
    // Vendor Onboarding
    "Become a Vendor",
    "Start Selling on Our Platform", 
    "Join thousands of successful vendors and grow your business with us.",
    "Reach New Customers",
    "Connect with buyers from around the world and expand your market reach.",
    "Easy Management",
    "Manage your products, orders, and customers with our intuitive dashboard.",
    "Secure Payments",
    "Get paid securely and on time with our integrated payment system.",
    "Grow Your Business",
    "Access analytics and tools to help your business grow.",
    
    // Status Messages
    "Your vendor account is active. Here are some options to get started.",
    "Your vendor profile is being set up. Here are some things you can do now:",
    "Using Private Vendor account",
    "Using Business Vendor account",
    
    // Action Buttons
    "Add Your First Product",
    "Start selling by adding your first product to your store.",
    "Add Product",
    "View Dashboard", 
    "View your dashboard to track sales and performance.",
    "Create Business Vendor",
    "Creating...",
    "Create Discount",
    "Automatic Discount", 
    "Discount Code",
    
    // Settings Tab Content
    "Store Settings",
    "Manage your store information and preferences",
    "Store Name",
    "Enter your store name",
    "Store Description", 
    "Describe your store",
    "Store Address",
    "Enter your store address",
    "City",
    "Enter city",
    "Country",
    "Select country",
    "Contact Email",
    "Enter contact email",
    "Contact Phone",
    "Enter contact phone",
    "Business Registration Number",
    "Enter registration number",
    "Tax ID",
    "Enter tax ID",
    "Store Type",
    "Select store type",
    "Private Vendor",
    "Business Vendor",
    "Save Settings",
    "Saving...",
    "Settings saved successfully",
    "Failed to save settings",
    
    // Analytics & Performance
    "Sales Analytics",
    "Performance Metrics",
    "Revenue",
    "Total Sales",
    "Orders Count",
    "Customer Growth",
    "Monthly Revenue",
    "Weekly Sales",
    "Top Products",
    "Recent Orders",
    "Customer Reviews",
    "Inventory Status",
    
    // Product Management
    "Product Management",
    "Add New Product",
    "Edit Product",
    "Delete Product",
    "Product Details",
    "Product Images",
    "Product Categories",
    "Inventory Management",
    "Stock Level",
    "Price Management",
    "Product Status",
    "Active",
    "Inactive",
    "Out of Stock",
    
    // Order Management
    "Order Management",
    "New Orders",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Refunded",
    "Order Details",
    "Order History",
    "Track Shipment",
    
    // Customer Management
    "Customer Management",
    "Customer List",
    "Customer Details",
    "Customer Orders",
    "Customer Reviews",
    "Customer Support",
    "Contact Customer",
    
    // Shipping & Logistics
    "Shipping Management",
    "Shipping Methods",
    "Shipping Rates",
    "Delivery Options",
    "Tracking Information",
    "Shipping Labels",
    "Delivery Status",
    
    // Marketing & Promotions
    "Marketing Campaigns",
    "Promotional Offers",
    "Discount Management",
    "Coupon Codes",
    "Marketing Analytics",
    "Campaign Performance",
    "Social Media Integration",
    "Email Marketing",
    
    // Financial Management
    "Payment Management",
    "Revenue Reports",
    "Transaction History",
    "Payout Information",
    "Commission Structure",
    "Tax Reports",
    "Financial Analytics",
    
    // Store Configuration
    "Store Configuration",
    "Business Hours",
    "Return Policy",
    "Shipping Policy",
    "Terms of Service",
    "Privacy Policy",
    "Store Policies",
    
    // Notifications & Alerts
    "Notifications",
    "Order Alerts",
    "Inventory Alerts",
    "Customer Messages",
    "System Notifications",
    "Email Preferences",
    
    // Help & Support
    "Help & Support",
    "Documentation",
    "Video Tutorials",
    "Contact Support",
    "FAQ",
    "Community Forum",
    
    // Status Indicators
    "Online",
    "Offline",
    "Pending",
    "Approved",
    "Rejected",
    "Under Review",
    "Published",
    "Draft",
    
    // Common Actions
    "Save",
    "Cancel",
    "Delete",
    "Edit",
    "View",
    "Export",
    "Import",
    "Download",
    "Upload",
    "Search",
    "Filter",
    "Sort",
    "Refresh",
    "Print",
    "Share",
    
    // Time & Date
    "Today",
    "Yesterday", 
    "This Week",
    "This Month",
    "Last Month",
    "This Year",
    "Custom Range",
    
    // Error Messages
    "Error loading data",
    "Failed to save",
    "Access denied",
    "Invalid input",
    "Network error",
    "Please try again",
    
    // Success Messages
    "Successfully saved",
    "Operation completed",
    "Data updated",
    "Changes applied",
    "Your Store Performance",
    "Monthly Revenue",
    "Total Orders",
    "Products Sold",
    "Store Performance",
    "Sales Overview",
    "Vendor Type"
  ];

  // Initialize unified translation system for all vendor dashboard texts
  const { translations, isLoading: isTranslating } = useUnifiedBatchTranslation(vendorTexts, 'instant');
  
  // Authentication wall - redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);
  
  // Fetch vendor profile only if user is authenticated
  const { data: vendorData, isLoading: isLoadingVendor, error: vendorError } = useQuery({
    queryKey: ["/api/vendors/me"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/me");
      if (!response.ok) {
        if (response.status === 404) {
          // Not a vendor yet
          return null;
        }
        if (response.status === 401) {
          // Unauthorized - redirect to login
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

  // Set vendor ID when data is loaded
  useEffect(() => {
    if (vendor?.id) {
      setVendorId(vendor.id);
    }
  }, [vendor]);

  // Show loading screen while checking authentication
  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>{translations["Vendor Dashboard"] || "Vendor Dashboard"}</CardTitle>
            <CardDescription>
              {translations["Please log in to access your vendor dashboard"] || "Please log in to access your vendor dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              {translations["You need to be authenticated to access vendor features and manage your store."] || "You need to be authenticated to access vendor features and manage your store."}
            </p>
            <Button onClick={() => setLocation('/')}>
              {translations["Go to Login"] || "Go to Login"}
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

  // Handle business vendor creation
  const handleCreateBusinessVendor = () => {
    createBusinessVendorMutation.mutate();
  };

  // Show loading while vendor data is being fetched
  if (isLoadingVendor || isTranslating) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>{translations["Loading Vendor Dashboard"] || "Loading Vendor Dashboard"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {translations["Verifying your vendor access..."] || "Verifying your vendor access..."}
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
        <Card className="border-none">
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>Vendor Account Not Found</CardTitle>
            <CardDescription>
              Unable to verify vendor access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              To create your vendor profile, please{' '}
              <span 
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => setLocation('/vendor-register')}
              >
                click here
              </span>
              . If you encounter an error while having a vendor account, please attempt to log in again. Should the issue persist, do not hesitate to contact support for assistance.{' '}
              <span 
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => setLocation('/contact')}
              >
                Contact Us
              </span>
            </p>
            <div className="space-y-2">
              <Button onClick={() => setLocation('/vendor-register')} className="bg-black text-white hover:bg-gray-800">
                Register as Vendor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is a vendor based on the user object's isVendor flag
  const isUserVendor = user && user.isVendor === true;

  // Not a vendor yet - but allow direct product listing if user.isVendor is true even if vendor profile is missing
  if (!isLoadingVendor && !vendor && !isUserVendor) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="text-2xl">Become a Vendor</CardTitle>
            <CardDescription>
              Start selling your products on our marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <Store className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Create Your Store</CardTitle>
                </CardHeader>
                <CardContent>
                  Set up your own branded storefront with custom logo and description.
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <Package className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Sell Your Products</CardTitle>
                </CardHeader>
                <CardContent>
                  List and sell your products to customers around the world.
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <BarChart className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Grow Your Business</CardTitle>
                </CardHeader>
                <CardContent>
                  Access analytics and tools to help your business grow.
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button size="lg" onClick={handleBecomeVendor}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Become a Vendor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If user is a vendor but doesn't have a vendor profile yet, show simplified dashboard with multiple options
  if (!isLoadingVendor && !vendor && isUserVendor) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="text-2xl">Vendor Dashboard</CardTitle>
            <CardDescription>
              Your vendor account is active. Here are some options to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p>Your vendor profile is being set up. Here are some things you can do now:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Add Your First Product</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      Start selling by adding your first product to your store.
                    </p>
                    <Button onClick={() => setLocation('/add-product')}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">View Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      View your dashboard to track sales and performance.
                    </p>
                    <Button variant="outline" onClick={() => setLocation('/vendor-dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Navigation Tabs - Top of Page */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-6 gap-1 p-1 bg-black text-white">
          <TabsTrigger value="dashboard" className="flex items-center justify-center px-3 py-2 text-sm text-white data-[state=active]:text-black data-[state=active]:bg-white">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            {translations["Dashboard"] || "Dashboard"}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center justify-center px-3 py-2 text-sm text-white data-[state=active]:text-black data-[state=active]:bg-white">
            <Package className="h-4 w-4 mr-2" />
            {translations["Products"] || "Products"}
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center justify-center px-3 py-2 text-sm text-white data-[state=active]:text-black data-[state=active]:bg-white">
            <Users className="h-4 w-4 mr-2" />
            {translations["Customers"] || "Customers"}
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center justify-center px-3 py-2 text-sm text-white data-[state=active]:text-black data-[state=active]:bg-white">
            <Truck className="h-4 w-4 mr-2" />
            {translations["Shipping"] || "Shipping"}
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center justify-center px-3 py-2 text-sm text-white data-[state=active]:text-black data-[state=active]:bg-white">
            <Megaphone className="h-4 w-4 mr-2" />
            {translations["Marketing"] || "Marketing"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center px-3 py-2 text-sm text-white data-[state=active]:text-black data-[state=active]:bg-white">
            <Settings className="h-4 w-4 mr-2" />
            {translations["Settings"] || "Settings"}
          </TabsTrigger>

        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-4">
          <div className="mb-4">
            <div className="font-medium text-xl flex items-center">
              <Store className="mr-2 h-5 w-5" />
              {vendor?.storeName || translations["Vendor Dashboard"] || "Vendor Dashboard"}
            </div>
            <div className="text-sm text-muted-foreground">
              {user?.username || ""}
            </div>
          </div>

          {/* Vendor Badge Display */}
          {vendor && (
            <div className="mt-3 space-y-2">
              <VendorBadge 
                level={calculateBadgeLevel(
                  vendor.totalSalesAmount || 0, 
                  vendor.totalTransactions || 0
                )}
                size="md"
                showTooltip={true}
                className="mb-2"
              />
              <BadgeProgress
                currentLevel={calculateBadgeLevel(
                  vendor.totalSalesAmount || 0, 
                  vendor.totalTransactions || 0
                )}
                totalSales={vendor.totalSalesAmount || 0}
                totalTransactions={vendor.totalTransactions || 0}
                className="text-xs"
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dashboard" className="mt-0 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                {vendor && (
                  <p className="text-blue-600 text-xs font-normal mt-1">
                    Using {vendor.vendorType === 'private' ? 'Private Vendor' : 'Business Vendor'} account
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleCreateBusinessVendor} 
                  className="bg-black text-white hover:bg-gray-800"
                  disabled={createBusinessVendorMutation.isPending}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createBusinessVendorMutation.isPending ? "Creating..." : "Create Business Vendor"}
                </Button>
                <Button onClick={() => setLocation('/add-product')} className="bg-black text-white hover:bg-gray-800">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
                <Button onClick={() => setLocation('/vendor-analytics')} className="bg-black text-white hover:bg-gray-800">
                  <BarChart className="mr-2 h-4 w-4" />
                  Deep Analytics
                </Button>
              </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingSummary ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      summary?.productCount || 0
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingSummary ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      summary?.orderCount || 0
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingSummary ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      formatPriceFromGBP(summary?.totalRevenue || 0)
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingSummary ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      summary?.pendingOrderCount || 0
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Commission Dashboard Section */}
            {vendorId && (
              <div className="mt-8">
                <VendorCommissionDashboard vendorId={vendorId} />
              </div>
            )}

          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-0 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight">Products</h2>
              <Button onClick={() => setLocation('/add-product')} className="bg-black text-white hover:bg-gray-800">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
            <ProductsList vendorId={vendorId || undefined} />
          </TabsContent>



          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-0 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
            <CustomersList vendorId={vendorId || undefined} />
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping" className="mt-0 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Shipping & Orders</h2>
            
            {/* Orders Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Orders</h3>
              <OrdersList vendorId={vendorId || undefined} />
            </div>
            
            {/* Shipping Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Shipping Management</h3>
              <ShippingManager vendorId={vendorId || undefined} />
            </div>
          </TabsContent>



          {/* Marketing Tab */}
          <TabsContent value="marketing" className="mt-0 space-y-6">
            
            {/* Marketing Campaigns Section */}
            <div className="space-y-4">
              <MarketingCampaigns />
            </div>
            
            {/* Promotions & Discounts Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Promotions & Discounts</h3>
                  <p className="text-muted-foreground">Manage discount codes and automatic promotions</p>
                </div>
              </div>

              <Tabs defaultValue="discount-codes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="discount-codes">Discount Codes</TabsTrigger>
                  <TabsTrigger value="auto-discounts">Automatic Discounts</TabsTrigger>
                </TabsList>

                {/* Discount Codes Tab */}
                <TabsContent value="discount-codes" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold">Discount Codes</h4>
                    <Button className="bg-black hover:bg-gray-800" onClick={() => {
                      setDiscountFormType("discount-code");
                      setDiscountFormOpen(true);
                    }}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Code
                    </Button>
                  </div>

                  <DiscountList vendorId={vendorId} type="discount-code" />
                </TabsContent>

                {/* Automatic Discounts Tab */}
                <TabsContent value="auto-discounts" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold">Automatic Discounts</h4>
                    <Button className="bg-black hover:bg-gray-800" onClick={() => {
                      setDiscountFormType("automatic");
                      setDiscountFormOpen(true);
                    }}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Auto Discount
                    </Button>
                  </div>

                  <DiscountList vendorId={vendorId} type="automatic" />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>





          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Store Settings</h2>
            <StoreSettingsForm vendor={vendor} />
            
            {vendorId && (
              <div className="mt-8">
                <VendorPaymentInfo vendorId={vendorId} />
              </div>
            )}
          </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Discount Form Dialog */}
      <DiscountForm
        open={discountFormOpen}
        onOpenChange={setDiscountFormOpen}
        type={discountFormType}
        vendorId={vendorId || 0}
      />
    </div>
  );
}