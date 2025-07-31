import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  ShieldAlert, 
  Store, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  UserCheck, 
  UserX, 
  Mail,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  MessageSquare,
  Package,
  ShoppingCart,
  CreditCard,
  Activity,
  UserPlus,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  isVendor: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  region?: string;
  country?: string;
}

interface Report {
  id: number;
  reporterUserId: number;
  reportedUserId?: number;
  contentType: string;
  contentId: number;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reporterUser?: User;
  reportedUser?: User;
}

interface VendorRequest {
  id: number;
  userId: number;
  vendorType: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  description?: string;
  status: string;
  createdAt: string;
  user?: User;
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
}

export default function AdminControlCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedVendorRequest, setSelectedVendorRequest] = useState<VendorRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  // Check if user is admin
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
            <p>You don't have permission to access the Admin Control Center.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch admin statistics
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
  });

  // Fetch all users
  const { data: usersData = { users: [], totalCount: 0 }, isLoading: usersLoading } = useQuery<{users: User[], totalCount: number}>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
  });
  
  const users = usersData.users || [];

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/admin/reports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/reports');
      return response.json();
    },
  });

  // Fetch vendor requests
  const { data: vendorRequests = [], isLoading: vendorRequestsLoading } = useQuery<VendorRequest[]>({
    queryKey: ['/api/admin/vendor-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/vendor-requests');
      return response.json();
    },
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
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
        description: "Report status has been updated.",
      });
      setReportDialogOpen(false);
    },
  });

  // Vendor request mutations
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
        description: "Vendor request has been processed.",
      });
      setVendorDialogOpen(false);
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <ShieldAlert className="h-8 w-8 text-red-600" />
            Admin Control Center
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive platform moderation and management system
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
              <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeUsers24h || 0} active in 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendors</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVendors?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingVendorRequests || 0} pending requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                Active listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingReports || '0'}</div>
              <p className="text-xs text-muted-foreground">
                Pending review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Vendor Requests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage all platform users, roles, and account status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by username, name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {/* Users Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading users...
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  {user.avatar ? (
                                    <img 
                                      src={user.avatar} 
                                      alt={user.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm font-medium">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                  <div className="text-xs text-gray-400">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(user.role)}>
                                {user.role}
                              </Badge>
                              {user.isVendor && (
                                <Badge variant="outline" className="ml-1">
                                  Vendor
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge className={user.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                  {user.isLocked ? 'Locked' : 'Active'}
                                </Badge>
                                {user.failedLoginAttempts > 0 && (
                                  <span className="text-xs text-red-500">
                                    {user.failedLoginAttempts} failed attempts
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.lastLogin ? 
                                  new Date(user.lastLogin).toLocaleDateString() : 
                                  'Never'
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.country && user.region ? 
                                  `${user.country}, ${user.region}` : 
                                  'Not specified'
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setUserDialogOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                
                                <Button
                                  variant={user.isLocked ? "default" : "destructive"}
                                  size="sm"
                                  onClick={() => {
                                    updateUserMutation.mutate({
                                      userId: user.id,
                                      updates: { 
                                        isLocked: !user.isLocked,
                                        failedLoginAttempts: 0
                                      }
                                    });
                                  }}
                                >
                                  {user.isLocked ? (
                                    <>
                                      <Unlock className="h-3 w-3 mr-1" />
                                      Unlock
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3 mr-1" />
                                      Lock
                                    </>
                                  )}
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
                  Content Reports
                </CardTitle>
                <CardDescription>
                  Review and moderate reported content and users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Content Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading reports...
                          </TableCell>
                        </TableRow>
                      ) : reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No reports found
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <div className="font-medium">
                                {report.reporterUser?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{report.reporterUser?.username || 'unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {report.contentType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">
                                {report.reason}
                              </div>
                            </TableCell>
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
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setReportDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                                
                                {report.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        updateReportMutation.mutate({
                                          reportId: report.id,
                                          status: 'approved'
                                        });
                                      }}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        updateReportMutation.mutate({
                                          reportId: report.id,
                                          status: 'rejected'
                                        });
                                      }}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </>
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

          {/* Vendor Requests Tab */}
          <TabsContent value="vendors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Vendor Account Requests
                </CardTitle>
                <CardDescription>
                  Review and approve vendor applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Business Details</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied Date</TableHead>
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
                        vendorRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="font-medium">
                                {request.user?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{request.user?.username || 'unknown'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {request.user?.email || 'No email'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <div className="font-medium">
                                  {request.businessName || 'No business name'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {request.businessEmail || 'No business email'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {request.businessPhone || 'No phone'}
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
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVendorRequest(request);
                                    setVendorDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                                
                                {request.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        updateVendorRequestMutation.mutate({
                                          requestId: request.id,
                                          status: 'approved'
                                        });
                                      }}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        updateVendorRequestMutation.mutate({
                                          requestId: request.id,
                                          status: 'rejected'
                                        });
                                      }}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-sm text-gray-500">Total Registered Users</p>
                  
                  <div className="mt-4">
                    <div className="text-lg font-semibold">{stats?.activeUsers24h || 0}</div>
                    <p className="text-sm text-gray-500">Active Users (24h)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    £{stats?.totalRevenue?.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  
                  <div className="mt-4">
                    <div className="text-lg font-semibold">{stats?.totalOrders || 0}</div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Server Status</span>
                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database</span>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Email Service</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Edit Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="max-w-md">
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
                  <Label>Role</Label>
                  <Select 
                    defaultValue={selectedUser.role}
                    onValueChange={(value) => 
                      setSelectedUser({...selectedUser, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={selectedUser.isLocked}
                    onChange={(e) => 
                      setSelectedUser({...selectedUser, isLocked: e.target.checked})
                    }
                  />
                  <Label>Account Locked</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      updateUserMutation.mutate({
                        userId: selectedUser.id,
                        updates: {
                          role: selectedUser.role,
                          isLocked: selectedUser.isLocked,
                          failedLoginAttempts: selectedUser.isLocked ? selectedUser.failedLoginAttempts : 0
                        }
                      });
                    }}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete 
                          {selectedUser.name}'s account and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUserMutation.mutate(selectedUser.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report Review Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Report</DialogTitle>
              <DialogDescription>
                Review reported content and take appropriate action
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reporter</Label>
                    <p className="text-sm">{selectedReport.reporterUser?.name}</p>
                    <p className="text-xs text-gray-500">@{selectedReport.reporterUser?.username}</p>
                  </div>
                  
                  <div>
                    <Label>Content Type</Label>
                    <Badge variant="outline">{selectedReport.contentType}</Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Reason</Label>
                  <p className="text-sm">{selectedReport.reason}</p>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedReport.description || 'No additional description provided'}
                  </p>
                </div>
                
                <div>
                  <Label>Current Status</Label>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
                
                {selectedReport.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        updateReportMutation.mutate({
                          reportId: selectedReport.id,
                          status: 'approved'
                        });
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Report
                    </Button>
                    
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        updateReportMutation.mutate({
                          reportId: selectedReport.id,
                          status: 'rejected'
                        });
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Report
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Vendor Request Dialog */}
        <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Vendor Application</DialogTitle>
              <DialogDescription>
                Review vendor application details and approve or reject
              </DialogDescription>
            </DialogHeader>
            
            {selectedVendorRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Applicant</Label>
                    <p className="text-sm">{selectedVendorRequest.user?.name}</p>
                    <p className="text-xs text-gray-500">@{selectedVendorRequest.user?.username}</p>
                    <p className="text-xs text-gray-500">{selectedVendorRequest.user?.email}</p>
                  </div>
                  
                  <div>
                    <Label>Vendor Type</Label>
                    <Badge variant="outline">{selectedVendorRequest.vendorType}</Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Business Name</Label>
                  <p className="text-sm">{selectedVendorRequest.businessName || 'Not provided'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Business Email</Label>
                    <p className="text-sm">{selectedVendorRequest.businessEmail || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <Label>Business Phone</Label>
                    <p className="text-sm">{selectedVendorRequest.businessPhone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Business Address</Label>
                  <p className="text-sm">{selectedVendorRequest.businessAddress || 'Not provided'}</p>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedVendorRequest.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <Label>Current Status</Label>
                  <Badge className={getStatusColor(selectedVendorRequest.status)}>
                    {selectedVendorRequest.status}
                  </Badge>
                </div>
                
                {selectedVendorRequest.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        updateVendorRequestMutation.mutate({
                          requestId: selectedVendorRequest.id,
                          status: 'approved'
                        });
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Application
                    </Button>
                    
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        updateVendorRequestMutation.mutate({
                          requestId: selectedVendorRequest.id,
                          status: 'rejected'
                        });
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Application
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}