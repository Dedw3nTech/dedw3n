import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/admin/orders", searchTerm, filterStatus],
    queryFn: async () => {
      let endpoint = "/api/admin/orders";
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const res = await fetch(endpoint);
      return res.json();
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const handleOrderDetails = (order: any) => {
    setCurrentOrder(order);
    setShowOrderDetailsDialog(true);
  };

  const handleUpdateStatus = (orderId: number, status: string) => {
    updateOrderMutation.mutate({ orderId, status });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">Order Management</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders by ID, customer name, or email..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2.5 top-2.5"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders && orders.length > 0 ? (
                    orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOrderDetails(order)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'processing')}>
                                Mark as Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')}>
                                Mark as Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                                Mark as Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              >
                                Mark as Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm || filterStatus !== "all" ? "No orders found matching your criteria." : "No orders found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetailsDialog} onOpenChange={setShowOrderDetailsDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {currentOrder && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Order #{currentOrder.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    Placed on {formatDate(currentOrder.createdAt)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(currentOrder.status)}`}>
                  {currentOrder.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{currentOrder.customerName}</p>
                    <p>{currentOrder.customerEmail}</p>
                    <p>{currentOrder.customerPhone || 'No phone'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Shipping Address</h4>
                  <div className="space-y-1 text-sm">
                    <p>{currentOrder.shippingAddress?.line1}</p>
                    {currentOrder.shippingAddress?.line2 && <p>{currentOrder.shippingAddress.line2}</p>}
                    <p>{currentOrder.shippingAddress?.city}, {currentOrder.shippingAddress?.postalCode}</p>
                    <p>{currentOrder.shippingAddress?.country}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Order Items</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentOrder.items && currentOrder.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-between border-t pt-4">
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm">{currentOrder.paymentMethod}</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex justify-between gap-8">
                    <p className="text-sm">Subtotal:</p>
                    <p className="text-sm font-medium">{formatPrice(currentOrder.subtotal)}</p>
                  </div>
                  <div className="flex justify-between gap-8">
                    <p className="text-sm">Shipping:</p>
                    <p className="text-sm font-medium">{formatPrice(currentOrder.shippingCost)}</p>
                  </div>
                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between gap-8 text-green-600">
                      <p className="text-sm">Discount:</p>
                      <p className="text-sm font-medium">-{formatPrice(currentOrder.discount)}</p>
                    </div>
                  )}
                  <div className="flex justify-between gap-8 border-t pt-1">
                    <p className="text-sm font-bold">Total:</p>
                    <p className="text-lg font-bold">{formatPrice(currentOrder.total)}</p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderDetailsDialog(false)}
                  >
                    Close
                  </Button>
                  <Select
                    value={currentOrder.status}
                    onValueChange={(value) => {
                      handleUpdateStatus(currentOrder.id, value);
                      setCurrentOrder({ ...currentOrder, status: value });
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}