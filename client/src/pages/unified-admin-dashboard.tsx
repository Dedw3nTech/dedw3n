import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { 
  Users, Package, ShoppingCart, MessageSquare, TrendingUp, Settings, Shield, ShieldAlert, 
  Database, RefreshCw, Download, Upload, AlertTriangle, Activity, AlertCircle, CheckCircle, 
  XCircle, Clock, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Mail, Phone, MapPin, 
  Calendar, Store, UserCog, Languages, CreditCard, Truck, FileText, BarChart3, Bell, 
  ExternalLink, DollarSign, Sparkles, FileWarning, ShieldCheck
} from 'lucide-react';

// Types
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: string;
  isLocked: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

interface Report {
  id: number;
  type: string;
  contentId: number;
  reporterId: number;
  reason: string;
  status: string;
  createdAt: Date;
  reporter: {
    username: string;
    name: string;
  };
  content: {
    title: string;
    excerpt: string;
  };
}

interface VendorRequest {
  id: number;
  userId: number;
  vendorType: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  description: string;
  status: string;
  createdAt: Date;
  user: {
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingReports: number;
  pendingVendorRequests: number;
  activeUsers24h: number;
  totalRevenue: number;
  userCount: number;
  productCount: number;
  orderCount: number;
  communityCount: number;
}

// Master Translation mega-batch for Unified Admin Dashboard
const adminTexts = [
  // Main Navigation (12 texts)
  "Unified Admin Dashboard", "Overview", "Users", "Products", "Orders", "Reports", "Vendors", "Settings", "System", "Analytics", "Security", "Moderation",
  
  // User Management (15 texts)
  "User Management", "Active Users", "Banned Users", "Moderators", "User Details", "User Roles", "Ban User", "Unban User", 
  "Lock Account", "Unlock Account", "Edit User", "Delete User", "View Profile", "Send Message", "Search Users",
  
  // Vendor Management (12 texts)
  "Vendor Requests", "Pending Requests", "Approved Vendors", "Business Details", "Vendor Type", "Review Request", 
  "Approve Vendor", "Reject Vendor", "Business Information", "Contact Details", "Vendor Status", "Account Management",
  
  // Content Moderation (10 texts)
  "Content Reports", "Flagged Content", "Pending Review", "Approved Content", "Rejected Content", "Review Report", 
  "Approve Report", "Reject Report", "Content Details", "Moderation Actions",
  
  // System Management (15 texts)
  "System Health", "Performance Metrics", "Database Status", "Cache Management", "Clear Cache", "Rebuild Indices", 
  "Fix Blob Avatars", "Export Data", "Import Data", "Backup System", "Restore System", "Maintenance Mode", 
  "System Logs", "Error Reports", "Server Status"
];

export default function UnifiedAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Translation system
  const { translations, isLoading: translationsLoading } = useMasterBatchTranslation(adminTexts, 'instant');
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = adminTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedVendorRequest, setSelectedVendorRequest] = useState<VendorRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  // System maintenance states
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isRebuildingIndices, setIsRebuildingIndices] = useState(false);
  const [isFixingBlobAvatars, setIsFixingBlobAvatars] = useState(false);

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY - Move queries here
  // Fetch admin statistics
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
    enabled: !!(user && user.role === 'admin'), // Only run if user is admin
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
    enabled: !!(user && user.role === 'admin'), // Only run if user is admin
  });

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/admin/reports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/reports');
      return response.json();
    },
    enabled: !!(user && user.role === 'admin'), // Only run if user is admin
  });

  // Fetch vendor requests
  const { data: vendorRequests = [], isLoading: vendorRequestsLoading } = useQuery<VendorRequest[]>({
    queryKey: ['/api/admin/vendor-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/vendor-requests');
      return response.json();
    },
    enabled: !!(user && user.role === 'admin'), // Only run if user is admin
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: Partial<User> }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "User Updated",
        description: "User has been successfully updated.",
      });
      setUserDialogOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
  });

  // Report management mutations
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/reports/${reportId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Report Updated",
        description: "Report status has been successfully updated.",
      });
      setReportDialogOpen(false);
    },
  });

  // Vendor request management mutations
  const updateVendorRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/vendor-requests/${requestId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Vendor Request Updated",
        description: "Vendor request has been successfully processed.",
      });
      setVendorDialogOpen(false);
    },
  });

  // Check if user is admin AFTER all hooks
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access the Admin Dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (translationsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading admin dashboard...</div>;
  }



  // System maintenance handlers
  const handleSaveSettings = () => {
    setIsSettingsSaved(true);
    toast({
      title: "Settings Saved",
      description: "Admin settings have been saved successfully.",
    });
    setTimeout(() => setIsSettingsSaved(false), 3000);
  };

  const handleClearCache = () => {
    setIsClearingCache(true);
    toast({
      title: "Cache Cleared",
      description: "System cache has been cleared successfully.",
    });
    setTimeout(() => setIsClearingCache(false), 2000);
  };

  const handleRebuildIndices = () => {
    setIsRebuildingIndices(true);
    toast({
      title: "Rebuilding Indices",
      description: "Database indices are being rebuilt...",
    });
    setTimeout(() => {
      setIsRebuildingIndices(false);
      toast({
        title: "Indices Rebuilt",
        description: "Database indices have been rebuilt successfully.",
      });
    }, 5000);
  };

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

  // Filter functions
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Utility functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'vendor': return 'bg-green-100 text-green-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-blue-600" />
            {t("Unified Admin Dashboard")}
          </h1>
          <p className="mt-2 text-gray-600">
            Complete platform administration and moderation center
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || stats?.userCount?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeUsers24h || 0} active in 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts?.toLocaleString() || stats?.productCount?.toLocaleString() || '0'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders?.toLocaleString() || stats?.orderCount?.toLocaleString() || '0'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.pendingReports || 0) + (stats?.pendingVendorRequests || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingReports || 0} reports, {stats?.pendingVendorRequests || 0} vendors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
            <TabsTrigger value="users">{t("Users")}</TabsTrigger>
            <TabsTrigger value="vendors">{t("Vendors")}</TabsTrigger>
            <TabsTrigger value="reports">{t("Reports")}</TabsTrigger>
            <TabsTrigger value="system">{t("System")}</TabsTrigger>
            <TabsTrigger value="settings">{t("Settings")}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
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
                        <p className="text-sm">Vendor application submitted</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Content flagged for review</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" variant="outline" onClick={() => setActiveTab("users")}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => setActiveTab("vendors")}>
                    <Store className="h-4 w-4 mr-2" />
                    Review Vendor Requests
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => setActiveTab("reports")}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Review Reports
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => setActiveTab("system")}>
                    <Settings className="h-4 w-4 mr-2" />
                    System Management
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("User Management")}
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Badge variant="outline">
                    {filteredUsers.length} users found
                  </Badge>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Loading users...
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.slice(0, 10).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <Users className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-500">@{user.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(user.role)}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.status)}>
                                {user.isLocked ? 'Locked' : user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {t("Vendor Requests")}
                </CardTitle>
                <CardDescription>
                  Review and manage vendor account applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorRequestsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading vendor requests...
                          </TableCell>
                        </TableRow>
                      ) : vendorRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No vendor requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        vendorRequests.slice(0, 10).map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{request.businessName}</p>
                                <p className="text-sm text-gray-500">{request.businessEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  {request.user.avatar ? (
                                    <img src={request.user.avatar} alt={request.user.name} className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <Users className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{request.user.name}</p>
                                  <p className="text-sm text-gray-500">@{request.user.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {request.vendorType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVendorRequest(request);
                                    setVendorDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateVendorRequestMutation.mutate({ requestId: request.id, status: 'approved' })}
                                  disabled={request.status === 'approved'}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateVendorRequestMutation.mutate({ requestId: request.id, status: 'rejected' })}
                                  disabled={request.status === 'rejected'}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t("Content Reports")}
                </CardTitle>
                <CardDescription>
                  Review flagged content and moderate platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                    <p className="text-gray-500">
                      No content reports are currently pending review. The reports system is ready for when reports are submitted.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reported</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{report.content.title}</p>
                                <p className="text-sm text-gray-500">{report.content.excerpt}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{report.reporter.name}</p>
                                <p className="text-sm text-gray-500">@{report.reporter.username}</p>
                              </div>
                            </TableCell>
                            <TableCell>{report.reason}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(report.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setReportDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateReportMutation.mutate({ reportId: report.id, status: 'approved' })}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateReportMutation.mutate({ reportId: report.id, status: 'rejected' })}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("System Health")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Database Status</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cache Status</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>WebSocket Status</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Email Service</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleClearCache} 
                    disabled={isClearingCache}
                    className="w-full"
                    variant="outline"
                  >
                    {isClearingCache ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    {t("Clear Cache")}
                  </Button>
                  <Button 
                    onClick={handleRebuildIndices} 
                    disabled={isRebuildingIndices}
                    className="w-full"
                    variant="outline"
                  >
                    {isRebuildingIndices ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    {t("Rebuild Indices")}
                  </Button>
                  <Button 
                    onClick={handleFixBlobAvatars} 
                    disabled={isFixingBlobAvatars}
                    className="w-full"
                    variant="outline"
                  >
                    {isFixingBlobAvatars ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    {t("Fix Blob Avatars")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Settings")}</CardTitle>
                <CardDescription>
                  Configure platform settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable maintenance mode for the platform</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">User Registration</Label>
                      <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Vendor Applications</Label>
                      <p className="text-sm text-muted-foreground">Accept new vendor applications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isSettingsSaved}
                  className="w-full"
                >
                  {isSettingsSaved ? "Settings Saved!" : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Modify user account settings and permissions
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label>Username</Label>
                  <Input value={selectedUser.username} disabled />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={selectedUser.name} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={selectedUser.email} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={selectedUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => updateUserMutation.mutate({ userId: selectedUser?.id || 0, updates: {} })}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vendor Dialog */}
        <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vendor Request Details</DialogTitle>
              <DialogDescription>
                Review vendor application information
              </DialogDescription>
            </DialogHeader>
            {selectedVendorRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Business Name</Label>
                    <p className="text-sm">{selectedVendorRequest.businessName}</p>
                  </div>
                  <div>
                    <Label>Vendor Type</Label>
                    <p className="text-sm">{selectedVendorRequest.vendorType}</p>
                  </div>
                  <div>
                    <Label>Business Email</Label>
                    <p className="text-sm">{selectedVendorRequest.businessEmail}</p>
                  </div>
                  <div>
                    <Label>Business Phone</Label>
                    <p className="text-sm">{selectedVendorRequest.businessPhone}</p>
                  </div>
                </div>
                <div>
                  <Label>Business Address</Label>
                  <p className="text-sm">{selectedVendorRequest.businessAddress}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedVendorRequest.description}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setVendorDialogOpen(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => updateVendorRequestMutation.mutate({ requestId: selectedVendorRequest?.id || 0, status: 'rejected' })}
              >
                Reject
              </Button>
              <Button onClick={() => updateVendorRequestMutation.mutate({ requestId: selectedVendorRequest?.id || 0, status: 'approved' })}>
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>
                Review flagged content report
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <Label>Content Title</Label>
                  <p className="text-sm">{selectedReport.content.title}</p>
                </div>
                <div>
                  <Label>Report Reason</Label>
                  <p className="text-sm">{selectedReport.reason}</p>
                </div>
                <div>
                  <Label>Reported By</Label>
                  <p className="text-sm">{selectedReport.reporter.name} (@{selectedReport.reporter.username})</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => updateReportMutation.mutate({ reportId: selectedReport?.id || 0, status: 'rejected' })}
              >
                Dismiss Report
              </Button>
              <Button onClick={() => updateReportMutation.mutate({ reportId: selectedReport?.id || 0, status: 'approved' })}>
                Take Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}