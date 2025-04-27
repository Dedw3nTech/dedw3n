export type CurrencyCode = 'GBP' | 'EUR' | 'USD' | 'CNY' | 'INR' | 'BRL';

// List of supported currencies
export const supportedCurrencies: CurrencyCode[] = ['GBP', 'EUR', 'USD', 'CNY', 'INR', 'BRL'];

// Symbol lookup for different currencies
export const currencySymbols: Record<CurrencyCode, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
};

// Exchange rates with GBP as the base currency
// These rates would ideally come from a real-time API in production
export const exchangeRates: Record<CurrencyCode, number> = {
  GBP: 1.0,      // Base currency
  EUR: 1.17,     // 1 GBP = 1.17 EUR
  USD: 1.25,     // 1 GBP = 1.25 USD
  CNY: 9.07,     // 1 GBP = 9.07 CNY
  INR: 104.43,   // 1 GBP = 104.43 INR
  BRL: 6.35,     // 1 GBP = 6.35 BRL
};

/**
 * Fetch exchange rates from source currency
 * In a real app, this would call a currency exchange API
 * @param baseCurrency The base currency to get rates for
 * @returns A promise resolving to exchange rates
 */
export async function fetchExchangeRates(baseCurrency: CurrencyCode): Promise<Record<CurrencyCode, number>> {
  // For demo purposes, we're using static rates
  // In a real app, this would call an API like OpenExchangeRates or CurrencyAPI
  
  // Simulate network request
  return new Promise((resolve) => {
    setTimeout(() => {
      // If base currency is GBP, return rates as is
      if (baseCurrency === 'GBP') {
        resolve({...exchangeRates});
        return;
      }
      
      // Otherwise, convert to the requested base currency
      const baseRate = exchangeRates[baseCurrency];
      const convertedRates: Record<CurrencyCode, number> = {} as Record<CurrencyCode, number>;
      
      // Calculate rates relative to the requested base currency
      supportedCurrencies.forEach(currency => {
        if (currency === baseCurrency) {
          convertedRates[currency] = 1.0; // Base currency to itself is always 1
        } else {
          // Convert through GBP: first find the GBP value of 1 unit of baseCurrency,
          // then convert that GBP value to the target currency
          const rateInGBP = 1 / exchangeRates[baseCurrency]; // How much GBP for 1 unit of baseCurrency
          const targetRate = rateInGBP * exchangeRates[currency]; // Convert that GBP to target currency
          convertedRates[currency] = targetRate;
        }
      });
      
      resolve(convertedRates);
    }, 500); // Simulate network delay
  });
};

/**
 * Convert amount from one currency to another
 * @param amount The amount to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // First convert to GBP (base currency)
  const inGBP = amount / exchangeRates[fromCurrency];
  
  // Then convert from GBP to target currency
  return inGBP * exchangeRates[toCurrency];
}

/**
 * Format currency with proper symbol and decimal places
 * @param amount The amount to format
 * @param currencyCode The currency code
 * @param includeCode Optional flag to include currency code in output
 * @returns Formatted currency string with symbol
 */
export function formatCurrency(
  amount: number, 
  currencyCode: CurrencyCode,
  includeCode: boolean = false
): string {
  // Use the globally defined currency symbols
  const symbol = currencySymbols[currencyCode];
  
  // Format with 2 decimal places and appropriate currency symbol
  const formattedAmount = `${symbol}${amount.toFixed(2)}`;
  
  // Optionally include the currency code
  return includeCode ? `${formattedAmount} ${currencyCode}` : formattedAmount;
}

/**
 * Get exchange rate between two currencies
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns The exchange rate
 */
export function getExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  // If the same currency, rate is 1:1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Calculate the exchange rate: how many toCurrency units for 1 fromCurrency unit
  return exchangeRates[toCurrency] / exchangeRates[fromCurrency];
}

/**
 * Get formatted exchange rate string
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns A formatted string showing the exchange rate
 */
export function getFormattedExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): string {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  const symbols = {
    GBP: '£',
    EUR: '€',
    USD: '$',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
  };

  return `1 ${symbols[fromCurrency]} = ${rate.toFixed(4)} ${symbols[toCurrency]}`;
}