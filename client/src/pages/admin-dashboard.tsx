import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Users, Package, ShoppingCart, BarChart, Settings, Shield, ActivitySquare, AlertTriangle, Brain, Sparkles, FileWarning, TrendingUp } from "lucide-react";
import ProductManagerDashboard from "@/components/admin/ProductManagerDashboard";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import UserModeration from "@/components/admin/UserModeration";
import PostModeration from "@/components/admin/PostModeration";
import EnhancedModeration from "@/components/admin/EnhancedModeration";
import AIInsights from "@/components/social/AIInsights";

// Import placeholder component for development
const PlaceholderComponent = ({ title }: { title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>This section is under development</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center py-10">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <p className="text-center text-muted-foreground">
        The admin API endpoints for this feature are being implemented.
        <br />Check back soon!
      </p>
    </CardContent>
  </Card>
);

// Define types for admin stats
type AdminStats = {
  userCount: number;
  productCount: number;
  orderCount: number;
  communityCount: number;
  postCount?: number;
  reportCount?: number;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: stats = { 
    userCount: 0, 
    productCount: 0, 
    orderCount: 0, 
    communityCount: 0 
  }, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
  });

  // If user is not admin, redirect to home
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Loading state
  if (!user || isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-screen-xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, products, orders, and system settings.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Total Users</p>
                  <h3 className="text-3xl font-bold">{stats?.userCount || 0}</h3>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Products</p>
                  <h3 className="text-3xl font-bold">{stats?.productCount || 0}</h3>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Orders</p>
                  <h3 className="text-3xl font-bold">{stats?.orderCount || 0}</h3>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Communities</p>
                  <h3 className="text-3xl font-bold">{stats?.communityCount || 0}</h3>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-8 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden md:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Communities</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden md:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Moderation</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-primary" />
                    Data Visualization
                  </CardTitle>
                  <CardDescription>
                    View data flow in clear and easy-to-understand formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-medium">User Growth Trends</h3>
                      <div className="h-40 bg-slate-50 rounded-md flex items-center justify-center">
                        <div className="relative w-full h-32 px-4">
                          {/* Simple chart visualization */}
                          <div className="absolute bottom-0 w-full flex items-end justify-between h-28">
                            <div className="w-[8%] bg-primary/80 rounded-t" style={{ height: '40%' }}></div>
                            <div className="w-[8%] bg-primary/80 rounded-t" style={{ height: '60%' }}></div>
                            <div className="w-[8%] bg-primary/80 rounded-t" style={{ height: '50%' }}></div>
                            <div className="w-[8%] bg-primary/80 rounded-t" style={{ height: '75%' }}></div>
                            <div className="w-[8%] bg-primary/80 rounded-t" style={{ height: '65%' }}></div>
                            <div className="w-[8%] bg-primary/80 rounded-t" style={{ height: '90%' }}></div>
                            <div className="w-[8%] bg-primary/80 rounded-t" style={{ height: '80%' }}></div>
                          </div>
                          <div className="absolute bottom-0 w-full border-t border-slate-200 pt-1 flex justify-between text-xs text-slate-500">
                            <span>Jan</span>
                            <span>Feb</span>
                            <span>Mar</span>
                            <span>Apr</span>
                            <span>May</span>
                            <span>Jun</span>
                            <span>Jul</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Visualize user adoption trends over time to identify growth patterns.
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-medium">Revenue Distribution</h3>
                      <div className="h-40 bg-slate-50 rounded-md flex items-center justify-center">
                        <div className="w-32 h-32 relative">
                          {/* Simple pie chart visualization */}
                          <svg viewBox="0 0 32 32" className="w-full h-full">
                            <circle r="16" cx="16" cy="16" className="fill-primary/10" />
                            <circle r="16" cx="16" cy="16" className="fill-primary/80" 
                              stroke="white" strokeWidth="1"
                              strokeDasharray="100" strokeDashoffset="75" 
                              transform="rotate(-90 16 16)" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-medium">75% Products</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        See revenue breakdown by categories, products, and marketplaces.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">View All Analytics</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileWarning className="h-5 w-5 text-primary" />
                    Customization & Reporting
                  </CardTitle>
                  <CardDescription>
                    Create custom reports, set up alerts, and export data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-medium">Saved Reports</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <BarChart className="h-4 w-4 text-primary" />
                          <span className="text-sm">Monthly Revenue Report</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-sm">User Engagement Summary</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm">Product Performance</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-1">
                      <Sparkles className="h-4 w-4" />
                      Create Report
                    </Button>
                    <Button variant="outline" className="flex-1 gap-1">
                      <ActivitySquare className="h-4 w-4" /> 
                      Configure Alerts
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ActivitySquare className="h-5 w-5 text-primary" />
                    System Monitoring
                  </CardTitle>
                  <CardDescription>
                    Track KPIs and system health metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">User Engagement</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: "78%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Resource Utilization</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">System Health</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: "92%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">API Response Time</span>
                        <span className="text-sm font-medium">248ms</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: "35%" }}></div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">View All Metrics</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Integration with Other Systems
                  </CardTitle>
                  <CardDescription>
                    Connect with various data sources and platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-primary">
                            <Package className="h-5 w-5" />
                          </div>
                          <span className="font-medium">Inventory</span>
                        </div>
                        <div className="w-10 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Real-time inventory sync with warehouse management
                      </p>
                    </div>
                    <div className="border rounded-lg p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-primary">
                            <ShoppingCart className="h-5 w-5" />
                          </div>
                          <span className="font-medium">Orders</span>
                        </div>
                        <div className="w-10 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Order processing integration with fulfillment centers
                      </p>
                    </div>
                    <div className="border rounded-lg p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-primary">
                            <Brain className="h-5 w-5" />
                          </div>
                          <span className="font-medium">Analytics</span>
                        </div>
                        <div className="w-10 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Business intelligence and reporting dashboard
                      </p>
                    </div>
                    <div className="border rounded-lg p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center text-primary">
                            <Shield className="h-5 w-5" />
                          </div>
                          <span className="font-medium">Security</span>
                        </div>
                        <div className="w-10 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-amber-700">Updating</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Threat detection and security monitoring services
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">Manage Integrations</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <UserModeration />
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Product Management
                    </CardTitle>
                    <CardDescription>
                      Manage your product catalog
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm">All Products</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm">Categories</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm">Inventory</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm">Product Reviews</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full">
                        Add New Product
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Product Manager KPI Dashboard
                    </CardTitle>
                    <CardDescription>
                      Monitor product performance and identify growth opportunities with comprehensive metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProductManagerDashboard />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-4">
            <PlaceholderComponent title="Order Management" />
          </TabsContent>
          
          <TabsContent value="communities" className="space-y-4">
            <PlaceholderComponent title="Community Management" />
          </TabsContent>
          
          <TabsContent value="ai-insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Social Insights Dashboard
                </CardTitle>
                <CardDescription>
                  Advanced analytics and AI-driven insights for platform optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIInsights />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="moderation" className="space-y-4">
            <EnhancedModeration />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <PlaceholderComponent title="System Settings" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}