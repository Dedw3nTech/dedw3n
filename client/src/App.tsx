import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewProvider } from "@/hooks/use-view";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Social from "@/pages/social";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNavigation from "@/components/layout/MobileNavigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/social" component={Social} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
