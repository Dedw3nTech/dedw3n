import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  Eye,
  Calendar,
  Star,
  Target
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface VendorAnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalViews: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: number;
    name: string;
    orders: number;
    revenue: number;
  }>;
  monthlyStats: Array<{
    month: string;
    orders: number;
    revenue: number;
    views: number;
  }>;
  recentOrders: Array<{
    id: number;
    customerName: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  performanceMetrics: {
    salesGrowth: number;
    orderGrowth: number;
    viewGrowth: number;
    rating: number;
    badgeLevel: string;
  };
}

interface VendorAnalyticsProps {
  vendorId: number;
}

export default function VendorAnalytics({ vendorId }: VendorAnalyticsProps) {
  const { formatPriceFromGBP } = useCurrency();
  
  const { data: analyticsData, isLoading } = useQuery<VendorAnalyticsData>({
    queryKey: ["/api/vendor/analytics", vendorId],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No analytics data available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Performance Overview</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {analyticsData.performanceMetrics.badgeLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
            <span className="text-lg font-semibold">
              {analyticsData.performanceMetrics.rating.toFixed(1)} / 5.0
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPriceFromGBP(analyticsData.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.performanceMetrics.salesGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(analyticsData.performanceMetrics.salesGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.performanceMetrics.orderGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(analyticsData.performanceMetrics.orderGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.performanceMetrics.viewGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(analyticsData.performanceMetrics.viewGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              Avg Order: {formatPriceFromGBP(analyticsData.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatPriceFromGBP(Number(value))} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.orders} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPriceFromGBP(product.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPriceFromGBP(order.amount)}</div>
                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}