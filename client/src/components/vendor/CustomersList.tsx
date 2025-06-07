import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedBatchTranslation } from '@/hooks/use-unified-translation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  ExternalLink,
  Search,
  Users,
  Target,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CustomersListProps {
  vendorId?: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  phone?: string;
  location?: string;
  totalOrders: number;
  totalSpent: number;
  lastPurchaseDate: string;
  tier?: string;
}



export default function CustomersList({ vendorId }: CustomersListProps) {
  const { formatPriceFromGBP } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [analyticsView, setAnalyticsView] = useState('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  // Define all translatable texts
  const customerTexts = useMemo(() => [
    "Search customers...",
    "Total Customers",
    "Premium Customers", 
    "Average Order Value",
    "Overview",
    "Segmentation",
    "Lifetime Value",
    "Service History",
    "All Segments",
    "VIP",
    "Premium", 
    "Regular",
    "New",
    "Recent Activity",
    "Customer",
    "Contact",
    "Segment",
    "Orders",
    "Total Spent",
    "Last Order",
    "Actions",
    "View Details",
    "Never",
    "No vendor selected",
    "Please select a vendor to view customer analytics",
    "No customers found",
    "Try adjusting your search or filters",
    "Sort by",
    "View Customer",
    "Customer Segmentation Analytics",
    "Analytics data will be available once you have sufficient customer transaction history",
    "This feature provides insights into customer segments based on purchase patterns",
    "Customer Lifetime Value Analytics",
    "Lifetime value predictions will be calculated once you have sufficient transaction data",
    "This feature helps identify your most valuable customers and predict future revenue",
    "Customer Service Analytics",
    "Service interaction metrics will be available once you implement a customer support system",
    "This feature tracks support tickets, response times, and customer satisfaction"
  ], []);

  // Get translations
  const { translations: translatedTexts, isLoading: isTranslating } = useUnifiedBatchTranslation(customerTexts, 'high');

  // Fetch real customer data
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: [`/api/vendors/${vendorId}/customers`],
    enabled: !!vendorId,
  });



  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getCustomerSegment = (customer: Customer) => {
    if (customer.totalSpent >= 2000) return 'VIP';
    if (customer.totalSpent >= 1000) return 'Premium';
    if (customer.totalSpent >= 100) return 'Regular';
    return 'New';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return translatedTexts["Never"] || 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const sortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const segment = getCustomerSegment(customer);
      const matchesSegment = segmentFilter === 'all' || 
                           (segmentFilter === 'vip' && segment === 'VIP') ||
                           (segmentFilter === 'premium' && segment === 'Premium') ||
                           (segmentFilter === 'regular' && segment === 'Regular') ||
                           (segmentFilter === 'new' && segment === 'New');
      
      return matchesSearch && matchesSegment;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'orders_high':
          return (b.totalOrders || 0) - (a.totalOrders || 0);
        case 'amount_high':
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case 'recent':
        default:
          return new Date(b.lastPurchaseDate || '').getTime() - new Date(a.lastPurchaseDate || '').getTime();
      }
    });
  }, [customers, searchQuery, sortBy, segmentFilter]);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerDialogOpen(true);
  };

  if (!vendorId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          {translatedTexts["No vendor selected"] || "No vendor selected"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translatedTexts["Please select a vendor to view customer analytics"] || "Please select a vendor to view customer analytics"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Tabs */}
      <Tabs value={analyticsView} onValueChange={setAnalyticsView}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{translatedTexts["Overview"] || "Overview"}</TabsTrigger>
          <TabsTrigger value="segmentation">{translatedTexts["Segmentation"] || "Segmentation"}</TabsTrigger>
          <TabsTrigger value="lifetime-value">{translatedTexts["Lifetime Value"] || "Lifetime Value"}</TabsTrigger>
          <TabsTrigger value="service-interactions">{translatedTexts["Service History"] || "Service History"}</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Traditional Customer List */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={translatedTexts["Search customers..."] || "Search customers..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={translatedTexts["All Segments"] || "All Segments"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translatedTexts["All Segments"] || "All Segments"}</SelectItem>
                  <SelectItem value="vip">{translatedTexts["VIP"] || "VIP"}</SelectItem>
                  <SelectItem value="premium">{translatedTexts["Premium"] || "Premium"}</SelectItem>
                  <SelectItem value="regular">{translatedTexts["Regular"] || "Regular"}</SelectItem>
                  <SelectItem value="new">{translatedTexts["New"] || "New"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={translatedTexts["Sort by"] || "Sort by"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{translatedTexts["Recent Activity"] || "Recent Activity"}</SelectItem>
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
                  {translatedTexts["Total Customers"] || "Total Customers"}
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
                  {translatedTexts["Premium Customers"] || "Premium Customers"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers?.filter((customer: Customer) => 
                    getCustomerSegment(customer) === 'Premium' || getCustomerSegment(customer) === 'VIP'
                  ).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {translatedTexts["Average Order Value"] || "Average Order Value"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPriceFromGBP(customers?.reduce((avg: number, customer: Customer) => {
                    const customerAvg = customer.totalSpent / (customer.totalOrders || 1);
                    return avg + customerAvg / (customers.length || 1);
                  }, 0) || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translatedTexts["Customer"] || "Customer"}</TableHead>
                  <TableHead>{translatedTexts["Contact"] || "Contact"}</TableHead>
                  <TableHead>{translatedTexts["Segment"] || "Segment"}</TableHead>
                  <TableHead>{translatedTexts["Orders"] || "Orders"}</TableHead>
                  <TableHead>{translatedTexts["Total Spent"] || "Total Spent"}</TableHead>
                  <TableHead>{translatedTexts["Last Order"] || "Last Order"}</TableHead>
                  <TableHead>{translatedTexts["Actions"] || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCustomers ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading customers...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <User className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">{translatedTexts["No customers found"] || "No customers found"}</p>
                        <p className="text-xs text-muted-foreground">{translatedTexts["Try adjusting your search or filters"] || "Try adjusting your search or filters"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCustomers.map((customer: Customer) => (
                    <TableRow key={customer.id} className="group">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={customer.avatar} alt={customer.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(customer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.username || "No username"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getCustomerSegment(customer) === 'VIP' ? 'bg-purple-100 text-purple-800' : 
                          getCustomerSegment(customer) === 'Premium' ? 'bg-blue-100 text-blue-800' :
                          getCustomerSegment(customer) === 'Regular' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}`}>
                          {getCustomerSegment(customer)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.totalOrders || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatPriceFromGBP(customer.totalSpent || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDate(customer.lastPurchaseDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCustomer(customer)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {translatedTexts["View Details"] || "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Segmentation Tab */}
        <TabsContent value="segmentation" className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {translatedTexts["Customer Segmentation Analytics"] || "Customer Segmentation Analytics"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {translatedTexts["Analytics data will be available once you have sufficient customer transaction history"] || "Analytics data will be available once you have sufficient customer transaction history."}
              {" "}
              {translatedTexts["This feature provides insights into customer segments based on purchase patterns"] || "This feature provides insights into customer segments based on purchase patterns."}
            </p>
          </div>
        </TabsContent>

        {/* Lifetime Value Tab */}
        <TabsContent value="lifetime-value" className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {translatedTexts["Customer Lifetime Value Analytics"] || "Customer Lifetime Value Analytics"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {translatedTexts["Lifetime value predictions will be calculated once you have sufficient transaction data"] || "Lifetime value predictions will be calculated once you have sufficient transaction data."}
              {" "}
              {translatedTexts["This feature helps identify your most valuable customers and predict future revenue"] || "This feature helps identify your most valuable customers and predict future revenue."}
            </p>
          </div>
        </TabsContent>

        {/* Service Interactions Tab */}
        <TabsContent value="service-interactions" className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {translatedTexts["Customer Service Analytics"] || "Customer Service Analytics"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {translatedTexts["Service interaction metrics will be available once you implement a customer support system"] || "Service interaction metrics will be available once you implement a customer support system."}
              {" "}
              {translatedTexts["This feature tracks support tickets, response times, and customer satisfaction"] || "This feature tracks support tickets, response times, and customer satisfaction."}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-semibold">{selectedCustomer.name || "Unknown Customer"}</div>
                  <div className="text-sm text-muted-foreground">{selectedCustomer.email}</div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Detailed customer information and analytics
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCustomer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCustomer.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purchase Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span>Purchase Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-semibold">{selectedCustomer.totalOrders || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Orders</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-semibold">
                        {formatPriceFromGBP(selectedCustomer.totalSpent || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Spent</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-semibold">
                        {formatPriceFromGBP(
                          (selectedCustomer.totalSpent || 0) / (selectedCustomer.totalOrders || 1)
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Order Value</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-semibold">
                        {getCustomerSegment(selectedCustomer)}
                      </div>
                      <div className="text-xs text-muted-foreground">Customer Segment</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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