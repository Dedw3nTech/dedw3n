import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { updateCryptocurrencyRates } from '../services/cryptoApiService';
import type { Currency } from '../types/currency';
import { currencies } from '../types/currency';

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
  formatPriceFromGBP: (priceInGBP: number) => string;
  currencyList: Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]); // Default to GBP
  const [currencyList, setCurrencyList] = useState<Currency[]>(currencies);

  // Update cryptocurrency rates on component mount and periodically
  useEffect(() => {
    const updateRates = async () => {
      try {
        const updatedCurrencies = await updateCryptocurrencyRates(currencyList);
        setCurrencyList(updatedCurrencies);
        
        // Update selected currency if it's a cryptocurrency
        if (selectedCurrency.category === 'Cryptocurrencies' || selectedCurrency.category === 'Stablecoins') {
          const updatedSelectedCurrency = updatedCurrencies.find(c => c.code === selectedCurrency.code);
          if (updatedSelectedCurrency) {
            setSelectedCurrency(updatedSelectedCurrency);
          }
        }
      } catch (error) {
        console.error('Failed to update cryptocurrency rates:', error);
      }
    };

    // Update rates immediately
    updateRates();

    // Update rates every 5 minutes
    const interval = setInterval(updateRates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currencyList.length, selectedCurrency.code]); // Only depend on list length and selected currency code

  const convertPrice = (priceInUSD: number): number => {
    return priceInUSD / selectedCurrency.rate;
  };

  const formatCryptoAmount = (amount: number): string => {
    // Use toFixed(10) for precision, then manually remove trailing zeros to avoid scientific notation
    const fixed = amount.toFixed(10);
    return fixed.replace(/\.?0+$/, '');
  };

  const formatPrice = (priceInUSD: number): string => {
    const convertedPrice = convertPrice(priceInUSD);
    
    // Use 10 decimal places for cryptocurrencies and stablecoins, 2 for traditional currencies
    const isCrypto = selectedCurrency.category === 'Cryptocurrencies' || selectedCurrency.category === 'Stablecoins';
    
    let formattedPrice: string;
    if (isCrypto) {
      formattedPrice = formatCryptoAmount(convertedPrice);
    } else {
      formattedPrice = convertedPrice.toFixed(2);
    }
    
    return `${selectedCurrency.symbol}${formattedPrice}`;
  };

  const formatPriceFromGBP = (priceInGBP: number): string => {
    let convertedPrice: number;
    
    if (selectedCurrency.code === 'GBP') {
      convertedPrice = priceInGBP;
    } else {
      // Convert from GBP to selected currency
      // First convert GBP to USD (GBP rate is 1.27, so 1 GBP = 1.27 USD)
      const priceInUSD = priceInGBP * 1.27;
      // Then convert USD to selected currency
      convertedPrice = priceInUSD / selectedCurrency.rate;
    }
    
    // Use different formatting for crypto vs traditional currencies
    let formatted: string;
    if (selectedCurrency.category === 'Cryptocurrencies' || selectedCurrency.category === 'Stablecoins') {
      // For crypto: use up to 10 decimal places, remove trailing zeros
      formatted = formatCryptoAmount(convertedPrice);
    } else {
      // For traditional currencies: always show exactly 2 decimal places
      formatted = convertedPrice.toFixed(2);
    }
    
    return `${selectedCurrency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setSelectedCurrency,
      convertPrice,
      formatPrice,
      formatPriceFromGBP,
      currencyList
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    // Provide fallback values instead of throwing error
    return {
      selectedCurrency: currencies[0], // Default to GBP
      setSelectedCurrency: () => {},
      convertPrice: (priceInUSD: number) => priceInUSD / currencies[0].rate,
      formatPrice: (priceInUSD: number) => `${currencies[0].symbol}${(priceInUSD / currencies[0].rate).toFixed(2)}`,
      formatPriceFromGBP: (priceInGBP: number) => {
        const currency = currencies[0]; // Default to GBP
        let formatted: string;
        if (currency.category === 'Cryptocurrencies' || currency.category === 'Stablecoins') {
          // For crypto: use up to 10 decimal places, remove trailing zeros safely
          const fixed = priceInGBP.toFixed(10);
          formatted = fixed.replace(/\.?0+$/, '');
        } else {
          // For traditional currencies: always show exactly 2 decimal places
          formatted = priceInGBP.toFixed(2);
        }
        return `${currency.symbol}${formatted}`;
      },
      currencyList: currencies
    };
  }
  return context;
}