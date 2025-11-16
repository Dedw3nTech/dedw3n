import type { Currency } from '../contexts/CurrencyContext';

export interface CryptoPriceResponse {
  [coinId: string]: {
    usd: number;
  };
}

export interface CoinGeckoApiResponse {
  [key: string]: {
    usd: number;
  };
}

// Map of cryptocurrency codes to CoinGecko API IDs
const CRYPTO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  ADA: 'cardano',
  SOL: 'solana',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  MATIC: 'matic-network',
  LTC: 'litecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  BUSD: 'binance-usd',
  DAI: 'dai',
  TUSD: 'true-usd'
};

// Cache for storing fetched prices to avoid excessive API calls
interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

let priceCache: PriceCache = {
  prices: {},
  timestamp: 0,
  ttl: 300000 // 5 minutes
};

/**
 * Fetch cryptocurrency prices from CoinGecko API
 * @param cryptoCodes Array of cryptocurrency codes to fetch prices for
 * @returns Promise resolving to prices in USD
 */
export async function fetchCryptoPrices(cryptoCodes: string[]): Promise<Record<string, number>> {
  // Check cache first
  const now = Date.now();
  if (priceCache.timestamp && (now - priceCache.timestamp) < priceCache.ttl) {
    const cachedPrices: Record<string, number> = {};
    let allCached = true;
    
    for (const code of cryptoCodes) {
      if (priceCache.prices[code]) {
        cachedPrices[code] = priceCache.prices[code];
      } else {
        allCached = false;
        break;
      }
    }
    
    if (allCached) {
      return cachedPrices;
    }
  }

  try {
    // Map crypto codes to CoinGecko IDs
    const coinIds = cryptoCodes
      .map(code => CRYPTO_ID_MAP[code])
      .filter(Boolean)
      .join(',');

    if (!coinIds) {
      throw new Error('No valid cryptocurrency codes provided');
    }

    // Call backend CORS proxy endpoint instead of CoinGecko directly
    const response = await fetch(
      `/api/crypto/prices?currencies=${cryptoCodes.join(',')}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const prices: Record<string, number> = await response.json();

    // Update cache
    priceCache = {
      prices: { ...priceCache.prices, ...prices },
      timestamp: now,
      ttl: priceCache.ttl
    };

    return prices;
  } catch (error) {
    console.error('Failed to fetch cryptocurrency prices:', error);
    
    // Return cached prices if available, or throw error
    if (priceCache.prices && Object.keys(priceCache.prices).length > 0) {
      const cachedPrices: Record<string, number> = {};
      cryptoCodes.forEach(code => {
        if (priceCache.prices[code]) {
          cachedPrices[code] = priceCache.prices[code];
        }
      });
      
      if (Object.keys(cachedPrices).length > 0) {
        console.warn('Using cached cryptocurrency prices due to API error');
        return cachedPrices;
      }
    }
    
    throw error;
  }
}

/**
 * Update cryptocurrency rates in the currency context
 * @param currencies Array of all currencies including cryptocurrencies
 * @returns Promise resolving to updated currencies with fresh rates
 */
export async function updateCryptocurrencyRates(currencies: Currency[]): Promise<Currency[]> {
  // Extract cryptocurrency codes
  const cryptoCodes = currencies
    .filter(currency => ['Cryptocurrencies', 'Stablecoins'].includes(currency.category || ''))
    .map(currency => currency.code);

  if (cryptoCodes.length === 0) {
    return currencies; // No cryptocurrencies to update
  }

  try {
    // Fetch current prices in USD
    const prices = await fetchCryptoPrices(cryptoCodes);

    // Update the currencies array with new rates
    return currencies.map(currency => {
      if (prices[currency.code]) {
        return {
          ...currency,
          rate: prices[currency.code] // USD per unit
        };
      }
      return currency;
    });
  } catch (error) {
    console.error('Failed to update cryptocurrency rates:', error);
    return currencies; // Return original currencies if update fails
  }
}

/**
 * Get the current price of a specific cryptocurrency
 * @param cryptoCode The cryptocurrency code (e.g., 'BTC', 'ETH')
 * @returns Promise resolving to the current USD price
 */
export async function getCryptoPrice(cryptoCode: string): Promise<number> {
  const prices = await fetchCryptoPrices([cryptoCode]);
  const price = prices[cryptoCode];
  
  if (!price) {
    throw new Error(`Price not found for cryptocurrency: ${cryptoCode}`);
  }
  
  return price;
}

/**
 * Clear the price cache (useful for testing or forced refresh)
 */
export function clearPriceCache(): void {
  priceCache = {
    prices: {},
    timestamp: 0,
    ttl: priceCache.ttl
  };
}

/**
 * Set cache TTL (time to live) in milliseconds
 * @param ttl Time to live in milliseconds
 */
export function setCacheTTL(ttl: number): void {
  priceCache.ttl = ttl;
}