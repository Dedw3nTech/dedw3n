import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Eye, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Loader2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OrdersListProps {
  vendorId?: number;
}

export default function OrdersList({ vendorId }: OrdersListProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);

  // Fetch vendor orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/vendors/orders", statusFilter],
    queryFn: async () => {
      let url = "/api/vendors/orders";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const response = await apiRequest("PUT", `/api/vendors/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
      setUpdateStatusOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update shipping info mutation
  const updateShippingMutation = useMutation({
    mutationFn: async ({ orderId, tracking }: { orderId: number, tracking: string }) => {
      const response = await apiRequest("PUT", `/api/vendors/orders/${orderId}/shipping`, { tracking });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Shipping Updated",
        description: "Shipping information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update shipping: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search query
  const filteredOrders = orders?.filter((order: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  // Handle status update
  const handleStatusUpdate = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setUpdateStatusOpen(true);
  };

  // Handle view details
  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setViewDetailsOpen(true);
  };

  // Handle submit status update
  const handleSubmitStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return;
    
    updateOrderStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus
    });
  };

  // Handle update shipping
  const handleUpdateShipping = (orderId: number, trackingNumber: string) => {
    if (!trackingNumber) {
      toast({
        title: "Error",
        description: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }
    
    updateShippingMutation.mutate({
      orderId,
      tracking: trackingNumber
    });
  };

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shipped</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-10">
        <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No orders found</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          You don't have any orders matching your filters yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders?.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                  </div>
                </TableCell>
                <TableCell>{order.date ? format(new Date(order.date), "MMM d, yyyy") : "—"}</TableCell>
                <TableCell>${order.total?.toFixed(2) || "0.00"}</TableCell>
                <TableCell>
                  {renderStatusBadge(order.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(order)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Order Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder?.date ? format(new Date(selectedOrder.date), "MMMM d, yyyy") : "—"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Customer Information</h4>
                <div className="rounded-lg border p-3 space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {selectedOrder?.customerName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedOrder?.customerEmail}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedOrder?.customerPhone || "—"}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Shipping Address</h4>
                <div className="rounded-lg border p-3 space-y-2">
                  {selectedOrder?.shippingAddress ? (
                    <>
                      <div>{selectedOrder.shippingAddress.line1}</div>
                      {selectedOrder.shippingAddress.line2 && <div>{selectedOrder.shippingAddress.line2}</div>}
                      <div>
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                      </div>
                      <div>{selectedOrder.shippingAddress.country}</div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No shipping address available</div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Order Items</h4>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder?.items?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.variant && (
                                <div className="text-xs text-muted-foreground">
                                  {item.variant}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell className="text-right">
                          ${(item.price * item.quantity).toFixed(2) || "0.00"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Payment Information</h4>
                <div className="rounded-lg border p-3 space-y-2">
                  <div>
                    <span className="font-medium">Payment Method:</span> {selectedOrder?.paymentMethod || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Payment Status:</span> {selectedOrder?.paymentStatus || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Transaction ID:</span> {selectedOrder?.transactionId || "—"}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Order Summary</h4>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${selectedOrder?.subtotal?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${selectedOrder?.shipping?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${selectedOrder?.tax?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span>${selectedOrder?.total?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Shipping Information</h4>
              <div className="rounded-lg border p-3">
                <div className="mb-3">
                  <span className="font-medium">Status:</span> {renderStatusBadge(selectedOrder?.status || "")}
                </div>
                <div className="mb-3">
                  <span className="font-medium">Tracking Number:</span> {selectedOrder?.trackingNumber || "Not assigned"}
                </div>
                
                {/* Quick shipping update form */}
                {selectedOrder?.status !== "delivered" && selectedOrder?.status !== "cancelled" && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Enter tracking number"
                      defaultValue={selectedOrder?.trackingNumber || ""}
                      className="flex-1"
                      id="tracking-input"
                    />
                    <Button
                      onClick={() => {
                        const trackingInput = document.getElementById("tracking-input") as HTMLInputElement;
                        if (trackingInput && selectedOrder) {
                          handleUpdateShipping(selectedOrder.id, trackingInput.value);
                        }
                      }}
                      size="sm"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status for order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitStatusUpdate}
              disabled={updateOrderStatusMutation.isPending}
            >
              {updateOrderStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}