import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Package,
  Truck,
  Eye,
  Search,
  Filter,

  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Phone,
  Mail,

  RefreshCw,
  ArrowUpDown
} from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  priority: 'normal' | 'high' | 'urgent';
}

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  variant?: string;
}

interface Address {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface VendorOrderManagementProps {
  vendorId: number;
}

export default function VendorOrderManagement({ vendorId }: VendorOrderManagementProps) {
  const { toast } = useToast();
  const { formatPriceFromGBP } = useCurrency();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', carrier: '', notes: '' });

  // Fetch vendor orders
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['/api/vendors/orders', vendorId, searchTerm, statusFilter, paymentFilter, dateRange, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        vendorId: vendorId.toString(),
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        paymentStatus: paymentFilter !== 'all' ? paymentFilter : '',
        dateRange: dateRange !== 'all' ? dateRange : '',
        sortBy,
        sortOrder
      });
      
      const response = await apiRequest(`/api/vendors/orders?${params}`);
      return response;
    },
    enabled: !!vendorId
  });

  // Order status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/vendors/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, vendorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/orders'] });
      toast({
        title: "Success",
        description: "Order status updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  });

  // Shipping tracking mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async (trackingData: any) => {
      return await apiRequest(`/api/vendors/orders/${selectedOrder?.id}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trackingData, vendorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/orders'] });
      setShowTrackingDialog(false);
      setTrackingForm({ trackingNumber: '', carrier: '', notes: '' });
      toast({
        title: "Success",
        description: "Tracking information updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tracking information",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'outline' as const, icon: Clock },
      confirmed: { label: 'Confirmed', variant: 'secondary' as const, icon: CheckCircle },
      processing: { label: 'Processing', variant: 'default' as const, icon: Package },
      shipped: { label: 'Shipped', variant: 'default' as const, icon: Truck },
      delivered: { label: 'Delivered', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
      refunded: { label: 'Refunded', variant: 'outline' as const, icon: RefreshCw }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'outline' as const },
      paid: { label: 'Paid', variant: 'default' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
      refunded: { label: 'Refunded', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      normal: { label: 'Normal', variant: 'secondary' as const },
      high: { label: 'High', variant: 'outline' as const },
      urgent: { label: 'Urgent', variant: 'destructive' as const }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const openTrackingDialog = (order: Order) => {
    setSelectedOrder(order);
    setTrackingForm({
      trackingNumber: order.trackingNumber || '',
      carrier: order.carrier || '',
      notes: order.notes || ''
    });
    setShowTrackingDialog(true);
  };

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleTrackingSubmit = () => {
    if (!selectedOrder) return;
    updateTrackingMutation.mutate(trackingForm);
  };

  const filteredOrders = orders?.filter((order: Order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order Management</h2>
          <p className="text-muted-foreground">
            Track and manage your customer orders and shipments
          </p>
        </div>

      </div>

      {/* Order Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o: Order) => ['pending', 'confirmed'].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o: Order) => o.status === 'shipped').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPriceFromGBP(filteredOrders.reduce((sum: number, order: Order) => sum + order.total, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by number, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: Order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.items.length} items</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(order.status)}
                      {order.trackingNumber && (
                        <div className="text-xs text-muted-foreground">
                          Tracking: {order.trackingNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                  <TableCell className="font-medium">{formatPriceFromGBP(order.total)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusUpdate(order.id, value)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTrackingDialog(order)}
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Orders will appear here once customers start purchasing your products'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{selectedOrder.customerPhone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      {getPaymentBadge(selectedOrder.paymentStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div className="flex justify-between">
                        <span>Tracking:</span>
                        <span>{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item: OrderItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                {item.variant && (
                                  <div className="text-sm text-muted-foreground">{item.variant}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{item.sku}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatPriceFromGBP(item.price)}</TableCell>
                          <TableCell className="font-medium">{formatPriceFromGBP(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{selectedOrder.shippingAddress.name}</div>
                      {selectedOrder.shippingAddress.company && (
                        <div>{selectedOrder.shippingAddress.company}</div>
                      )}
                      <div>{selectedOrder.shippingAddress.address1}</div>
                      {selectedOrder.shippingAddress.address2 && (
                        <div>{selectedOrder.shippingAddress.address2}</div>
                      )}
                      <div>
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                      </div>
                      <div>{selectedOrder.shippingAddress.country}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPriceFromGBP(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{formatPriceFromGBP(selectedOrder.shipping)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatPriceFromGBP(selectedOrder.tax)}</span>
                      </div>
                      {selectedOrder.discount && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatPriceFromGBP(selectedOrder.discount)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{formatPriceFromGBP(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tracking Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={trackingForm.trackingNumber}
                onChange={(e) => setTrackingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Enter tracking number"
              />
            </div>
            
            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Select
                value={trackingForm.carrier}
                onValueChange={(value) => setTrackingForm(prev => ({ ...prev, carrier: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="royal-mail">Royal Mail</SelectItem>
                  <SelectItem value="dpd">DPD</SelectItem>
                  <SelectItem value="hermes">Hermes</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={trackingForm.notes}
                onChange={(e) => setTrackingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional shipping notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTrackingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTrackingSubmit} disabled={updateTrackingMutation.isPending}>
              {updateTrackingMutation.isPending ? 'Updating...' : 'Update Tracking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}