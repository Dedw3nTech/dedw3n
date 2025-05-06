import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, User, Loader2, Mail, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface CustomersListProps {
  vendorId?: number;
}

export default function CustomersList({ vendorId }: CustomersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch vendor customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/vendors/customers"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/customers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Filter customers based on search query
  const filteredCustomers = customers?.filter((customer: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    );
  });

  // Calculate customer lifetime value and total orders
  const getCustomerStats = (customer: any) => {
    const totalOrders = customer.orders?.length || 0;
    const totalSpent = customer.orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    return {
      totalOrders,
      totalSpent,
      avgOrderValue,
    };
  };

  // Helper to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle view customer details
  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  // Customer loyalty badge
  const getLoyaltyBadge = (totalOrders: number) => {
    if (totalOrders >= 10) {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">VIP</Badge>;
    } else if (totalOrders >= 5) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Regular</Badge>;
    } else if (totalOrders >= 2) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Returning</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300">New</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-10">
        <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No customers found</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          You don't have any customers yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers?.map((customer: any) => {
              const stats = getCustomerStats(customer);
              const lastOrder = customer.orders?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={customer.profileImage} alt={customer.name} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getLoyaltyBadge(stats.totalOrders)}
                  </TableCell>
                  <TableCell>{stats.totalOrders}</TableCell>
                  <TableCell>${stats.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>
                    {lastOrder ? format(new Date(lastOrder.date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={selectedCustomer.profileImage} alt={selectedCustomer.name} />
                    <AvatarFallback className="text-2xl">{getInitials(selectedCustomer.name)}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Mail className="mr-1 h-4 w-4" />
                        {selectedCustomer.email}
                      </div>
                      {selectedCustomer.phone && (
                        <div className="flex items-center">
                          <Phone className="mr-1 h-4 w-4" />
                          {selectedCustomer.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{getCustomerStats(selectedCustomer).totalOrders}</div>
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">${getCustomerStats(selectedCustomer).totalSpent.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Total Spent</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">${getCustomerStats(selectedCustomer).avgOrderValue.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Avg. Order Value</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="orders">
                <TabsList>
                  <TabsTrigger value="orders">Order History</TabsTrigger>
                  <TabsTrigger value="address">Shipping Addresses</TabsTrigger>
                </TabsList>
                
                <TabsContent value="orders" className="space-y-4">
                  {selectedCustomer.orders?.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCustomer.orders
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell>#{order.id}</TableCell>
                                <TableCell>{format(new Date(order.date), "MMM d, yyyy")}</TableCell>
                                <TableCell>{order.items?.length || 0} items</TableCell>
                                <TableCell>${order.total?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      order.status === "completed" || order.status === "delivered"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : order.status === "shipped"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : order.status === "processing"
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : order.status === "cancelled"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                    }
                                  >
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No orders found for this customer
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="address">
                  {selectedCustomer.addresses?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCustomer.addresses.map((address: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="pt-6 space-y-2">
                            {address.isDefault && (
                              <Badge className="mb-2">Default</Badge>
                            )}
                            <div className="font-medium">{address.name}</div>
                            <div>{address.line1}</div>
                            {address.line2 && <div>{address.line2}</div>}
                            <div>
                              {address.city}, {address.state} {address.postalCode}
                            </div>
                            <div>{address.country}</div>
                            {address.phone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="mr-1 h-3 w-3" />
                                {address.phone}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No saved addresses for this customer
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}