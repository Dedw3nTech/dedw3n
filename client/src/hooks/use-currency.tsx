import React, { createContext, useContext, useEffect, useState } from 'react';
import { detectUserLocation, getUserPreferredCurrency, saveUserCurrency, supportedCurrencies } from '@/lib/locationDetection';

export type CurrencyType = 'GBP' | 'EUR' | 'USD' | 'CNY' | 'INR' | 'BRL';

// Symbol lookup for different currencies
export const currencySymbols: Record<string, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
};

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  symbol: string;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyType>('GBP');
  const [loaded, setLoaded] = useState(false);

  // Format amount based on current currency
  const formatAmount = (amount: number): string => {
    return `${currencySymbols[currency]}${amount.toFixed(2)}`;
  };

  // Update currency with user choice and save preference
  const handleSetCurrency = (newCurrency: CurrencyType) => {
    console.log('Currency changing from', currency, 'to', newCurrency);
    setCurrency(newCurrency);
    saveUserCurrency(newCurrency);
    
    // Force refresh to update all components that display prices
    window.dispatchEvent(new CustomEvent('currency-changed', { 
      detail: { from: currency, to: newCurrency } 
    }));
  };

  // Initialize currency based on user location
  useEffect(() => {
    const initCurrency = async () => {
      try {
        // Check if user already has a currency preference
        const savedCurrency = getUserPreferredCurrency();
        if (savedCurrency && supportedCurrencies.includes(savedCurrency)) {
          setCurrency(savedCurrency as CurrencyType);
          setLoaded(true);
          return;
        }

        // Detect location and set appropriate currency
        const locationInfo = await detectUserLocation();
        
        if (locationInfo && locationInfo.currency && supportedCurrencies.includes(locationInfo.currency)) {
          setCurrency(locationInfo.currency as CurrencyType);
          saveUserCurrency(locationInfo.currency);
        }
        
        setLoaded(true);
      } catch (error) {
        console.error('Error initializing currency from location:', error);
        setLoaded(true);
      }
    };

    if (!loaded) {
      initCurrency();
    }
  }, [loaded]);

  const value = {
    currency,
    setCurrency: handleSetCurrency,
    symbol: currencySymbols[currency],
    formatAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};