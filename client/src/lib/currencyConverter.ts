// Currency conversion utility

// List of supported currencies
export const supportedCurrencies = ['GBP', 'USD', 'EUR', 'CNY', 'INR', 'BRL'];

// Currency symbols for displaying amounts
export const currencySymbols: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$'
};

// Cache for exchange rates to avoid frequent API calls
interface ExchangeRateCache {
  rates: Record<string, number>;
  lastUpdated: number;
  baseCurrency: string;
}

let rateCache: ExchangeRateCache = {
  rates: {},
  lastUpdated: 0,
  baseCurrency: 'GBP'
};

// Timeout for cache (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Fetch latest exchange rates from API
 * @param baseCurrency Base currency to get rates for
 * @returns Object with exchange rates
 */
export const fetchExchangeRates = async (baseCurrency: string = 'GBP'): Promise<Record<string, number>> => {
  const now = Date.now();
  
  // Return from cache if still valid and for the same base currency
  if (
    rateCache.lastUpdated > 0 && 
    now - rateCache.lastUpdated < CACHE_TIMEOUT &&
    rateCache.baseCurrency === baseCurrency
  ) {
    return rateCache.rates;
  }
  
  try {
    // Using Exchange Rate API (free tier)
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    const data = await response.json();
    
    if (data && data.rates) {
      // Update cache
      rateCache = {
        rates: data.rates,
        lastUpdated: now,
        baseCurrency
      };
      return data.rates;
    } else {
      throw new Error('Invalid response from exchange rate API');
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // If we have cached rates, return those even if outdated
    if (Object.keys(rateCache.rates).length > 0) {
      return rateCache.rates;
    }
    
    // Fallback to some default rates if API fails and no cache
    return {
      GBP: 1,
      USD: 1.28,
      EUR: 1.18,
      CNY: 9.09,
      INR: 106.56,
      BRL: 7.28
    };
  }
};

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @returns Converted amount
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Get rates with fromCurrency as base
  const rates = await fetchExchangeRates(fromCurrency);
  
  // Convert to target currency
  if (rates[toCurrency]) {
    return amount * rates[toCurrency];
  }
  
  // Fallback if conversion rate not found
  console.error(`Conversion rate from ${fromCurrency} to ${toCurrency} not found`);
  return amount;
};

/**
 * Format amount with currency symbol
 * @param amount Amount to format
 * @param currency Currency code
 * @param showCode Whether to include currency code
 * @returns Formatted amount string
 */
export const formatCurrency = (
  amount: number,
  currency: string,
  showCode: boolean = false
): string => {
  const symbol = currencySymbols[currency] || '$';
  
  const formatted = amount.toFixed(2);
  
  return showCode 
    ? `${symbol}${formatted} ${currency}`
    : `${symbol}${formatted}`;
};