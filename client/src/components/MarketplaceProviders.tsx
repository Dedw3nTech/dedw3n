import { ReactNode } from "react";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { MarketTypeProvider } from "@/hooks/use-market-type";

interface MarketplaceProvidersProps {
  children: ReactNode;
}

export function MarketplaceProviders({ children }: MarketplaceProvidersProps) {
  return (
    <MarketTypeProvider>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </MarketTypeProvider>
  );
}
