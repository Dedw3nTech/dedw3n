import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMasterTranslation } from '@/hooks/use-master-translation';
import { Package, RefreshCw, ArrowLeft, Eye, FileText, Calendar, DollarSign, Truck, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  shippingCost: number;
  paymentMethod: string;
  paymentStatus: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  status: string;
  product: {
    id: number;
    name: string;
    description: string;
    images: string[];
  };
  vendor: {
    id: number;
    storeName: string;
  };
}

interface Return {
  id: number;
  reason: string;
  description: string;
  status: string;
  requestedQuantity: number;
  approvedQuantity: number;
  refundAmount: number;
  returnShippingCost: number;
  vendorNotes: string;
  customerNotes: string;
  returnTrackingNumber: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  orderItem: {
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
  product: {
    id: number;
    name: string;
    images: string[];
  };
  vendor: {
    id: number;
    storeName: string;
  };
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'requested':
      return 'secondary';
    case 'processing':
    case 'shipped':
      return 'default';
    case 'delivered':
    case 'completed':
      return 'default';
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'requested':
      return <Clock className="h-4 w-4" />;
    case 'processing':
      return <RefreshCw className="h-4 w-4" />;
    case 'shipped':
      return <Truck className="h-4 w-4" />;
    case 'delivered':
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export default function OrdersReturns() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('all');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnFormData, setReturnFormData] = useState({
    orderItemId: 0,
    vendorId: 0,
    reason: '',
    description: '',
    requestedQuantity: 1,
    customerNotes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { translateText } = useMasterTranslation();

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders', orderStatusFilter],
    queryFn: async () => {
      const url = orderStatusFilter ? `/api/orders?status=${orderStatusFilter}` : '/api/orders';
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });

  // Fetch returns
  const { data: returns = [], isLoading: returnsLoading } = useQuery<Return[]>({
    queryKey: ['/api/returns', returnStatusFilter],
    queryFn: async () => {
      const url = returnStatusFilter ? `/api/returns?status=${returnStatusFilter}` : '/api/returns';
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });

  // Fetch order details
  const { data: orderDetails } = useQuery<Order>({
    queryKey: ['/api/orders', selectedOrder?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/orders/${selectedOrder?.id}`);
      return response.json();
    },
    enabled: !!selectedOrder?.id
  });

  // Create return mutation
  const createReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const response = await apiRequest('POST', '/api/returns', returnData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Request Submitted",
        description: "Your return request has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
      setReturnDialogOpen(false);
      setReturnFormData({
        orderItemId: 0,
        vendorId: 0,
        reason: '',
        description: '',
        requestedQuantity: 1,
        customerNotes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit return request",
        variant: "destructive",
      });
    }
  });

  // Cancel return mutation
  const cancelReturnMutation = useMutation({
    mutationFn: async (returnId: number) => {
      const response = await apiRequest('PATCH', `/api/returns/${returnId}/cancel`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Cancelled",
        description: "Your return request has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel return",
        variant: "destructive",
      });
    }
  });

  const handleCreateReturn = (orderItem: OrderItem, vendorId: number) => {
    setReturnFormData({
      orderItemId: orderItem.id,
      vendorId: vendorId,
      reason: '',
      description: '',
      requestedQuantity: 1,
      customerNotes: ''
    });
    setReturnDialogOpen(true);
  };

  const handleSubmitReturn = () => {
    if (!returnFormData.reason || !returnFormData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createReturnMutation.mutate(returnFormData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{translateText('Orders & Returns')}</h1>
            <p className="text-gray-600">{translateText('Track your purchases and manage returns')}</p>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {translateText('My Orders')}
            </TabsTrigger>
            <TabsTrigger value="returns" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {translateText('Returns')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">{translateText('Order History')}</h2>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={translateText('Filter by status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translateText('All Orders')}</SelectItem>
                  <SelectItem value="pending">{translateText('Pending')}</SelectItem>
                  <SelectItem value="processing">{translateText('Processing')}</SelectItem>
                  <SelectItem value="shipped">{translateText('Shipped')}</SelectItem>
                  <SelectItem value="delivered">{translateText('Delivered')}</SelectItem>
                  <SelectItem value="cancelled">{translateText('Cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600">You haven't placed any orders yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Order #{order.id}
                            <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${order.totalAmount.toFixed(2)}
                            </span>
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {order.shippingAddress && (
                      <CardContent>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Truck className="h-4 w-4 mt-0.5" />
                          <span>Shipping to: {order.shippingAddress}</span>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="returns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Return Requests</h2>
              <Select value={returnStatusFilter} onValueChange={setReturnStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Returns</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {returnsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : returns.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Returns Found</h3>
                  <p className="text-gray-600">You haven't submitted any return requests.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {returns.map((returnItem) => (
                  <Card key={returnItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {returnItem.product.name}
                            <Badge variant={getStatusBadgeVariant(returnItem.status)} className="flex items-center gap-1">
                              {getStatusIcon(returnItem.status)}
                              {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <span>Return #{returnItem.id}</span>
                              <span>Vendor: {returnItem.vendor.storeName}</span>
                              <span>Reason: {returnItem.reason}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(returnItem.createdAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {returnItem.status === 'requested' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelReturnMutation.mutate(returnItem.id)}
                              disabled={cancelReturnMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReturn(returnItem)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Requested Qty:</span>
                          <p className="font-medium">{returnItem.requestedQuantity}</p>
                        </div>
                        {returnItem.approvedQuantity > 0 && (
                          <div>
                            <span className="text-gray-500">Approved Qty:</span>
                            <p className="font-medium">{returnItem.approvedQuantity}</p>
                          </div>
                        )}
                        {returnItem.refundAmount > 0 && (
                          <div>
                            <span className="text-gray-500">Refund Amount:</span>
                            <p className="font-medium">${returnItem.refundAmount.toFixed(2)}</p>
                          </div>
                        )}
                        {returnItem.returnTrackingNumber && (
                          <div>
                            <span className="text-gray-500">Tracking:</span>
                            <p className="font-medium">{returnItem.returnTrackingNumber}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order #{selectedOrder?.id} Details
              </DialogTitle>
              <DialogDescription>
                View complete order information and manage returns
              </DialogDescription>
            </DialogHeader>
            
            {orderDetails && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusBadgeVariant(orderDetails.status)} className="flex items-center gap-1">
                        {getStatusIcon(orderDetails.status)}
                        {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Amount</span>
                    <p className="font-semibold">${orderDetails.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Order Date</span>
                    <p className="font-medium">{format(new Date(orderDetails.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Payment Method</span>
                    <p className="font-medium">{orderDetails.paymentMethod}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Payment Status</span>
                    <p className="font-medium">{orderDetails.paymentStatus}</p>
                  </div>
                  {orderDetails.shippingCost > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Shipping Cost</span>
                      <p className="font-medium">${orderDetails.shippingCost.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {orderDetails.shippingAddress && (
                  <div>
                    <h4 className="font-semibold mb-2">Shipping Address</h4>
                    <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{orderDetails.shippingAddress}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-4">Order Items</h4>
                  <div className="space-y-4">
                    {orderDetails.items?.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium">{item.product.name}</h5>
                              <p className="text-sm text-gray-600 mt-1">{item.product.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span>Vendor: {item.vendor.storeName}</span>
                                <span>Quantity: {item.quantity}</span>
                                <span>Unit Price: ${item.unitPrice.toFixed(2)}</span>
                                <span>Total: ${item.totalPrice.toFixed(2)}</span>
                              </div>
                              <Badge variant={getStatusBadgeVariant(item.status)} className="mt-2">
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </Badge>
                            </div>
                            {(item.status === 'delivered' || item.status === 'completed') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCreateReturn(item, item.vendor.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Request Return
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {orderDetails.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Order Notes</h4>
                    <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{orderDetails.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Return Details Dialog */}
        <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Return #{selectedReturn?.id} Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedReturn && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusBadgeVariant(selectedReturn.status)} className="flex items-center gap-1">
                        {getStatusIcon(selectedReturn.status)}
                        {selectedReturn.status.charAt(0).toUpperCase() + selectedReturn.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Return Date</span>
                    <p className="font-medium">{format(new Date(selectedReturn.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Requested Quantity</span>
                    <p className="font-semibold">{selectedReturn.requestedQuantity}</p>
                  </div>
                  {selectedReturn.approvedQuantity > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Approved Quantity</span>
                      <p className="font-semibold">{selectedReturn.approvedQuantity}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Product Information</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium">{selectedReturn.product.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">Vendor: {selectedReturn.vendor.storeName}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Return Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Reason</span>
                      <p className="font-medium">{selectedReturn.reason}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Description</span>
                      <p className="text-gray-700">{selectedReturn.description}</p>
                    </div>
                  </div>
                </div>

                {selectedReturn.refundAmount > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Refund Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Refund Amount</span>
                        <p className="font-semibold text-green-600">${selectedReturn.refundAmount.toFixed(2)}</p>
                      </div>
                      {selectedReturn.returnShippingCost > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">Return Shipping Cost</span>
                          <p className="font-medium">${selectedReturn.returnShippingCost.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedReturn.returnTrackingNumber && (
                  <div>
                    <h4 className="font-semibold mb-2">Tracking Information</h4>
                    <p className="font-mono text-sm p-3 bg-gray-50 rounded-lg">{selectedReturn.returnTrackingNumber}</p>
                  </div>
                )}

                {selectedReturn.vendorNotes && (
                  <div>
                    <h4 className="font-semibold mb-2">Vendor Notes</h4>
                    <p className="text-gray-700 p-3 bg-blue-50 rounded-lg">{selectedReturn.vendorNotes}</p>
                  </div>
                )}

                {selectedReturn.customerNotes && (
                  <div>
                    <h4 className="font-semibold mb-2">Your Notes</h4>
                    <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">{selectedReturn.customerNotes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Return Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Return</DialogTitle>
              <DialogDescription>
                Fill out the form below to request a return for this item.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason for Return *</Label>
                <Select value={returnFormData.reason} onValueChange={(value) => setReturnFormData(prev => ({...prev, reason: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defective">Defective/Damaged</SelectItem>
                    <SelectItem value="wrong_item">Wrong Item Received</SelectItem>
                    <SelectItem value="not_as_described">Not As Described</SelectItem>
                    <SelectItem value="changed_mind">Changed Mind</SelectItem>
                    <SelectItem value="size_issue">Size Issue</SelectItem>
                    <SelectItem value="quality_issue">Quality Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about the issue..."
                  value={returnFormData.description}
                  onChange={(e) => setReturnFormData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity to Return</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={returnFormData.requestedQuantity}
                  onChange={(e) => setReturnFormData(prev => ({...prev, requestedQuantity: parseInt(e.target.value) || 1}))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={returnFormData.customerNotes}
                  onChange={(e) => setReturnFormData(prev => ({...prev, customerNotes: e.target.value}))}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReturn}
                  disabled={createReturnMutation.isPending}
                >
                  {createReturnMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Submit Return Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}