import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, Package, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface ShippingManagerProps {
  vendorId?: number;
}

export default function ShippingManager({ vendorId }: ShippingManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [shippingStatusFilter, setShippingStatusFilter] = useState("all");
  const { toast } = useToast();
  
  // Fetch vendor orders
  const { data, isLoading } = useQuery({
    queryKey: ["/api/vendors/orders"],
    enabled: !!vendorId,
  });

  const updateShippingStatus = async (orderId: number, status: string, trackingNumber?: string) => {
    try {
      await apiRequest("PUT", `/api/vendors/orders/${orderId}/shipping`, {
        status,
        trackingNumber,
      });
      
      // Show success message
      toast({
        title: "Shipping updated",
        description: `The order shipping status has been updated to ${status}.`,
      });
      
      // Invalidate orders cache
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update shipping status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter and sort orders
  const getFilteredOrders = () => {
    if (!data || !data.orders) return [];
    
    const filtered = data.orders.filter((order: any) => {
      // Filter by shipping status
      if (shippingStatusFilter !== "all" && order.status !== shippingStatusFilter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.id.toString().includes(searchLower) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
    
    // Sort orders by date (newest first)
    return filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
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
      default:
        return (
          <Badge variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return <div>Loading shipping information...</div>;
  }

  const filteredOrders = getFilteredOrders();

  // Group orders by status for dashboard
  const pendingOrders = data.orders.filter((o: any) => o.status === "pending").length;
  const processingOrders = data.orders.filter((o: any) => o.status === "processing").length;
  const shippedOrders = data.orders.filter((o: any) => o.status === "shipped").length;
  const deliveredOrders = data.orders.filter((o: any) => o.status === "delivered").length;

  if (!data.orders || data.orders.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Truck className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No shipments yet</h3>
        <p className="text-sm">You haven't shipped any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shipping Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Shipments</CardTitle>
          <CardDescription>Update shipping status and tracking information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or tracking number"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              defaultValue={shippingStatusFilter}
              onValueChange={setShippingStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shipments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No shipments found</h3>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-muted/30">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <CardTitle className="text-base">Order #{order.id}</CardTitle>
                        <CardDescription>
                          {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy") : "Date unavailable"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <div className="text-sm font-medium">
                          ${order.totalAmount?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Shipping Address</div>
                        <div className="text-sm">{order.shippingAddress || "Not available"}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Items</div>
                        <div className="text-sm">
                          {data.orderItems
                            .filter((item: any) => item.orderId === order.id)
                            .map((item: any, index: number) => (
                              <div key={item.id} className="flex justify-between items-center">
                                <span>
                                  {item.product?.name || `Product #${item.productId}`}
                                  <span className="text-muted-foreground"> × {item.quantity}</span>
                                </span>
                                <span>${item.totalPrice?.toFixed(2) || "0.00"}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/30 flex flex-col sm:flex-row gap-2">
                    <Select 
                      defaultValue={order.status}
                      onValueChange={(value) => updateShippingStatus(order.id, value, order.trackingNumber)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      placeholder="Add tracking number"
                      defaultValue={order.trackingNumber || ""}
                      className="flex-1"
                      onChange={(e) => {
                        const trackingNumber = e.target.value;
                        if (trackingNumber && trackingNumber !== order.trackingNumber) {
                          updateShippingStatus(order.id, order.status, trackingNumber);
                        }
                      }}
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}