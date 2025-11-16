import { useAuth } from '@/hooks/use-auth';
import { useAdminTab } from '@/hooks/use-admin-tab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminUsersPanel from '@/components/admin/AdminUsersPanel';
import AdminReportsPanel from '@/components/admin/AdminReportsPanel';
import AdminVendorsPanel from '@/components/admin/AdminVendorsPanel';
import AdminAnalyticsPanel from '@/components/admin/AdminAnalyticsPanel';
import TicketsPage from './admin/tickets';
import OperationsAdmin from './admin/operations-admin';
import OperationsCredit from './admin/operations-credit';
import OperationsFinance from './admin/operations-finance';
import OperationsFraud from './admin/operations-fraud';
import OperationsOrders from './admin/operations-orders';
import OperationsShipping from './admin/operations-shipping';
import { ShieldAlert } from 'lucide-react';

export default function AdminControlCenter() {
  const { user } = useAuth();
  const { currentTab } = useAdminTab();

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access the Admin Control Center.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'tickets':
        return <TicketsPage />;
      case 'operations-admin':
        return <OperationsAdmin />;
      case 'operations-credit':
        return <OperationsCredit />;
      case 'operations-finance':
        return <OperationsFinance />;
      case 'operations-fraud':
        return <OperationsFraud />;
      case 'operations-orders':
        return <OperationsOrders />;
      case 'operations-shipping':
        return <OperationsShipping />;
      case 'users':
        return (
          <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                  User Management
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  Manage all platform users, roles, and account status
                </p>
              </div>
              <AdminUsersPanel />
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                  Content Moderation
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  Review and moderate reported content and users
                </p>
              </div>
              <AdminReportsPanel />
            </div>
          </div>
        );
      case 'vendors':
        return (
          <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                  Vendor Requests
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  Review and approve vendor applications
                </p>
              </div>
              <AdminVendorsPanel />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                  Analytics & Insights
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  Platform performance metrics and statistics
                </p>
              </div>
              <AdminAnalyticsPanel />
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3" data-testid="text-page-title">
                  <ShieldAlert className="h-6 w-6 md:h-8 md:w-8 text-[#1e3a5f]" />
                  Admin Control Center
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  Comprehensive platform moderation and management system
                </p>
              </div>
              <AdminDashboard />
            </div>
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      {renderContent()}
    </AdminLayout>
  );
}