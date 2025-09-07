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

export default function OrdersReturnsContent() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('all');
  const [returnReason, setReturnReason] = useState<string>('');
  const [returnDescription, setReturnDescription] = useState<string>('');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnDialogOpen, setReturnDialogOpen] = useState<boolean>(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);

  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Fetch returns
  const { data: returns = [], isLoading: returnsLoading } = useQuery<Return[]>({
    queryKey: ['/api/returns'],
  });

  // Filter orders based on status
  const filteredOrders = orders.filter(order => 
    orderStatusFilter === 'all' || order.status.toLowerCase() === orderStatusFilter.toLowerCase()
  );

  // Filter returns based on status
  const filteredReturns = returns.filter(returnItem => 
    returnStatusFilter === 'all' || returnItem.status.toLowerCase() === returnStatusFilter.toLowerCase()
  );

  const handleRequestReturn = (orderItem: OrderItem) => {
    setSelectedOrderItem(orderItem);
    setReturnQuantity(1);
    setReturnReason('');
    setReturnDescription('');
    setReturnDialogOpen(true);
  };

  if (ordersLoading || returnsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {translateText('Orders')}
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {translateText('Returns')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{translateText('Your Orders')}</h3>
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
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

          {filteredOrders.length === 0 ? (
            <Card className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{translateText('No orders found')}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {translateText('You haven\'t placed any orders yet')}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <CardDescription>
                          Placed on {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={getStatusBadgeVariant(order.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                        <span className="font-semibold">£{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Payment: {order.paymentMethod}</p>
                        <p>Status: {order.paymentStatus}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {translateText('View Details')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{translateText('Returns & Refunds')}</h3>
            <Select value={returnStatusFilter} onValueChange={setReturnStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translateText('All Returns')}</SelectItem>
                <SelectItem value="requested">{translateText('Requested')}</SelectItem>
                <SelectItem value="approved">{translateText('Approved')}</SelectItem>
                <SelectItem value="rejected">{translateText('Rejected')}</SelectItem>
                <SelectItem value="completed">{translateText('Completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredReturns.length === 0 ? (
            <Card className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <RefreshCw className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{translateText('No returns found')}</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {translateText('You haven\'t requested any returns yet')}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((returnItem) => (
                <Card key={returnItem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Return #{returnItem.id}</CardTitle>
                        <CardDescription>
                          {returnItem.product.name} - {returnItem.vendor.storeName}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={getStatusBadgeVariant(returnItem.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(returnItem.status)}
                          {returnItem.status}
                        </Badge>
                        <span className="font-semibold">£{returnItem.refundAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Reason:</strong> {returnItem.reason}</p>
                      <p><strong>Quantity:</strong> {returnItem.requestedQuantity}</p>
                      <p><strong>Requested:</strong> {format(new Date(returnItem.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}