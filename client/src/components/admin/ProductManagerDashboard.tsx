import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Star,
  BarChart2,
  LineChartIcon,
  ArrowRightLeft,
  Timer,
  Target,
  ThumbsUp,
  Activity,
  Loader2,
  Maximize2,
  Download,
  Share2,
  Settings,
  Check,
  MessageSquareText,
  Eye,
  X,
  Lightbulb
} from "lucide-react";

// Mock data for product KPIs
const productPerformanceData = {
  conversionRate: {
    current: 3.8,
    previous: 3.2,
    change: 18.75,
  },
  averageOrderValue: {
    current: 78.92,
    previous: 72.45,
    change: 8.93,
  },
  customerRetention: {
    current: 42.5,
    previous: 38.9,
    change: 9.25,
  },
  churnRate: {
    current: 6.2,
    previous: 7.4,
    change: -16.22, // Negative change is good for churn
  },
  customerSatisfaction: {
    current: 4.2,
    previous: 4.0,
    change: 5.0,
  },
  productViews: {
    current: 12859,
    previous: 10234,
    change: 25.65,
  },
  userGrowth: {
    current: 5482,
    previous: 4321,
    change: 26.87,
  },
  averageSalesPerDay: {
    current: 15.3,
    previous: 12.8,
    change: 19.53,
  },
  customerLifetimeValue: {
    current: 342.50,
    previous: 315.75,
    change: 8.47,
  },
  netPromoterScore: {
    current: 64,
    previous: 58,
    change: 10.34,
  }
};

// Top performing products data
const topProductsData = [
  { id: 1, name: "Premium Wireless Headphones", sales: 128, revenue: 12800, conversion: 5.2 },
  { id: 3, name: "Smart Home Security System", sales: 89, revenue: 17800, conversion: 4.7 },
  { id: 5, name: "Professional DSLR Camera", sales: 64, revenue: 57600, conversion: 3.8 },
  { id: 2, name: "Ergonomic Office Chair", sales: 52, revenue: 10400, conversion: 3.5 },
  { id: 8, name: "Ultra-thin Laptop", sales: 42, revenue: 29400, conversion: 2.9 },
];

// Product trend data for categories
const categoryTrendsData = [
  { name: "Electronics", growth: 32, sales: 342, views: 4280 },
  { name: "Home & Kitchen", growth: 18, sales: 213, views: 2860 },
  { name: "Fashion", growth: 12, sales: 198, views: 3120 },
  { name: "Beauty & Personal Care", growth: 24, sales: 156, views: 2340 },
  { name: "Sports & Outdoors", growth: 8, sales: 87, views: 1460 },
];

export default function ProductManagerDashboard() {
  const [activeTab, setActiveTab] = React.useState("performance");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Manager KPI Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
      
      {/* KPI Overview Section */}
      <div className="space-y-6">
        {/* Key Metrics Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Key Product Metrics</h3>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            Customize Metrics
          </Button>
        </div>

        {/* KPI Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Conversion Rate */}
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Conversion Rate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.conversionRate.current}%</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.conversionRate.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.conversionRate.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.conversionRate.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <ArrowRightLeft className="h-5 w-5 text-blue-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${productPerformanceData.conversionRate.current * 10}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Percentage of visitors taking desired actions</p>
            </CardContent>
          </Card>

          {/* Customer Retention */}
          <Card className="bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Retention Rate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.customerRetention.current}%</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.customerRetention.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.customerRetention.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.customerRetention.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-amber-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-amber-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: `${productPerformanceData.customerRetention.current}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Customers continuing to use the product over time</p>
            </CardContent>
          </Card>

          {/* Churn Rate */}
          <Card className="bg-gradient-to-br from-rose-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Churn Rate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.churnRate.current}%</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.churnRate.change < 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.churnRate.change < 0 ? 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.churnRate.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-rose-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-rose-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-rose-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600 rounded-full" style={{ width: `${productPerformanceData.churnRate.current * 2}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Percentage of customers who stop using the product</p>
            </CardContent>
          </Card>
        </div>

        {/* User Metrics Header */}
        <div className="flex justify-between items-center pt-4">
          <h3 className="text-lg font-medium">User Engagement Metrics</h3>
        </div>

        {/* User Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Users */}
          <Card className="bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Active Users</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.userGrowth.current.toLocaleString()}</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.userGrowth.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.userGrowth.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.userGrowth.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: "75%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Monthly active users (MAU) using the platform</p>
            </CardContent>
          </Card>

          {/* Traffic */}
          <Card className="bg-gradient-to-br from-red-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Product Views</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.productViews.current.toLocaleString()}</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.productViews.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.productViews.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.productViews.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-red-100 p-2 rounded-full">
                  <Target className="h-5 w-5 text-red-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{ width: "80%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Number of visitors to product pages</p>
            </CardContent>
          </Card>

          {/* NPS Score */}
          <Card className="bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">NPS Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.netPromoterScore.current}</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.netPromoterScore.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.netPromoterScore.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.netPromoterScore.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <ThumbsUp className="h-5 w-5 text-indigo-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${productPerformanceData.netPromoterScore.current}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Net Promoter Score measuring customer loyalty</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Metrics Header */}
        <div className="flex justify-between items-center pt-4">
          <h3 className="text-lg font-medium">Financial Performance</h3>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Average Order Value */}
          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Average Order Value</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">£{productPerformanceData.averageOrderValue.current}</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.averageOrderValue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.averageOrderValue.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.averageOrderValue.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-purple-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${(productPerformanceData.averageOrderValue.current / 100) * 80}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Average amount spent per transaction</p>
            </CardContent>
          </Card>

          {/* Customer Lifetime Value */}
          <Card className="bg-gradient-to-br from-lime-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Customer Lifetime Value</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">£{productPerformanceData.customerLifetimeValue.current}</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.customerLifetimeValue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.customerLifetimeValue.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.customerLifetimeValue.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-lime-100 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-lime-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-lime-100 rounded-full overflow-hidden">
                <div className="h-full bg-lime-600 rounded-full" style={{ width: "70%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total value a customer brings over their lifetime</p>
            </CardContent>
          </Card>

          {/* Average Daily Sales */}
          <Card className="bg-gradient-to-br from-cyan-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Daily Sales</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.averageSalesPerDay.current}</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.averageSalesPerDay.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.averageSalesPerDay.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.averageSalesPerDay.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-cyan-100 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-cyan-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-cyan-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full" style={{ width: "65%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Average number of daily product sales</p>
            </CardContent>
          </Card>
        </div>

        {/* Satisfaction Metrics Header */}
        <div className="flex justify-between items-center pt-4">
          <h3 className="text-lg font-medium">User Satisfaction</h3>
        </div>

        {/* Satisfaction Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer Satisfaction */}
          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Customer Satisfaction</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{productPerformanceData.customerSatisfaction.current}/5</span>
                    <span className={`text-sm font-medium flex items-center ${productPerformanceData.customerSatisfaction.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {productPerformanceData.customerSatisfaction.change >= 0 ? 
                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      }
                      {Math.abs(productPerformanceData.customerSatisfaction.change)}%
                    </span>
                  </div>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <Star className="h-5 w-5 text-green-700" />
                </div>
              </div>
              <div className="mt-3 h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: `${(productPerformanceData.customerSatisfaction.current / 5) * 100}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">CSAT score based on customer feedback</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Analysis Tabs */}
      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="pb-0">
            <CardTitle>Performance Analysis</CardTitle>
            <CardDescription>Comprehensive analysis of product performance metrics</CardDescription>
            <TabsList className="grid grid-cols-3 mt-4">
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="top-products" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Top Products</span>
              </TabsTrigger>
              <TabsTrigger value="category-analysis" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <span>Category Analysis</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="p-6">
            <TabsContent value="performance" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium">Conversion Rate Trend</h3>
                  <div className="aspect-[4/3] bg-slate-50 rounded-md flex flex-col items-center justify-center relative overflow-hidden border p-4">
                    {/* Basic chart visualization */}
                    <div className="w-full h-full relative">
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between h-48 px-4">
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '45%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '40%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '52%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '48%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '63%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '58%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '72%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '68%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '75%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '81%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '78%' }}></div>
                        <div className="w-[5%] bg-blue-500 rounded-t" style={{ height: '85%' }}></div>
                      </div>
                      <div className="absolute left-0 h-full flex flex-col justify-between py-2 text-xs text-slate-500">
                        <span>4%</span>
                        <span>3%</span>
                        <span>2%</span>
                        <span>1%</span>
                        <span>0%</span>
                      </div>
                      <div className="absolute bottom-0 w-full border-t border-slate-200 pt-1 flex justify-between text-xs text-slate-500 px-6">
                        <span>Jan</span>
                        <span>Apr</span>
                        <span>Jul</span>
                        <span>Oct</span>
                        <span>Dec</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 justify-center">
                      <span className="text-xs flex items-center text-slate-500">
                        <span className="w-3 h-3 bg-blue-500 mr-1 rounded-sm"></span> 
                        2024
                      </span>
                      <span className="text-xs flex items-center text-slate-500">
                        <span className="w-3 h-3 bg-blue-200 mr-1 rounded-sm"></span> 
                        2023
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Maximize2 className="h-3 w-3" />
                      Expand
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">Average Order Value Trend</h3>
                  <div className="aspect-[4/3] bg-slate-50 rounded-md flex flex-col items-center justify-center relative overflow-hidden border p-4">
                    {/* Basic line chart visualization */}
                    <div className="w-full h-full relative">
                      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-48 stroke-purple-500 stroke-2 fill-none">
                        <path d="M0,40 L10,38 L20,35 L30,36 L40,32 L50,30 L60,25 L70,22 L80,18 L90,15 L100,10" 
                          vectorEffect="non-scaling-stroke" className="stroke-purple-500" />
                        <path d="M0,40 L10,38 L20,35 L30,36 L40,32 L50,30 L60,25 L70,22 L80,18 L90,15 L100,10" 
                          vectorEffect="non-scaling-stroke" className="stroke-none fill-purple-100/50" />
                      </svg>
                      <div className="absolute left-0 h-full flex flex-col justify-between py-2 text-xs text-slate-500">
                        <span>£100</span>
                        <span>£75</span>
                        <span>£50</span>
                        <span>£25</span>
                        <span>£0</span>
                      </div>
                      <div className="absolute bottom-0 w-full border-t border-slate-200 pt-1 flex justify-between text-xs text-slate-500 px-6">
                        <span>Jan</span>
                        <span>Apr</span>
                        <span>Jul</span>
                        <span>Oct</span>
                        <span>Dec</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 justify-center">
                      <span className="text-xs flex items-center text-slate-500">
                        <span className="w-3 h-3 bg-purple-500 mr-1 rounded-sm"></span> 
                        2024
                      </span>
                      <span className="text-xs flex items-center text-slate-500">
                        <span className="w-3 h-3 bg-purple-200 mr-1 rounded-sm"></span> 
                        2023
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Maximize2 className="h-3 w-3" />
                      Expand
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-yellow-50/50">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full mt-1">
                    <Timer className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-yellow-900">Response Time Analysis</h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      Product page load time has decreased by 18% this month, leading to a 
                      potential correlation with the 8.93% increase in average order value.
                      Consider further performance optimizations for additional gains.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="top-products" className="mt-0">
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium text-sm p-2">Product</th>
                        <th className="text-right font-medium text-sm p-2">Sales</th>
                        <th className="text-right font-medium text-sm p-2">Revenue</th>
                        <th className="text-right font-medium text-sm p-2">Conversion</th>
                        <th className="text-right font-medium text-sm p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductsData.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 text-sm">{product.name}</td>
                          <td className="p-2 text-sm text-right">{product.sales}</td>
                          <td className="p-2 text-sm text-right">£{product.revenue.toLocaleString()}</td>
                          <td className="p-2 text-sm text-right">{product.conversion}%</td>
                          <td className="p-2 text-sm text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Product Revenue Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="relative w-48 h-48">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="20" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#60a5fa" strokeWidth="20" 
                              strokeDasharray="251.2" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#a855f7" strokeWidth="20" 
                              strokeDasharray="251.2" strokeDashoffset="125.6" transform="rotate(-90 50 50)" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" 
                              strokeDasharray="251.2" strokeDashoffset="188.4" transform="rotate(-90 50 50)" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="20" 
                              strokeDasharray="251.2" strokeDashoffset="213.52" transform="rotate(-90 50 50)" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-blue-400 rounded-sm"></span>
                          <span className="text-xs">Electronics (45%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-purple-400 rounded-sm"></span>
                          <span className="text-xs">Home & Kitchen (25%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-amber-400 rounded-sm"></span>
                          <span className="text-xs">Fashion (15%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-green-400 rounded-sm"></span>
                          <span className="text-xs">Other (15%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Top Product Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-full h-48 relative">
                          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between h-40 px-0">
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-blue-500 rounded-t" style={{ height: '80%' }}></div>
                              <span className="text-xs mt-1 text-center line-clamp-1">Headphones</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-blue-500 rounded-t" style={{ height: '65%' }}></div>
                              <span className="text-xs mt-1 text-center line-clamp-1">Security</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-blue-500 rounded-t" style={{ height: '95%' }}></div>
                              <span className="text-xs mt-1 text-center line-clamp-1">Camera</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-blue-500 rounded-t" style={{ height: '55%' }}></div>
                              <span className="text-xs mt-1 text-center line-clamp-1">Chair</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-blue-500 rounded-t" style={{ height: '75%' }}></div>
                              <span className="text-xs mt-1 text-center line-clamp-1">Laptop</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Revenue comparison of top 5 products, with the DSLR Camera generating 
                          the highest revenue despite fewer unit sales.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="category-analysis" className="mt-0">
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium text-sm p-2">Category</th>
                        <th className="text-right font-medium text-sm p-2">Growth</th>
                        <th className="text-right font-medium text-sm p-2">Sales</th>
                        <th className="text-right font-medium text-sm p-2">Views</th>
                        <th className="text-right font-medium text-sm p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryTrendsData.map((category) => (
                        <tr key={category.name} className="border-b hover:bg-muted/50">
                          <td className="p-2 text-sm">{category.name}</td>
                          <td className="p-2 text-sm text-right">
                            <span className="flex items-center justify-end">
                              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
                              {category.growth}%
                            </span>
                          </td>
                          <td className="p-2 text-sm text-right">{category.sales}</td>
                          <td className="p-2 text-sm text-right">{category.views.toLocaleString()}</td>
                          <td className="p-2 text-sm text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Category Growth Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-full h-48 relative">
                          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between h-40 px-0">
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-green-500 rounded-t" style={{ height: '80%' }}></div>
                              <span className="text-xs mt-1 text-center">Electronics</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-blue-500 rounded-t" style={{ height: '45%' }}></div>
                              <span className="text-xs mt-1 text-center">Home</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-purple-500 rounded-t" style={{ height: '30%' }}></div>
                              <span className="text-xs mt-1 text-center">Fashion</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-amber-500 rounded-t" style={{ height: '60%' }}></div>
                              <span className="text-xs mt-1 text-center">Beauty</span>
                            </div>
                            <div className="w-[15%] flex flex-col items-center">
                              <div className="w-full bg-red-500 rounded-t" style={{ height: '20%' }}></div>
                              <span className="text-xs mt-1 text-center">Sports</span>
                            </div>
                          </div>
                          <div className="absolute left-0 h-full flex flex-col justify-between py-2 text-xs text-slate-500">
                            <span>40%</span>
                            <span>30%</span>
                            <span>20%</span>
                            <span>10%</span>
                            <span>0%</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Electronics showing the strongest growth at 32%, with Beauty & Personal Care following at 24%.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Conversion Rate by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Electronics</span>
                            <span className="font-medium">3.8%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '76%' }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Home & Kitchen</span>
                            <span className="font-medium">2.9%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '58%' }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Fashion</span>
                            <span className="font-medium">4.2%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '84%' }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Beauty & Personal Care</span>
                            <span className="font-medium">3.4%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '68%' }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Sports & Outdoors</span>
                            <span className="font-medium">2.1%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '42%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="p-4 border rounded-lg bg-blue-50/50">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full mt-1">
                      <ThumbsUp className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Category Optimization Suggestion</h3>
                      <p className="text-sm text-blue-800 mt-1">
                        Fashion has the highest conversion rate (4.2%) but only modest growth (12%). 
                        Consider allocating more marketing resources to this category to capitalize on 
                        its strong performance. Electronics continues to be both high-converting and high-growth.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
      
      {/* Action Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>Suggested actions to improve product performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-md bg-gradient-to-r from-green-50 to-transparent">
              <div className="bg-green-100 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Boost Electronics Category</h3>
                <p className="text-sm text-muted-foreground">
                  Electronics is showing 32% growth with strong conversion rates. Consider increasing inventory 
                  and featuring these products more prominently on the homepage.
                </p>
                <div className="mt-3">
                  <Button variant="outline" size="sm">Apply Recommendation</Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 border rounded-md bg-gradient-to-r from-amber-50 to-transparent">
              <div className="bg-amber-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Improve Customer Retention</h3>
                <p className="text-sm text-muted-foreground">
                  While retention has improved by 9.25%, it's still at only 42.5%. Implement a loyalty 
                  program targeting second-time purchasers with special offers.
                </p>
                <div className="mt-3">
                  <Button variant="outline" size="sm">Apply Recommendation</Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 border rounded-md bg-gradient-to-r from-blue-50 to-transparent">
              <div className="bg-blue-100 p-2 rounded-full">
                <ShoppingBag className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Sports & Outdoors Opportunity</h3>
                <p className="text-sm text-muted-foreground">
                  This category has the lowest conversion rate (2.1%) but shows potential. Optimize product 
                  pages with better images and descriptions to improve performance.
                </p>
                <div className="mt-3">
                  <Button variant="outline" size="sm">Apply Recommendation</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}