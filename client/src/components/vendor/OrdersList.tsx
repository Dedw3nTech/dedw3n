import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  ShoppingCart, 
  ChevronDown, 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertCircle 
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";

interface OrdersListProps {
  vendorId?: number;
}

export default function OrdersList({ vendorId }: OrdersListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();
  
  // Get status filter for API request
  const getStatusFilter = () => {
    if (selectedStatus === "all") return undefined;
    return selectedStatus;
  };

  // Fetch vendor orders
  const { data, isLoading } = useQuery({
    queryKey: ["/api/vendors/orders", getStatusFilter()],
    enabled: !!vendorId,
  });

  const updateOrderStatus = async (orderId: number, status: string, trackingNumber?: string) => {
    try {
      await apiRequest("PUT", `/api/vendors/orders/${orderId}/shipping`, {
        status,
        trackingNumber,
      });
      
      // Show success message
      toast({
        title: "Order updated",
        description: `The order status has been updated to ${status}.`,
      });
      
      // Invalidate orders cache
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Package className="h-3 w-3" />
            Processing
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1">
            <Truck className="h-3 w-3" />
            Shipped
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  if (!data || !data.orders || data.orders.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No orders yet</h3>
        <p className="text-sm">You haven't received any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {data.orders.length} orders
        </div>
        <Select onValueChange={setSelectedStatus} defaultValue={selectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" className="w-full space-y-2">
        {data.orders.map((order: any) => (
          <AccordionItem key={order.id} value={order.id.toString()} className="border rounded-lg p-2">
            <AccordionTrigger className="px-2 hover:no-underline">
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-medium">Order #{order.id}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy") : "Date unavailable"}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-medium text-right">
                    ${order.totalAmount?.toFixed(2) || "0.00"}
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2">
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Customer Details</h4>
                    <div className="text-sm">
                      <p>Name: {order.user?.name || "Unknown"}</p>
                      <p>Email: {order.user?.email || "Unknown"}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Shipping Address</h4>
                    <div className="text-sm">{order.shippingAddress || "Not available"}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Order Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orderItems
                        .filter((item: any) => item.orderId === order.id)
                        .map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product?.name || `Product #${item.productId}`}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitPrice?.toFixed(2) || "0.00"}</TableCell>
                            <TableCell>${item.totalPrice?.toFixed(2) || "0.00"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Update Order Status</h4>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Select 
                      defaultValue={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value, order.trackingNumber)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {order.status === "shipped" && (
                      <div className="flex flex-1 gap-2">
                        <Input 
                          placeholder="Add tracking number"
                          defaultValue={order.trackingNumber || ""}
                          onChange={(e) => {
                            const trackingNumber = e.target.value;
                            if (trackingNumber && trackingNumber !== order.trackingNumber) {
                              updateOrderStatus(order.id, order.status, trackingNumber);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}