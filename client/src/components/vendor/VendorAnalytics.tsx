import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface VendorAnalyticsProps {
  vendorId: number;
}

export default function VendorAnalytics({ vendorId }: VendorAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("revenue");
  const [revenuePeriod, setRevenuePeriod] = useState("monthly");
  const { formatPriceFromGBP } = useCurrency();

  // Revenue analytics
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'analytics/revenue', revenuePeriod],
    queryFn: () => apiRequest('GET', `/api/vendors/${vendorId}/analytics/revenue?period=${revenuePeriod}`).then(res => res.json()),
    enabled: !!vendorId
  });

  // Profit/Loss analytics
  const { data: profitLossData, isLoading: isLoadingProfitLoss } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'analytics/profit-loss'],
    queryFn: () => apiRequest('GET', `/api/vendors/${vendorId}/analytics/profit-loss`).then(res => res.json()),
    enabled: !!vendorId
  });

  // Metrics analytics
  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'analytics/metrics'],
    queryFn: () => apiRequest('GET', `/api/vendors/${vendorId}/analytics/metrics`).then(res => res.json()),
    enabled: !!vendorId
  });

  // Competitors analytics
  const { data: competitorsData, isLoading: isLoadingCompetitors } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'analytics/competitors'],
    queryFn: () => apiRequest('GET', `/api/vendors/${vendorId}/analytics/competitors`).then(res => res.json()),
    enabled: !!vendorId
  });

  // Leads analytics
  const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'analytics/leads'],
    queryFn: () => apiRequest('GET', `/api/vendors/${vendorId}/analytics/leads`).then(res => res.json()),
    enabled: !!vendorId
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="profitLoss">Profit/Loss</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Revenue Analysis</h3>
            <div className="w-40">
              <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Your revenue trends over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingRevenue ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatPriceFromGBP(Number(value)), 'Revenue']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No revenue data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit/Loss Tab */}
        <TabsContent value="profitLoss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Summary</CardTitle>
              <CardDescription>
                Your financial performance overview
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingProfitLoss ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : profitLossData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                  <Card className="shadow-none border border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPriceFromGBP(Number(profitLossData.revenue || 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none border border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatPriceFromGBP(Number(profitLossData.expenses || 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none border border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${Number(profitLossData.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPriceFromGBP(Number(profitLossData.profit || 0))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {profitLossData.categories && profitLossData.categories.length > 0 && (
                    <div className="col-span-3 h-40">
                      <h4 className="text-sm font-medium mb-2">Revenue by Category</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={profitLossData.categories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="category"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {profitLossData.categories.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No profit/loss data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
              <CardDescription>
                Key performance indicators for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingMetrics ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : metricsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div className="grid grid-cols-1 gap-4">
                    <Card className="shadow-none border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {Number(metricsData.totalOrders || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {formatPriceFromGBP(Number(metricsData.averageOrderValue || 0))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {(Number(metricsData.fulfillmentRate || 0) * 100).toFixed(0)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {metricsData.ordersByStatus && metricsData.ordersByStatus.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Orders by Status</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={metricsData.ordersByStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="status"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {metricsData.ordersByStatus.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Orders']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No metrics data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>
                Other vendors in your categories
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingCompetitors ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : competitorsData && competitorsData.length > 0 ? (
                <div className="space-y-4 max-h-72 overflow-y-auto">
                  {competitorsData.map((competitor: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{competitor.storeName}</h4>
                        <p className="text-sm text-muted-foreground">{competitor.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Number(competitor.productCount)} products
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: ${Number(competitor.averagePrice || 0).toFixed(2)}
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          ${Number(competitor.totalSales || 0).toFixed(2)} sales
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No competitor data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Potential Leads</CardTitle>
              <CardDescription>
                Users who have shown interest in your products
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingLeads ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : leadsData && leadsData.length > 0 ? (
                <div className="space-y-4 max-h-72 overflow-y-auto">
                  {leadsData.map((lead: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{lead.username}</h4>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Number(lead.viewCount)} product views
                        </div>
                        <Badge variant={lead.hasOrdered ? "default" : "secondary"}>
                          {lead.hasOrdered ? "Customer" : "Lead"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No leads data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}