import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Edit3, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Search, 
  Trash2,
  Mail,
  Ban
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

export default function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const { data: usersData = { users: [], totalCount: 0 }, isLoading: usersLoading } = useQuery<{users: User[], totalCount: number}>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
  });
  
  const users = usersData.users || [];

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

  return (
    <div className="space-y-6">
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
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by username, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })} data-testid="button-refresh-users">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

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
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
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
                            data-testid={`button-edit-user-${user.id}`}
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
                            data-testid={`button-lock-user-${user.id}`}
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

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Manage user account settings and permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input value={selectedUser.username} disabled />
                </div>
                
                <div>
                  <Label>Email</Label>
                  <Input value={selectedUser.email} disabled />
                </div>
              </div>
              
              <div>
                <Label>Full Name</Label>
                <Input 
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  data-testid="input-edit-user-name"
                />
              </div>
              
              <div>
                <Label>Role</Label>
                <Select 
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                >
                  <SelectTrigger data-testid="select-edit-user-role">
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
              
              <div className="flex gap-4 items-center">
                <Label>Account Status</Label>
                <Badge className={selectedUser.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  {selectedUser.isLocked ? 'Locked' : 'Active'}
                </Badge>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    updateUserMutation.mutate({
                      userId: selectedUser.id,
                      updates: {
                        name: selectedUser.name,
                        role: selectedUser.role
                      }
                    });
                  }}
                  className="flex-1"
                  data-testid="button-save-user"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
                
                <Button 
                  variant={selectedUser.isLocked ? "default" : "destructive"}
                  onClick={() => {
                    updateUserMutation.mutate({
                      userId: selectedUser.id,
                      updates: { 
                        isLocked: !selectedUser.isLocked,
                        failedLoginAttempts: 0
                      }
                    });
                  }}
                  data-testid="button-toggle-lock-user"
                >
                  {selectedUser.isLocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-1" />
                      Unlock Account
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-1" />
                      Lock Account
                    </>
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" data-testid="button-delete-user-trigger">
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
                        data-testid="button-confirm-delete-user"
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
    </div>
  );
}
