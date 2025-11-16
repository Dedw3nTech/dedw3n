import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingReports: number;
  pendingVendorRequests: number;
  activeUsers24h: number;
  totalRevenue: number;
}

export default function AdminAnalyticsPanel() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-analytics-total-users">{stats?.totalUsers || 0}</div>
            <p className="text-sm text-gray-500">Total Registered Users</p>
            
            <div className="mt-4">
              <div className="text-lg font-semibold" data-testid="text-analytics-active-users">{stats?.activeUsers24h || 0}</div>
              <p className="text-sm text-gray-500">Active Users (24h)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-analytics-revenue">
              £{stats?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            
            <div className="mt-4">
              <div className="text-lg font-semibold" data-testid="text-analytics-orders">{stats?.totalOrders || 0}</div>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Server Status</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Email Service</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
