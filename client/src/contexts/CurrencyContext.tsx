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
  
  // African Mobile Money Currencies (High Priority)
  { code: 'RWF', name: 'Rwanda - Rwandan Franc', symbol: 'RWF', flag: '🇷🇼', rate: 0.00070 },
  { code: 'XOF', name: 'Senegal - West African CFA Franc', symbol: 'CFA', flag: '🇸🇳', rate: 0.0016 },
  { code: 'SLL', name: 'Sierra Leone - Leone', symbol: 'Le', flag: '🇸🇱', rate: 0.000033 },
  { code: 'UGX', name: 'Uganda - Ugandan Shilling', symbol: 'UGX', flag: '🇺🇬', rate: 0.00027 },
  { code: 'ZMW', name: 'Zambia - Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲', rate: 0.036 },
  { code: 'GHS', name: 'Ghana - Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', rate: 0.063 },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🌍', rate: 0.0016 },
  { code: 'GNF', name: 'Guinea - Guinean Franc', symbol: 'GNF', flag: '🇬🇳', rate: 0.00012 },
  { code: 'KES', name: 'Kenya - Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', rate: 0.0062 },
  { code: 'TZS', name: 'Tanzania - Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', rate: 0.00034 },
  { code: 'MWK', name: 'Malawi - Malawian Kwacha', symbol: 'MK', flag: '🇲🇼', rate: 0.00058 },
  { code: 'MGA', name: 'Madagascar - Malagasy Ariary', symbol: 'Ar', flag: '🇲🇬', rate: 0.00017 },
  { code: 'CDF', name: 'Congo - Congolese Franc', symbol: 'FC', flag: '🇨🇩', rate: 0.00027 },
  { code: 'LRD', name: 'Liberia - Liberian Dollar', symbol: 'L$', flag: '🇱🇷', rate: 0.0041 },
  
  // Other Global Currencies
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rate: 0.012 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rate: 0.0007 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 0.055 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', rate: 0.0036 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', rate: 0.0084 },
  { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ', flag: '🇦🇪', rate: 0.27 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', rate: 0.27 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬', rate: 0.020 },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', flag: '🇩🇿', rate: 0.0075 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦', rate: 0.099 },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', flag: '🇦🇴', rate: 0.0012 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', rate: 0.17 },
  { code: 'SRD', name: 'Suriname Dollar', symbol: '$', flag: '🇸🇷', rate: 0.027 },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', rate: 0.00023 },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', flag: '🇭🇹', rate: 0.0076 },
  { code: 'DOP', name: 'Dominican Peso', symbol: '$', flag: '🇩🇴', rate: 0.017 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', rate: 0.049 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦', rate: 0.73 },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', flag: '🇦🇱', rate: 0.011 },
];

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
  formatPriceFromGBP: (priceInGBP: number) => string;
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
    
    // Format without .00 for whole numbers, with .xx for decimals
    const formatted = convertedPrice % 1 === 0 
      ? convertedPrice.toLocaleString() 
      : convertedPrice.toFixed(2);
    
    return `${selectedCurrency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setSelectedCurrency,
      convertPrice,
      formatPrice,
      formatPriceFromGBP
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
        const formatted = priceInGBP % 1 === 0 ? priceInGBP.toLocaleString() : priceInGBP.toFixed(2);
        return `${currencies[0].symbol}${formatted}`;
      }
    };
  }
  return context;
}