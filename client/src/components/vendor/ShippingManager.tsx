import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Truck, 
  Package, 
  Search, 
  Loader2,
  PackageCheck,
  Map,
  Barcode
} from "lucide-react";
import { useUnifiedBatchTranslation } from "@/hooks/use-unified-translation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface ShippingManagerProps {
  vendorId?: number;
}

export default function ShippingManager({ vendorId }: ShippingManagerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [shippingProvider, setShippingProvider] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Define all translatable texts
  const shippingTexts = useMemo(() => [
    "Pending Shipments",
    "Orders that need to be shipped",
    "Shipped Today", 
    "Orders shipped in the last 24 hours",
    "Total Shipped",
    "All-time shipped orders",
    "Pending",
    "Shipped",
    "Search orders...",
    "No orders to ship",
    "All orders have been shipped",
    "Order ID",
    "Customer",
    "Amount",
    "Date",
    "Status", 
    "Actions",
    "Ship Order",
    "View Details",
    "Tracking Number",
    "Shipping Provider",
    "Shipping Address",
    "Update Shipping",
    "Cancel",
    "Updating",
    "Mark as Shipped",
    "Shipping Updated",
    "Order has been marked as shipped with tracking information",
    "Error",
    "Failed to update shipping",
    "Select provider",
    "DHL",
    "FedEx", 
    "UPS",
    "USPS",
    "Royal Mail",
    "Other"
  ], []);

  // Get translations
  const { translations: translatedTexts, isLoading: isTranslating } = useUnifiedBatchTranslation(shippingTexts, 'high');

  // Fetch pending shipments (orders that are paid but not shipped)
  const { data: pendingShipments, isLoading: isLoadingPending } = useQuery({
    queryKey: ["/api/vendors/orders", "processing"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/orders?status=processing");
      if (!response.ok) {
        throw new Error("Failed to fetch pending shipments");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch shipped orders
  const { data: shippedOrders, isLoading: isLoadingShipped } = useQuery({
    queryKey: ["/api/vendors/orders", "shipped"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/orders?status=shipped");
      if (!response.ok) {
        throw new Error("Failed to fetch shipped orders");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Update shipping info mutation
  const updateShippingMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber, provider }: { orderId: number, trackingNumber: string, provider: string }) => {
      const response = await apiRequest("PUT", `/api/vendors/orders/${orderId}/shipping`, { 
        tracking: trackingNumber,
        provider: provider
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: translatedTexts["Shipping Updated"] || "Shipping Updated",
        description: translatedTexts["Order has been marked as shipped with tracking information"] || "Order has been marked as shipped with tracking information.",
      });
      
      // Clear form
      setTrackingNumber("");
      setShippingProvider("");
      setIsDialogOpen(false);
      
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: translatedTexts["Error"] || "Error",
        description: `${translatedTexts["Failed to update shipping"] || "Failed to update shipping"}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search query
  const filteredPendingShipments = pendingShipments?.filter((order: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query)
    );
  });

  const filteredShippedOrders = shippedOrders?.filter((order: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query) ||
      order.trackingNumber?.toLowerCase().includes(query)
    );
  });

  // Handle ship now
  const handleShipNow = (order: any) => {
    setSelectedOrder(order);
    setTrackingNumber(order.trackingNumber || "");
    setShippingProvider(order.shippingProvider || "");
    setIsDialogOpen(true);
  };

  // Handle submit shipping
  const handleSubmitShipping = () => {
    if (!selectedOrder) return;
    if (!trackingNumber) {
      toast({
        title: "Missing Information",
        description: "Please enter a tracking number.",
        variant: "destructive",
      });
      return;
    }

    updateShippingMutation.mutate({
      orderId: selectedOrder.id,
      trackingNumber,
      provider: shippingProvider
    });
  };

  // Loading state
  if (isLoadingPending || isLoadingShipped) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{translatedTexts["Pending Shipments"] || "Pending Shipments"}</CardTitle>
            <CardDescription>
              {translatedTexts["Orders that need to be shipped"] || "Orders that need to be shipped"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pendingShipments?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{translatedTexts["Shipped Today"] || "Shipped Today"}</CardTitle>
            <CardDescription>
              {translatedTexts["Orders shipped in the last 24 hours"] || "Orders shipped in the last 24 hours"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {shippedOrders?.filter((order: any) => {
                const orderDate = new Date(order.shippedDate || order.updatedAt);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return orderDate >= yesterday;
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{translatedTexts["Total Shipped"] || "Total Shipped"}</CardTitle>
            <CardDescription>
              {translatedTexts["All-time shipped orders"] || "All-time shipped orders"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {shippedOrders?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={translatedTexts["Search orders..."] || "Search orders..."}
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {translatedTexts["Pending"] || "Pending"} ({pendingShipments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="shipped">
            {translatedTexts["Shipped"] || "Shipped"} ({shippedOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Pending Shipments Tab */}
        <TabsContent value="pending" className="space-y-4">
          {filteredPendingShipments?.length === 0 ? (
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">{translatedTexts["No orders to ship"] || "No orders to ship"}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {translatedTexts["All orders have been shipped"] || "All orders have been shipped"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translatedTexts["Order ID"] || "Order ID"}</TableHead>
                    <TableHead>{translatedTexts["Customer"] || "Customer"}</TableHead>
                    <TableHead>{translatedTexts["Date"] || "Date"}</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>{translatedTexts["Amount"] || "Amount"}</TableHead>
                    <TableHead className="text-right">{translatedTexts["Actions"] || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingShipments?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.date ? format(new Date(order.date), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>
                      <TableCell>${order.total?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleShipNow(order)}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          {translatedTexts["Ship Order"] || "Ship Order"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Shipped Orders Tab */}
        <TabsContent value="shipped" className="space-y-4">
          {filteredShippedOrders?.length === 0 ? (
            <div className="text-center py-10">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">{translatedTexts["No orders to ship"] || "No orders to ship"}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {translatedTexts["All orders have been shipped"] || "All orders have been shipped"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translatedTexts["Order ID"] || "Order ID"}</TableHead>
                    <TableHead>{translatedTexts["Customer"] || "Customer"}</TableHead>
                    <TableHead>{translatedTexts["Date"] || "Date"}</TableHead>
                    <TableHead>{translatedTexts["Tracking Number"] || "Tracking Number"}</TableHead>
                    <TableHead>{translatedTexts["Shipping Provider"] || "Shipping Provider"}</TableHead>
                    <TableHead className="text-right">{translatedTexts["Actions"] || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShippedOrders?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.shippedDate ? format(new Date(order.shippedDate), "MMM d, yyyy") : 
                         order.updatedAt ? format(new Date(order.updatedAt), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <div className="flex items-center">
                            <Barcode className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{order.trackingNumber}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No tracking</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.shippingProvider ? (
                          <Badge variant="outline">
                            {order.shippingProvider}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShipNow(order)}
                        >
                          <PackageCheck className="mr-2 h-4 w-4" />
                          {translatedTexts["View Details"] || "View Details"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Shipping Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translatedTexts["Update Shipping"] || "Update Shipping"}</DialogTitle>
            <DialogDescription>
              Enter shipping information for order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="provider" className="text-right text-sm font-medium">
                {translatedTexts["Shipping Provider"] || "Shipping Provider"}
              </label>
              <div className="col-span-3">
                <Select 
                  value={shippingProvider} 
                  onValueChange={setShippingProvider}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={translatedTexts["Select provider"] || "Select provider"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FedEx">{translatedTexts["FedEx"] || "FedEx"}</SelectItem>
                    <SelectItem value="UPS">{translatedTexts["UPS"] || "UPS"}</SelectItem>
                    <SelectItem value="USPS">{translatedTexts["USPS"] || "USPS"}</SelectItem>
                    <SelectItem value="DHL">{translatedTexts["DHL"] || "DHL"}</SelectItem>
                    <SelectItem value="Royal Mail">{translatedTexts["Royal Mail"] || "Royal Mail"}</SelectItem>
                    <SelectItem value="Other">{translatedTexts["Other"] || "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="tracking" className="text-right text-sm font-medium">
                {translatedTexts["Tracking Number"] || "Tracking Number"}
              </label>
              <div className="col-span-3">
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={translatedTexts["Tracking Number"] || "Tracking Number"}
                />
              </div>
            </div>
            
            {selectedOrder?.shippingAddress && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Map className="mr-2 h-4 w-4" /> 
                  {translatedTexts["Shipping Address"] || "Shipping Address"}
                </h4>
                <div className="rounded-lg border p-3 text-sm">
                  <div>{selectedOrder.shippingAddress.line1}</div>
                  {selectedOrder.shippingAddress.line2 && <div>{selectedOrder.shippingAddress.line2}</div>}
                  <div>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                  </div>
                  <div>{selectedOrder.shippingAddress.country}</div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              {translatedTexts["Cancel"] || "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmitShipping}
              disabled={updateShippingMutation.isPending}
            >
              {updateShippingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translatedTexts["Updating"] || "Updating"}...
                </>
              ) : (
                <>
                  <Truck className="mr-2 h-4 w-4" />
                  {selectedOrder?.status === "shipped" ? 
                    (translatedTexts["Update Shipping"] || "Update Shipping") : 
                    (translatedTexts["Mark as Shipped"] || "Mark as Shipped")
                  }
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}