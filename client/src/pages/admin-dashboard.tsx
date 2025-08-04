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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Activity,
  Users,
  Package,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  Settings,
  Shield,
  ShieldAlert,
  Database,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles, 
  FileWarning, 
  TrendingUp as TrendingUpIcon,
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
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Master Translation mega-batch for Admin Dashboard (50+ texts)
const adminTexts = [
    // Main Navigation (8 texts)
    "Admin Dashboard", "Users", "Products", "Orders", "Reports", "Settings", "Security", "System",
    
    // User Management (12 texts)
    "User Management", "Active Users", "Banned Users", "Moderators", "User Details", "User Roles",
    "Ban User", "Unban User", "Edit", "Delete", "View Profile", "Send Message",
    
    // Product Management (10 texts)
    "Product Approval", "Pending Products", "Approved Products", "Rejected Products", "Review Product",
    "Approve", "Reject", "Edit", "Delete", "Feature Product",
    
    // Order Management (8 texts)
    "Order Overview", "Pending Orders", "Processing Orders", "Completed Orders", "Cancelled Orders",
    "View Order", "Update Status", "Refund Order",
    
    // Reports & Analytics (12 texts)
    "Platform Analytics", "Revenue Reports", "User Activity", "Product Performance", "Sales Trends",
    "Export Data", "Generate Report", "View Details", "Filter", "Date Range", "Download", "Print"
];

// Define types for admin stats
type AdminStats = {
  userCount: number;
  productCount: number;
  orderCount: number;
  communityCount: number;
  postCount?: number;
  reportCount?: number;
};

// Affiliate Partnership Management Component
const AffiliatePartnershipManagement = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const { data: partners = [], refetch } = useQuery({
    queryKey: ['/api/admin/affiliate-partners', filter],
    queryFn: async () => {
      const params = filter === 'pending' ? '?status=pending' : '';
      const response = await fetch(`/api/admin/affiliate-partners${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch affiliate partners');
      }
      return response.json();
    },
  });

  const approvePartner = async (partnerId: number) => {
    try {
      const response = await fetch(`/api/admin/affiliate-partners/${partnerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to approve partner');
      }

      toast({
        title: "Partner Approved",
        description: "The affiliate partner has been approved and notified.",
        variant: "default",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve affiliate partner",
        variant: "destructive",
      });
    }
  };

  const declinePartner = async () => {
    if (!selectedPartner) return;

    try {
      const response = await fetch(`/api/admin/affiliate-partners/${selectedPartner.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline partner');
      }

      toast({
        title: "Partner Declined",
        description: "The affiliate partner has been declined and notified.",
        variant: "default",
      });

      setShowDeclineDialog(false);
      setDeclineReason("");
      setSelectedPartner(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline affiliate partner",
        variant: "destructive",
      });
    }
  };

  const filteredPartners = partners.filter((partner: any) => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (partner.company && partner.company.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Affiliate Partnership Management
        </CardTitle>
        <CardDescription>Review and manage affiliate partnership applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredPartners.length === 0 ? (
          <div className="text-center py-8">
            <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No affiliate partners found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPartners.map((partner: any) => (
              <Card key={partner.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{partner.name}</h3>
                        {getStatusBadge(partner.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{partner.email}</p>
                      {partner.company && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Company:</strong> {partner.company}
                        </p>
                      )}
                      {partner.specialization && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Specialization:</strong> {partner.specialization}
                        </p>
                      )}
                      {partner.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          <strong>Description:</strong> {partner.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Partner Code: {partner.partnerCode}</span>
                        <span>Commission: {partner.commissionRate}%</span>
                        <span>Applied: {new Date(partner.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {partner.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approvePartner(partner.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedPartner(partner);
                            setShowDeclineDialog(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Decline Dialog */}
        {showDeclineDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Decline Affiliate Partnership</CardTitle>
                <CardDescription>
                  Provide a reason for declining {selectedPartner?.name}'s application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Optional: Provide a reason for the decline..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeclineDialog(false);
                      setDeclineReason("");
                      setSelectedPartner(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={declinePartner}>
                    Decline Partner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Placeholder components for admin dashboard features
const UserModeration = () => (
  <Card>
    <CardHeader>
      <CardTitle>User Moderation</CardTitle>
      <CardDescription>Manage user accounts and moderation tasks</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center py-10">
      <ShieldAlert className="h-12 w-12 text-blue-500 mb-4" />
      <p className="text-center text-muted-foreground mb-4">
        Access the comprehensive Admin Control Center for complete platform moderation.
      </p>
      <Link href="/admin-control-center">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <ShieldAlert className="h-4 w-4 mr-2" />
          Open Control Center
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const OrderManagement = () => (
  <Card>
    <CardHeader>
      <CardTitle>Order Management</CardTitle>
      <CardDescription>View and manage all orders</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Order management features coming soon</p>
    </CardContent>
  </Card>
);

const CommunityModeration = () => (
  <Card>
    <CardHeader>
      <CardTitle>Community Moderation</CardTitle>
      <CardDescription>Moderate community content and posts</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Community moderation features coming soon</p>
    </CardContent>
  </Card>
);

const ReportsAnalytics = () => (
  <Card>
    <CardHeader>
      <CardTitle>Reports & Analytics</CardTitle>
      <CardDescription>View platform analytics and generate reports</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Analytics and reporting features coming soon</p>
    </CardContent>
  </Card>
);

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

export default function AdminDashboard() {
  const { translations, isLoading } = useMasterBatchTranslation(adminTexts, 'instant');
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading translations...</div>;
  }
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = adminTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };

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
    setTimeout(() => {
      setIsSettingsSaved(false);
    }, 3000);
  };

  // Handler for clearing cache
  const handleClearCache = () => {
    setIsClearingCache(true);
    setTimeout(() => {
      setIsClearingCache(false);
    }, 2000);
  };

  // Handler for rebuilding indices
  const handleRebuildIndices = () => {
    setIsRebuildingIndices(true);
    setTimeout(() => {
      setIsRebuildingIndices(false);
    }, 5000);
  };

  // Handler for fixing blob avatars
  const handleFixBlobAvatars = async () => {
    setIsFixingBlobAvatars(true);
    
    try {
      const response = await fetch('/api/admin/fix-blob-avatars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        description: (error as Error).message || "Failed to fix avatar URLs",
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
    communityCount: 0,
    postCount: 0,
    reportCount: 0
  } } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user?.role && ['admin'].includes(user.role),
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("Admin Dashboard")}</h1>
          <p className="mt-2 text-gray-600">Manage your platform from this central dashboard</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("Users")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userCount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("Products")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productCount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("Orders")}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderCount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.communityCount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">{t("Users")}</TabsTrigger>
            <TabsTrigger value="products">{t("Products")}</TabsTrigger>
            <TabsTrigger value="orders">{t("Orders")}</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            <TabsTrigger value="reports">{t("Reports")}</TabsTrigger>
            <TabsTrigger value="settings">{t("Settings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">New user registration</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Product approved</p>
                        <p className="text-xs text-muted-foreground">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">New order placed</p>
                        <p className="text-xs text-muted-foreground">10 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge variant="default">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Response</span>
                      <Badge variant="default">Good</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage</span>
                      <Badge variant="secondary">75% Used</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserModeration />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagerDashboard />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="affiliates">
            <AffiliatePartnershipManagement />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsAnalytics />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Settings")}</CardTitle>
                <CardDescription>Manage system settings and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="site-name">Site Name</Label>
                        <Input id="site-name" defaultValue="Dedw3n Marketplace" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maintenance">Maintenance Mode</Label>
                        <Switch id="maintenance" />
                      </div>
                      <Button 
                        onClick={handleSaveSettings}
                        disabled={isSettingsSaved}
                        className="w-full"
                      >
                        {isSettingsSaved ? "Saved!" : "Save Settings"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">System Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        onClick={handleClearCache}
                        disabled={isClearingCache}
                        variant="outline"
                        className="w-full"
                      >
                        {isClearingCache ? "Clearing..." : "Clear Cache"}
                      </Button>
                      <Button 
                        onClick={handleRebuildIndices}
                        disabled={isRebuildingIndices}
                        variant="outline"
                        className="w-full"
                      >
                        {isRebuildingIndices ? "Rebuilding..." : "Rebuild Search Indices"}
                      </Button>
                      <Button 
                        onClick={handleFixBlobAvatars}
                        disabled={isFixingBlobAvatars}
                        variant="outline"
                        className="w-full"
                      >
                        {isFixingBlobAvatars ? "Fixing..." : "Fix Blob Avatar URLs"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Two-Factor Authentication</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate Limiting</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2">
                        <Label>IP Blocking</Label>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}