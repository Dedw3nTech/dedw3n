import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart, 
  Settings, 
  Shield, 
  ActivitySquare, 
  AlertTriangle, 
  Brain, 
  Sparkles, 
  FileWarning, 
  TrendingUp,
  ShieldCheck,
  Store,
  UserCog,
  Languages,
  CreditCard,
  Truck,
  FileText,
  BarChart3,
  Bell,
  ExternalLink,
  DollarSign
} from "lucide-react";
import ProductManagerDashboard from "@/components/admin/ProductManagerDashboard";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  // Master Translation mega-batch for Admin Dashboard (50+ texts)
  const adminTexts = useMemo(() => [
    // Main Navigation (8 texts)
    "Admin Dashboard", "Users", "Products", "Orders", "Reports", "Settings", "Security", "System",
    
    // User Management (12 texts)
    "User Management", "Active Users", "Banned Users", "Moderators", "User Details", "User Roles",
    "Ban User", "Unban User", "Edit User", "Delete User", "View Profile", "Send Message",
    
    // Product Management (10 texts)
    "Product Approval", "Pending Products", "Approved Products", "Rejected Products", "Review Product",
    "Approve", "Reject", "Edit", "Delete", "Feature Product",
    
    // Order Management (8 texts)
    "Order Overview", "Pending Orders", "Processing Orders", "Completed Orders", "Cancelled Orders",
    "View Order", "Update Status", "Refund Order",
    
    // Reports & Analytics (12 texts)
    "Platform Analytics", "Revenue Reports", "User Activity", "Product Performance", "Sales Trends",
    "Export Data", "Generate Report", "View Details", "Filter", "Date Range", "Download", "Print"
  ], []);

  const [t] = useMasterBatchTranslation(adminTexts);
  const [
    adminDashboardText, usersText, productsText, ordersText, reportsText, settingsText, securityText, systemText,
    userManagementText, activeUsersText, bannedUsersText, moderatorsText, userDetailsText, userRolesText,
    banUserText, unbanUserText, editUserText, deleteUserText, viewProfileText, sendMessageText,
    productApprovalText, pendingProductsText, approvedProductsText, rejectedProductsText, reviewProductText,
    approveText, rejectText, editText, deleteText, featureProductText,
    orderOverviewText, pendingOrdersText, processingOrdersText, completedOrdersText, cancelledOrdersText,
    viewOrderText, updateStatusText, refundOrderText,
    platformAnalyticsText, revenueReportsText, userActivityText, productPerformanceText, salesTrendsText,
    exportDataText, generateReportText, viewDetailsText, filterText, dateRangeText, downloadText, printText
  ] = t || adminTexts;

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
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSetting, setActiveSetting] = useState("general");
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isRebuildingIndices, setIsRebuildingIndices] = useState(false);
  const [isFixingBlobAvatars, setIsFixingBlobAvatars] = useState(false);
  
  // Handler for saving settings
  const handleSaveSettings = () => {
    setIsSettingsSaved(true);
    // Simulate API call
    setTimeout(() => {
      setIsSettingsSaved(false);
      toast({
        title: "Settings saved",
        description: "Your system settings have been updated successfully.",
        variant: "default",
      });
    }, 800);
  };
  
  // Handler for resetting settings to defaults
  const handleResetSettings = () => {
    setIsResetting(true);
    // Simulate API call
    setTimeout(() => {
      setIsResetting(false);
      toast({
        title: "Settings reset",
        description: "Your system settings have been reset to default values.",
        variant: "default",
      });
    }, 800);
  };
  
  // Handler for clearing system cache
  const handleClearCache = () => {
    setIsClearingCache(true);
    // Simulate API call
    setTimeout(() => {
      setIsClearingCache(false);
      toast({
        title: "Cache cleared",
        description: "System cache has been successfully cleared.",
        variant: "default",
      });
    }, 1000);
  };
  
  // Handler for rebuilding indices
  const handleRebuildIndices = () => {
    setIsRebuildingIndices(true);
    // Simulate API call
    setTimeout(() => {
      setIsRebuildingIndices(false);
      toast({
        title: "Indices rebuilt",
        description: "System indices have been successfully rebuilt.",
        variant: "default",
      });
    }, 1500);
  };
  
  // Handler for fixing blob avatars
  const handleFixBlobAvatars = async () => {
    setIsFixingBlobAvatars(true);
    try {
      const response = await fetch('/api/users/fix-blob-avatars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Avatar URLs Fixed",
          description: `Fixed ${data.users.length} user avatars with blob URLs.`,
          variant: "default",
        });
      } else {
        throw new Error(data.error || "Failed to fix avatar URLs");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fix avatar URLs",
        variant: "destructive",
      });
    } finally {
      setIsFixingBlobAvatars(false);
    }
  };
  
  const { data: stats = { 
    userCount: 0, 
    productCount: 0, 
    orderCount: 0, 
    communityCount: 0 
  }, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
  });

  // If user is not admin, don't redirect here (it causes React errors)
  // Instead, we'll handle this with useEffect
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Still return early if user is not an admin
  if (user && user.role !== "admin") {
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
            <OrderManagement />
          </TabsContent>
          
          <TabsContent value="communities" className="space-y-4">
            <CommunityModeration />
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Settings Sidebar */}
              <div className="col-span-3 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage system configurations
                      </p>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <Button 
                        variant={activeSetting === "general" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("general")}
                      >
                        <Settings className="h-4 w-4" />
                        General
                      </Button>
                      <Button 
                        variant={activeSetting === "security" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("security")}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Security
                      </Button>
                      <Button 
                        variant={activeSetting === "marketplace" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("marketplace")}
                      >
                        <Store className="h-4 w-4" />
                        Marketplace
                      </Button>
                      <Button 
                        variant={activeSetting === "user-management" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("user-management")}
                      >
                        <UserCog className="h-4 w-4" />
                        User Management
                      </Button>
                      <Button 
                        variant={activeSetting === "notifications" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("notifications")}
                      >
                        <Bell className="h-4 w-4" />
                        Notifications
                      </Button>
                      <Button 
                        variant={activeSetting === "localization" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("localization")}
                      >
                        <Languages className="h-4 w-4" />
                        Localization
                      </Button>
                      <Button 
                        variant={activeSetting === "payment" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("payment")}
                      >
                        <CreditCard className="h-4 w-4" />
                        Payment Methods
                      </Button>
                      <Button 
                        variant={activeSetting === "shipping" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("shipping")}
                      >
                        <Truck className="h-4 w-4" />
                        Shipping Options
                      </Button>
                      <Button 
                        variant={activeSetting === "legal" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("legal")}
                      >
                        <FileText className="h-4 w-4" />
                        Legal & Terms
                      </Button>
                      <Button 
                        variant={activeSetting === "analytics" ? "default" : "ghost"} 
                        className="w-full justify-start gap-2 font-medium"
                        onClick={() => setActiveSetting("analytics")}
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Content */}
              <div className="col-span-9 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      General Settings
                    </CardTitle>
                    <CardDescription>
                      Configure basic system settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Platform Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Platform Settings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="platform-name">Platform Name</Label>
                          <Input 
                            id="platform-name" 
                            defaultValue="Dedw3n" 
                            className="max-w-md"
                          />
                          <p className="text-xs text-muted-foreground">
                            The name of your platform as it appears to users
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Contact Email</Label>
                          <Input 
                            id="contact-email" 
                            type="email" 
                            defaultValue="support@dedw3n.com" 
                            className="max-w-md"
                          />
                          <p className="text-xs text-muted-foreground">
                            Primary email for system notifications and user support
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="default-currency">Default Currency</Label>
                          <Select defaultValue="gbp">
                            <SelectTrigger className="max-w-md">
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gbp">British Pound (GBP)</SelectItem>
                              <SelectItem value="usd">US Dollar (USD)</SelectItem>
                              <SelectItem value="eur">Euro (EUR)</SelectItem>
                              <SelectItem value="jpy">Japanese Yen (JPY)</SelectItem>
                              <SelectItem value="cny">Chinese Yuan (CNY)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Default currency for product prices and transactions
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="default-language">Default Language</Label>
                          <Select defaultValue="en">
                            <SelectTrigger className="max-w-md">
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="zh">Chinese</SelectItem>
                              <SelectItem value="ar">Arabic</SelectItem>
                              <SelectItem value="hi">Hindi</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Default language for the platform interface
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Feature Toggles */}
                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-medium">Feature Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Social Features</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable social networking features like community posts and messaging
                            </p>
                          </div>
                          <Switch defaultChecked id="social-features" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Dating Features</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable dating and matchmaking services on the platform
                            </p>
                          </div>
                          <Switch defaultChecked id="dating-features" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Governmental Services</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable government service application features
                            </p>
                          </div>
                          <Switch defaultChecked id="gov-features" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Digital Wallet</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable e-wallet features for users
                            </p>
                          </div>
                          <Switch defaultChecked id="wallet-features" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">AI-Powered Features</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable AI recommendations and insights
                            </p>
                          </div>
                          <Switch defaultChecked id="ai-features" />
                        </div>
                      </div>
                    </div>

                    {/* System Maintenance */}
                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-medium">System Maintenance</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                          <Select defaultValue="off">
                            <SelectTrigger className="max-w-md">
                              <SelectValue placeholder="Select maintenance mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="off">Off</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="on">On (Site Down)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Set the site to maintenance mode for system updates
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cache-clear">Cache Management</Label>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleClearCache}
                              disabled={isClearingCache || isRebuildingIndices}
                            >
                              {isClearingCache ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Clearing...
                                </>
                              ) : (
                                "Clear System Cache"
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleRebuildIndices}
                              disabled={isRebuildingIndices || isClearingCache}
                            >
                              {isRebuildingIndices ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Rebuilding...
                                </>
                              ) : (
                                "Rebuild Indices"
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Manage system cache and search indices
                          </p>
                        </div>

                        {/* User Data Utilities */}
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="user-utilities">User Data Utilities</Label>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleFixBlobAvatars}
                              disabled={isFixingBlobAvatars}
                            >
                              {isFixingBlobAvatars ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Fixing...
                                </>
                              ) : (
                                "Fix Blob Avatars"
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Clean up and fix temporary blob URLs in user avatars
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Save Settings Button */}
                    <div className="pt-4 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleResetSettings} 
                        disabled={isResetting || isSettingsSaved}
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Reset to Defaults"
                        )}
                      </Button>
                      <Button 
                        onClick={handleSaveSettings} 
                        disabled={isSettingsSaved || isResetting}
                      >
                        {isSettingsSaved ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Settings"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}