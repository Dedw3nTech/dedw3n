import { createContext, useContext, useState, ReactNode } from 'react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // Exchange rate to USD
}

export const currencies: Currency[] = [
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 1.27 },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🌍', rate: 1.00 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 1.08 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rate: 0.012 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rate: 0.0007 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 0.055 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', rate: 0.008 },
];

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]); // Default to GBP

  const convertPrice = (priceInUSD: number): number => {
    return priceInUSD / selectedCurrency.rate;
  };

  const formatPrice = (priceInUSD: number): string => {
    const convertedPrice = convertPrice(priceInUSD);
    return `${selectedCurrency.symbol}${convertedPrice.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setSelectedCurrency,
      convertPrice,
      formatPrice
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}