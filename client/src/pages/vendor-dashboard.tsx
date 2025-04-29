import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Store, 
  Plus, 
  BarChart4, 
  Package, 
  Truck, 
  ShoppingCart, 
  Settings, 
  Users,
  DollarSign,
  Loader2
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorDashboardPage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is logged in
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch vendor data if user is logged in
  const { data: vendorData, isLoading: isLoadingVendor } = useQuery({
    queryKey: ["/api/vendors/me"],
    enabled: !!userData?.id && !!userData?.isVendor,
  });

  // Fetch analytics data for the vendor
  const { data: analyticsSummary, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["/api/vendors", vendorData?.id, "analytics/summary"],
    enabled: !!vendorData?.id,
  });

  // Redirect if not logged in
  if (!isLoadingUser && !userData) {
    setLocation("/auth?redirect=/vendor-dashboard");
    return null;
  }

  // Redirect if not a vendor
  if (!isLoadingUser && userData && !userData.isVendor) {
    setLocation("/become-vendor");
    return null;
  }

  const isLoading = isLoadingUser || isLoadingVendor || isLoadingAnalytics;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24 mt-2" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={vendorData?.logo || "/placeholder-logo.png"} alt={vendorData?.storeName} />
                      <AvatarFallback>
                        <Store className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-base font-semibold">{vendorData?.storeName}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">
                            <i className="ri-star-fill"></i>
                          </span>
                          <span>{vendorData?.rating || 0}</span>
                        </div>
                        <span className="mx-1">•</span>
                        <span>{vendorData?.ratingCount || 0} reviews</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {vendorData?.description || "No description available"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                <Button 
                  variant="ghost" 
                  className={`justify-start rounded-none px-4 py-2 text-left ${activeTab === "overview" ? "bg-muted" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Overview
                </Button>
                <Button 
                  variant="ghost" 
                  className={`justify-start rounded-none px-4 py-2 text-left ${activeTab === "products" ? "bg-muted" : ""}`}
                  onClick={() => setActiveTab("products")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
                <Button 
                  variant="ghost" 
                  className={`justify-start rounded-none px-4 py-2 text-left ${activeTab === "orders" ? "bg-muted" : ""}`}
                  onClick={() => setActiveTab("orders")}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
                <Button 
                  variant="ghost" 
                  className={`justify-start rounded-none px-4 py-2 text-left ${activeTab === "shipping" ? "bg-muted" : ""}`}
                  onClick={() => setActiveTab("shipping")}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Shipping
                </Button>
                <Button 
                  variant="ghost" 
                  className={`justify-start rounded-none px-4 py-2 text-left ${activeTab === "customers" ? "bg-muted" : ""}`}
                  onClick={() => setActiveTab("customers")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Customers
                </Button>
                <Button 
                  variant="ghost" 
                  className={`justify-start rounded-none px-4 py-2 text-left ${activeTab === "settings" ? "bg-muted" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="flex-1 w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="hidden">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <Button onClick={() => setLocation("/add-product")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Overview tab content */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <div className="text-2xl font-bold">
                        ${analyticsSummary?.totalRevenue?.toFixed(2) || "0.00"}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {analyticsSummary?.totalOrders || "0"}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {analyticsSummary?.totalProducts || "0"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>
                    Your most recent orders and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <div className="ml-auto">
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : analyticsSummary?.recentOrders?.length ? (
                    <div className="space-y-4">
                      {analyticsSummary.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center gap-4 border-b pb-4">
                          <div className="flex-1">
                            <div className="font-medium">Order #{order.id}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(order.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm">${order.total.toFixed(2)}</div>
                          <div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === "delivered" ? "bg-green-100 text-green-800" :
                              order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                              order.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">No orders yet</h3>
                      <p className="text-sm">You haven't received any orders yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products tab content (just a placeholder for now) */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Manage your product inventory
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-6 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Your Products</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your products, add new ones, and track inventory.
                  </p>
                  <Button onClick={() => setLocation("/add-product")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Placeholder tabs - these would be implemented with actual functionality */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>
                    View and manage all your orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Orders Management</h3>
                    <p className="text-muted-foreground">
                      This section is coming soon. You'll be able to manage all your orders here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping</CardTitle>
                  <CardDescription>
                    Manage shipping options and track deliveries
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Truck className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Shipping Management</h3>
                    <p className="text-muted-foreground">
                      This section is coming soon. You'll be able to manage all your shipping options here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>
                    View customer information and purchase history
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Customer Management</h3>
                    <p className="text-muted-foreground">
                      This section is coming soon. You'll be able to view all your customers here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Settings</CardTitle>
                  <CardDescription>
                    Manage your vendor profile and store settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Store Settings</h3>
                    <p className="text-muted-foreground">
                      This section is coming soon. You'll be able to customize your store settings here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}