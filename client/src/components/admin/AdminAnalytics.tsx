import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  LineChart,
  PieChart,
  DonutChart,
  AreaChart,
} from "@/components/ui/charts";
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
import { Loader2 } from "lucide-react";

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("30days");
  
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium mb-2">No Analytics Data Available</h3>
        <p className="text-muted-foreground">Analytics data will appear here once there is sufficient user activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dashboard Overview</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 3 months</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analyticsData.userRegistrations && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                User Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart className="h-[300px]" data={analyticsData.userRegistrations} />
            </CardContent>
          </Card>
        )}

        {analyticsData.sales && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart className="h-[300px]" data={analyticsData.sales} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analyticsData.productCategories && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Product Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart className="h-[300px]" data={analyticsData.productCategories} />
            </CardContent>
          </Card>
        )}

        {analyticsData.traffic && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Traffic Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart className="h-[300px]" data={analyticsData.traffic} />
            </CardContent>
          </Card>
        )}

        {analyticsData.orderStatus && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart className="h-[300px]" data={analyticsData.orderStatus} />
            </CardContent>
          </Card>
        )}
      </div>

      {analyticsData.revenue && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart className="h-[300px]" data={analyticsData.revenue} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {analyticsData.overview && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {analyticsData.overview.map((metric: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    {metric.change && (
                      <p className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          {analyticsData.productMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart className="h-[300px]" data={analyticsData.productMetrics.topProducts} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart className="h-[300px]" data={analyticsData.productMetrics.categoryPerformance} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          {analyticsData.userMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart className="h-[300px]" data={analyticsData.userMetrics.activity} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart className="h-[300px]" data={analyticsData.userMetrics.demographics} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}