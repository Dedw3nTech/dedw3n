import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ViewProvider } from "@/hooks/use-view";
import { AuthProvider } from "@/hooks/use-auth";
import { MessagingProvider } from "@/hooks/use-messaging";
import { MarketTypeProvider } from "@/hooks/use-market-type";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { CurrencyProvider } from "@/hooks/use-currency";
import { initializeOfflineDetection } from "@/lib/offline";
import { initializeLanguageFromLocation } from "@/lib/i18n";
import { useEffect, useState } from "react";
import promoImage from "@assets/Dedw3n Marketplace.png";
import sellCampaignImage from "@assets/Copy of Pre Launch Campaign  SELL.png";
import bottomPromoImage from "@assets/Black Friday Email Header  (1).png";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ProtectedRoute } from "@/lib/protected-route";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { GlobalLoginHandler } from "@/components/GlobalLoginHandler";

// Conditional MarketplaceNav wrapper
function MarketplaceNavWrapper({ searchTerm, setSearchTerm }: { searchTerm?: string; setSearchTerm?: (term: string) => void } = {}) {
  const [location] = useLocation();
  
  // Only show marketplace nav on marketplace-related pages
  const showOnPaths = [
    '/products',
    '/product',
    '/vendors',
    '/vendor',
    '/government',
    '/cart',
    '/checkout',
    '/payment-success',
    '/add-product',
    '/upload-product',
    '/vendor-dashboard',
    '/become-vendor',
    '/liked'
  ];
  
  // Check if current path should show the marketplace nav
  const shouldShowNav = showOnPaths.some(path => 
    location === path || location.startsWith(`${path}/`)
  );
  
  if (!shouldShowNav) {
    return null;
  }
  
  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm">
      <MarketplaceNav searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
    </div>
  );
}

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Social from "@/pages/social";
import AuthPage from "@/pages/auth-page";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import LogoutSuccess from "@/pages/logout-success";
import AdminDashboard from "@/pages/admin-dashboard";
import AIInsightsPage from "@/pages/ai-insights";
import SocialInsightsPage from "@/pages/social-insights";
import ApiTestPage from "@/pages/api-test";

import Header from "@/components/layout/Header-clean";
import Footer from "@/components/layout/Footer";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { MarketplaceNav } from "@/components/layout/MarketplaceNav";
import OfflineSimulator from "@/components/utils/OfflineSimulator";
import ChatbotWindow from "@/components/ai/ChatbotWindow";
import { LoginPopup } from "@/components/ui/login-popup";

// Import new page components
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import AddProduct from "@/pages/add-product";
import UploadProduct from "@/pages/upload-product";
import MembersPage from "@/pages/members";
import WalletPage from "@/pages/wallet";
import VendorAnalytics from "@/pages/vendor-analytics";
import SpendingAnalytics from "@/pages/spending-analytics";
import VendorsPage from "@/pages/vendors";
import VendorDetailPage from "@/pages/vendor-detail";
import GovernmentPage from "@/pages/government";
import DatingPage from "@/pages/dating";
import BecomeVendorPage from "@/pages/become-vendor";
import VendorDashboardPage from "@/pages/vendor-dashboard";
import LikedPage from "@/pages/liked";

// Import footer pages
import FAQPage from "@/pages/faq";
import ShippingPage from "@/pages/shipping";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import CookiesPage from "@/pages/cookies";
import ContactPage from "@/pages/contact";
import CommunityGuidelines from "@/pages/community-guidelines";
import CommunityPage from "@/pages/community";
import RemoveAdsPage from "@/pages/remove-ads";



// Import social networking and user components
import ProfilePage from "@/pages/profile-simple";
import SettingsPage from "@/pages/settings";
import ProfileSettingsPage from "@/pages/profile-settings";
import WallPage from "@/pages/wall";
import MessagesPage from "@/pages/messages";
import ExplorePage from "@/pages/explore";
import SearchPage from "@/pages/search";
import SocialConsolePage from "@/pages/social-console";
import NotificationsPage from "@/pages/notifications";
import PostDetailPage from "@/pages/post-detail";
import DatingProfilePage from "@/pages/dating-profile";

import PremiumVideoPage from "@/pages/premium-video";

function Router() {
  return (
    <Switch>
      <Route path="/test-auth">
        <TestAuthPage />
      </Route>
      <Route path="/" component={CommunityPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/logout-success" component={LogoutSuccess} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/vendor/:id" component={VendorDetailPage} />
      <Route path="/government" component={GovernmentPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/dating" component={DatingPage} />
      <ProtectedRoute path="/become-vendor" component={BecomeVendorPage} />
      <ProtectedRoute path="/vendor-dashboard" component={VendorDashboardPage} />
      
      {/* Footer pages - publicly accessible */}
      <Route path="/faq" component={FAQPage} />
      <Route path="/shipping" component={ShippingPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/remove-ads" component={RemoveAdsPage} />
      <Route path="/api-test" component={ApiTestPage} />
      
      {/* Protected routes - require authentication */}
      <Route path="/social">
        <Redirect to="/wall" />
      </Route>
      <Route path="/social/:tab">
        <Redirect to="/wall" />
      </Route>
      <ProtectedRoute path="/social-console" component={SocialConsolePage} />
      <ProtectedRoute path="/social-insights" component={SocialInsightsPage} />
      <ProtectedRoute path="/ai-insights" component={AIInsightsPage} />
      <ProtectedRoute path="/cart" component={Cart} />
      <ProtectedRoute path="/checkout" component={Checkout} />
      <ProtectedRoute path="/payment-success" component={PaymentSuccess} />
      <ProtectedRoute path="/liked" component={LikedPage} />
      <ProtectedRoute path="/add-product" component={AddProduct} />
      <ProtectedRoute path="/upload-product" component={UploadProduct} />
      <ProtectedRoute path="/members" component={MembersPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/spending-analytics" component={SpendingAnalytics} />
      <ProtectedRoute path="/vendor-analytics" component={VendorAnalytics} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/:username" component={ProfilePage} />
      <ProtectedRoute path="/profile-settings" component={ProfileSettingsPage} />
      <ProtectedRoute path="/dating-profile" component={DatingProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/wall" component={WallPage} />
      <Route path="/community" component={CommunityPage} />
      <ProtectedRoute path="/posts/:id" component={PostDetailPage} />
      <ProtectedRoute path="/messages/:username?" component={MessagesPage} />
      <ProtectedRoute path="/explore" component={ExplorePage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      

      
      {/* Premium video routes */}
      <ProtectedRoute path="/premium-videos" component={PremiumVideoPage} />
      <ProtectedRoute path="/premium-videos/:id" component={PremiumVideoPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/:tab" component={AdminDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force refresh state to update all components when language changes
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Initialize offline detection and language
  useEffect(() => {
    // Initialize offline detection
    initializeOfflineDetection();
    
    // Initialize language based on user location
    initializeLanguageFromLocation();
    
    // Listen for language changes and force refresh
    const handleLanguageChange = () => {
      console.log('App detected language change, refreshing entire application');
      setForceRefresh((prev: number) => prev + 1);
    };
    
    window.addEventListener('language-changed', handleLanguageChange);
    
    return () => {
      window.removeEventListener('language-changed', handleLanguageChange);
    };
  }, []);

  // Using forceRefresh in a key forces re-rendering when language changes
  return (
    <QueryClientProvider client={queryClient} key={`query-provider-${forceRefresh}`}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <ViewProvider>
              <MarketTypeProvider>
                <SubscriptionProvider>
                  <MessagingProvider>
                    <CurrencyProvider>
                      <ErrorBoundary>
                        <div className="flex flex-col min-h-screen">
                          <Header />
                          <MarketplaceNavWrapper />
                          
                          {/* New Section Above Main - Only show on marketplace pages */}
                          <MarketplacePromoSection />
                          
                          <main className="flex-grow">
                            <ApiErrorBoundary showHomeButton={false}>
                              <Router />
                            </ApiErrorBoundary>
                          </main>
                          
                          {/* New Section Below Main - Only show on marketplace pages */}
                          <MarketplaceBottomPromoSection />
                          
                          <Footer />
                          <MobileNavigation />
                          <OfflineIndicator />
                          <LoginPopup delay={5000} />
                          <GlobalLoginHandler />
                          {/* Offline simulator hidden as requested */}
                          {/* Chatbot will be implemented later when API key is available */}
                          {/* <ChatbotWindow /> */}
                        </div>
                      </ErrorBoundary>
                      <Toaster />
                    </CurrencyProvider>
                  </MessagingProvider>
                </SubscriptionProvider>
              </MarketTypeProvider>
            </ViewProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Marketplace promotional sections that only show on marketplace pages
function MarketplacePromoSection() {
  const [location] = useLocation();
  
  // Only show on marketplace-related pages (excluding home page)
  const isMarketplacePage = location === "/products" || location === "/categories" || location.startsWith("/products/");
  
  if (!isMarketplacePage) return null;
  
  return (
    <div className="w-full">
      <img 
        src={promoImage} 
        alt="Dedwen Black Friday Header - Premium Marketplace" 
        className="w-full h-[400px] object-cover"
      />
    </div>
  );
}

function MarketplaceBottomPromoSection() {
  const [location] = useLocation();
  
  // Only show on marketplace-related pages (excluding home page)
  const isMarketplacePage = location === "/products" || location === "/categories" || location.startsWith("/products/");
  
  if (!isMarketplacePage) return null;
  
  return (
    <div className="w-full">
      <img 
        src={bottomPromoImage} 
        alt="Dedwen Black Friday - Professional Fashion Collection" 
        className="w-full h-[768px] object-cover"
      />
    </div>
  );
}

// Test Auth Page component for debugging authentication
function TestAuthPage() {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // Query for testing authentication status
  const { data: authData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/auth/test-auth'],
    retry: false,
    enabled: false,
  });
  
  // Query to get current user
  const { data: user, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });
  
  // Test direct login with session-based auth
  const handleDirectLogin = async (userId: number) => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch(`/api/auth/test-login/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Login successful: ${JSON.stringify(data, null, 2)}`);
        await refetchUser();
      } else {
        setMessage(`Login failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Get a JWT token for testing
  const handleGetToken = async (userId: number) => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch(`/api/auth/get-test-token/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.token);
        setMessage(`Token generated: ${data.token.substring(0, 20)}... (expires: ${new Date(data.expiresAt).toLocaleString()})`);
        await refetchUser();
      } else {
        setMessage(`Token generation failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Check authentication status
  const handleCheckAuth = async () => {
    setLoading(true);
    await refetch();
    setLoading(false);
  };
  
  // Logout
  const handleLogout = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await apiRequest("POST", "/api/logout");
      
      if (response.ok) {
        localStorage.removeItem('auth_token');
        setMessage("Logged out successfully");
        await refetchUser();
      } else {
        const data = await response.json();
        setMessage(`Logout failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Testing Page</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Actions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Session Authentication</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => handleDirectLogin(1)} 
                  disabled={loading}
                  variant="default"
                >
                  Login as User ID 1
                </Button>
                <Button 
                  onClick={() => handleDirectLogin(2)} 
                  disabled={loading}
                  variant="default"
                >
                  Login as User ID 2
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">JWT Authentication</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => handleGetToken(1)} 
                  disabled={loading}
                  variant="secondary"
                >
                  Get Token for User 1
                </Button>
                <Button 
                  onClick={() => handleGetToken(2)} 
                  disabled={loading}
                  variant="secondary"
                >
                  Get Token for User 2
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Auth Operations</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleCheckAuth} 
                  disabled={loading}
                  variant="outline"
                >
                  Check Auth Status
                </Button>
                <Button 
                  onClick={handleLogout} 
                  disabled={loading}
                  variant="destructive"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
          
          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Processing...</p>
            </div>
          )}
          
          {message && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{message}</pre>
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication Status</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Auth Check Response</h3>
              {isLoading ? (
                <p>Checking authentication...</p>
              ) : error ? (
                <p className="text-destructive">Error: {(error as Error).message}</p>
              ) : authData ? (
                <pre className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {JSON.stringify(authData, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">Click "Check Auth Status" to verify authentication</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Current User</h3>
              {userLoading ? (
                <p>Loading user data...</p>
              ) : user ? (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="font-medium">Authenticated as: {user.username || user.email || `User ${user.id}`}</span>
                  </div>
                  <pre className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                  <span>Not authenticated</span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Local Storage Token</h3>
              <div className="p-3 bg-muted rounded-md text-sm font-mono">
                {localStorage.getItem('auth_token') ? (
                  <>
                    <p className="mb-1">Token found:</p>
                    <p className="truncate">{localStorage.getItem('auth_token')}</p>
                  </>
                ) : (
                  <p>No token in localStorage</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
