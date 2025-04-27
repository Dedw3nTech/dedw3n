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
  CardDescription,
  CardFooter,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  AlertCircle, 
  BarChart3, 
  Clock, 
  ExternalLink, 
  Loader2, 
  MoreHorizontal, 
  PackageCheck, 
  Plus, 
  Search, 
  Truck, 
  X 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // States for order settings
  const [enableAHT, setEnableAHT] = useState(true);
  const [enableQuantityCheck, setEnableQuantityCheck] = useState(true); 
  const [enableTrackingUpdates, setEnableTrackingUpdates] = useState(true);
  const [enableLotTracking, setEnableLotTracking] = useState(false);
  const [selectedShippingAPI, setSelectedShippingAPI] = useState("fedex");
  
  // Mock orders data while API is being implemented
  const mockOrders = [
    {
      id: 1001,
      createdAt: new Date().toISOString(),
      customerName: "John Smith",
      customerEmail: "john@example.com",
      customerPhone: "+44 1234 567890",
      total: 129.99,
      subtotal: 119.99,
      shippingCost: 10.00,
      discount: 0,
      status: "processing",
      paymentStatus: "paid",
      paymentMethod: "Credit Card",
      shippingAddress: {
        line1: "123 Main St",
        line2: "Apt 4B",
        city: "London",
        postalCode: "W1 6AA",
        country: "United Kingdom"
      },
      items: [
        {
          productName: "Premium Wireless Headphones",
          quantity: 1,
          price: 119.99
        }
      ]
    },
    {
      id: 1002,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
      customerName: "Sarah Johnson",
      customerEmail: "sarah@example.com",
      customerPhone: "+44 9876 543210",
      total: 254.98,
      subtotal: 239.98,
      shippingCost: 15.00,
      discount: 0,
      status: "shipped",
      paymentStatus: "paid",
      paymentMethod: "PayPal",
      shippingAddress: {
        line1: "45 Park Avenue",
        line2: "",
        city: "Manchester",
        postalCode: "M1 2RT",
        country: "United Kingdom"
      },
      items: [
        {
          productName: "Smartphone Case",
          quantity: 1,
          price: 19.99
        },
        {
          productName: "Smart Watch",
          quantity: 1,
          price: 219.99
        }
      ]
    },
    {
      id: 1003,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      customerName: "Michael Brown",
      customerEmail: "michael@example.com",
      customerPhone: "+44 5544 332211",
      total: 89.99,
      subtotal: 79.99,
      shippingCost: 10.00,
      discount: 0,
      status: "delivered",
      paymentStatus: "paid",
      paymentMethod: "Mobile Money",
      shippingAddress: {
        line1: "78 High Street",
        line2: "Suite 12",
        city: "Birmingham",
        postalCode: "B1 1AA",
        country: "United Kingdom"
      },
      items: [
        {
          productName: "Fitness Tracker",
          quantity: 1,
          price: 79.99
        }
      ]
    },
    {
      id: 1004,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      customerName: "Emily Williams",
      customerEmail: "emily@example.com",
      customerPhone: "+44 1122 334455",
      total: 345.97,
      subtotal: 325.97,
      shippingCost: 20.00,
      discount: 0,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "Bank Transfer",
      shippingAddress: {
        line1: "12 Queen's Road",
        line2: "",
        city: "Edinburgh",
        postalCode: "EH2 4AD",
        country: "United Kingdom"
      },
      items: [
        {
          productName: "Laptop Backpack",
          quantity: 1,
          price: 45.99
        },
        {
          productName: "Bluetooth Speaker",
          quantity: 1,
          price: 79.99
        },
        {
          productName: "Wireless Earbuds",
          quantity: 2,
          price: 99.99
        }
      ]
    }
  ];

  // Fetch orders with fallback to mock data
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/orders", searchTerm, filterStatus],
    queryFn: async () => {
      // Filter mock orders based on search and filter criteria
      // This simulates what would happen on the server
      let filteredOrders = [...mockOrders];
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.id.toString().includes(search) ||
          order.customerName.toLowerCase().includes(search) ||
          order.customerEmail.toLowerCase().includes(search)
        );
      }
      
      if (filterStatus !== "all") {
        filteredOrders = filteredOrders.filter(order => 
          order.status.toLowerCase() === filterStatus.toLowerCase()
        );
      }
      
      return filteredOrders;
    },
    retry: false,
    // Always return mock data without hitting the API
    // This simulates the API being ready
    initialData: mockOrders,
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

  // Save order settings
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Order management settings have been updated successfully.",
    });
  };

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
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
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

              {/* API Implementation Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="ml-2">
                    <h3 className="text-sm font-medium text-amber-800">
                      The admin API endpoints for this feature are being implemented
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Currently displaying example data for demonstration purposes.</p>
                    </div>
                  </div>
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
        </TabsContent>
        
        {/* Order Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Performance Metrics</CardTitle>
              <CardDescription>
                Monitor key metrics to improve order fulfillment and customer satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Implementation Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="ml-2">
                    <h3 className="text-sm font-medium text-amber-800">
                      The admin API endpoints for this feature are being implemented
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Currently displaying example metrics data for demonstration purposes.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* AHT Metric */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Accurate Handling Time (AHT)</h3>
                    <p className="text-sm text-muted-foreground">
                      Time from order acknowledgment to order fulfillment
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Current Average</div>
                    <div className="text-2xl font-bold">3.2 hours</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Target</div>
                    <div className="text-2xl font-bold">2.5 hours</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Improvement</div>
                    <div className="text-2xl font-bold text-yellow-600">+28%</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                  <h4 className="font-medium text-blue-700 mb-1">How to improve</h4>
                  <p className="text-sm text-blue-600">
                    Improve order processing workflows by adopting an OMS with automation functionality.
                  </p>
                </div>
              </div>
              
              {/* Quantity Check Metric */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <PackageCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Correct Quantity Products Shipped</h3>
                    <p className="text-sm text-muted-foreground">
                      Accuracy of products and quantities in shipments
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Accuracy Rate</div>
                    <div className="text-2xl font-bold">97.8%</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Target</div>
                    <div className="text-2xl font-bold">99.5%</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Error Cost</div>
                    <div className="text-2xl font-bold text-red-600">£2,850</div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-100 rounded-md p-3">
                  <h4 className="font-medium text-green-700 mb-1">How to improve</h4>
                  <p className="text-sm text-green-600">
                    Implement checks at various stages of order fulfillment to prevent errors in quantity shipped.
                  </p>
                </div>
              </div>
              
              {/* Tracking Marketplace Metric */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Tracking Sent to Marketplaces</h3>
                    <p className="text-sm text-muted-foreground">
                      Timely transmission of tracking information
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Transmission Rate</div>
                    <div className="text-2xl font-bold">92.4%</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Target</div>
                    <div className="text-2xl font-bold">98%</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Avg. Delay</div>
                    <div className="text-2xl font-bold text-orange-600">8.5 hrs</div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-100 rounded-md p-3">
                  <h4 className="font-medium text-purple-700 mb-1">How to improve</h4>
                  <p className="text-sm text-purple-600">
                    Integrate order management system for real-time tracking updates and automate notifications to customers.
                  </p>
                </div>
              </div>
              
              {/* LOT/Serial Tracking Metric */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">LOT/Serial Number Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Accuracy of tracking products with LOT and serial numbers
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Tracking Accuracy</div>
                    <div className="text-2xl font-bold">89.2%</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Target</div>
                    <div className="text-2xl font-bold">99.9%</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-sm text-muted-foreground mb-1">Compliance Rate</div>
                    <div className="text-2xl font-bold text-red-600">85.7%</div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                  <h4 className="font-medium text-amber-700 mb-1">How to improve</h4>
                  <p className="text-sm text-amber-600">
                    Implement dedicated LOT/Serial tracking for regulatory compliance and improved recall management.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Order Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Processing Settings</CardTitle>
              <CardDescription>
                Configure settings for order handling, shipping, and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Implementation Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="ml-2">
                    <h3 className="text-sm font-medium text-amber-800">
                      The admin API endpoints for this feature are being implemented
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Settings configuration functionality will be available soon. Currently showing UI demonstration.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Processing Settings */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Order Processing Controls</h3>
                  <div className="space-y-4">
                    {/* AHT Setting */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base" htmlFor="aht-monitoring">
                          Accurate Handling Time (AHT) Monitoring
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Track time between order acknowledgment and fulfillment
                        </p>
                      </div>
                      <Switch 
                        id="aht-monitoring" 
                        checked={enableAHT}
                        onCheckedChange={setEnableAHT}
                      />
                    </div>
                    
                    {/* Quantity Check Setting */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base" htmlFor="quantity-check">
                          Quantity Verification Checks
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable multi-stage verification for order quantities
                        </p>
                      </div>
                      <Switch 
                        id="quantity-check" 
                        checked={enableQuantityCheck}
                        onCheckedChange={setEnableQuantityCheck}
                      />
                    </div>
                    
                    {/* Marketplace Tracking Setting */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base" htmlFor="tracking-update">
                          Automatic Tracking Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Send real-time tracking updates to marketplaces
                        </p>
                      </div>
                      <Switch 
                        id="tracking-update" 
                        checked={enableTrackingUpdates}
                        onCheckedChange={setEnableTrackingUpdates}
                      />
                    </div>
                    
                    {/* LOT/Serial Tracking Setting */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base" htmlFor="lot-tracking">
                          LOT/Serial Number Tracking
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Track products with LOT and serial numbers throughout fulfillment
                        </p>
                      </div>
                      <Switch 
                        id="lot-tracking" 
                        checked={enableLotTracking}
                        onCheckedChange={setEnableLotTracking}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Shipping API Integration */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Shipping API Integration</h3>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="shipping-api">Select Shipping API Provider</Label>
                      <Select 
                        value={selectedShippingAPI} 
                        onValueChange={setSelectedShippingAPI}
                      >
                        <SelectTrigger id="shipping-api">
                          <SelectValue placeholder="Select a shipping provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fedex">FedEx</SelectItem>
                          <SelectItem value="ups">UPS</SelectItem>
                          <SelectItem value="dhl">DHL</SelectItem>
                          <SelectItem value="usps">USPS</SelectItem>
                          <SelectItem value="royalmail">Royal Mail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center p-3 text-sm border rounded-md bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
                      <p className="text-amber-700">
                        You'll need to provide API credentials in the integration settings.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Configure API
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        Test Connection
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}