import React from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ViewProvider } from "@/hooks/use-view";
import { AuthProvider } from "@/hooks/use-auth-nonblocking";
import { MessagingProvider } from "@/hooks/use-messaging";
import { MarketTypeProvider } from "@/hooks/use-market-type";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/utils/ErrorBoundary";
import { ApiErrorBoundary } from "@/components/utils/ApiErrorBoundary";
import { OptimizedNavigation } from "@/components/OptimizedNavigation";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MobileNavigation } from "@/components/MobileNavigation";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { GlobalLoginHandler } from "@/components/GlobalLoginHandler";

// Import pages
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OptimizedNavigation />
      <Breadcrumbs />
      
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <Footer />
      <MobileNavigation />
      <OfflineIndicator />
      <GlobalLoginHandler />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <ViewProvider>
              <LanguageProvider>
                <CurrencyProvider>
                  <ApiErrorBoundary>
                    <AuthProvider>
                      <MessagingProvider>
                        <SubscriptionProvider>
                          <MarketTypeProvider>
                            <Router />
                            <Toaster />
                          </MarketTypeProvider>
                        </SubscriptionProvider>
                      </MessagingProvider>
                    </AuthProvider>
                  </ApiErrorBoundary>
                </CurrencyProvider>
              </LanguageProvider>
            </ViewProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;