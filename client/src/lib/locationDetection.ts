interface LocationInfo {
  country: string;
  countryCode: string;
  currency: string;
  language: string;
}

// Map of country codes to currencies
const countryCurrencyMap: Record<string, string> = {
  // Europe
  'GB': 'GBP', // United Kingdom - British Pound
  'DE': 'EUR', // Germany - Euro
  'FR': 'EUR', // France - Euro
  'IT': 'EUR', // Italy - Euro
  'ES': 'EUR', // Spain - Euro
  
  // Americas
  'US': 'USD', // United States - US Dollar
  'CA': 'CAD', // Canada - Canadian Dollar
  'BR': 'BRL', // Brazil - Brazilian Real
  'MX': 'MXN', // Mexico - Mexican Peso
  
  // Asia
  'CN': 'CNY', // China - Chinese Yuan
  'IN': 'INR', // India - Indian Rupee
  'JP': 'JPY', // Japan - Japanese Yen
  'KR': 'KRW', // South Korea - Korean Won
  
  // Default
  'DEFAULT': 'GBP', // Default to GBP
};

// Only English is supported
export const supportedLanguages = ['en'];

// Currencies supported by our application
export const supportedCurrencies = ['GBP', 'EUR', 'USD', 'CNY', 'INR', 'BRL'];

export async function detectUserLocation(): Promise<LocationInfo> {
  try {
    // Use a geolocation API service to get the user's location
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error('Failed to detect location');
    }
    
    const data = await response.json();
    const countryCode = data.country_code;
    const country = data.country_name;
    
    // Get currency for the detected country or use default
    const currency = countryCurrencyMap[countryCode] || countryCurrencyMap.DEFAULT;
    
    // English only
    const language = 'en';
    
    return {
      country,
      countryCode,
      currency,
      language,
    };
  } catch (error) {
    console.error('Error detecting location:', error);
    
    // Return default values if location detection fails
    return {
      country: 'United Kingdom',
      countryCode: 'GB',
      currency: 'GBP',
      language: 'en',
    };
  }
}

// Always return English
export function getBrowserLanguage(): string {
  return 'en';
}

// Always return English
export function getUserPreferredLanguage(): string {
  return 'en';
}

// Save English only
export function saveUserLanguage(language: string): void {
  localStorage.setItem('userLanguage', 'en');
}

// Save the user's currency preference to localStorage
export function saveUserCurrency(currency: string): void {
  localStorage.setItem('userCurrency', currency);
}

// Get the user's preferred currency from localStorage
export function getUserPreferredCurrency(): string {
  return localStorage.getItem('userCurrency') || 'GBP';
}