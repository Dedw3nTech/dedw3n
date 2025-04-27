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
import { Loader2, Users, Package, ShoppingCart, BarChart, Settings, Shield, ActivitySquare, AlertTriangle, Brain, Sparkles, FileWarning } from "lucide-react";
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
          <TabsList className="grid grid-cols-2 md:grid-cols-8 gap-2">
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
            <PlaceholderComponent title="Analytics & Dashboard Overview" />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <UserModeration />
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4">
            <PlaceholderComponent title="Product Management" />
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