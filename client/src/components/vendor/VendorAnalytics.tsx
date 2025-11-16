import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Eye,
  ShoppingCart,
  Star,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Award,
  Clock,
  Lightbulb,
  AlertCircle
} from 'lucide-react';

interface VendorAnalyticsProps {
  vendorId: number;
}

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
    repeatCustomerRate: number;
    totalViews: number;
  };
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    orders: number;
    profit: number;
  }>;
  productPerformance: Array<{
    productId: number;
    productName: string;
    revenue: number;
    orders: number;
    views: number;
    conversionRate: number;
    profit: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
  customerInsights: {
    topCustomers: Array<{
      customerId: number;
      customerName: string;
      totalSpent: number;
      orderCount: number;
      lastOrder: string;
    }>;
    customerRetention: Array<{
      period: string;
      newCustomers: number;
      returningCustomers: number;
    }>;
  };
  trafficAnalytics: Array<{
    period: string;
    views: number;
    uniqueVisitors: number;
    bounceRate: number;
  }>;
  comparison: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
    conversionGrowth: number;
  };
}

interface Suggestion {
  id: number;
  type: 'pricing' | 'inventory' | 'marketing' | 'product' | 'customer';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28'];

export default function VendorAnalytics({ vendorId }: VendorAnalyticsProps) {
  const { formatPriceFromGBP } = useCurrency();
  const [timeRange, setTimeRange] = useState('30d');
  const [activeMetric, setActiveMetric] = useState('revenue');

  // Fetch analytics data
  const { data: analytics, isLoading, refetch, error: analyticsError } = useQuery({
    queryKey: ['/api/vendors/analytics', vendorId, timeRange],
    queryFn: async () => {
      const response = await apiRequest(`/api/vendors/analytics?vendorId=${vendorId}&timeRange=${timeRange}`);
      return response as AnalyticsData;
    },
    enabled: !!vendorId
  });

  // Fetch AI-powered suggestions
  const { data: suggestions, isLoading: isLoadingSuggestions, error: suggestionsError } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'suggestions'],
    queryFn: async () => {
      const response = await apiRequest(`/api/vendors/${vendorId}/suggestions`);
      return response as Suggestion[];
    },
    enabled: !!vendorId
  });

  const formatMetric = (value: number, type: 'currency' | 'number' | 'percentage') => {
    switch (type) {
      case 'currency':
        return formatPriceFromGBP(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing':
        return <DollarSign className="h-5 w-5" />;
      case 'inventory':
        return <Package className="h-5 w-5" />;
      case 'marketing':
        return <TrendingUp className="h-5 w-5" />;
      case 'product':
        return <ShoppingCart className="h-5 w-5" />;
      case 'customer':
        return <Users className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="analytics-loading">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        Loading analytics...
      </div>
    );
  }

  if (analyticsError) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center" data-testid="analytics-error">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
            <p className="text-muted-foreground mb-4">
              {analyticsError instanceof Error ? analyticsError.message : 'An error occurred while loading analytics data'}
            </p>
            <Button onClick={() => refetch()} variant="outline" data-testid="button-retry-analytics">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8" data-testid="analytics-no-data">
        <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Analytics will appear once you have sales data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Analytics</h2>
          <p className="text-muted-foreground">
            Track your store performance and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-analytics">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" data-testid="button-export-analytics">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              {formatPriceFromGBP(analytics.overview.totalRevenue)}
            </div>
            <div className={`text-xs flex items-center ${getGrowthColor(analytics.comparison.revenueGrowth)}`}>
              {getGrowthIcon(analytics.comparison.revenueGrowth)}
              <span className="ml-1" data-testid="text-revenue-growth">
                {analytics.comparison.revenueGrowth > 0 ? '+' : ''}
                {analytics.comparison.revenueGrowth.toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">
              {analytics.overview.totalOrders.toLocaleString()}
            </div>
            <div className={`text-xs flex items-center ${getGrowthColor(analytics.comparison.orderGrowth)}`}>
              {getGrowthIcon(analytics.comparison.orderGrowth)}
              <span className="ml-1" data-testid="text-order-growth">
                {analytics.comparison.orderGrowth > 0 ? '+' : ''}
                {analytics.comparison.orderGrowth.toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-customers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-customers">
              {analytics.overview.totalCustomers.toLocaleString()}
            </div>
            <div className={`text-xs flex items-center ${getGrowthColor(analytics.comparison.customerGrowth)}`}>
              {getGrowthIcon(analytics.comparison.customerGrowth)}
              <span className="ml-1" data-testid="text-customer-growth">
                {analytics.comparison.customerGrowth > 0 ? '+' : ''}
                {analytics.comparison.customerGrowth.toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {analytics.overview.conversionRate.toFixed(1)}%
            </div>
            <div className={`text-xs flex items-center ${getGrowthColor(analytics.comparison.conversionGrowth)}`}>
              {getGrowthIcon(analytics.comparison.conversionGrowth)}
              <span className="ml-1" data-testid="text-conversion-growth">
                {analytics.comparison.conversionGrowth > 0 ? '+' : ''}
                {analytics.comparison.conversionGrowth.toFixed(1)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPriceFromGBP(analytics.overview.averageOrderValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalProducts.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customer Rate</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.repeatCustomerRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI-Powered Suggestions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Personalized tips to increase your sales based on your store's performance
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingSuggestions ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="suggestions-loading">
              Generating personalized suggestions...
            </div>
          ) : suggestionsError ? (
            <div className="text-center py-8" data-testid="suggestions-error">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
              <p className="text-sm text-muted-foreground mb-3">
                {suggestionsError instanceof Error ? suggestionsError.message : 'Failed to load suggestions'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
                data-testid="button-retry-suggestions"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="space-y-4" data-testid="suggestions-list">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  data-testid={`suggestion-${suggestion.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getTypeIcon(suggestion.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold" data-testid={`text-suggestion-title-${suggestion.id}`}>
                          {suggestion.title}
                        </h4>
                        <span 
                          className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(suggestion.priority)}`}
                          data-testid={`text-suggestion-priority-${suggestion.id}`}
                        >
                          {suggestion.priority === 'high' && 'High Priority'}
                          {suggestion.priority === 'medium' && 'Medium Priority'}
                          {suggestion.priority === 'low' && 'Low Priority'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-suggestion-description-${suggestion.id}`}>
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-green-700">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Impact:</span>
                        <span data-testid={`text-suggestion-impact-${suggestion.id}`}>{suggestion.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="suggestions-empty">
              No suggestions available at the moment. Keep growing your business and check back later!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-analytics">
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          <TabsTrigger value="traffic" data-testid="tab-traffic">Traffic</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPriceFromGBP(value as number)} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPriceFromGBP(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatPriceFromGBP(category.revenue)}</div>
                        <div className="text-xs text-muted-foreground">{category.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.productPerformance.slice(0, 10).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.orders} orders • {product.views} views
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPriceFromGBP(product.revenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.conversionRate.toFixed(1)}% conversion
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.customerInsights.topCustomers.map((customer, index) => (
                    <div key={customer.customerId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{customer.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.orderCount} orders
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatPriceFromGBP(customer.totalSpent)}</div>
                        <div className="text-sm text-muted-foreground">
                          Last: {new Date(customer.lastOrder).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.customerInsights.customerRetention}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="newCustomers" stackId="a" fill="#8884d8" name="New Customers" />
                    <Bar dataKey="returningCustomers" stackId="a" fill="#82ca9d" name="Returning Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.trafficAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="uniqueVisitors" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}