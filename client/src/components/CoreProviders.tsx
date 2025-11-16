import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthTokenProvider } from "@/contexts/AuthTokenContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { GPCProvider } from "@/components/GPCProvider";
import { CookieConsentProvider } from "@/components/CookieConsentProvider";
import { WeightUnitProvider } from "@/contexts/WeightUnitContext";
import { DimensionUnitProvider } from "@/hooks/use-dimension-unit";
import { DistanceUnitProvider } from "@/hooks/use-distance-unit";
import { queryClient } from "@/lib/queryClient";

interface CoreProvidersProps {
  children: ReactNode;
  forceRefresh?: number;
}

export function CoreProviders({ children, forceRefresh = 0 }: CoreProvidersProps) {
  return (
    <QueryClientProvider client={queryClient} key={`query-provider-${forceRefresh}`}>
      <GPCProvider>
        <CookieConsentProvider>
          <TooltipProvider>
            <AuthTokenProvider>
              <LanguageProvider>
                <DistanceUnitProvider>
                  <WeightUnitProvider>
                    <DimensionUnitProvider>
                      {children}
                    </DimensionUnitProvider>
                  </WeightUnitProvider>
                </DistanceUnitProvider>
              </LanguageProvider>
            </AuthTokenProvider>
          </TooltipProvider>
        </CookieConsentProvider>
      </GPCProvider>
    </QueryClientProvider>
  );
}
