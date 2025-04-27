import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewProvider } from "@/hooks/use-view";
import { AuthProvider } from "@/hooks/use-auth";
import { MessagingProvider } from "@/hooks/use-messaging";
import { initializeOfflineDetection } from "@/lib/offline";
import { useEffect } from "react";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Social from "@/pages/social";
import AuthPage from "@/pages/auth-page";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
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

// Import video pages
import TrendingVideosPage from "@/pages/videos/trending";
import ShortsPage from "@/pages/videos/shorts";
import StoriesPage from "@/pages/videos/stories";
import LivePage from "@/pages/videos/live";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/vendor/:id" component={VendorDetailPage} />
      
      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/social" component={Social} />
      <ProtectedRoute path="/social/:tab" component={Social} />
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
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize offline detection
  useEffect(() => {
    initializeOfflineDetection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MessagingProvider>
            <ViewProvider>
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
            </ViewProvider>
          </MessagingProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
