import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { 
  Activity, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Lock, 
  Unlock, 
  UserCheck, 
  UserX, 
  Shield, 
  Database,
  Settings,
  RefreshCw,
  UserPlus,
  Mail,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  isLocked: boolean;
  failedLoginAttempts: number;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

export default function OperationsAdmin() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/admin/operations/overview'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/operations/overview');
      return response.json();
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{users: User[], totalCount: number}>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
  });

  const users = usersData?.users || [];
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/lock`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Success',
        description: 'User account locked successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to lock user account',
        variant: 'destructive',
      });
    },
  });

  const unlockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/unlock`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Success',
        description: 'User account unlocked successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to unlock user account',
        variant: 'destructive',
      });
    },
  });

  const promoteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/promote`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Success',
        description: 'User promoted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to promote user',
        variant: 'destructive',
      });
    },
  });

  if (overviewLoading || usersLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading admin tools...</span>
        </div>
      </div>
    );
  }

  const lockedUsers = users.filter(u => u.isLocked).length;
  const activeUsers = users.filter(u => !u.isLocked).length;
  const recentUsers = users.filter(u => {
    const createdDate = new Date(u.createdAt);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-operations-admin-title">Operations Admin</h1>
        <p className="text-gray-600">Comprehensive user management tools and platform operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} active, {lockedUsers} locked
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-new-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users (7d)</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUsers}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card data-testid="card-fraud-stats">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.fraud?.openCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500 font-semibold">{overview?.fraud?.criticalCases || 0}</span> critical
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-payouts-stats">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview?.payouts?.totalAmount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.payouts?.pending || 0} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management Tools
            </CardTitle>
            <CardDescription>Search, filter, and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
                data-testid="input-user-search"
              />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.slice(0, 10).map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isLocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.location.href = `/admin-control-center?tab=users&userId=${user.id}`}
                            data-testid={`button-view-user-${user.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {user.isLocked ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => unlockUserMutation.mutate(user.id)}
                              data-testid={`button-unlock-user-${user.id}`}
                            >
                              <Unlock className="h-3 w-3 text-green-500" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => lockUserMutation.mutate(user.id)}
                              data-testid={`button-lock-user-${user.id}`}
                            >
                              <Lock className="h-3 w-3 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length > 10 && (
              <div className="text-center text-sm text-muted-foreground">
                Showing 10 of {filteredUsers.length} users. 
                <a href="/admin-control-center?tab=users" className="ml-2 text-blue-500 hover:underline">
                  View all users →
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a 
                href="/admin-control-center?tab=users" 
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                data-testid="link-quick-users"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">User Management</div>
                    <div className="text-xs text-muted-foreground">Manage all user accounts</div>
                  </div>
                </div>
              </a>
              
              <a 
                href="/admin-control-center?tab=operations-fraud" 
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                data-testid="link-quick-fraud"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <div className="font-medium">Fraud Detection</div>
                    <div className="text-xs text-muted-foreground">Review fraud cases</div>
                  </div>
                </div>
              </a>
              
              <a 
                href="/admin-control-center?tab=operations-credit" 
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                data-testid="link-quick-credit"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium">Credit & Collections</div>
                    <div className="text-xs text-muted-foreground">Manage payments</div>
                  </div>
                </div>
              </a>
              
              <a 
                href="/admin-control-center?tab=reports" 
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                data-testid="link-quick-reports"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <div className="flex-1">
                    <div className="font-medium">Content Moderation</div>
                    <div className="text-xs text-muted-foreground">Review user reports</div>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Database</div>
                    <div className="text-xs text-muted-foreground">Operational</div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Object Storage</div>
                    <div className="text-xs text-muted-foreground">Healthy</div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">API Services</div>
                    <div className="text-xs text-muted-foreground">Running</div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
