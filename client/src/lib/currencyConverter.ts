export type CurrencyCode = 
  // Major Global Currencies
  'GBP' | 'EUR' | 'USD' | 'CNY' | 'INR' | 'BRL' | 'JMD' | 'AUD' |
  // East Asia & Pacific
  'JPY' | 'KRW' | 'SGD' | 'HKD' | 'TWD' | 'THB' | 'MYR' | 'IDR' | 'VND' | 'PHP' | 'NZD' | 'FJD' |
  // Europe
  'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'BGN' | 'HRK' | 'RUB' | 'TRY' | 'ISK' | 'ALL' |
  // Americas
  'CAD' | 'MXN' | 'PEN' | 'CLP' | 'UYU' | 'PYG' | 'VES' | 'ARS' | 'BOB' | 'CRC' | 'COP' | 'HTG' | 'DOP' | 'SRD' |
  // Africa
  'RWF' | 'XOF' | 'SLL' | 'UGX' | 'ZMW' | 'GHS' | 'XAF' | 'GNF' | 'KES' | 'TZS' | 'MWK' | 'MGA' | 'CDF' | 'LRD' | 
  'NGN' | 'ZAR' | 'EGP' | 'DZD' | 'MAD' | 'AOA' |
  // Middle East & South Asia
  'AED' | 'SAR' | 'ILS' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'LBP' | 'IRR' | 'AFN' | 'PKR' | 'BDT' | 
  'MVR' | 'LKR' | 'NPR';

// List of supported currencies with regional grouping
export const supportedCurrencies: CurrencyCode[] = [
  // Major Global (Popular)
  'GBP', 'EUR', 'USD', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF',
  // Europe
  'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'ISK', 'ALL',
  // East Asia & Pacific
  'KRW', 'SGD', 'HKD', 'TWD', 'THB', 'MYR', 'IDR', 'VND', 'PHP', 'NZD', 'FJD',
  // Americas
  'BRL', 'MXN', 'CAD', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'VES', 'BOB', 'CRC', 'JMD', 'HTG', 'DOP', 'SRD',
  // Africa
  'ZAR', 'NGN', 'EGP', 'MAD', 'DZD', 'AOA', 'GHS', 'KES', 'UGX', 'TZS', 'RWF', 'ZMW', 'MWK', 'XOF', 'XAF', 'GNF', 'MGA', 'CDF', 'SLL', 'LRD',
  // Middle East & South Asia
  'AED', 'SAR', 'ILS', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'IRR', 'AFN', 'INR', 'PKR', 'BDT', 'MVR', 'LKR', 'NPR'
];

// Symbol lookup for different currencies
export const currencySymbols: Record<CurrencyCode, string> = {
  // Major Global Currencies
  GBP: '£',
  EUR: '€',
  USD: '$',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  JMD: 'J$',
  AUD: 'A$',
  
  // East Asia & Pacific
  JPY: '¥',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  VND: '₫',
  PHP: '₱',
  NZD: 'NZ$',
  FJD: 'FJ$',
  
  // Europe
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  HRK: 'kn',
  RUB: '₽',
  TRY: '₺',
  ISK: 'kr',
  ALL: 'L',
  
  // Americas
  CAD: 'C$',
  MXN: '$',
  PEN: 'S/',
  CLP: '$',
  UYU: '$',
  PYG: '₲',
  VES: 'Bs',
  ARS: '$',
  BOB: 'Bs',
  CRC: '₡',
  COP: '$',
  HTG: 'G',
  DOP: '$',
  SRD: '$',
  
  // Africa
  RWF: 'RWF',
  XOF: 'CFA',
  SLL: 'Le',
  UGX: 'UGX',
  ZMW: 'ZK',
  GHS: 'GH₵',
  XAF: 'FCFA',
  GNF: 'GNF',
  KES: 'KSh',
  TZS: 'TSh',
  MWK: 'MK',
  MGA: 'Ar',
  CDF: 'FC',
  LRD: 'L$',
  NGN: '₦',
  ZAR: 'R',
  EGP: '£',
  DZD: 'د.ج',
  MAD: 'د.م.',
  AOA: 'Kz',
  
  // Middle East & South Asia
  AED: 'د.إ',
  SAR: '﷼',
  ILS: '₪',
  QAR: 'ر.ق',
  KWD: 'د.ك',
  BHD: '.د.ب',
  OMR: 'ر.ع.',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  IRR: '﷼',
  AFN: '؋',
  PKR: '₨',
  BDT: '৳',
  MVR: 'Rf',
  LKR: 'Rs',
  NPR: 'Rs',
};

// Exchange rates with GBP as the base currency (Updated 2025)
// These rates would ideally come from a real-time API in production
export const exchangeRates: Record<CurrencyCode, number> = {
  // Major Global Currencies
  GBP: 1.0,        // Base currency
  EUR: 1.18,       // 1 GBP = 1.18 EUR
  USD: 1.27,       // 1 GBP = 1.27 USD
  CNY: 9.15,       // 1 GBP = 9.15 CNY
  INR: 105.43,     // 1 GBP = 105.43 INR
  BRL: 6.85,       // 1 GBP = 6.85 BRL
  JMD: 195.50,     // 1 GBP = 195.50 JMD
  AUD: 1.92,       // 1 GBP = 1.92 AUD
  
  // East Asia & Pacific
  JPY: 190.45,     // 1 GBP = 190.45 JPY
  KRW: 1685.30,    // 1 GBP = 1685.30 KRW
  SGD: 1.72,       // 1 GBP = 1.72 SGD
  HKD: 9.95,       // 1 GBP = 9.95 HKD
  TWD: 40.85,      // 1 GBP = 40.85 TWD
  THB: 45.20,      // 1 GBP = 45.20 THB
  MYR: 5.95,       // 1 GBP = 5.95 MYR
  IDR: 19650.00,   // 1 GBP = 19650 IDR
  VND: 31250.00,   // 1 GBP = 31250 VND
  PHP: 72.15,      // 1 GBP = 72.15 PHP
  NZD: 2.08,       // 1 GBP = 2.08 NZD
  FJD: 2.85,       // 1 GBP = 2.85 FJD
  
  // Europe
  CHF: 1.14,       // 1 GBP = 1.14 CHF
  SEK: 13.85,      // 1 GBP = 13.85 SEK
  NOK: 14.20,      // 1 GBP = 14.20 NOK
  DKK: 8.75,       // 1 GBP = 8.75 DKK
  PLN: 5.15,       // 1 GBP = 5.15 PLN
  CZK: 29.40,      // 1 GBP = 29.40 CZK
  HUF: 465.80,     // 1 GBP = 465.80 HUF
  RON: 5.85,       // 1 GBP = 5.85 RON
  BGN: 2.30,       // 1 GBP = 2.30 BGN
  HRK: 8.85,       // 1 GBP = 8.85 HRK
  RUB: 118.75,     // 1 GBP = 118.75 RUB
  TRY: 42.15,      // 1 GBP = 42.15 TRY
  ISK: 175.40,     // 1 GBP = 175.40 ISK
  ALL: 114.25,     // 1 GBP = 114.25 ALL
  
  // Americas
  CAD: 1.73,       // 1 GBP = 1.73 CAD
  MXN: 25.45,      // 1 GBP = 25.45 MXN
  PEN: 4.85,       // 1 GBP = 4.85 PEN
  CLP: 1205.60,    // 1 GBP = 1205.60 CLP
  UYU: 54.25,      // 1 GBP = 54.25 UYU
  PYG: 9145.00,    // 1 GBP = 9145 PYG
  VES: 46.85,      // 1 GBP = 46.85 VES
  ARS: 1285.40,    // 1 GBP = 1285.40 ARS
  BOB: 8.75,       // 1 GBP = 8.75 BOB
  CRC: 654.20,     // 1 GBP = 654.20 CRC
  COP: 5285.00,    // 1 GBP = 5285 COP
  HTG: 168.50,     // 1 GBP = 168.50 HTG
  DOP: 76.40,      // 1 GBP = 76.40 DOP
  SRD: 45.85,      // 1 GBP = 45.85 SRD
  
  // Africa
  RWF: 1420.75,    // 1 GBP = 1420.75 RWF
  XOF: 774.25,     // 1 GBP = 774.25 XOF
  SLL: 30590.00,   // 1 GBP = 30590 SLL
  UGX: 4650.50,    // 1 GBP = 4650.50 UGX
  ZMW: 27.85,      // 1 GBP = 27.85 ZMW
  GHS: 15.80,      // 1 GBP = 15.80 GHS
  XAF: 774.25,     // 1 GBP = 774.25 XAF
  GNF: 10850.00,   // 1 GBP = 10850 GNF
  KES: 162.30,     // 1 GBP = 162.30 KES
  TZS: 2985.40,    // 1 GBP = 2985.40 TZS
  MWK: 1735.60,    // 1 GBP = 1735.60 MWK
  MGA: 5780.25,    // 1 GBP = 5780.25 MGA
  CDF: 3650.80,    // 1 GBP = 3650.80 CDF
  LRD: 245.60,     // 1 GBP = 245.60 LRD
  NGN: 1985.40,    // 1 GBP = 1985.40 NGN
  ZAR: 23.45,      // 1 GBP = 23.45 ZAR
  EGP: 62.35,      // 1 GBP = 62.35 EGP
  DZD: 170.25,     // 1 GBP = 170.25 DZD
  MAD: 12.85,      // 1 GBP = 12.85 MAD
  AOA: 1085.40,    // 1 GBP = 1085.40 AOA
  
  // Middle East & South Asia
  AED: 4.68,       // 1 GBP = 4.68 AED
  SAR: 4.78,       // 1 GBP = 4.78 SAR
  ILS: 4.68,       // 1 GBP = 4.68 ILS
  QAR: 4.65,       // 1 GBP = 4.65 QAR
  KWD: 0.385,      // 1 GBP = 0.385 KWD
  BHD: 0.48,       // 1 GBP = 0.48 BHD
  OMR: 0.49,       // 1 GBP = 0.49 OMR
  JOD: 0.90,       // 1 GBP = 0.90 JOD
  LBP: 1925.00,    // 1 GBP = 1925 LBP
  IRR: 53750.00,   // 1 GBP = 53750 IRR
  AFN: 88.50,      // 1 GBP = 88.50 AFN
  PKR: 352.80,     // 1 GBP = 352.80 PKR
  BDT: 152.40,     // 1 GBP = 152.40 BDT
  MVR: 19.65,      // 1 GBP = 19.65 MVR
  LKR: 385.40,     // 1 GBP = 385.40 LKR
  NPR: 167.10,     // 1 GBP = 167.10 NPR
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
  const currencyLocales: Record<CurrencyCode, string> = {
    GBP: "en-GB",
    EUR: "de-DE",
    USD: "en-US",
    CNY: "zh-CN",
    INR: "hi-IN",
    BRL: "pt-BR",
    JMD: "en-JM",
    AUD: "en-AU",
  };
  
  const locale = currencyLocales[currencyCode] || "en-GB";
  
  // Format with appropriate currency locale
  const formattedAmount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
  
  // Optionally include the currency code if not already included in the format
  return includeCode ? `${formattedAmount} ${currencyCode}` : formattedAmount;
}

/**
 * Format price in specified currency, converting from GBP if needed
 * @param amount The amount in GBP to convert and format
 * @param currencyCode The target currency code to display
 * @returns Formatted currency string after conversion
 */
export function formatPriceWithCurrency(
  amount: number,
  currencyCode: CurrencyCode
): string {
  // Convert the amount from GBP to target currency if needed
  const convertedAmount = convertCurrency(amount, 'GBP', currencyCode);
  
  // Format with appropriate currency locale
  return formatCurrency(convertedAmount, currencyCode);
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
    JMD: 'J$',
    AUD: 'A$',
  };

  return `1 ${symbols[fromCurrency]} = ${rate.toFixed(4)} ${symbols[toCurrency]}`;
}