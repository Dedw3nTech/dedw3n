import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewProvider } from "@/hooks/use-view";
import { AuthProvider } from "@/hooks/use-auth";
import { MessagingProvider } from "@/hooks/use-messaging";
import { MarketTypeProvider } from "@/hooks/use-market-type";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { CurrencyProvider } from "@/hooks/use-currency";
import { initializeOfflineDetection } from "@/lib/offline";
import { initializeLanguageFromLocation } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Social from "@/pages/social";
import AuthPage from "@/pages/auth-page";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import AdminDashboard from "@/pages/admin-dashboard";
import AIInsightsPage from "@/pages/ai-insights";
import SocialInsightsPage from "@/pages/social-insights";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNavigation from "@/components/layout/MobileNavigation";
import OfflineSimulator from "@/components/utils/OfflineSimulator";
import ChatbotWindow from "@/components/ai/ChatbotWindow";

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

// Import community-related components
import CommunitiesPage from "@/pages/communities";
import CreateCommunityPage from "@/pages/create-community";
import CommunityDetailPage from "@/pages/community-detail";
import CommunityManagePage from "@/pages/community-manage";

// Import social networking and user components
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import WallPage from "@/pages/wall";
import MessagesPage from "@/pages/messages";
import ExplorePage from "@/pages/explore";
import SocialConsolePage from "@/pages/social-console";

// Import video pages
import TrendingVideosPage from "@/pages/videos/trending";
import ShortsPage from "@/pages/videos/shorts";
import StoriesPage from "@/pages/videos/stories";
import LivePage from "@/pages/videos/live";
import PremiumVideoPage from "@/pages/premium-video";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/vendor/:id" component={VendorDetailPage} />
      <Route path="/government" component={GovernmentPage} />
      <ProtectedRoute path="/dating" component={DatingPage} />
      
      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/social" component={Social} />
      <ProtectedRoute path="/social/:tab" component={Social} />
      <ProtectedRoute path="/social-console" component={SocialConsolePage} />
      <ProtectedRoute path="/social-insights" component={SocialInsightsPage} />
      <ProtectedRoute path="/ai-insights" component={AIInsightsPage} />
      <ProtectedRoute path="/cart" component={Cart} />
      <ProtectedRoute path="/checkout" component={Checkout} />
      <ProtectedRoute path="/payment-success" component={PaymentSuccess} />
      <ProtectedRoute path="/add-product" component={AddProduct} />
      <ProtectedRoute path="/upload-product" component={UploadProduct} />
      <ProtectedRoute path="/members" component={MembersPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/spending-analytics" component={SpendingAnalytics} />
      <ProtectedRoute path="/vendor-analytics" component={VendorAnalytics} />
      <ProtectedRoute path="/communities" component={CommunitiesPage} />
      <ProtectedRoute path="/communities/create" component={CreateCommunityPage} />
      <ProtectedRoute path="/communities/:id" component={CommunityDetailPage} />
      <ProtectedRoute path="/communities/:id/manage" component={CommunityManagePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/:username" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/wall" component={WallPage} />
      <ProtectedRoute path="/messages/:username?" component={MessagesPage} />
      <ProtectedRoute path="/explore" component={ExplorePage} />
      
      {/* Protected video routes */}
      <ProtectedRoute path="/videos/trending" component={TrendingVideosPage} />
      <ProtectedRoute path="/videos/shorts" component={ShortsPage} />
      <ProtectedRoute path="/videos/stories" component={StoriesPage} />
      <ProtectedRoute path="/videos/live" component={LivePage} />
      <ProtectedRoute path="/videos/upload" component={TrendingVideosPage} />
      <ProtectedRoute path="/videos/:id" component={TrendingVideosPage} />
      
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
      <TooltipProvider>
        <AuthProvider>
          <MessagingProvider>
            <ViewProvider>
              <MarketTypeProvider>
                <SubscriptionProvider>
                  <CurrencyProvider>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-grow">
                        <Router />
                      </main>
                      <Footer />
                      <MobileNavigation />
                      <OfflineIndicator />
                      {/* Offline simulator hidden as requested */}
                      {/* Chatbot will be implemented later when API key is available */}
                      {/* <ChatbotWindow /> */}
                    </div>
                    <Toaster />
                  </CurrencyProvider>
                </SubscriptionProvider>
              </MarketTypeProvider>
            </ViewProvider>
          </MessagingProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
