import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Mail, Phone, ExternalLink, ShoppingBag, Calendar, MapPin, User, CreditCard, Globe, Building2, TrendingUp, Users, Target, MessageSquare, BarChart3, PieChart } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface CustomersListProps {
  vendorId?: number;
}

export default function CustomersList({ vendorId }: CustomersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [analyticsView, setAnalyticsView] = useState("overview");
  const { formatPriceFromGBP } = useCurrency();

  // Fetch customers
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

  // Fetch customer segmentation analytics
  const { data: segmentationData, isLoading: isLoadingSegmentation } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/segmentation"],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/segmentation`);
      if (!response.ok) {
        throw new Error("Failed to fetch segmentation data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch customer lifetime value analytics
  const { data: lifetimeValueData, isLoading: isLoadingLTV } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/lifetime-value"],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/lifetime-value`);
      if (!response.ok) {
        throw new Error("Failed to fetch lifetime value data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch customer service interactions
  const { data: serviceInteractions, isLoading: isLoadingService } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/service-interactions"],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/service-interactions`);
      if (!response.ok) {
        throw new Error("Failed to fetch service interactions");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Filter customers based on search query and segment
  const filteredCustomers = customers?.filter((customer: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Segment filter
    if (segmentFilter !== "all") {
      const customerSegment = getCustomerSegment(customer);
      if (customerSegment.toLowerCase() !== segmentFilter.toLowerCase()) return false;
    }

    return true;
  }) || [];

  // Helper function to determine customer segment
  const getCustomerSegment = (customer: any) => {
    const totalSpent = customer.totalSpent || 0;
    const totalOrders = customer.totalOrders || 0;
    
    if (totalSpent >= 1000 && totalOrders >= 10) return 'VIP';
    if (totalSpent >= 500 && totalOrders >= 5) return 'Premium';
    if (totalSpent >= 100 && totalOrders >= 2) return 'Regular';
    return 'New';
  };

  // Sort customers based on selected sort option
  const sortedCustomers = [...filteredCustomers].sort((a: any, b: any) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.lastPurchaseDate || 0).getTime() - new Date(a.lastPurchaseDate || 0).getTime();
      case "name_asc":
        return (a.name || "").localeCompare(b.name || "");
      case "name_desc":
        return (b.name || "").localeCompare(a.name || "");
      case "orders_high":
        return (b.totalOrders || 0) - (a.totalOrders || 0);
      case "amount_high":
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      default:
        return 0;
    }
  });

  // Handle view customer details
  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCustomerDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get customer initials for avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get customer tier badge
  const getCustomerTierBadge = (tier: string | null | undefined, totalSpent: number) => {
    if (!tier && totalSpent >= 1000) {
      tier = "premium";
    } else if (!tier && totalSpent >= 500) {
      tier = "regular";
    } else if (!tier) {
      tier = "new";
    }

    switch (tier.toLowerCase()) {
      case "premium":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300">Premium</Badge>;
      case "regular":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">Regular</Badge>;
      case "new":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">New</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Tabs */}
      <Tabs value={analyticsView} onValueChange={setAnalyticsView}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="lifetime-value">Lifetime Value</TabsTrigger>
          <TabsTrigger value="service-interactions">Service History</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Traditional Customer List */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="orders_high">Most Orders</SelectItem>
                  <SelectItem value="amount_high">Highest Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Premium Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers?.filter((customer: any) => 
                customer.tier === "premium" || customer.totalSpent >= 1000
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPriceFromGBP(customers?.reduce((avg: number, customer: any) => {
                const customerAvg = customer.totalSpent / (customer.totalOrders || 1);
                return avg + customerAvg / (customers.length || 1);
              }, 0) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent Purchase</SelectItem>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="orders_high">Most Orders</SelectItem>
            <SelectItem value="amount_high">Highest Spend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!sortedCustomers || sortedCustomers.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <h3 className="text-lg font-medium">No customers found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery 
              ? "No customers match your search criteria." 
              : "You don't have any customers yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer: any) => (
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
                  <TableCell>{formatDate(customer.lastPurchaseDate)}</TableCell>
                  <TableCell>{customer.totalOrders || 0}</TableCell>
                  <TableCell>${(customer.totalSpent || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {getCustomerTierBadge(customer.tier, customer.totalSpent || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedCustomer.profileImage} alt={selectedCustomer.name} />
                  <AvatarFallback>{getInitials(selectedCustomer.name)}</AvatarFallback>
                </Avatar>
                {selectedCustomer.name}
              </DialogTitle>
              <DialogDescription>
                Customer details and purchase history
              </DialogDescription>
            </DialogHeader>
            <div>
              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal Information
                      </h4>
                      <div className="space-y-3 pl-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-muted-foreground">Full Name</span>
                            <p className="font-medium">{selectedCustomer.name || selectedCustomer.username || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Username</span>
                            <p className="font-medium">{selectedCustomer.username || 'N/A'}</p>
                          </div>
                        </div>
                        {selectedCustomer.dateOfBirth && (
                          <div>
                            <span className="text-xs text-muted-foreground">Date of Birth</span>
                            <p className="font-medium">{formatDate(selectedCustomer.dateOfBirth)}</p>
                          </div>
                        )}
                        {selectedCustomer.gender && (
                          <div>
                            <span className="text-xs text-muted-foreground">Gender</span>
                            <p className="font-medium capitalize">{selectedCustomer.gender}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Information
                      </h4>
                      <div className="space-y-3 pl-6">
                        {selectedCustomer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{selectedCustomer.email}</span>
                          </div>
                        )}
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{selectedCustomer.phone}</span>
                          </div>
                        )}
                        {selectedCustomer.alternatePhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{selectedCustomer.alternatePhone} <span className="text-xs text-muted-foreground">(Alt)</span></span>
                          </div>
                        )}
                        {selectedCustomer.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={selectedCustomer.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedCustomer.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                      {/* Primary Address */}
                      {(selectedCustomer.address || selectedCustomer.city || selectedCustomer.country) && (
                        <div>
                          <span className="text-xs text-muted-foreground mb-2 block">Primary Address</span>
                          <div className="space-y-1 text-sm">
                            {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
                            <p>
                              {[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(', ')}
                              {selectedCustomer.zipCode && ` ${selectedCustomer.zipCode}`}
                            </p>
                            {selectedCustomer.country && <p className="font-medium">{selectedCustomer.country}</p>}
                          </div>
                        </div>
                      )}

                      {/* Billing Address (if different) */}
                      {(selectedCustomer.billingAddress || selectedCustomer.billingCity) && (
                        <div>
                          <span className="text-xs text-muted-foreground mb-2 block">Billing Address</span>
                          <div className="space-y-1 text-sm">
                            {selectedCustomer.billingAddress && <p>{selectedCustomer.billingAddress}</p>}
                            <p>
                              {[selectedCustomer.billingCity, selectedCustomer.billingState].filter(Boolean).join(', ')}
                              {selectedCustomer.billingZipCode && ` ${selectedCustomer.billingZipCode}`}
                            </p>
                            {selectedCustomer.billingCountry && <p className="font-medium">{selectedCustomer.billingCountry}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account & Membership Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Account Information
                      </h4>
                      <div className="space-y-3 pl-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            Member since <strong>{formatDate(selectedCustomer.createdAt)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>{selectedCustomer.totalOrders || 0}</strong> total orders
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Customer Tier</span>
                          <div className="mt-1">
                            {getCustomerTierBadge(selectedCustomer.tier, selectedCustomer.totalSpent || 0)}
                          </div>
                        </div>
                        {selectedCustomer.accountStatus && (
                          <div>
                            <span className="text-xs text-muted-foreground">Account Status</span>
                            <p className="font-medium capitalize">{selectedCustomer.accountStatus}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Additional Details
                      </h4>
                      <div className="space-y-3 pl-6">
                        {selectedCustomer.company && (
                          <div>
                            <span className="text-xs text-muted-foreground">Company</span>
                            <p className="font-medium">{selectedCustomer.company}</p>
                          </div>
                        )}
                        {selectedCustomer.jobTitle && (
                          <div>
                            <span className="text-xs text-muted-foreground">Job Title</span>
                            <p className="font-medium">{selectedCustomer.jobTitle}</p>
                          </div>
                        )}
                        {selectedCustomer.preferredLanguage && (
                          <div>
                            <span className="text-xs text-muted-foreground">Preferred Language</span>
                            <p className="font-medium">{selectedCustomer.preferredLanguage}</p>
                          </div>
                        )}
                        {selectedCustomer.timezone && (
                          <div>
                            <span className="text-xs text-muted-foreground">Timezone</span>
                            <p className="font-medium">{selectedCustomer.timezone}</p>
                          </div>
                        )}
                        {selectedCustomer.marketingOptIn !== undefined && (
                          <div>
                            <span className="text-xs text-muted-foreground">Marketing Emails</span>
                            <p className="font-medium">{selectedCustomer.marketingOptIn ? 'Subscribed' : 'Unsubscribed'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Purchase Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="shadow-none border border-muted">
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-xs font-medium text-muted-foreground">
                            Total Spent
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="text-lg font-bold">
                            {formatPriceFromGBP(selectedCustomer.totalSpent || 0)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="shadow-none border border-muted">
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-xs font-medium text-muted-foreground">
                            Avg. Order Value
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="text-lg font-bold">
                            {formatPriceFromGBP(selectedCustomer.totalSpent / (selectedCustomer.totalOrders || 1))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="shadow-none border border-muted">
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-xs font-medium text-muted-foreground">
                            Last Purchase
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="text-lg font-bold">
                            {formatDate(selectedCustomer.lastPurchaseDate)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {selectedCustomer.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <div className="border rounded-md p-3">
                        <p>{selectedCustomer.notes}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="orders">
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="border rounded-md">
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
                          {selectedCustomer.orders.map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                {order.orderNumber || `#${order.id}`}
                              </TableCell>
                              <TableCell>{formatDate(order.createdAt || order.date)}</TableCell>
                              <TableCell>{order.items?.length || 0}</TableCell>
                              <TableCell>{formatPriceFromGBP(order.total || 0)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{order.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No order history available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCustomerDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}