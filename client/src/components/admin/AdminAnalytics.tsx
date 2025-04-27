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

  // If no real data exists yet, we'll show placeholder analytical UI
  // This will automatically show real data when the API endpoint is implemented
  const mockData = {
    userRegistrations: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "User Registrations",
          data: [32, 45, 28, 65, 53, 38, 47],
          backgroundColor: "rgba(99, 102, 241, 0.5)",
          borderColor: "rgb(99, 102, 241)",
        },
      ],
    },
    sales: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Sales",
          data: [421, 389, 475, 590, 671, 783, 819],
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
        },
      ],
    },
    productCategories: {
      labels: ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Books"],
      datasets: [
        {
          label: "Product Distribution",
          data: [35, 25, 15, 10, 10, 5],
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
            "rgba(255, 159, 64, 0.7)",
          ],
        },
      ],
    },
    traffic: {
      labels: ["Direct", "Organic", "Social", "Referral", "Email"],
      datasets: [
        {
          label: "Traffic Sources",
          data: [45, 25, 20, 5, 5],
          backgroundColor: [
            "rgba(54, 162, 235, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(99, 102, 241, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(239, 68, 68, 0.7)",
          ],
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    },
    orderStatus: {
      labels: ["Completed", "Processing", "Shipped", "Cancelled"],
      datasets: [
        {
          label: "Order Status",
          data: [68, 15, 12, 5],
          backgroundColor: [
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(239, 68, 68, 0.7)",
          ],
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    },
    revenue: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Revenue",
          data: [12500, 15800, 18200, 21400, 24500, 27800],
          backgroundColor: "rgba(99, 102, 241, 0.5)",
          borderColor: "rgb(99, 102, 241)",
        },
      ],
    },
  };

  // Use real data if available, otherwise use mock data
  const chartData = analyticsData || mockData;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              User Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart className="h-[300px]" data={chartData.userRegistrations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart className="h-[300px]" data={chartData.sales} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Product Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart className="h-[300px]" data={chartData.productCategories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart className="h-[300px]" data={chartData.traffic} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart className="h-[300px]" data={chartData.orderStatus} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart className="h-[300px]" data={chartData.revenue} />
        </CardContent>
      </Card>
    </div>
  );
}