import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, Package, AlertTriangle } from 'lucide-react';

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

export default function AdminDashboard() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-[#1e3a5f] shadow-md hover:shadow-lg transition-shadow" data-testid="card-total-users">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <div className="p-2 bg-[#1e3a5f]/10 rounded-lg">
            <Users className="h-4 w-4 text-[#1e3a5f]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1e3a5f]" data-testid="text-total-users">{stats?.totalUsers?.toLocaleString() || '0'}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.activeUsers24h || 0} active in 24h
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-600 shadow-md hover:shadow-lg transition-shadow" data-testid="card-vendors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendors</CardTitle>
          <div className="p-2 bg-green-100 rounded-lg">
            <Store className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600" data-testid="text-total-vendors">{stats?.totalVendors?.toLocaleString() || '0'}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.pendingVendorRequests || 0} pending requests
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-600 shadow-md hover:shadow-lg transition-shadow" data-testid="card-products">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Products</CardTitle>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600" data-testid="text-total-products">{stats?.totalProducts?.toLocaleString() || '0'}</div>
          <p className="text-xs text-muted-foreground">
            Active listings
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-600 shadow-md hover:shadow-lg transition-shadow" data-testid="card-reports">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reports</CardTitle>
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-reports">{stats?.pendingReports || '0'}</div>
          <p className="text-xs text-muted-foreground">
            Pending review
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
