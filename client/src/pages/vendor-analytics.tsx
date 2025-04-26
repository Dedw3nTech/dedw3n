import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useVendorAnalytics, RevenuePeriod } from '@/hooks/use-vendor-analytics';
import { Redirect } from 'wouter';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/currencyConverter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleDollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line, 
  ResponsiveContainer, 
  Pie, 
  Cell,
  LineChart,
  PieChart,
  BarChart 
} from 'recharts';

export default function VendorAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [period, setPeriod] = useState<RevenuePeriod>('monthly');
  
  // Redirect if not a vendor
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (user && !user.isVendor) {
    return <Redirect to="/" />;
  }
  
  // Get vendor ID from user (assuming the vendor has the same ID as the user for simplicity)
  // In a real app, you would have a separate lookup
  const vendorId = user.id;
  
  const { 
    totalSales, 
    orderStats, 
    topProducts, 
    profitLoss, 
    getRevenueData,
    isLoading 
  } = useVendorAnalytics(vendorId);
  
  const { 
    data: revenueData,
    isLoading: isLoadingRevenue
  } = getRevenueData(period);
  
  // Prepare data for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
  
  // Format revenue data for chart
  const formattedRevenueData = revenueData ? Object.entries(revenueData).map(([date, amount]) => ({
    date,
    amount
  })).sort((a, b) => {
    // Sort by date
    return a.date.localeCompare(b.date);
  }) : [];
  
  // Format order stats for chart
  const orderStatsData = orderStats ? [
    { name: t('vendor.pending'), value: orderStats.pendingOrders },
    { name: t('vendor.shipped'), value: orderStats.shippedOrders },
    { name: t('vendor.delivered'), value: orderStats.deliveredOrders },
    { name: t('vendor.canceled'), value: orderStats.canceledOrders }
  ] : [];
  
  // Format top products for chart
  const topProductsData = topProducts ? topProducts.map(item => ({
    name: item.product.name,
    revenue: item.revenue,
    sold: item.totalSold
  })) : [];
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center gradient-text">{t('vendor.analytics_dashboard')}</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('vendor.total_sales')}
                </CardTitle>
                <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSales, "GBP")}</div>
                <p className="text-xs text-muted-foreground">{t('vendor.total_revenue', {})}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('vendor.orders')}
                </CardTitle>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">{t('vendor.total_orders')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('vendor.profit')}
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(profitLoss?.netProfit || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {t('vendor.profit_margin')}: {profitLoss ? profitLoss.profitMargin.toFixed(2) : '0'}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('vendor.products')}
                </CardTitle>
                <Package className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topProducts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">{t('vendor.top_selling_products')}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>{t('vendor.revenue_over_time')}</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant={period === 'daily' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setPeriod('daily')}
                  >
                    {t('vendor.daily')}
                  </Button>
                  <Button 
                    variant={period === 'weekly' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setPeriod('weekly')}
                  >
                    {t('vendor.weekly')}
                  </Button>
                  <Button 
                    variant={period === 'monthly' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setPeriod('monthly')}
                  >
                    {t('vendor.monthly')}
                  </Button>
                  <Button 
                    variant={period === 'yearly' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setPeriod('yearly')}
                  >
                    {t('vendor.yearly')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingRevenue ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : formattedRevenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name={t('vendor.revenue')}
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    {t('vendor.no_revenue_data')}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Order Status Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>{t('vendor.order_status_distribution')}</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {orderStatsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {orderStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    {t('vendor.no_order_data')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Top Products Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('vendor.top_selling_products')}</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value as number) : value,
                      name === 'revenue' ? t('vendor.revenue') : t('vendor.units_sold')
                    ]} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name={t('vendor.revenue')} fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="sold" name={t('vendor.units_sold')} fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                  {t('vendor.no_product_data')}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Profit/Loss Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>{t('vendor.profit_loss_analysis')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {profitLoss ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col space-y-2">
                    <span className="text-muted-foreground text-sm">{t('vendor.total_revenue')}</span>
                    <span className="text-2xl font-bold">{formatCurrency(profitLoss.totalRevenue)}</span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <span className="text-muted-foreground text-sm">{t('vendor.total_cost')}</span>
                    <span className="text-2xl font-bold">{formatCurrency(profitLoss.totalCost)}</span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <span className="text-muted-foreground text-sm">{t('vendor.net_profit')}</span>
                    <span className={`text-2xl font-bold ${profitLoss.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(profitLoss.netProfit)}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <span className="text-muted-foreground text-sm">{t('vendor.profit_margin')}</span>
                    <span className={`text-2xl font-bold ${profitLoss.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {profitLoss.profitMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-32 text-muted-foreground">
                  {t('vendor.no_profit_loss_data')}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}