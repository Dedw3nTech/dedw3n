import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewProvider } from "@/hooks/use-view";
import { AuthProvider } from "@/hooks/use-auth";

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

// Import new page components
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import AddProduct from "@/pages/add-product";
import UploadProduct from "@/pages/upload-product";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/social" component={Social} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/add-product" component={AddProduct} />
      <Route path="/upload-product" component={UploadProduct} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ViewProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Router />
              </main>
              <Footer />
              <MobileNavigation />
            </div>
            <Toaster />
          </ViewProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
