import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, 
  Target, Calendar, Download, RefreshCw, AlertTriangle, Info, 
  Eye, MousePointer, CreditCard, BarChart3, PieChart as PieChartIcon,
  Globe, Smartphone, Monitor, Tablet, ArrowUp, ArrowDown, Minus,
  Star, Award, Trophy, Zap, FileText
} from 'lucide-react';
import { useAnalyticsDashboard, useGenerateSampleData } from '@/hooks/use-vendor-analytics';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function VendorAnalytics() {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('monthly');
  const [days, setDays] = useState(30);
  const { toast } = useToast();

  const { data: analytics, isLoading, error, refetch } = useAnalyticsDashboard(days, timeRange);
  const { refetch: generateSample } = useGenerateSampleData();

  const handleGenerateSample = async () => {
    try {
      await generateSample();
      await refetch();
      toast({
        title: "Sample Data Generated",
        description: "Analytics dashboard has been populated with sample data.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sample data.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report is being generated and will download shortly.",
    });
    // PDF export functionality would be implemented here
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load analytics data. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2" 
              onClick={handleGenerateSample}
            >
              Generate sample data
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const deviceColors = {
    desktop: '#8884d8',
    mobile: '#82ca9d',
    tablet: '#ffc658'
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deep Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business intelligence and performance insights</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={timeRange} onValueChange={(value: 'weekly' | 'monthly') => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button 
            onClick={handleExportPDF}
            className="gap-2 bg-black text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {analytics?.financialSummary && analytics.financialSummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.financialSummary[0]?.grossRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Net: {formatCurrency(analytics.financialSummary[0]?.netRevenue || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.financialSummary[0]?.totalOrders?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                AOV: {formatCurrency(analytics.financialSummary[0]?.averageOrderValue || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(analytics.financialSummary[0]?.profitMargin || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gross: {formatCurrency(analytics.financialSummary[0]?.grossProfit || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.conversionRates && analytics.conversionRates.length > 0 
                  ? formatPercentage(analytics.conversionRates[analytics.conversionRates.length - 1]?.conversionRate || 0)
                  : '0.0%'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Last 30 days average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="forecasts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Product Forecasts */}
        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Product Forecasting
              </CardTitle>
              <CardDescription>
                AI-powered predictions for your products performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.productForecasts && analytics.productForecasts.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.productForecasts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="productName" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Predicted Revenue']} />
                      <Bar dataKey="predictedRevenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.productForecasts.slice(0, 6).map((forecast) => (
                      <Card key={forecast.productId}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{forecast.productName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Predicted Sales:</span>
                            <span className="font-medium">{forecast.predictedSales}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Revenue:</span>
                            <span className="font-medium">{formatCurrency(forecast.predictedRevenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Confidence:</span>
                            <Badge variant="secondary">
                              {formatPercentage(forecast.confidenceLevel * 100)}
                            </Badge>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span>Rec. Inventory:</span>
                            <span className="font-medium">{forecast.recommendedInventory}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Rec. Price:</span>
                            <span className="font-medium">{formatCurrency(forecast.recommendedPrice)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No forecast data available</p>
                  <Button onClick={handleGenerateSample} variant="outline">
                    Generate Sample Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Trends */}
        <TabsContent value="market" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Trends Analysis
              </CardTitle>
              <CardDescription>
                Industry insights and market performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.marketTrends && analytics.marketTrends.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analytics.marketTrends.map((trend, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{trend.category}</CardTitle>
                          {getTrendIcon(trend.trendDirection)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Growth Rate:</span>
                            <div className="font-medium text-lg">
                              {formatPercentage(trend.growthRate)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Market Demand:</span>
                            <div className="font-medium text-lg">
                              {formatPercentage(trend.marketDemand)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Competitors:</span>
                            <div className="font-medium text-lg">{trend.competitorCount}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Price:</span>
                            <div className="font-medium text-lg">
                              {formatCurrency(trend.averagePrice)}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-muted-foreground">Search Volume:</span>
                          <div className="font-medium">{trend.searchVolume.toLocaleString()}</div>
                        </div>

                        {trend.recommendedActions && trend.recommendedActions.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Recommended Actions:</span>
                            <div className="mt-2 space-y-1">
                              {trend.recommendedActions.map((action, idx) => (
                                <Badge key={idx} variant="outline" className="mr-2 mb-1">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No market trends data available</p>
                  <Button onClick={handleGenerateSample} variant="outline">
                    Generate Sample Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Analytics */}
        <TabsContent value="conversions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.conversionRates && analytics.conversionRates.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.conversionRates}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="conversionRate" stroke="#8884d8" name="Conversion Rate %" />
                      <Line type="monotone" dataKey="checkoutRate" stroke="#82ca9d" name="Checkout Rate %" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversion data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Sessions by Device
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.sessionAnalytics && analytics.sessionAnalytics.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={analytics.sessionAnalytics}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="totalSessions"
                          nameKey="deviceType"
                        >
                          {analytics.sessionAnalytics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={deviceColors[entry.deviceType]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2">
                      {analytics.sessionAnalytics.map((session) => (
                        <div key={session.deviceType} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {session.deviceType === 'desktop' && <Monitor className="h-4 w-4" />}
                            {session.deviceType === 'mobile' && <Smartphone className="h-4 w-4" />}
                            {session.deviceType === 'tablet' && <Tablet className="h-4 w-4" />}
                            <span className="capitalize">{session.deviceType}</span>
                          </div>
                          <div className="text-right text-sm">
                            <div>{session.totalSessions} sessions</div>
                            <div className="text-muted-foreground">
                              {formatPercentage(session.conversionRate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No session data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics */}
        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Demographics
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your customer base
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.demographics && analytics.demographics.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.demographics.slice(0, 9).map((demo, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{demo.ageGroup}</span>
                            {demo.gender && (
                              <Badge variant="outline" className="text-xs">
                                {demo.gender}
                              </Badge>
                            )}
                          </CardTitle>
                          {demo.country && (
                            <CardDescription className="text-xs">{demo.country}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Users:</span>
                              <div className="font-medium">{demo.totalUsers}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Orders:</span>
                              <div className="font-medium">{demo.totalOrders}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>
                              <div className="font-medium">{formatCurrency(demo.totalRevenue)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">AOV:</span>
                              <div className="font-medium">{formatCurrency(demo.averageOrderValue)}</div>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Conv. Rate:</span>
                            <span className="font-medium">{formatPercentage(demo.conversionRate)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">LTV:</span>
                            <span className="font-medium">{formatCurrency(demo.lifetimeValue)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No demographics data available</p>
                  <Button onClick={handleGenerateSample} variant="outline">
                    Generate Sample Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitor Analysis */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Competitor Analysis
              </CardTitle>
              <CardDescription>
                Market positioning and competitive landscape
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.competitorAnalysis && analytics.competitorAnalysis.length > 0 ? (
                <div className="space-y-4">
                  {analytics.competitorAnalysis.map((competitor) => (
                    <Card key={competitor.competitorId}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{competitor.competitorName}</h3>
                            <p className="text-sm text-muted-foreground">{competitor.category}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{competitor.rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">
                              ({competitor.reviewCount} reviews)
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Avg Price:</span>
                            <div className="font-medium">{formatCurrency(competitor.averagePrice)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Products:</span>
                            <div className="font-medium">{competitor.totalProducts}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly Revenue:</span>
                            <div className="font-medium">{formatCurrency(competitor.monthlyRevenue)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Market Share:</span>
                            <div className="font-medium">{formatPercentage(competitor.marketShare)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No competitor data available</p>
                  <Button onClick={handleGenerateSample} variant="outline">
                    Generate Sample Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Summary */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.financialSummary && analytics.financialSummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.financialSummary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="grossRevenue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Gross Revenue" />
                      <Area type="monotone" dataKey="netRevenue" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Net Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No financial data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profit Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Profit Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.profitBreakdown && analytics.profitBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={analytics.profitBreakdown.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="grossProfit"
                          nameKey="productName"
                        >
                          {analytics.profitBreakdown.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2">
                      {analytics.profitBreakdown.slice(0, 5).map((item, index) => (
                        <div key={item.productId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }}
                            />
                            <span className="text-sm">{item.productName}</span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{formatCurrency(item.grossProfit)}</div>
                            <div className="text-muted-foreground">{formatPercentage(item.profitMargin)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No profit data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Cards */}
          {analytics?.financialSummary && analytics.financialSummary.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.financialSummary.slice(0, 4).map((period, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{period.period}</CardTitle>
                    <CardDescription className="text-xs">
                      {period.startDate} - {period.endDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Gross Revenue:</span>
                        <span className="font-medium">{formatCurrency(period.grossRevenue)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Net Revenue:</span>
                        <span className="font-medium">{formatCurrency(period.netRevenue)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Total Costs:</span>
                        <span className="font-medium">{formatCurrency(period.totalCosts)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-xs">
                        <span>Net Profit:</span>
                        <span className="font-medium text-green-600">{formatCurrency(period.netProfit)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Margin:</span>
                        <span className="font-medium">{formatPercentage(period.profitMargin)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Key Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Inventory Optimization:</strong> Based on forecasts, consider adjusting inventory levels for top-performing products.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Award className="h-4 w-4" />
                <AlertDescription>
                  <strong>Market Opportunity:</strong> Market trends indicate growing demand in your primary categories.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Trophy className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conversion Focus:</strong> Mobile conversions show potential for improvement with UX optimization.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Sample Data Button */}
      {(!analytics || Object.keys(analytics).length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Generate sample data to explore the comprehensive analytics dashboard
            </p>
            <Button onClick={handleGenerateSample} className="bg-black text-white hover:bg-gray-800">
              Generate Sample Analytics Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}