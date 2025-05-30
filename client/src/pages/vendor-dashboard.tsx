import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  PlusCircle
} from "lucide-react";

// Import vendor components
import ProductsList from "@/components/vendor/ProductsList";
import VendorAnalytics from "@/components/vendor/VendorAnalytics";
import OrdersList from "@/components/vendor/OrdersList";
import CustomersList from "@/components/vendor/CustomersList";
import ShippingManager from "@/components/vendor/ShippingManager";
import StoreSettingsForm from "@/components/vendor/StoreSettingsForm";

export default function VendorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [vendorId, setVendorId] = useState<number | null>(null);
  
  // Authentication wall - redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);
  
  // Fetch vendor profile only if user is authenticated
  const { data: vendor, isLoading: isLoadingVendor, error: vendorError } = useQuery({
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
    if (vendor && vendor.id) {
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
            <CardTitle>Vendor Dashboard</CardTitle>
            <CardDescription>
              Please log in to access your vendor dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              You need to be authenticated to access vendor features and manage your store.
            </p>
            <Button onClick={() => setLocation('/')}>
              Go to Login
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

  // Show loading while vendor data is being fetched
  if (isLoadingVendor) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center">
        <Card>
          <CardHeader>
            <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Loading Vendor Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Verifying your vendor access...
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
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Unable to verify vendor access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              There was an error verifying your vendor status. Please try logging in again or contact support if the issue persists.
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
        <Card>
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
        <Card>
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
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-4">
          <div className="mb-4">
            <div className="font-medium text-xl flex items-center">
              <Store className="mr-2 h-5 w-5" />
              {vendor?.storeName || "Vendor Dashboard"}
            </div>
            <div className="text-sm text-muted-foreground">
              {user?.username || ""}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="vertical"
            className="space-y-2"
          >
            <TabsList className="flex flex-col h-auto bg-transparent justify-start space-y-1">
              <TabsTrigger
                value="dashboard"
                className="justify-start px-3 py-2 h-auto font-normal"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="justify-start px-3 py-2 h-auto font-normal"
              >
                <Package className="h-4 w-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="justify-start px-3 py-2 h-auto font-normal"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="justify-start px-3 py-2 h-auto font-normal"
              >
                <Users className="h-4 w-4 mr-2" />
                Customers
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="justify-start px-3 py-2 h-auto font-normal"
              >
                <Truck className="h-4 w-4 mr-2" />
                Shipping
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="justify-start px-3 py-2 h-auto font-normal"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dashboard" className="mt-0 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
              <Button onClick={() => setLocation('/add-product')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
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
                      `$${(summary?.totalRevenue || 0).toFixed(2)}`
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

            {/* Analytics */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Analytics Overview</h3>
              {vendorId && <VendorAnalytics vendorId={vendorId} />}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-0 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight">Products</h2>
              <Button onClick={() => setLocation('/add-product')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
            <ProductsList vendorId={vendorId || undefined} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-0 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
            <OrdersList vendorId={vendorId || undefined} />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-0 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
            <CustomersList vendorId={vendorId || undefined} />
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping" className="mt-0 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Shipping</h2>
            <ShippingManager vendorId={vendorId || undefined} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Store Settings</h2>
            <StoreSettingsForm vendor={vendor} />
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}