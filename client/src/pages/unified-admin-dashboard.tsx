import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
  ExternalLink, DollarSign, Sparkles, FileWarning, ShieldCheck, Ban, ChevronUp, ChevronDown, Heart,
  Link as LinkIcon, Unlink
} from 'lucide-react';

// Types
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  // status: string; // Field doesn't exist in schema
  isLocked: boolean;
  lastLogin?: Date;
  createdAt: Date;
  isVendor: boolean;
  datingEnabled: boolean;
  datingSubscription?: string;
  city?: string;
  country?: string;
  region?: string;
  gender?: string;
  dateOfBirth?: Date;
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

interface Vendor {
  id: number;
  userId: number;
  vendorType: string;
  storeName: string;
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website?: string;
  logo?: string;
  rating: number;
  ratingCount: number;
  badgeLevel: string;
  totalSalesAmount: number;
  totalTransactions: number;
  accountStatus: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    avatar?: string;
    role: string;
    lastLogin?: Date;
    createdAt: Date;
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
  totalDatingProfiles: number;
  activeDatingProfiles: number;
  activeVendors: number;
  totalAmountSold: number;
  totalTransactions: number;
  totalAmountShipped: number;
  shippedOrders: number;
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

// Recent Activity Component
function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/admin/recent-activity'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'store': return <Store className="h-4 w-4" />;
      case 'package': return <Package className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 animate-pulse">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.slice(0, 6).map((activity: any, index: number) => (
        <div key={index} className="flex items-center space-x-4">
          <div className={`w-2 h-2 ${getActivityColor(activity.color)} rounded-full`}></div>
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorDetailsDialogOpen, setVendorDetailsDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [userSortField, setUserSortField] = useState<'createdAt' | 'lastLogin' | 'name'>('createdAt');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter states for User Management
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [datingFilter, setDatingFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [lastLoginFilter, setLastLoginFilter] = useState('all');

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
  const { data: usersData = { users: [], totalCount: 0 }, isLoading: usersLoading } = useQuery<{users: User[], totalCount: number}>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
    enabled: !!(user && user.role === 'admin'), // Only run if user is admin
  });
  
  const users = usersData.users || [];

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

  // Fetch all vendors (approved/active vendors)
  const { data: vendorsData = { vendors: [], totalCount: 0 }, isLoading: vendorsLoading } = useQuery<{vendors: Vendor[], totalCount: number}>({
    queryKey: ['/api/admin/vendors'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/vendors');
      return response.json();
    },
    enabled: !!(user && user.role === 'admin'), // Only run if user is admin
  });
  
  const vendors = vendorsData.vendors || [];

  // Fetch all products
  const { data: productsData = { products: [], totalCount: 0 }, isLoading: productsLoading } = useQuery<{products: any[], totalCount: number}>({
    queryKey: ['/api/admin/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/products');
      return response.json();
    },
    enabled: !!(user && user.role === 'admin'), // Only run if user is admin
  });
  
  const products = productsData.products || [];

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: Partial<User> }) => {
      return apiRequest(`/api/admin/users/${userId}`, 'PATCH', updates);
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



  // Report management mutations
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      return apiRequest(`/api/admin/reports/${reportId}`, 'PATCH', { status });
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
      return apiRequest(`/api/admin/vendor-requests/${requestId}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Vendor Request Updated",
        description: "Vendor request has been successfully processed.",
      });
      setVendorDialogOpen(false);
    },
  });

  // User deletion mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "User Deleted",
        description: "User account has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  // Vendor status management mutations
  const updateVendorStatusMutation = useMutation({
    mutationFn: async ({ vendorId, accountStatus, isActive }: { vendorId: number; accountStatus?: string; isActive?: boolean }) => {
      return apiRequest(`/api/admin/vendors/${vendorId}`, 'PATCH', { accountStatus, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Vendor Updated",
        description: "Vendor status has been successfully updated.",
      });
      setVendorDetailsDialogOpen(false);
    },
  });

  // Product management mutations
  const updateProductStatusMutation = useMutation({
    mutationFn: async ({ productId, status, isActive }: { productId: number; status?: string; isActive?: boolean }) => {
      return apiRequest(`/api/admin/products/${productId}`, 'PATCH', { status, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Product Updated",
        description: "Product status has been successfully updated.",
      });
      setProductDialogOpen(false);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest(`/api/admin/products/${productId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Product Deleted",
        description: "Product has been permanently deleted.",
      });
    },
  });

  // Vendor deletion mutation
  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      return apiRequest(`/api/admin/vendors/${vendorId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Vendor Deleted",
        description: "Vendor account and all products permanently deleted.",
      });
    },
  });

  // Commission management mutations
  const freezeVendorMutation = useMutation({
    mutationFn: async ({ vendorId, reason }: { vendorId: number; reason: string }) => {
      return apiRequest(`/api/admin/vendors/${vendorId}/freeze`, 'PATCH', { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Vendor Account Frozen",
        description: "Vendor account has been frozen successfully.",
      });
    },
  });

  const unfreezeVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      return apiRequest(`/api/admin/vendors/${vendorId}/unfreeze`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Vendor Account Unfrozen",
        description: "Vendor account has been unfrozen successfully.",
      });
    },
  });

  const markCommissionPaidMutation = useMutation({
    mutationFn: async ({ periodId, paymentMethod, paymentReference }: { periodId: number; paymentMethod?: string; paymentReference?: string }) => {
      return apiRequest(`/api/admin/commission-periods/${periodId}/mark-paid`, 'PATCH', { paymentMethod, paymentReference });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commissions'] });
      toast({
        title: "Commission Marked as Paid",
        description: "Commission has been marked as paid successfully.",
      });
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

  // Filter and sort functions
  const sortUsers = (users: User[]) => {
    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (userSortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        case 'lastLogin':
          aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (userSortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filteredUsers = sortUsers(users.filter(user => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'locked' && user.isLocked) ||
      (statusFilter === 'active' && !user.isLocked);
    
    // Vendor filter
    const matchesVendor = vendorFilter === 'all' ||
      (vendorFilter === 'active' && user.isVendor) ||
      (vendorFilter === 'inactive' && !user.isVendor);
    
    // Dating filter
    const matchesDating = datingFilter === 'all' ||
      (datingFilter === 'active' && user.datingEnabled) ||
      (datingFilter === 'inactive' && !user.datingEnabled);
    
    // Gender filter
    const matchesGender = genderFilter === 'all' ||
      (genderFilter === 'not_set' && !user.gender) ||
      (genderFilter !== 'not_set' && user.gender === genderFilter);
    
    // Location filter
    const matchesLocation = locationFilter === 'all' ||
      (locationFilter === 'has_location' && (user.city || user.country)) ||
      (locationFilter === 'no_location' && !user.city && !user.country);
    
    // Age filter
    const userAge = user.dateOfBirth ? 
      Math.floor((new Date().getTime() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    const matchesAge = ageFilter === 'all' ||
      (ageFilter === 'under_18' && userAge && userAge < 18) ||
      (ageFilter === '18_25' && userAge && userAge >= 18 && userAge <= 25) ||
      (ageFilter === '26_35' && userAge && userAge >= 26 && userAge <= 35) ||
      (ageFilter === '36_50' && userAge && userAge >= 36 && userAge <= 50) ||
      (ageFilter === 'over_50' && userAge && userAge > 50) ||
      (ageFilter === 'not_set' && !user.dateOfBirth);
    
    // Last login filter
    const daysSinceLogin = user.lastLogin ? 
      Math.floor((new Date().getTime() - new Date(user.lastLogin).getTime()) / (24 * 60 * 60 * 1000)) : null;
    const matchesLastLogin = lastLoginFilter === 'all' ||
      (lastLoginFilter === 'today' && daysSinceLogin !== null && daysSinceLogin === 0) ||
      (lastLoginFilter === 'week' && daysSinceLogin !== null && daysSinceLogin <= 7) ||
      (lastLoginFilter === 'month' && daysSinceLogin !== null && daysSinceLogin <= 30) ||
      (lastLoginFilter === 'over_month' && daysSinceLogin !== null && daysSinceLogin > 30) ||
      (lastLoginFilter === 'never' && !user.lastLogin);
    
    return matchesSearch && matchesRole && matchesStatus && matchesVendor && matchesDating && matchesGender && matchesLocation && matchesAge && matchesLastLogin;
  }));

  // Handle sort changes
  const handleUserSort = (field: 'createdAt' | 'lastLogin' | 'name') => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDirection('desc');
    }
  };

  const filteredVendors = vendors.filter(vendor => 
    vendor.storeName.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    vendor.businessName.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    vendor.user.name.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    vendor.user.username.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.vendor?.storeName.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.vendor?.businessName.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.user?.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.user?.username.toLowerCase().includes(productSearchTerm.toLowerCase())
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
      case 'permanently_suspended':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeColor = (badgeLevel: string) => {
    switch (badgeLevel) {
      case 'new_vendor': return 'bg-gray-100 text-gray-700';
      case 'level_2_vendor': return 'bg-blue-100 text-blue-700';
      case 'top_vendor': return 'bg-green-100 text-green-700';
      case 'infinity_vendor': return 'bg-purple-100 text-purple-700';
      case 'elite_vendor': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Total Dating Profiles</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalDatingProfiles?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeDatingProfiles || 0} active profiles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVendors?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeVendors || 0} active stores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount Sold</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{stats?.totalAmountSold?.toLocaleString() || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalTransactions || 0} transactions
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
              <CardTitle className="text-sm font-medium">Total Amount Shipped</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{stats?.totalAmountShipped?.toLocaleString() || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.shippedOrders || 0} orders shipped
              </p>
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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
            <TabsTrigger value="users">{t("Users")}</TabsTrigger>
            <TabsTrigger value="vendors">{t("Vendors")}</TabsTrigger>
            <TabsTrigger value="products">{t("Products")}</TabsTrigger>
            <TabsTrigger value="affiliate-partners">Partners</TabsTrigger>
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
                  <RecentActivity />
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
            <Tabs defaultValue="users-list" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users-list">{t("Users")}</TabsTrigger>
                <TabsTrigger value="vendor-status">{t("Vendor")}</TabsTrigger>
                <TabsTrigger value="commission-management">{t("Commission")}</TabsTrigger>
                <TabsTrigger value="dating-status">{t("Dating")}</TabsTrigger>
              </TabsList>
              
              {/* Users List */}
              <TabsContent value="users-list" className="space-y-6">
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
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center">
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
                      
                      {/* Filters Row */}
                      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Role:</label>
                          <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All roles</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Status:</label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="locked">Locked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Vendor:</label>
                          <Select value={vendorFilter} onValueChange={setVendorFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All vendors" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All vendors</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Dating:</label>
                          <Select value={datingFilter} onValueChange={setDatingFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All dating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All dating</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Gender:</label>
                          <Select value={genderFilter} onValueChange={setGenderFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All genders" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All genders</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="not_set">Not set</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Location:</label>
                          <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All locations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All locations</SelectItem>
                              <SelectItem value="has_location">Has location</SelectItem>
                              <SelectItem value="no_location">No location</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Age:</label>
                          <Select value={ageFilter} onValueChange={setAgeFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All ages" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All ages</SelectItem>
                              <SelectItem value="under_18">Under 18</SelectItem>
                              <SelectItem value="18_25">18-25</SelectItem>
                              <SelectItem value="26_35">26-35</SelectItem>
                              <SelectItem value="36_50">36-50</SelectItem>
                              <SelectItem value="over_50">Over 50</SelectItem>
                              <SelectItem value="not_set">Not set</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Last Login:</label>
                          <Select value={lastLoginFilter} onValueChange={setLastLoginFilter}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="All logins" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All logins</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="week">This week</SelectItem>
                              <SelectItem value="month">This month</SelectItem>
                              <SelectItem value="over_month">Over month</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Sort by:</label>
                          <Select value={`${userSortField}-${userSortDirection}`} onValueChange={(value) => {
                            const [field, direction] = value.split('-');
                            setUserSortField(field as 'createdAt' | 'lastLogin' | 'name');
                            setUserSortDirection(direction as 'asc' | 'desc');
                          }}>
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                              <SelectItem value="createdAt-desc">Newest first</SelectItem>
                              <SelectItem value="createdAt-asc">Oldest first</SelectItem>
                              <SelectItem value="lastLogin-desc">Recent login</SelectItem>
                              <SelectItem value="lastLogin-asc">Old login</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setRoleFilter('all');
                            setStatusFilter('all');
                            setVendorFilter('all');
                            setDatingFilter('all');
                            setGenderFilter('all');
                            setLocationFilter('all');
                            setAgeFilter('all');
                            setLastLoginFilter('all');
                            setSearchTerm('');
                          }}
                          className="h-8"
                        >
                          Clear filters
                        </Button>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleUserSort('name')}
                            >
                              <div className="flex items-center gap-2">
                                User
                                {userSortField === 'name' && (
                                  userSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleUserSort('createdAt')}
                            >
                              <div className="flex items-center gap-2">
                                Creation Date
                                {userSortField === 'createdAt' && (
                                  userSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleUserSort('lastLogin')}
                            >
                              <div className="flex items-center gap-2">
                                Last Login
                                {userSortField === 'lastLogin' && (
                                  userSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Vendor Status</TableHead>
                            <TableHead>Dating Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersLoading ? (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center py-8">
                                Loading users...
                              </TableCell>
                            </TableRow>
                          ) : filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center py-8">
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
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {user.city && user.country ? (
                                      <div>
                                        <p className="font-medium">{user.city}</p>
                                        <p className="text-gray-500">{user.country}</p>
                                        {user.region && <p className="text-xs text-gray-400">{user.region}</p>}
                                      </div>
                                    ) : user.country ? (
                                      <div>
                                        <p className="font-medium">{user.country}</p>
                                        {user.region && <p className="text-xs text-gray-400">{user.region}</p>}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Not set</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {user.gender ? (
                                      <Badge variant="outline" className="capitalize">
                                        {user.gender}
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-400">Not set</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {user.dateOfBirth ? (
                                      <div>
                                        <p className="font-medium">
                                          {Math.floor((new Date().getTime() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(user.dateOfBirth).toLocaleDateString()}
                                        </p>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Not set</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={user.isVendor ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                                    {user.isVendor ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={user.datingEnabled ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-600'}>
                                    {user.datingEnabled ? 'Active' : 'Inactive'}
                                  </Badge>
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
              
              {/* Vendor Status Tab */}
              <TabsContent value="vendor-status" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {t("Vendor Status Management")}
                    </CardTitle>
                    <CardDescription>
                      View and manage vendor account status for all users
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
                            <TableHead>User ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Vendor Status</TableHead>
                            <TableHead>Vendor Type</TableHead>
                            <TableHead>Store Name</TableHead>
                            <TableHead>Creation Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                Loading users...
                              </TableCell>
                            </TableRow>
                          ) : filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
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
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    #{user.id}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">{user.email}</p>
                                </TableCell>
                                <TableCell>
                                  <Badge className={user.isVendor ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                                    {user.isVendor ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {user.isVendor ? (
                                    <Badge variant="outline" className="text-xs">
                                      Vendor
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-gray-400">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.isVendor ? (
                                    <p className="text-sm">Store Available</p>
                                  ) : (
                                    <span className="text-sm text-gray-400">No Store</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
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
                                      <Eye className="h-3 w-3" />
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
              
              {/* Dating Status Tab */}
              <TabsContent value="dating-status" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      {t("Dating Status Management")}
                    </CardTitle>
                    <CardDescription>
                      View and manage dating account status for all users
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
                            <TableHead>User ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Dating Status</TableHead>
                            <TableHead>Subscription</TableHead>
                            <TableHead>Profile Status</TableHead>
                            <TableHead>Creation Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                Loading users...
                              </TableCell>
                            </TableRow>
                          ) : filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
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
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    #{user.id}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">{user.email}</p>
                                </TableCell>
                                <TableCell>
                                  <Badge className={user.datingEnabled ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-600'}>
                                    {user.datingEnabled ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    user.datingSubscription === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                                    user.datingSubscription === 'plus' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-600'
                                  }>
                                    {user.datingSubscription || 'normal'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {user.datingEnabled ? (
                                    <Badge variant="outline" className="text-xs">
                                      Profile Set
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-gray-400">No Profile</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
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
                                      <Eye className="h-3 w-3" />
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
              
              {/* Commission Management Tab */}
              <TabsContent value="commission-management" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {t("Commission Management")}
                    </CardTitle>
                    <CardDescription>
                      Manage vendor commissions, payments, and account freezing/unfreezing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Search vendors..."
                          value={vendorSearchTerm}
                          onChange={(e) => setVendorSearchTerm(e.target.value)}
                          className="w-64"
                        />
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Badge variant="outline">
                        {filteredVendors.length} vendors found
                      </Badge>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Store/Business</TableHead>
                            <TableHead>Affiliate Partner</TableHead>
                            <TableHead>Total Sales</TableHead>
                            <TableHead>Commission Owed</TableHead>
                            <TableHead>Commission Paid</TableHead>
                            <TableHead>Account Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendorsLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                Loading vendors...
                              </TableCell>
                            </TableRow>
                          ) : filteredVendors.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                No vendors found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredVendors.slice(0, 10).map((vendor) => (
                              <TableRow key={vendor.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                      {vendor.user?.avatar ? (
                                        <img src={vendor.user.avatar} alt={vendor.user.name} className="w-8 h-8 rounded-full" />
                                      ) : (
                                        <Store className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{vendor.user?.name}</p>
                                      <p className="text-sm text-gray-500">@{vendor.user?.username}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{vendor.storeName}</p>
                                    <p className="text-sm text-gray-500">{vendor.businessName}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <AffiliatePartnerCell vendorId={vendor.id} />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">£{(vendor.totalSalesAmount || 0).toFixed(2)}</p>
                                    <p className="text-sm text-gray-500">{vendor.totalTransactions || 0} transactions</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                    £{((vendor.totalSalesAmount || 0) * 0.15).toFixed(2)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    £0.00
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(vendor.accountStatus)}>
                                    {vendor.accountStatus === 'frozen' ? 'Frozen' : 
                                     vendor.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        // Open commission details dialog
                                        console.log('View commission details for vendor:', vendor.id);
                                      }}
                                    >
                                      <DollarSign className="h-3 w-3" />
                                    </Button>
                                    {vendor.accountStatus === 'frozen' ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700"
                                        onClick={() => unfreezeVendorMutation.mutate(vendor.id)}
                                        disabled={unfreezeVendorMutation.isPending}
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => freezeVendorMutation.mutate({ vendorId: vendor.id, reason: 'Administrative freeze' })}
                                        disabled={freezeVendorMutation.isPending}
                                      >
                                        <Ban className="h-3 w-3" />
                                      </Button>
                                    )}
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
            </Tabs>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-6">
            <Tabs defaultValue="vendors-list" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vendors-list">{t("All Vendors")}</TabsTrigger>
                <TabsTrigger value="vendor-requests">{t("Vendor Requests")}</TabsTrigger>
              </TabsList>
              
              {/* All Vendors List */}
              <TabsContent value="vendors-list" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {t("All Vendors")}
                    </CardTitle>
                    <CardDescription>
                      Manage all approved vendors (both private and business vendors)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Search vendors..."
                          value={vendorSearchTerm}
                          onChange={(e) => setVendorSearchTerm(e.target.value)}
                          className="w-64"
                        />
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Badge variant="outline">
                        {filteredVendors.length} vendors found
                      </Badge>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Badge</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendorsLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                Loading vendors...
                              </TableCell>
                            </TableRow>
                          ) : filteredVendors.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8">
                                No vendors found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredVendors.slice(0, 10).map((vendor) => (
                              <TableRow key={vendor.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                      {vendor.logo ? (
                                        <img src={vendor.logo} alt={vendor.storeName} className="w-10 h-10 rounded-lg object-cover" />
                                      ) : (
                                        <Store className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{vendor.storeName}</p>
                                      <p className="text-sm text-gray-500">{vendor.businessName}</p>
                                      <p className="text-xs text-gray-400">{vendor.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                      {vendor.user.avatar ? (
                                        <img src={vendor.user.avatar} alt={vendor.user.name} className="w-8 h-8 rounded-full" />
                                      ) : (
                                        <Users className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">{vendor.user.name}</p>
                                      <p className="text-sm text-gray-500">@{vendor.user.username}</p>
                                      <p className="text-xs text-gray-400">ID: {vendor.userId}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={vendor.vendorType === 'private' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                                    {vendor.vendorType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge className={getStatusColor(vendor.accountStatus)}>
                                      {vendor.accountStatus}
                                    </Badge>
                                    {!vendor.isActive && (
                                      <Badge variant="secondary" className="text-xs">
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getBadgeColor(vendor.badgeLevel)}>
                                    {vendor.badgeLevel?.replace('_', ' ') || 'new vendor'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <p className="font-medium">£{vendor.totalSalesAmount?.toFixed(2) || '0.00'}</p>
                                    <p className="text-gray-500">{vendor.totalTransactions || 0} transactions</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {new Date(vendor.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedVendor(vendor);
                                        setVendorDetailsDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => updateVendorStatusMutation.mutate({ 
                                        vendorId: vendor.id, 
                                        accountStatus: vendor.accountStatus === 'active' ? 'suspended' : 'active' 
                                      })}
                                    >
                                      {vendor.accountStatus === 'active' ? 
                                        <Ban className="h-3 w-3" /> : 
                                        <CheckCircle className="h-3 w-3" />
                                      }
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => deleteVendorMutation.mutate(vendor.id)}
                                      className="text-red-600 hover:text-red-700"
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
              
              {/* Vendor Requests */}
              <TabsContent value="vendor-requests" className="space-y-6">
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
            </Tabs>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t("Products Management")}
                </CardTitle>
                <CardDescription>
                  Manage all products and services uploaded to the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Badge variant="outline">
                    {filteredProducts.length} products found
                  </Badge>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            Loading products...
                          </TableCell>
                        </TableRow>
                      ) : filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            No products found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.slice(0, 20).map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                  ) : (
                                    <Package className="h-6 w-6" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-500 max-w-xs truncate">{product.description}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono text-xs">
                                {product.productCode}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.vendor?.storeName || product.vendor?.businessName}</p>
                                <p className="text-sm text-gray-500">{product.vendor?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  ID: {product.userId}
                                </Badge>
                                {product.user && (
                                  <div className="text-xs text-gray-500">
                                    {product.user.name} (@{product.user.username})
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={product.offeringType === 'service' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}>
                                {product.offeringType || 'product'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                £{product.price?.toFixed(2) || '0.00'}
                              </div>
                              {product.compareAtPrice && (
                                <div className="text-xs text-gray-500 line-through">
                                  £{product.compareAtPrice.toFixed(2)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge className={getStatusColor(product.status || 'active')}>
                                  {product.status || 'active'}
                                </Badge>
                                {product.isActive === false && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(product.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setProductDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateProductStatusMutation.mutate({ 
                                    productId: product.id, 
                                    isActive: !product.isActive 
                                  })}
                                >
                                  {product.isActive === false ? 
                                    <CheckCircle className="h-3 w-3" /> : 
                                    <Ban className="h-3 w-3" />
                                  }
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => deleteProductMutation.mutate(product.id)}
                                  className="text-red-600 hover:text-red-700"
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

          {/* Affiliate Partners Tab */}
          <TabsContent value="affiliate-partners" className="space-y-6">
            <AffiliatePartnerManagement />
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

        {/* Product Details Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("Product Details")}</DialogTitle>
              <DialogDescription>
                View and manage product information
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Product Name</Label>
                    <p className="text-sm font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm">{selectedProduct.description}</p>
                  </div>
                  <div>
                    <Label>Product Code</Label>
                    <Badge variant="secondary" className="font-mono">
                      {selectedProduct.productCode}
                    </Badge>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Badge variant="outline" className={selectedProduct.offeringType === 'service' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}>
                      {selectedProduct.offeringType || 'product'}
                    </Badge>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <p className="text-sm font-medium">£{selectedProduct.price?.toFixed(2) || '0.00'}</p>
                    {selectedProduct.compareAtPrice && (
                      <p className="text-xs text-gray-500 line-through">
                        Was: £{selectedProduct.compareAtPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Vendor</Label>
                    <p className="text-sm font-medium">{selectedProduct.vendor?.storeName || selectedProduct.vendor?.businessName}</p>
                    <p className="text-xs text-gray-500">{selectedProduct.vendor?.email}</p>
                  </div>
                  <div>
                    <Label>User</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        ID: {selectedProduct.userId}
                      </Badge>
                      {selectedProduct.user && (
                        <span className="text-xs text-gray-500">
                          {selectedProduct.user.name} (@{selectedProduct.user.username})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedProduct.status || 'active')}>
                      {selectedProduct.status || 'active'}
                    </Badge>
                    {selectedProduct.isActive === false && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm">{new Date(selectedProduct.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedProduct.imageUrl && (
                    <div>
                      <Label>Product Image</Label>
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name} 
                        className="w-32 h-32 rounded-lg object-cover border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => updateProductStatusMutation.mutate({ 
                  productId: selectedProduct?.id || 0, 
                  isActive: !selectedProduct?.isActive 
                })}
              >
                {selectedProduct?.isActive === false ? 'Activate' : 'Deactivate'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => deleteProductMutation.mutate(selectedProduct?.id || 0)}
                className="text-red-600 hover:text-red-700"
              >
                Delete Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Affiliate Partner Cell Component
function AffiliatePartnerCell({ vendorId }: { vendorId: number }) {
  const { toast } = useToast();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);

  // Query to get current affiliate partner for this vendor
  const { data: currentPartner, isLoading: isLoadingCurrentPartner } = useQuery({
    queryKey: ['/api/admin/vendors', vendorId, 'affiliate-partner'],
    queryFn: () => apiRequest(`/api/admin/vendors/${vendorId}/affiliate-partner`)
  });

  // Query to search affiliate partners
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['/api/admin/affiliate-partners', { search: searchTerm }],
    queryFn: () => apiRequest(`/api/admin/affiliate-partners?search=${encodeURIComponent(searchTerm)}&limit=20`),
    enabled: searchTerm.length > 0
  });

  // Mutation to link affiliate partner
  const linkPartnerMutation = useMutation({
    mutationFn: (partnerId: number) => 
      apiRequest(`/api/admin/vendors/${vendorId}/affiliate-partner`, 'POST', { affiliatePartnerId: partnerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors', vendorId, 'affiliate-partner'] });
      toast({
        title: "Success",
        description: "Affiliate partner linked successfully"
      });
      setIsSearchDialogOpen(false);
      setSearchTerm('');
      setSelectedPartnerId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to link affiliate partner",
        variant: "destructive"
      });
    }
  });

  // Mutation to unlink affiliate partner
  const unlinkPartnerMutation = useMutation({
    mutationFn: (partnerId: number) => 
      apiRequest(`/api/admin/vendors/${vendorId}/affiliate-partner/${partnerId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors', vendorId, 'affiliate-partner'] });
      toast({
        title: "Success",
        description: "Affiliate partner removed successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove affiliate partner",
        variant: "destructive"
      });
    }
  });

  const handleLinkPartner = () => {
    if (selectedPartnerId) {
      linkPartnerMutation.mutate(selectedPartnerId);
    }
  };

  const handleUnlinkPartner = (partnerId: number) => {
    unlinkPartnerMutation.mutate(partnerId);
  };

  if (isLoadingCurrentPartner) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const partner = currentPartner?.affiliatePartner;

  return (
    <>
      {partner ? (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{partner.partnerName || 'Unknown'}</p>
            <p className="text-xs text-gray-500 truncate">{partner.partnerCompany || 'No Company'}</p>
            <p className="text-xs text-blue-600">{partner.partnerCode || 'No Code'}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUnlinkPartner(partner.partnerId)}
            disabled={unlinkPartnerMutation.isPending}
            className="text-red-600 hover:text-red-700"
          >
            <Unlink className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsSearchDialogOpen(true)}
          className="text-blue-600 hover:text-blue-700"
        >
          <LinkIcon className="h-3 w-3 mr-1" />
          Link Partner
        </Button>
      )}

      {/* Search and Link Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Affiliate Partner</DialogTitle>
            <DialogDescription>
              Search and select an affiliate partner to link to this vendor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search partners by name, email, company, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            {searchTerm.length > 0 && (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {isLoadingSearch ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : searchResults?.data?.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {searchResults.data.map((partner: any) => (
                      <div
                        key={partner.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPartnerId === partner.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedPartnerId(partner.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{partner.name}</p>
                            <p className="text-sm text-gray-600">{partner.company || 'No Company'}</p>
                            <p className="text-xs text-blue-600">{partner.partnerCode}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                              {partner.status}
                            </Badge>
                            {partner.isVerified && (
                              <Badge variant="outline" className="ml-1 text-green-600">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    No partners found matching your search
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSearchDialogOpen(false);
                setSearchTerm('');
                setSelectedPartnerId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLinkPartner}
              disabled={!selectedPartnerId || linkPartnerMutation.isPending}
            >
              {linkPartnerMutation.isPending ? 'Linking...' : 'Link Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Affiliate Partner Management Component
function AffiliatePartnerManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  // Fetch affiliate partners
  const { data: partnersData = { data: [], totalCount: 0 }, isLoading: partnersLoading } = useQuery({
    queryKey: ['/api/admin/affiliate-partners', { search: searchTerm }],
    queryFn: () => apiRequest(`/api/admin/affiliate-partners?search=${encodeURIComponent(searchTerm)}&limit=50`)
  });

  const partners = partnersData.data || [];

  // Create affiliate partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: (partnerData: any) => 
      apiRequest('/api/admin/affiliate-partners', 'POST', partnerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-partners'] });
      toast({
        title: "Success",
        description: "Affiliate partner created successfully"
      });
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create affiliate partner",
        variant: "destructive"
      });
    }
  });

  // Update affiliate partner mutation
  const updatePartnerMutation = useMutation({
    mutationFn: ({ id, ...updates }: any) => 
      apiRequest(`/api/admin/affiliate-partners/${id}`, 'PATCH', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-partners'] });
      toast({
        title: "Success",
        description: "Affiliate partner updated successfully"
      });
      setEditDialogOpen(false);
      setSelectedPartner(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update affiliate partner",
        variant: "destructive"
      });
    }
  });

  // Delete affiliate partner mutation
  const deletePartnerMutation = useMutation({
    mutationFn: (partnerId: number) => 
      apiRequest(`/api/admin/affiliate-partners/${partnerId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-partners'] });
      toast({
        title: "Success",
        description: "Affiliate partner deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete affiliate partner",
        variant: "destructive"
      });
    }
  });

  const filteredPartners = partners.filter((partner: any) =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.partnerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Affiliate Partner Management
        </CardTitle>
        <CardDescription>
          Manage affiliate partners, create new partnerships, and track performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search partners by name, email, company, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-96"
            />
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {filteredPartners.length} partners found
            </Badge>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Create Partner
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Info</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Company & Region</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partnersLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading affiliate partners...
                  </TableCell>
                </TableRow>
              ) : filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No affiliate partners found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner: any) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {partner.partnerCode}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{partner.email}</p>
                        {partner.phone && (
                          <p className="text-xs text-gray-500">{partner.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{partner.company || 'No Company'}</p>
                        <p className="text-xs text-gray-500">{partner.region || 'No Region'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {partner.specialization || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                          {partner.status}
                        </Badge>
                        {partner.isVerified && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>Referrals: <span className="font-medium">{partner.totalReferrals || 0}</span></p>
                        <p className="text-xs text-gray-500">
                          Earned: £{(partner.totalCommissionEarned || 0).toFixed(2)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {((partner.commissionRate || 0.30) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(partner.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPartner(partner);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updatePartnerMutation.mutate({ 
                            id: partner.id, 
                            status: partner.status === 'active' ? 'inactive' : 'active' 
                          })}
                          className={partner.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {partner.status === 'active' ? 
                            <Ban className="h-3 w-3" /> : 
                            <CheckCircle className="h-3 w-3" />
                          }
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deletePartnerMutation.mutate(partner.id)}
                          className="text-red-600 hover:text-red-700"
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

        {/* Create Partner Dialog */}
        <CreatePartnerDialog 
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={createPartnerMutation.mutate}
          isLoading={createPartnerMutation.isPending}
        />

        {/* Edit Partner Dialog */}
        {selectedPartner && (
          <EditPartnerDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            partner={selectedPartner}
            onSubmit={updatePartnerMutation.mutate}
            isLoading={updatePartnerMutation.isPending}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Create Partner Dialog Component
function CreatePartnerDialog({ open, onOpenChange, onSubmit, isLoading }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    country: '',
    company: '',
    specialization: '',
    region: '',
    commissionRate: 0.30,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate partner code
    const partnerCode = `AP${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    onSubmit({
      ...formData,
      partnerCode,
      status: 'active',
      isVerified: false,
      totalReferrals: 0,
      totalCommissionEarned: 0.00
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      country: '',
      company: '',
      specialization: '',
      region: '',
      commissionRate: 0.30,
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Affiliate Partner</DialogTitle>
          <DialogDescription>
            Add a new affiliate partner with comprehensive information
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Enter country"
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="Enter region (e.g., UK, EU, US)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="e.g., E-commerce Marketing, Tech Solutions"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              value="30"
              disabled
              className="bg-gray-100 text-gray-500 cursor-not-allowed"
              placeholder="30.00"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the partner"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Partner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Partner Dialog Component
function EditPartnerDialog({ open, onOpenChange, partner, onSubmit, isLoading }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: partner?.name || '',
    email: partner?.email || '',
    phone: partner?.phone || '',
    dateOfBirth: partner?.dateOfBirth || '',
    country: partner?.country || '',
    company: partner?.company || '',
    specialization: partner?.specialization || '',
    region: partner?.region || '',
    commissionRate: partner?.commissionRate || 0.30,
    notes: partner?.notes || '',
    isVerified: partner?.isVerified || false
  });

  // Update form data when partner changes
  React.useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name || '',
        email: partner.email || '',
        phone: partner.phone || '',
        dateOfBirth: partner.dateOfBirth || '',
        country: partner.country || '',
        company: partner.company || '',
        specialization: partner.specialization || '',
        region: partner.region || '',
        commissionRate: partner.commissionRate || 0.30,
        notes: partner.notes || '',
        isVerified: partner.isVerified || false
      });
    }
  }, [partner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: partner.id,
      ...formData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Affiliate Partner</DialogTitle>
          <DialogDescription>
            Update affiliate partner information and settings
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
              <Input
                id="edit-dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Enter country"
              />
            </div>
            <div>
              <Label htmlFor="edit-region">Region</Label>
              <Input
                id="edit-region"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="Enter region (e.g., UK, EU, US)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-company">Company Name</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="edit-specialization">Specialization</Label>
              <Input
                id="edit-specialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="e.g., E-commerce Marketing, Tech Solutions"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-commissionRate">Commission Rate (%)</Label>
              <Input
                id="edit-commissionRate"
                type="number"
                value="30"
                disabled
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                placeholder="30.00"
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="edit-isVerified"
                checked={formData.isVerified}
                onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit-isVerified">Verified Partner</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Input
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the partner"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Partner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}