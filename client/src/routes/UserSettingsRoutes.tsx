import { lazy } from 'react';
import { Route, Switch } from 'wouter';
import { ProtectedRoute } from '@/lib/protected-route';

const ProfilePage = lazy(() => import('@/pages/Profile'));
const UserProfilePage = lazy(() => import('@/pages/user-profile'));
const ProfileSettingsPage = lazy(() => import('@/pages/profile-settings'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const SuspendAccountPage = lazy(() => import('@/pages/suspend-account'));
const CloseAccountPage = lazy(() => import('@/pages/close-account'));
const WalletPage = lazy(() => import('@/pages/wallet'));
const OrdersReturnsPage = lazy(() => import('@/pages/orders-returns'));
const LikedPage = lazy(() => import('@/pages/liked'));
const MembersPage = lazy(() => import('@/pages/members'));
const BecomeVendorPage = lazy(() => import('@/pages/become-vendor'));
const BecomeBusinessVendorPage = lazy(() => import('@/pages/become-business-vendor'));
const VendorDashboardPage = lazy(() => import('@/pages/vendor-dashboard'));
const VendorRegisterPage = lazy(() => import('@/pages/vendor-register'));
const LogoutTest = lazy(() => import('@/pages/logout-test').then(m => ({ default: m.LogoutTest })));

export function UserSettingsRoutes({ params }: any) {
  return (
    <Switch>
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="/profile/:username" component={UserProfilePage} />
      <ProtectedRoute path="/profile-settings" component={ProfileSettingsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/suspend-account" component={SuspendAccountPage} />
      <ProtectedRoute path="/close-account" component={CloseAccountPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/orders-returns" component={OrdersReturnsPage} />
      <ProtectedRoute path="/liked" component={LikedPage} />
      <ProtectedRoute path="/members" component={MembersPage} />
      <ProtectedRoute path="/become-vendor" component={BecomeVendorPage} />
      <ProtectedRoute path="/become-business-vendor" component={BecomeBusinessVendorPage} />
      <ProtectedRoute path="/vendor-dashboard" component={VendorDashboardPage} />
      <ProtectedRoute path="/vendor-register" component={VendorRegisterPage} />
      <Route path="/logout-test" component={LogoutTest} />
    </Switch>
  );
}
