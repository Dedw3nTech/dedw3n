import { lazy } from 'react';
import { Route, Switch } from 'wouter';
import { SEOHead } from '@/components/seo/SEOHead';
import { ProtectedRoute, AdminOnlyRoute, FinanceOnlyRoute } from '@/lib/protected-route';

const DatingPage = lazy(() => import('@/pages/dating'));
const DatingProfilePage = lazy(() => import('@/pages/dating-profile'));
const DatingProfileView = lazy(() => import('@/pages/dating-profile-view'));
const MyMatches = lazy(() => import('@/pages/MyMatches').then(m => ({ default: m.MyMatches })));
const AIDatingTools = lazy(() => import('@/components/AIDatingTools'));
const LifestylePage = lazy(() => import('@/pages/lifestyle'));
const LifestyleProfilePage = lazy(() => import('@/pages/LifestyleProfile'));
const GovernmentProfilePage = lazy(() => import('@/pages/GovernmentProfile'));
const ServicesProfilePage = lazy(() => import('@/pages/ServicesProfile'));
const OrderFoodPage = lazy(() => import('@/pages/order-food'));
const GroceriesPage = lazy(() => import('@/pages/groceries'));
const ReservationPage = lazy(() => import('@/pages/reservations'));
const ServicesPage = lazy(() => import('@/pages/services'));
const JobsPage = lazy(() => import('@/pages/jobs'));
const FreelancePage = lazy(() => import('@/pages/freelance'));
const ShippingCalculator = lazy(() => import('@/pages/shipping-calculator'));
const PercentageCalculator = lazy(() => import('@/pages/percentage-calculator'));
const GovernmentPage = lazy(() => import('@/pages/government'));
const DrCongoPage = lazy(() => import('@/pages/dr-congo'));
const FinancePage = lazy(() => import('@/pages/finance'));
const CommissionPayment = lazy(() => import('@/pages/commission-payment'));
const PawapayDepositCallback = lazy(() => import('@/pages/pawapay-deposit-callback'));
const PawapayPayoutCallback = lazy(() => import('@/pages/pawapay-payout-callback'));
const PawapayRefundCallback = lazy(() => import('@/pages/pawapay-refund-callback'));
const VideoDemo = lazy(() => import('@/pages/video-demo'));
const TestCookiesPage = lazy(() => import('@/pages/test-cookies'));
const ERPPage = lazy(() => import('@/pages/erp'));
const CRMPage = lazy(() => import('@/pages/crm'));
const CalendarPage = lazy(() => import('@/pages/calendar'));

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
      
      <Route path="/dr-congo">
        <SEOHead title="Dr Congo Services - Dedw3n" description="Access Dr Congo services including certificates, passports, and supplementary judgment documents through Dedw3n's trusted platform." />
        <DrCongoPage />
      </Route>
      
      <ProtectedRoute path="/government-profile" component={GovernmentProfilePage} />
      
      <FinanceOnlyRoute path="/finance" component={FinancePage} />
      
      <Route path="/erp">
        <SEOHead title="Enterprise Resource Planning - Dedw3n" description="Integrated business management system connecting all core operations including accounting, HR, procurement, supply chain, and government services." />
        <ERPPage />
      </Route>
      
      <Route path="/crm">
        <SEOHead title="Customer Relationship Management - Dedw3n" description="Centralized customer data and relationship management system for tracking interactions, sales pipeline, and customer engagement." />
        <CRMPage />
      </Route>
      
      <Route path="/calendar">
        <SEOHead title="Calendar - Dedw3n" description="Manage your events, meetings, appointments, and schedules with Dedw3n's integrated calendar system." />
        <CalendarPage />
      </Route>
      
      {/* Lifestyle routes - Order Food, Groceries, and Reservations */}
      <Route path="/lifestyle/order-food">
        <SEOHead title="Order Food - Dedw3n" description="Browse and order delicious food from local restaurants and food services." />
        <OrderFoodPage />
      </Route>
      <Route path="/lifestyle/groceries">
        <SEOHead title="Groceries - Dedw3n" description="Shop for fresh groceries and everyday essentials." />
        <GroceriesPage />
      </Route>
      <Route path="/lifestyle/reservations">
        <SEOHead title="Reservations - Dedw3n" description="Make reservations for hotels, venues, events, and other services." />
        <ReservationPage />
      </Route>
      <ProtectedRoute path="/lifestyle-profile" component={LifestyleProfilePage} />
      <Route path="/lifestyle" component={LifestylePage} />
      
      {/* Services routes - Jobs and Freelance */}
      <Route path="/services/jobs">
        <SEOHead title="Jobs - Dedw3n" description="Browse job opportunities and career listings." />
        <JobsPage />
      </Route>
      <Route path="/services/freelance">
        <SEOHead title="Freelance - Dedw3n" description="Find freelance gigs and project-based work opportunities." />
        <FreelancePage />
      </Route>
      
      <ProtectedRoute path="/services-profile" component={ServicesProfilePage} />
      
      <Route path="/services">
        <SEOHead title="Services - Dedw3n" description="Browse and access professional services including jobs and freelance opportunities." />
        <ServicesPage />
      </Route>
      
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
