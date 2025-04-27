import { createContext, useContext, useState, ReactNode } from "react";
import { MarketType, MARKET_TYPE_LABELS } from "@/lib/types";

interface MarketTypeContextType {
  marketType: MarketType;
  setMarketType: (marketType: MarketType) => void;
  marketTypeLabel: string;
}

const MarketTypeContext = createContext<MarketTypeContextType | undefined>(undefined);

export const MarketTypeProvider = ({ children }: { children: ReactNode }) => {
  const [marketType, setMarketType] = useState<MarketType>("b2c"); // Default to store (B2C)

  const marketTypeLabel = MARKET_TYPE_LABELS[marketType];

  return (
    <MarketTypeContext.Provider value={{ marketType, setMarketType, marketTypeLabel }}>
      {children}
    </MarketTypeContext.Provider>
  );
};

export const useMarketType = (): MarketTypeContextType => {
  const context = useContext(MarketTypeContext);
  if (context === undefined) {
    throw new Error("useMarketType must be used within a MarketTypeProvider");
  }
  return context;
};