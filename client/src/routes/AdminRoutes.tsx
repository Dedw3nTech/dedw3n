import { lazy } from 'react';
import { Switch } from 'wouter';
import { ProtectedRoute, AdminOnlyRoute } from '@/lib/protected-route';

const UnifiedAdminDashboard = lazy(() => import('@/pages/unified-admin-dashboard'));
const AdminControlCenter = lazy(() => import('@/pages/admin-control-center'));
const AdminEmail = lazy(() => import('@/pages/admin-email'));
const AIInsightsPage = lazy(() => import('@/pages/ai-insights'));
const Analytics = lazy(() => import('@/pages/analytics'));
const VendorAnalyticsPage = lazy(() => import('@/pages/vendor-analytics'));
const SpendingAnalytics = lazy(() => import('@/pages/spending-analytics'));
const AffiliatePartnership = lazy(() => import('@/pages/affiliate-partnership'));
const ApiTestPage = lazy(() => import('@/pages/api-test'));
const EnvironmentDiagnostic = lazy(() => import('@/pages/environment-diagnostic'));

export function AdminRoutes({ params }: any) {
  return (
    <Switch>
      <ProtectedRoute path="/admin" component={UnifiedAdminDashboard} />
      <ProtectedRoute path="/admin/:tab" component={UnifiedAdminDashboard} />
      <ProtectedRoute path="/unified-admin-dashboard" component={UnifiedAdminDashboard} />
      <ProtectedRoute path="/admin-control-center" component={AdminControlCenter} />
      <ProtectedRoute path="/affiliate-partnership" component={AffiliatePartnership} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/vendor-analytics" component={VendorAnalyticsPage} />
      <ProtectedRoute path="/spending-analytics" component={SpendingAnalytics} />
      <AdminOnlyRoute path="/diagnostic/environment" component={EnvironmentDiagnostic} />
      
      <ProtectedRoute path="/admin/email" component={AdminEmail} />
      <ProtectedRoute path="/ai-insights" component={AIInsightsPage} />
      <ProtectedRoute path="/api-test" component={ApiTestPage} />
    </Switch>
  );
}
