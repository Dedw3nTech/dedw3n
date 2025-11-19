import React, { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import { Switch, Route } from "wouter";
import { useLocation } from 'wouter';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { CoreProviders } from "@/components/CoreProviders";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { LowerCookieBanner } from "@/components/LowerCookieBanner";
import { GlobalLoginHandler } from "@/components/GlobalLoginHandler";
import { MobileRedirectHandler } from "@/components/MobileRedirectHandler";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { CacheBuster } from "@/components/CacheBuster";

import { initializeOfflineDetection } from "@/lib/offline";
import { initializeLanguageFromLocation } from "@/lib/i18n";
import "@/utils/unified-logout-system";
import leopardVideo from "@assets/Generated File November 09, 2025 - 8_24PM (1)_1762805360661.mp4";

// Loading indicator for code-split chunks with video background
function PageLoadingFallback() {
  const loadingTexts = useMemo(() => ['Thinking'], []);
  const { translations } = useMasterBatchTranslation(loadingTexts);
  const [thinkingText] = translations || loadingTexts;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-white"
      style={{ minHeight: '100dvh' }}
      role="status"
      aria-live="polite"
      aria-label="Loading application"
      data-testid="page-loading-fallback"
    >
      <div className="text-center py-12">
        <video 
          src={leopardVideo} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="h-24 w-auto object-contain mx-auto mb-4"
          data-testid="loading-video"
        />
        <p className="text-gray-600">
          {thinkingText}
          <span className="inline-flex ml-1">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </p>
      </div>
    </div>
  );
}

// Chunk Load Error Boundary - catches when lazy route bundles fail to load
class ChunkLoadErrorBoundaryCore extends React.Component<
  { children: React.ReactNode; translations: string[] },
  { hasError: boolean; error: Error | null; isReporting: boolean; reportSent: boolean }
> {
  constructor(props: { children: React.ReactNode; translations: string[] }) {
    super(props);
    this.state = { hasError: false, error: null, isReporting: false, reportSent: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[CHUNK-LOAD-ERROR] Lazy route failed to load:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isChunkError = 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError') ||
      error.name === 'ChunkLoadError';

    console.error('[CHUNK-LOAD-ERROR] Component error boundary caught:', {
      error: error.message,
      isChunkError,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    if (isChunkError) {
      console.warn('[CHUNK-LOAD-ERROR] Chunk failed to load - user will see reload prompt');
    }
  }

  handleReportIssue = async () => {
    if (this.state.isReporting || this.state.reportSent) return;
    
    this.setState({ isReporting: true });
    
    try {
      const reportData = {
        errorType: 'ChunkLoadError',
        errorMessage: this.state.error?.message || 'Unknown error',
        url: window.location.href,
        userAgent: navigator.userAgent,
        additionalInfo: JSON.stringify({
          errorStack: this.state.error?.stack || '',
          timestamp: new Date().toISOString(),
          browserInfo: {
            language: navigator.language,
            platform: navigator.platform,
            viewport: `${window.innerWidth}x${window.innerHeight}`
          }
        }),
        toastTitle: 'Application Error',
        toastDescription: this.state.error?.message || 'An unexpected error occurred'
      };

      const response = await fetch('/api/report-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        this.setState({ reportSent: true });
      }
    } catch (err) {
      console.error('Failed to send error report:', err);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error && (
        this.state.error.message.includes('Failed to fetch') ||
        this.state.error.message.includes('Loading chunk') ||
        this.state.error.message.includes('ChunkLoadError') ||
        this.state.error.name === 'ChunkLoadError'
      );

      const [
        loadingErrorText,
        somethingWentWrongText,
        failedToLoadText,
        unexpectedErrorText,
        reloadPageText,
        goToHomeText,
        errorDetailsText,
        reportIssueText,
        reportSentText
      ] = this.props.translations;

      return (
        <div className="flex items-center justify-center min-h-screen bg-white p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-gray-900">
              {isChunkError ? loadingErrorText : somethingWentWrongText}
            </h1>
            <p className="text-gray-600">
              {isChunkError 
                ? failedToLoadText
                : unexpectedErrorText
              }
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors w-full"
                data-testid="button-reload-page"
              >
                {reloadPageText}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors w-full"
                data-testid="button-go-home"
              >
                {goToHomeText}
              </button>
              <button
                onClick={this.handleReportIssue}
                disabled={this.state.isReporting || this.state.reportSent}
                className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-report-issue"
              >
                {this.state.reportSent ? reportSentText : (this.state.isReporting ? 'Sending...' : reportIssueText)}
              </button>
            </div>
            {this.state.error && (
              <details className="text-left text-xs text-gray-500 mt-4">
                <summary className="cursor-pointer">{errorDetailsText}</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper with translation hook
function ChunkLoadErrorBoundary({ children }: { children: React.ReactNode }) {
  const errorBoundaryTexts = useMemo(() => [
    'Loading Error',
    'Something went wrong',
    'Failed to load application resources. This could be due to a network issue or outdated cache.',
    'An unexpected error occurred while loading the page.',
    'Reload Page',
    'Go to Home',
    'Error Details',
    'Report Issue',
    'Report Sent'
  ], []);

  const { translations } = useMasterBatchTranslation(errorBoundaryTexts);

  return (
    <ChunkLoadErrorBoundaryCore translations={translations || errorBoundaryTexts}>
      {children}
    </ChunkLoadErrorBoundaryCore>
  );
}

// Eager page imports (critical authentication paths only)
import VerifyEmail from "@/pages/verify-email";
import VerifyEmailPending from "@/pages/verify-email-pending";
import Verify2FA from "@/pages/verify-2fa";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/auth";
import MobileLanding from "@/pages/mobile-landing";
import ResetPassword from "@/pages/reset-password";
import ResetPasswordConfirm from "@/pages/reset-password-confirm";
import NotFoundPage from "@/pages/NotFoundPage";

// SEO component is eager for better SEO performance (meta tags in initial HTML)
import { SEOHead } from '@/components/seo/SEOHead';

// Eager navigation components for instant UI rendering
import OptimizedNavigation from '@/components/layout/OptimizedNavigation';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { MarketplaceNav } from '@/components/layout/MarketplaceNav';
import Footer from '@/components/layout/Footer';
import { CommunityNav } from '@/components/layout/CommunityNav';
import { DatingNav } from '@/components/layout/DatingNav';
import { GPCBanner } from '@/components/GPCBanner';

// Lazy route bundles
const MarketplaceRoutes = lazy(() => import('@/routes/MarketplaceRoutes').then(m => ({ default: m.MarketplaceRoutes })));
const SocialRoutes = lazy(() => import('@/routes/SocialRoutes').then(m => ({ default: m.SocialRoutes })));
const AdminRoutes = lazy(() => import('@/routes/AdminRoutes').then(m => ({ default: m.AdminRoutes })));
const UserSettingsRoutes = lazy(() => import('@/routes/UserSettingsRoutes').then(m => ({ default: m.UserSettingsRoutes })));
const LegalInfoRoutes = lazy(() => import('@/routes/LegalInfoRoutes').then(m => ({ default: m.LegalInfoRoutes })));
const SpecialtyRoutes = lazy(() => import('@/routes/SpecialtyRoutes').then(m => ({ default: m.SpecialtyRoutes })));

// Eager-loaded provider wrappers (needed for navigation components that use context hooks)
import { SocialProviders } from '@/components/SocialProviders';
import { MessagingProviders } from '@/components/MessagingProviders';
import { MarketplaceProviders } from '@/components/MarketplaceProviders';

// Global scroll to top component
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
  
  return null;
}

// Email verification redirect component
function EmailVerificationRedirect() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // Public routes that don't require email verification
    const publicRoutes = [
      '/auth',
      '/verify-email',
      '/verify-email-pending',
      '/verify-2fa',
      '/reset-password',
      '/reset-password-confirm',
      '/mobile',
      '/test-cookies',
      '/video-demo'
    ];
    
    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route => location.startsWith(route));
    
    // Admin users are completely exempt from email verification
    if (user && user.role === 'admin' && location === '/verify-email-pending') {
      console.log('[ADMIN-EXEMPTION] Redirecting admin away from verification wall (admins are exempt)');
      setLocation('/');
      return;
    }
    
    // Only redirect if:
    // 1. User is authenticated
    // 2. Email is not verified
    // 3. Not already on verification page
    // 4. Not on a public route
    // 5. User is not an admin (admins are exempt from email verification)
    if (user && !user.emailVerified && !isPublicRoute && user.role !== 'admin') {
      console.log('[VERIFICATION-REDIRECT] Redirecting unverified user to verification wall');
      setLocation('/verify-email-pending');
    } else if (user && user.emailVerified && location === '/verify-email-pending') {
      // If user is verified but somehow on the pending page, redirect to home
      console.log('[VERIFICATION-CHECK] User is verified, redirecting from pending page to home');
      setLocation('/');
    }
  }, [user, location, setLocation]);
  
  return null;
}

// Navigation wrappers with instant rendering
function ConditionalNavigation() {
  return <OptimizedNavigation />;
}

function ConditionalMobileNavigation() {
  return <MobileNavigation />;
}

function CommunityNavWrapper() {
  const [location] = useLocation();
  const isCommunityPage = location === "/community";
  const isProfilePage = location.startsWith("/profile/");
  
  if (!isCommunityPage && !isProfilePage) return null;
  
  return <CommunityNav />;
}

function DatingNavWrapper() {
  const [location] = useLocation();
  const isDatingPage = location === "/dating";
  
  if (!isDatingPage) return null;
  
  return <DatingNav />;
}

function ConditionalFooter() {
  const [location] = useLocation();
  const ADMIN_PATHS = ['/admin', '/admin-control-center', '/unified-admin-dashboard'];
  const isAdminRoute = ADMIN_PATHS.some(path => location === path || location.startsWith(`${path}/`));
  const isCommunityPage = location === "/community";
  
  if (isCommunityPage || isAdminRoute) return null;
  
  return <Footer />;
}

function MarketplaceNavWrapper() {
  const [location] = useLocation();
  const showOnPaths = [
    '/marketplace', '/products', '/product', '/vendors', '/vendor',
    '/government', '/checkout', '/payment-success',
    '/vendor-dashboard', '/become-vendor',
    '/become-business-vendor', '/liked', '/orders-returns',
    '/shipping-calculator'
  ];
  
  const hideOnPaths = ['/add-product', '/upload-product'];
  const isHiddenPath = hideOnPaths.some(path => 
    location === path || location.startsWith(`${path}/`) || location.startsWith(`${path}?`)
  );
  
  if (isHiddenPath) return null;
  
  const shouldShowNav = showOnPaths.some(path => 
    location === path || location.startsWith(`${path}/`)
  );
  
  if (!shouldShowNav) return null;
  
  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm">
      <MarketplaceNav />
    </div>
  );
}

// Standalone route utilities - routes that render without shared navigation/footer
const STANDALONE_ROUTES: string[] = [];
const normalizePath = (path: string) => path.split('?')[0];
const isStandaloneRoutePath = (path: string) => STANDALONE_ROUTES.includes(normalizePath(path));



// SEO wrapper - SEOHead is now eager loaded for better SEO performance
function SEORoute({ path, component: Component, seoConfig, children, ...props }: any) {
  const [location] = useLocation();
  const isActive = location === path || (typeof path === 'string' && location.startsWith(path + '/'));
  
  if (!isActive) return null;
  
  return (
    <>
      {seoConfig && <SEOHead {...seoConfig} />}
      {Component ? <Component {...props} /> : children}
    </>
  );
}

// Lazy bundle configuration with comprehensive path mappings for code splitting
const lazyBundles = [
  {
    Component: MarketplaceRoutes,
    mounts: [
      '/marketplace/:rest*', '/marketplace', '/marketplace/b2c', '/marketplace/b2b', '/marketplace/c2c',
      '/marketplace/raw', '/marketplace/creators', '/marketplace/real-estate', '/marketplace/rqst',
      '/products', '/product/:identifier', '/vendors', '/vendor/:slug',
      '/search', '/gift-cards', '/cart', '/checkout', '/payment-gateway',
      '/payment-success', '/add-product', '/upload-product', '/categories'
    ]
  },
  {
    Component: SocialRoutes,
    mounts: [
      '/community', '/community/:rest*', '/dating', '/dating/:rest*', '/post/:id', '/vidz/:rest*', '/events', '/events/:rest*',
      '/social', '/social/:tab', '/social-console', '/social-insights',
      '/saved-posts', '/drafts', '/messages/:username?', '/messages', '/notifications', '/friend-requests',
      '/premium-videos', '/premium-videos/:id', '/walls', '/community-search'
    ]
  },
  {
    Component: AdminRoutes,
    mounts: ['/admin', '/admin/:rest*', '/admin-control-center', '/admin-control-center/:rest*', '/unified-admin-dashboard', '/unified-admin-dashboard/:rest*']
  },
  {
    Component: UserSettingsRoutes,
    mounts: [
      '/profile/:rest*', '/profile', '/settings/:rest*', '/settings', '/account/:rest*',
      '/profile-settings', '/preferences', '/vendor-dashboard', '/become-vendor', 
      '/become-business-vendor', '/vendor-register', '/logout-test'
    ]
  },
  {
    Component: LegalInfoRoutes,
    mounts: ['/legal/:rest*', '/privacy/:rest*', '/terms/:rest*', '/cookie-policy', '/about']
  },
  {
    Component: SpecialtyRoutes,
    mounts: [
      '/government', '/dr-congo', '/finance', '/erp', '/crm', '/calendar', '/lifestyle', '/lifestyle/order-food', '/lifestyle/groceries', '/lifestyle/reservations', '/lifestyle-profile',
      '/services', '/services/jobs', '/services/freelance',
      '/shipping-calculator', '/percentage-calculator', '/commission-payment/:periodId',
      '/dating', '/dating/:rest*', '/my-matches',
      '/pawapay/:rest*', '/affiliates/:rest*', '/partner/:rest*', '/creators/:rest*',
      '/video-demo', '/test-cookies'
    ]
  }
];

function Router() {
  return (
    <Switch>
      {/* Eager routes - Critical authentication and landing pages with SEO optimization */}
      <Route path="/">
        <SEOHead 
          title="Dedw3n - Multi-Vendor Social Marketplace & Dating Platform"
          description="Dedw3n is a multi-vendor marketplace and social platform built with modern web technologies. The platform combines e-commerce capabilities with social networking features, creating an end-to-end transactional ecosystem where users can purchase products, interact socially, and access exclusive content."
          keywords="marketplace, social platform, dating, e-commerce, multi-vendor, online shopping, social networking"
        />
        <LandingPage />
      </Route>

      <Route path="/auth">
        <SEOHead 
          title="Sign In - Dedw3n"
          description="Sign in to your Dedw3n account to access the marketplace, community, and dating features."
          keywords="sign in, login, authentication, account access"
        />
        <AuthPage />
      </Route>

      <Route path="/reset-password">
        <SEOHead 
          title="Reset Password - Dedw3n"
          description="Reset your Dedw3n account password securely."
          keywords="reset password, forgot password, account recovery"
        />
        <ResetPassword />
      </Route>

      <Route path="/reset-password-confirm">
        <SEOHead 
          title="Confirm Password Reset - Dedw3n"
          description="Confirm your new password for your Dedw3n account."
          keywords="confirm password, new password, account security"
        />
        <ResetPasswordConfirm />
      </Route>

      <Route path="/verify-email">
        <SEOHead 
          title="Verify Email - Dedw3n"
          description="Verify your email address to complete your Dedw3n account setup."
          keywords="email verification, account verification, confirm email"
        />
        <VerifyEmail />
      </Route>

      <Route path="/verify-email-pending">
        <SEOHead 
          title="Email Verification Pending - Dedw3n"
          description="Please verify your email address to access all Dedw3n features."
          keywords="email pending, verification pending, account setup"
        />
        <VerifyEmailPending />
      </Route>

      <Route path="/verify-2fa">
        <SEOHead 
          title="Two-Factor Authentication - Dedw3n"
          description="Enter your two-factor authentication code to access your Dedw3n account."
          keywords="2fa, two-factor authentication, security code, account security"
        />
        <Verify2FA />
      </Route>

      <Route path="/mobile">
        <MobileLanding />
      </Route>

      {/* Lazy route bundles - wrapped in chunk load error boundary */}
      {lazyBundles.flatMap(({ Component, mounts }) =>
        mounts.map((path) => (
          <Route key={path} path={path}>
            {(params) => (
              <ChunkLoadErrorBoundary>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Component params={params} />
                </Suspense>
              </ChunkLoadErrorBoundary>
            )}
          </Route>
        ))
      )}

      {/* 404 fallback route */}
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  );
}

function App() {
  // Force refresh state to update all components when language changes
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Detect standalone routes that should render without navigation/footer
  const [location] = useLocation();
  const isStandalone = useMemo(() => isStandaloneRoutePath(location), [location]);
  
  // Canonical URLs now managed by SEOHead component to prevent conflicts
  
  // Initialize offline detection, language, and advertisement preloader
  useEffect(() => {
    // Initialize offline detection and store cleanup function
    const cleanupOfflineDetection = initializeOfflineDetection();
    
    // Initialize language based on user location
    initializeLanguageFromLocation();
    

    
    // Listen for language changes and force refresh
    const handleLanguageChange = () => {
      console.log('App detected language change, refreshing entire application');
      setForceRefresh((prev: number) => prev + 1);
    };
    
    window.addEventListener('language-changed', handleLanguageChange);
    
    return () => {
      // Clean up offline detection event listeners
      cleanupOfflineDetection();
      window.removeEventListener('language-changed', handleLanguageChange);
    };
  }, []);

  // Lightweight app shell with eager-loaded providers wrapping entire layout
  return (
    <CoreProviders forceRefresh={forceRefresh}>
      <AuthProvider>
        <SocialProviders>
          <MessagingProviders>
            <MarketplaceProviders>
              <ErrorBoundary>
                <ScrollToTop />
                <EmailVerificationRedirect />
                <div className="flex flex-col min-h-screen">
                  {!isStandalone && (
                    <>
                      <ConditionalNavigation />
                      <GPCBanner />
                      <MarketplaceNavWrapper />
                      <CommunityNavWrapper />
                      <DatingNavWrapper />
                    </>
                  )}
                  
                  <main className="flex-grow">
                    <ApiErrorBoundary showHomeButton={false}>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <Router />
                      </Suspense>
                    </ApiErrorBoundary>
                  </main>
                  
                  {!isStandalone && (
                    <>
                      <ConditionalFooter />
                      <ConditionalMobileNavigation />
                    </>
                  )}
                  <OfflineIndicator />
                  <LowerCookieBanner />
                  <GlobalLoginHandler />
                  <MobileRedirectHandler />
                </div>
              </ErrorBoundary>
              <Toaster />
            </MarketplaceProviders>
          </MessagingProviders>
        </SocialProviders>
      </AuthProvider>
    </CoreProviders>
  );
}


export default App;
