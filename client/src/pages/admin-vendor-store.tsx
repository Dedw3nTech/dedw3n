import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { 
  ArrowLeft, Store, Package, DollarSign, TrendingUp, Users, Settings, Shield, 
  Edit, Trash2, Eye, Ban, CheckCircle, AlertTriangle, MapPin, Phone, Mail,
  Calendar, Clock, Star, ShoppingCart, FileText, Download
} from 'lucide-react';

interface VendorStoreData {
  id: number;
  userId: number;
  vendorType: string;
  accountStatus: string;
  storeName: string;
  businessName: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo: string;
  badgeLevel: string;
  isActive: boolean;
  totalSalesAmount: number;
  totalTransactions: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    status: string;
    createdAt: string;
  };
  products: Array<{
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
    stock: number;
    status: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: number;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer: {
      name: string;
      email: string;
    };
  }>;
}

export default function AdminVendorStore() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useMasterBatchTranslation();
  
  const userId = location.split('/').pop();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'suspend' | 'activate' | 'delete' | null>(null);

  // Fetch vendor store data
  const { data: vendorData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/vendor-store', userId],
    enabled: !!userId
  });

  // Update vendor status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { action: string; reason?: string }) => {
      return apiRequest(`/api/admin/vendor-store/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-store', userId] });
      setStatusDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  });

  // Update vendor details mutation
  const updateDetailsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/admin/vendor-store/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Vendor details updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-store', userId] });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update vendor details", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vendor store data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!vendorData && !isLoading)) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-control-center">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vendor Store Not Found</h3>
              <p className="text-gray-600">This user does not have an active vendor store or the data could not be loaded.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendor = vendorData as VendorStoreData;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge?.toLowerCase()) {
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin-control-center">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6" />
              Vendor Store Management
            </h1>
            <p className="text-gray-600">Manage {vendor.storeName} store details and operations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
          <Button 
            variant={vendor.accountStatus === 'active' ? 'destructive' : 'default'}
            onClick={() => {
              setSelectedAction(vendor.accountStatus === 'active' ? 'suspend' : 'activate');
              setStatusDialogOpen(true);
            }}
          >
            {vendor.accountStatus === 'active' ? (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Suspend Store
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate Store
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {vendor.logo ? (
                    <img src={vendor.logo} alt={vendor.storeName} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <Store className="h-8 w-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{vendor.storeName}</h3>
                  <p className="text-gray-600 mb-2">{vendor.businessName}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(vendor.accountStatus)}>
                      {vendor.accountStatus}
                    </Badge>
                    <Badge variant="outline" className={vendor.vendorType === 'private' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                      {vendor.vendorType}
                    </Badge>
                    <Badge className={getBadgeColor(vendor.badgeLevel)}>
                      {vendor.badgeLevel?.replace('_', ' ') || 'new vendor'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{vendor.description}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    <span>{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <span>{vendor.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.address || 'Not provided'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(vendor.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    <span>ID: #{vendor.id}</span>
                  </div>
                  {vendor.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {vendor.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products ({vendor.products?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.products && vendor.products.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.products.slice(0, 10).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-cover" />
                                ) : (
                                  <Package className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500">ID: {product.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>£{product.price.toFixed(2)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Badge className={product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No products found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders ({vendor.orders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.orders && vendor.orders.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.orders.slice(0, 10).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">ID: {order.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customer.name}</p>
                              <p className="text-sm text-gray-500">{order.customer.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>£{order.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {vendor.user.avatar ? (
                    <img src={vendor.user.avatar} alt={vendor.user.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <Users className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{vendor.user.name}</p>
                  <p className="text-sm text-gray-500">@{vendor.user.username}</p>
                  <p className="text-xs text-gray-400">ID: {vendor.user.id}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm">{vendor.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Role:</span>
                  <Badge variant="outline">{vendor.user.role}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={vendor.user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {vendor.user.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Joined:</span>
                  <span className="text-sm">{new Date(vendor.user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Store Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Total Sales</span>
                  </div>
                  <p className="text-xl font-bold text-green-900">£{vendor.totalSalesAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Transactions</span>
                  </div>
                  <p className="text-xl font-bold text-blue-900">{vendor.totalTransactions || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Products</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">{vendor.products?.length || 0}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Badge Level</span>
                  </div>
                  <p className="text-lg font-bold text-orange-900 capitalize">{vendor.badgeLevel?.replace('_', ' ') || 'New'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Store Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                View Public Store
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'suspend' ? 'Suspend Vendor Store' : 
               selectedAction === 'activate' ? 'Activate Vendor Store' : 
               'Delete Vendor Store'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'suspend' ? 'This will suspend the vendor store and prevent new sales.' :
               selectedAction === 'activate' ? 'This will activate the vendor store and allow sales.' :
               'This will permanently delete the vendor store and all associated data.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedAction === 'suspend' || selectedAction === 'delete' ? 'destructive' : 'default'}
              onClick={() => updateStatusMutation.mutate({ action: selectedAction || '' })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Processing...' : `Confirm ${selectedAction}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor Store Details</DialogTitle>
            <DialogDescription>
              Update store information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" defaultValue={vendor.storeName} />
            </div>
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" defaultValue={vendor.businessName} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" defaultValue={vendor.description} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={vendor.email} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue={vendor.phone} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue={vendor.address} />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" defaultValue={vendor.website} />
            </div>
            <div>
              <Label htmlFor="badgeLevel">Badge Level</Label>
              <Select defaultValue={vendor.badgeLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_vendor">New Vendor</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateDetailsMutation.mutate({})}
              disabled={updateDetailsMutation.isPending}
            >
              {updateDetailsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}