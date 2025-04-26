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
      <Route path="/social" component={Social} />
      <Route path="/social/:tab" component={Social} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/add-product" component={AddProduct} />
      <Route path="/upload-product" component={UploadProduct} />
      <Route path="/members" component={MembersPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/spending-analytics" component={SpendingAnalytics} />
      <Route path="/vendor-analytics" component={VendorAnalytics} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/vendor/:id" component={VendorDetailPage} />
      <Route path="/communities" component={CommunitiesPage} />
      <Route path="/communities/create" component={CreateCommunityPage} />
      <Route path="/communities/:id" component={CommunityDetailPage} />
      <Route path="/communities/:id/manage" component={CommunityManagePage} />
      <Route path="/profile/:username" component={ProfilePage} />
      <Route path="/wall" component={WallPage} />
      <Route path="/messages/:username?" component={MessagesPage} />
      <Route path="/explore" component={ExplorePage} />
      
      {/* Video routes */}
      <Route path="/videos/trending" component={TrendingVideosPage} />
      <Route path="/videos/shorts" component={ShortsPage} />
      <Route path="/videos/stories" component={StoriesPage} />
      <Route path="/videos/live" component={LivePage} />
      <Route path="/videos/upload" component={TrendingVideosPage} />
      <Route path="/videos/:id" component={TrendingVideosPage} />
      
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
