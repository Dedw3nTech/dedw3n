// Currency conversion rates (GBP to other currencies)
// Updated exchange rates as of 2025
const EXCHANGE_RATES = {
  // Base currency GBP = 1
  GBP: 1,
  USD: 1.27,
  EUR: 1.18,
  
  // African currencies
  UGX: 4650.50,    // Ugandan Shilling
  GHS: 15.80,      // Ghanaian Cedi
  XAF: 774.25,     // Central African CFA Franc
  XOF: 774.25,     // West African CFA Franc
  GNF: 10850.00,   // Guinean Franc
  RWF: 1420.75,    // Rwandan Franc
  KES: 162.30,     // Kenyan Shilling
  TZS: 2985.40,    // Tanzanian Shilling
  ZMW: 27.85,      // Zambian Kwacha
  MWK: 1735.60,    // Malawian Kwacha
  MGA: 5780.25,    // Malagasy Ariary
  CDF: 3650.80,    // Congolese Franc
  SLL: 30590.00,   // Sierra Leonean Leone (key rate: 227.99 GBP = 6,974,337 SLL)
  LRD: 245.60      // Liberian Dollar
};

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  formattedAmount: string;
}

/**
 * Convert amount from GBP to target currency
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: string = 'GBP', 
  toCurrency: string
): ConversionResult {
  
  // If same currency, return as-is
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      convertedCurrency: toCurrency,
      exchangeRate: 1,
      formattedAmount: formatCurrencyAmount(amount, toCurrency)
    };
  }

  // Get exchange rate for target currency
  const rate = EXCHANGE_RATES[toCurrency as keyof typeof EXCHANGE_RATES];
  
  if (!rate) {
    throw new Error(`Exchange rate not available for currency: ${toCurrency}`);
  }

  // Convert from GBP base
  let convertedAmount: number;
  
  if (fromCurrency === 'GBP') {
    convertedAmount = amount * rate;
  } else {
    // Convert to GBP first, then to target currency
    const fromRate = EXCHANGE_RATES[fromCurrency as keyof typeof EXCHANGE_RATES];
    if (!fromRate) {
      throw new Error(`Exchange rate not available for currency: ${fromCurrency}`);
    }
    const gbpAmount = amount / fromRate;
    convertedAmount = gbpAmount * rate;
  }

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    convertedCurrency: toCurrency,
    exchangeRate: rate,
    formattedAmount: formatCurrencyAmount(convertedAmount, toCurrency)
  };
}

/**
 * Format currency amount with proper decimals and separators
 */
export function formatCurrencyAmount(amount: number, currency: string): string {
  // Cryptocurrencies and stablecoins - use up to 10 decimal places
  const cryptoCurrencies = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'LINK', 'MATIC', 'LTC'];
  const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];
  
  if (cryptoCurrencies.includes(currency) || stablecoins.includes(currency)) {
    // For crypto: use up to 10 decimal places, remove trailing zeros safely to avoid scientific notation
    const preciseAmount = amount.toFixed(10);
    return preciseAmount.replace(/\.?0+$/, '');
  }
  
  const roundedAmount = Math.round(amount * 100) / 100;
  
  // Currencies that typically don't use decimal places
  const noDecimalCurrencies = ['UGX', 'XAF', 'XOF', 'GNF', 'RWF', 'KES', 'TZS', 'MWK', 'MGA', 'CDF', 'SLL'];
  
  if (noDecimalCurrencies.includes(currency)) {
    return Math.round(roundedAmount).toLocaleString();
  }
  
  return roundedAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    GBP: '£',
    USD: '$',
    EUR: '€',
    UGX: 'UGX',
    GHS: 'GH₵',
    XAF: 'FCFA',
    XOF: 'CFA',
    GNF: 'GNF',
    RWF: 'RWF',
    KES: 'KSh',
    TZS: 'TSh',
    ZMW: 'ZK',
    MWK: 'MK',
    MGA: 'Ar',
    CDF: 'FC',
    SLL: 'Le',
    LRD: 'L$'
  };
  
  return symbols[currency] || currency;
}

/**
 * Validate if currency is supported
 */
export function isSupportedCurrency(currency: string): boolean {
  return currency in EXCHANGE_RATES;
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

/**
 * Convert for Pawapay (with proper minor units)
 */
export function convertForPawapay(
  gbpAmount: number, 
  targetCurrency: string
): { amount: string; minorUnits: number } {
  
  const conversion = convertCurrency(gbpAmount, 'GBP', targetCurrency);
  
  // Currencies that use cents (divide by 100 for minor units)
  const centsCurrencies = ['UGX', 'GHS', 'RWF', 'KES', 'TZS', 'ZMW', 'MWK', 'MGA'];
  
  // Currencies that are already in minor units (no conversion needed)
  const minorUnitCurrencies = ['XAF', 'XOF', 'GNF', 'CDF', 'SLL', 'LRD'];
  
  let minorUnits: number;
  
  if (centsCurrencies.includes(targetCurrency)) {
    minorUnits = Math.round(conversion.convertedAmount * 100);
  } else if (minorUnitCurrencies.includes(targetCurrency)) {
    minorUnits = Math.round(conversion.convertedAmount);
  } else {
    // Default to cents conversion
    minorUnits = Math.round(conversion.convertedAmount * 100);
  }
  
  return {
    amount: minorUnits.toString(),
    minorUnits
  };
}