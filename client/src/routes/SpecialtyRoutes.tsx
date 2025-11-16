import { lazy } from 'react';
import { Route, Switch } from 'wouter';
import { SEOHead } from '@/components/seo/SEOHead';
import { ProtectedRoute, AdminOnlyRoute } from '@/lib/protected-route';

const DatingPage = lazy(() => import('@/pages/dating'));
const DatingProfilePage = lazy(() => import('@/pages/dating-profile'));
const DatingProfileView = lazy(() => import('@/pages/dating-profile-view'));
const MyMatches = lazy(() => import('@/pages/MyMatches').then(m => ({ default: m.MyMatches })));
const AIDatingTools = lazy(() => import('@/components/AIDatingTools'));
const LifestylePage = lazy(() => import('@/pages/lifestyle'));
const ServicesPage = lazy(() => import('@/pages/services'));
const ShippingCalculator = lazy(() => import('@/pages/shipping-calculator'));
const PercentageCalculator = lazy(() => import('@/pages/percentage-calculator'));
const GovernmentPage = lazy(() => import('@/pages/government'));
const GovernmentServicesPage = lazy(() => import('@/pages/government-services'));
const FinancePage = lazy(() => import('@/pages/finance'));
const CommissionPayment = lazy(() => import('@/pages/commission-payment'));
const PawapayDepositCallback = lazy(() => import('@/pages/pawapay-deposit-callback'));
const PawapayPayoutCallback = lazy(() => import('@/pages/pawapay-payout-callback'));
const PawapayRefundCallback = lazy(() => import('@/pages/pawapay-refund-callback'));
const VideoDemo = lazy(() => import('@/pages/video-demo'));
const TestCookiesPage = lazy(() => import('@/pages/test-cookies'));

export function SpecialtyRoutes({ params }: any) {
  return (
    <Switch>
      <AdminOnlyRoute path="/dating" component={DatingPage} />
      <AdminOnlyRoute path="/dating-profile" component={DatingProfilePage} />
      <AdminOnlyRoute path="/dating-profile/:profileId" component={DatingProfileView} />
      <AdminOnlyRoute path="/my-matches" component={MyMatches} />
      <AdminOnlyRoute path="/dating/ai-tools" component={AIDatingTools} />
      
      <Route path="/government">
        <SEOHead title="Government Services - Dedw3n" description="Access government services and information through Dedw3n's trusted platform." />
        <GovernmentPage />
      </Route>
      
      <Route path="/government/services">
        <SEOHead title="Government Services Catalog - Dedw3n" description="Browse and request government services online. Access documents, public services, youth programs, business licenses, and education services." />
        <GovernmentServicesPage />
      </Route>
      
      <Route path="/finance">
        <SEOHead title="Finance - Dedw3n" description="Access comprehensive financial services including banking, insurance, loans, investing, cryptocurrency, and international remittance through Dedw3n's trusted platform." />
        <FinancePage />
      </Route>
      
      <Route path="/lifestyle" component={LifestylePage} />
      <Route path="/services" component={ServicesPage} />
      
      <Route path="/shipping-calculator">
        <SEOHead title="Shipping Calculator - Dedw3n" description="Calculate shipping costs for different freight types and international destinations on Dedw3n marketplace." />
        <ShippingCalculator />
      </Route>
      <Route path="/percentage-calculator" component={PercentageCalculator} />
      
      <Route path="/pawapay/deposit/callback" component={PawapayDepositCallback} />
      <Route path="/pawapay/payout/callback" component={PawapayPayoutCallback} />
      <Route path="/pawapay/refund/callback" component={PawapayRefundCallback} />
      <ProtectedRoute path="/commission-payment/:periodId" component={CommissionPayment} />
      
      <Route path="/video-demo">
        <SEOHead title="Video Demo - Dedw3n" description="Watch our video demonstration of Dedw3n's features and capabilities." />
        <VideoDemo />
      </Route>
      <Route path="/test-cookies" component={TestCookiesPage} />
    </Switch>
  );
}
