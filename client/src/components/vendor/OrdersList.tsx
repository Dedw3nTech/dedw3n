import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { 
  ChevronDown, 
  Search, 
  Loader2, 
  Check,
  X,
  Clock,
  MoreHorizontal,
  Truck,
  Undo2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrdersListProps {
  vendorId?: number;
}

export default function OrdersList({ vendorId }: OrdersListProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const { formatPriceFromGBP } = useCurrency();

  // Define all translatable texts for OrdersList
  const orderTexts = useMemo(() => [
    "Search orders...",
    "All Status",
    "Pending",
    "Processing", 
    "Shipped",
    "Delivered",
    "Cancelled",
    "Refunded",
    "No orders found",
    "Your orders will appear here once customers start purchasing",
    "Order ID",
    "Customer",
    "Date",
    "Total",
    "Status",
    "Actions",
    "View Details",
    "Update Status", 
    "Change Status",
    "Select new status for this order",
    "Cancel",
    "Update",
    "Updating...",
    "Order Details",
    "Customer Information",
    "Shipping Address",
    "Items Ordered",
    "Order Summary",
    "Subtotal",
    "Shipping",
    "Tax",
    "Total Amount",
    "Payment Method",
    "Order Notes",
    "Status History",
    "Close",
    "Order status updated successfully",
    "Failed to update order status",
    "Loading orders...",
    "Quantity",
    "Price",
    "Item Total",
    "No items in this order",
    "Open menu"
  ], []);

  // Get translations using stable DOM translation to match parent component
  const { translations: translatedTexts, isLoading: isTranslating } = useMasterBatchTranslation(orderTexts, 'instant');

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/vendors/orders", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? "/api/vendors/orders" 
        : `/api/vendors/orders?status=${statusFilter}`;
      
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
      const response = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "The order status has been updated successfully.",
      });
      
      // Close dialog
      setIsStatusDialogOpen(false);
      
      // Reset selected order
      setSelectedOrder(null);
      
      // Invalidate orders query
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
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
      order.orderNumber?.toLowerCase().includes(query)
    );
  });

  // Handle order status change
  const handleStatusChange = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusDialogOpen(true);
  };

  // Handle confirm status change
  const handleConfirmStatusChange = () => {
    if (!selectedOrder || !newStatus) return;
    updateOrderStatusMutation.mutate({ orderId: selectedOrder.id, status: newStatus });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200">{translatedTexts["Pending"] || "Pending"}</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">{translatedTexts["Processing"] || "Processing"}</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">{translatedTexts["Shipped"] || "Shipped"}</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">{translatedTexts["Delivered"] || "Delivered"}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">{translatedTexts["Cancelled"] || "Cancelled"}</Badge>;
      case "refunded":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200">{translatedTexts["Refunded"] || "Refunded"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-indigo-600" />;
      case "delivered":
        return <Check className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <X className="h-4 w-4 text-red-600" />;
      case "refunded":
        return <Undo2 className="h-4 w-4 text-slate-600" />;
      default:
        return null;
    }
  };

  // Format order date
  const formatOrderDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-500">{translatedTexts["Loading orders..."] || "Loading orders..."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders?.filter((order: any) => order.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Shipped Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders?.filter((order: any) => order.status === "shipped").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders?.filter((order: any) => order.status === "delivered").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filteredOrders || filteredOrders.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <h3 className="text-lg font-medium">No orders found</h3>
          <p className="text-muted-foreground mt-2">
            {statusFilter !== "all" 
              ? `No orders with status "${statusFilter}" were found.` 
              : "You don't have any orders yet."}
          </p>
        </div>
      ) : (
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
              {filteredOrders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber || `#${order.id}`}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatOrderDate(order.createdAt || order.date)}</TableCell>
                  <TableCell>{formatPriceFromGBP(order.total || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(order)}>
                          Change Status
                        </DropdownMenuItem>
                        {order.status === "processing" && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedOrder(order);
                            setLocation("/shipping?order=" + order.id);
                          }}>
                            <Truck className="mr-2 h-4 w-4" />
                            Ship Order
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Details Accordion */}
      {selectedOrder && (
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Change the status for order {selectedOrder.orderNumber || `#${selectedOrder.id}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Status</h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedOrder.status)}
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">New Status</h4>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select new status" />
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
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>Order Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium">Customer</div>
                            <div>{selectedOrder.customerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedOrder.customerEmail}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Order Date</div>
                            <div>{formatOrderDate(selectedOrder.createdAt || selectedOrder.date)}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Order Items</div>
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="text-right">Qty</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedOrder.items?.map((item: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">${(item.price || 0).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsStatusDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmStatusChange}
                disabled={updateOrderStatusMutation.isPending || newStatus === selectedOrder.status}
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
      )}
    </div>
  );
}