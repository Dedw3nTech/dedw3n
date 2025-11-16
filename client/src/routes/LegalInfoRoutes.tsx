import { lazy } from 'react';
import { Route, Switch } from 'wouter';
import { SEOHead } from '@/components/seo/SEOHead';

const FAQPage = lazy(() => import('@/pages/faq'));
const AboutUsPage = lazy(() => import('@/pages/about-us'));
const ContactPage = lazy(() => import('@/pages/contact'));
const PrivacyPage = lazy(() => import('@/pages/privacy'));
const TermsPage = lazy(() => import('@/pages/terms'));
const BusinessTermsPage = lazy(() => import('@/pages/business-terms'));
const CookiesPage = lazy(() => import('@/pages/cookies'));
const CommunityGuidelines = lazy(() => import('@/pages/community-guidelines'));
const CodeOfEthicsPage = lazy(() => import('@/pages/code-of-ethics'));
const CareersPage = lazy(() => import('@/pages/careers'));
const IntellectualPropertyPage = lazy(() => import('@/pages/intellectual-property'));
const AdvertisementTermsPage = lazy(() => import('@/pages/advertisement-terms'));
const EducationPolicyPage = lazy(() => import('@/pages/education-policy'));
const HowToUsePage = lazy(() => import('@/pages/how-to-use'));
const PaymentOptionsPage = lazy(() => import('@/pages/payment-options'));
const DeliveryReturnsPage = lazy(() => import('@/pages/delivery-returns'));
const CatalogueRulesPage = lazy(() => import('@/pages/catalogue-rules'));
const TipsTricksPage = lazy(() => import('@/pages/tips-tricks'));
const NetworkPartnershipResources = lazy(() => import('@/pages/network-partnership-resources'));
const Resources = lazy(() => import('@/pages/resources'));
const RemoveAdsPage = lazy(() => import('@/pages/remove-ads'));
const SiteMap = lazy(() => import('@/components/layout/SiteMap').then(m => ({ default: m.SiteMap })));

export function LegalInfoRoutes({ params }: any) {
  return (
    <Switch>
      <Route path="/faq" component={FAQPage} />
      <Route path="/catalogue-rules" component={CatalogueRulesPage} />
      <Route path="/tips-tricks" component={TipsTricksPage} />
      
      <Route path="/payment-options">
        <SEOHead title="Payment Options - Dedw3n" description="Learn about the various payment methods we accept including credit cards, mobile money, digital wallets, and PayPal." />
        <PaymentOptionsPage />
      </Route>
      
      <Route path="/delivery-returns">
        <SEOHead title="Delivery & Return Options - Dedw3n" description="Learn about our delivery options, return policy, refunds, and exchanges. We offer flexible delivery and easy returns within 30 days." />
        <DeliveryReturnsPage />
      </Route>
      
      <Route path="/how-to-use">
        <SEOHead title="How to Use Dedw3n - Complete User Guide" description="Learn how to use www.dedw3n.com with our comprehensive user manual. Step-by-step guides for shopping, selling, social features, and more." />
        <HowToUsePage />
      </Route>
      
      <Route path="/about-us">
        <SEOHead title="About Us - Dedw3n" description="Learn about Dedw3n, a platform for contemporary artisans to express and expose their art. Founded in 2024 by the Yalusongamo family." />
        <AboutUsPage />
      </Route>
      
      <Route path="/code-of-ethics">
        <SEOHead title="Code of Ethics - Dedw3n" description="Learn about Dedw3n's commitment to ethics, integrity, and social responsibility in all business operations." />
        <CodeOfEthicsPage />
      </Route>
      
      <Route path="/careers">
        <SEOHead title="Careers - Dedw3n" description="Join our team and help us build the future of social commerce. Explore career opportunities at Dedw3n." />
        <CareersPage />
      </Route>
      
      <Route path="/network-partnership-resources" component={NetworkPartnershipResources} />
      <Route path="/resources" component={Resources} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      
      <Route path="/business-terms">
        <SEOHead title="Business Terms of Service - Dedw3n" description="Business Terms and Conditions for Dedw3n marketplace platform. Comprehensive legal agreement governing business vendor and buyer relationships." />
        <BusinessTermsPage />
      </Route>
      
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/education-policy" component={EducationPolicyPage} />
      <Route path="/intellectual-property" component={IntellectualPropertyPage} />
      <Route path="/advertisement-terms" component={AdvertisementTermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/remove-ads" component={RemoveAdsPage} />
      <Route path="/sitemap" component={SiteMap} />
    </Switch>
  );
}
