import { useState, useEffect } from 'react';
import { CurrencyCode, currencySymbols, formatPriceWithCurrency } from '@/lib/currencyConverter';

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');

  // Get the symbol for the current currency
  const symbol = currencySymbols[currency];

  // Format price from GBP to selected currency
  const formatPrice = (priceInGBP: number): string => {
    return formatPriceWithCurrency(priceInGBP, currency);
  };

  // Format price with currency symbol only (no currency name)
  const formatPriceSymbolOnly = (priceInGBP: number): string => {
    const formatted = formatPriceWithCurrency(priceInGBP, currency);
    // Remove currency code if present and just return symbol + amount
    return formatted.replace(/\s[A-Z]{3}$/, '');
  };

  return {
    currency,
    setCurrency,
    symbol,
    formatPrice,
    formatPriceSymbolOnly
  };
}