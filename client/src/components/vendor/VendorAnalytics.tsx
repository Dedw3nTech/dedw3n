import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface VendorAnalyticsProps {
  vendorId: number;
}

export default function VendorAnalytics({ vendorId }: VendorAnalyticsProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState("revenue");

  // Fetch revenue data
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/revenue", revenuePeriod],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/revenue?period=${revenuePeriod}`);
      if (!response.ok) {
        throw new Error("Failed to fetch revenue data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch top products data
  const { data: topProductsData, isLoading: isLoadingTopProducts } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/top-products"],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/top-products`);
      if (!response.ok) {
        throw new Error("Failed to fetch top products data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch profit/loss data
  const { data: profitLossData, isLoading: isLoadingProfitLoss } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/profit-loss"],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/profit-loss`);
      if (!response.ok) {
        throw new Error("Failed to fetch profit/loss data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch order stats data
  const { data: orderStatsData, isLoading: isLoadingOrderStats } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/order-stats"],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/order-stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch order stats data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch top buyers data
  const { data: topBuyersData, isLoading: isLoadingTopBuyers } = useQuery({
    queryKey: ["/api/vendors", vendorId, "analytics/top-buyers"],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/analytics/top-buyers`);
      if (!response.ok) {
        throw new Error("Failed to fetch top buyers data");
      }
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="profitLoss">Profit/Loss</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Revenue Analysis</h3>
            <div className="w-40">
              <Select value={revenuePeriod} onValueChange={(value) => setRevenuePeriod(value as any)}>
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
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
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

        {/* Top Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Your best performing products by sales volume
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingTopProducts ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : topProductsData && topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Units Sold']} />
                    <Legend />
                    <Bar dataKey="unitsSold" fill="#8884d8" name="Units Sold" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No product sales data available yet
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
                        ${profitLossData.revenue?.toFixed(2) || "0.00"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none border border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        ${profitLossData.expenses?.toFixed(2) || "0.00"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none border border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${(profitLossData.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${profitLossData.profit?.toFixed(2) || "0.00"}
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

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Statistics</CardTitle>
              <CardDescription>
                Your order performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingOrderStats ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : orderStatsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Orders by Status</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={orderStatsData.ordersByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {orderStatsData.ordersByStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Orders']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Orders Over Time</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart
                        data={orderStatsData.ordersByPeriod}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value, 'Orders']} />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                    <Card className="shadow-none border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {orderStatsData.totalOrders || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          ${orderStatsData.averageOrderValue?.toFixed(2) || "0.00"}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Order Fulfillment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {orderStatsData.fulfillmentRate ? (orderStatsData.fulfillmentRate * 100).toFixed(0) : "0"}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No order statistics available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>
                Your most valuable customers by purchase volume
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoadingTopBuyers ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : topBuyersData && topBuyersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topBuyersData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="customerName" width={150} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "totalSpent") return [`$${Number(value).toFixed(2)}`, 'Total Spent'];
                        return [value, name === "orderCount" ? 'Orders' : name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalSpent" fill="#8884d8" name="Total Spent ($)" />
                    <Bar dataKey="orderCount" fill="#82ca9d" name="Order Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No customer purchase data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}