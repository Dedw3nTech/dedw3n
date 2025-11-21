import type { Request, Response } from "express";
import { storage } from "./storage";
import { highRiskActionMiddleware } from "./fraud-prevention";

export interface CryptoPaymentRequest {
  amount: number;
  currency: string; // BTC, ETH, etc.
  orderId: string;
  walletAddress: string;
  metadata?: Record<string, any>;
}

export interface CryptoPaymentResponse {
  paymentId: string;
  walletAddress: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInCrypto: number;
  qrCode?: string;
  expiresAt: Date;
}

/**
 * Create a cryptocurrency payment request
 */
export async function createCryptoPayment(req: Request, res: Response) {
  try {
    const { amount, currency, orderId, metadata = {} }: CryptoPaymentRequest = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    if (!currency) {
      return res.status(400).json({ error: "Cryptocurrency currency is required" });
    }

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Validate cryptocurrency currency
    const supportedCrypto = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'LINK', 'MATIC', 'LTC', 'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];
    if (!supportedCrypto.includes(currency.toUpperCase())) {
      return res.status(400).json({ error: `Unsupported cryptocurrency: ${currency}` });
    }

    // Get current exchange rate (you would normally call a crypto price API here)
    const exchangeRate = await getCryptoExchangeRate(currency.toUpperCase());
    const amountInCrypto = amount / exchangeRate;

    // Generate payment ID
    const paymentId = `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate a wallet address (in production, this would be a real wallet address)
    const walletAddress = generateWalletAddress(currency.toUpperCase());

    // Set expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store payment request in database/storage
    const paymentData = {
      paymentId,
      orderId,
      amount,
      currency: currency.toUpperCase(),
      exchangeRate,
      amountInCrypto,
      walletAddress,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
      metadata
    };

    // TODO: Store in database
    // await storage.createCryptoPayment(paymentData);

    const response: CryptoPaymentResponse = {
      paymentId,
      walletAddress,
      amount,
      currency: currency.toUpperCase(),
      exchangeRate,
      amountInCrypto,
      expiresAt
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error creating crypto payment:', error);
    res.status(500).json({
      error: error.message || 'Failed to create cryptocurrency payment'
    });
  }
}

/**
 * Check cryptocurrency payment status
 */
export async function checkCryptoPaymentStatus(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ error: "Payment ID is required" });
    }

    // TODO: Retrieve payment from database
    // const payment = await storage.getCryptoPayment(paymentId);
    
    // For now, simulate payment status check
    const mockPayment = {
      paymentId,
      status: 'pending', // pending, confirmed, failed, expired
      confirmations: 0,
      requiredConfirmations: 3,
      transactionHash: null,
      updatedAt: new Date()
    };

    res.json(mockPayment);
  } catch (error: any) {
    console.error('Error checking crypto payment status:', error);
    res.status(500).json({
      error: error.message || 'Failed to check payment status'
    });
  }
}

/**
 * Webhook endpoint for cryptocurrency payment confirmations
 */
export async function handleCryptoPaymentWebhook(req: Request, res: Response) {
  try {
    const { paymentId, transactionHash, confirmations, status } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: "Payment ID is required" });
    }

    // TODO: Verify webhook authenticity
    // TODO: Update payment status in database
    // await storage.updateCryptoPaymentStatus(paymentId, { status, transactionHash, confirmations });

    // If payment is confirmed, update order status
    if (status === 'confirmed') {
      // TODO: Update order status
      // const payment = await storage.getCryptoPayment(paymentId);
      // await storage.updateOrderStatus(payment.orderId, 'paid');
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error handling crypto payment webhook:', error);
    res.status(500).json({
      error: error.message || 'Failed to process webhook'
    });
  }
}

/**
 * PRODUCTION-OPTIMIZED Cache for crypto exchange rates
 * Format: { currency: { price: number, timestamp: number } }
 */
const cryptoPriceCache: Record<string, { price: number; timestamp: number }> = {};

/**
 * Multi-tier caching strategy to handle API rate limits gracefully
 * Increased durations to reduce API calls and prevent 429 errors
 */
const CACHE_TIERS = {
  FRESH: 10 * 60 * 1000,       // 10 minutes - Always use if available (FRESH data)
  ACCEPTABLE: 30 * 60 * 1000,  // 30 minutes - Use if API fails (STALE but acceptable)  
  FALLBACK: 120 * 60 * 1000,   // 120 minutes - Emergency fallback (VERY STALE)
};

/**
 * Circuit breaker pattern to prevent hammering the API when experiencing issues
 */
let apiFailureCount = 0;
let circuitBreakerOpen = false;
let circuitBreakerResetTime = 0;
const MAX_FAILURES_BEFORE_CIRCUIT_BREAK = 3;
const CIRCUIT_BREAKER_COOLDOWN = 10 * 60 * 1000; // 10 minute cooldown (increased for better recovery)

/**
 * Aggressive rate limiting tracker to prevent 429 errors
 * CoinGecko free tier allows ~10-50 calls/minute, so we space them out
 */
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 5000; // 5 seconds minimum between API calls to avoid rate limits

/**
 * PRODUCTION-OPTIMIZED cryptocurrency exchange rate function with circuit breaker and multi-tier caching
 */
async function getCryptoExchangeRate(currency: string): Promise<number> {
  try {
    const cached = cryptoPriceCache[currency];
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
    
    // TIER 1: Use fresh cache (< 5 minutes)
    if (cached && cacheAge < CACHE_TIERS.FRESH) {
      return cached.price;
    }
    
    // Check circuit breaker before attempting API call
    if (circuitBreakerOpen) {
      const now = Date.now();
      if (now < circuitBreakerResetTime) {
        console.warn(`[CRYPTO-API] Circuit breaker OPEN, using cached/fallback data for ${currency}`);
        
        // Use acceptable stale cache if available
        if (cached && cacheAge < CACHE_TIERS.ACCEPTABLE) {
          console.log(`[CRYPTO-API] Using ACCEPTABLE cached rate for ${currency} (${Math.floor(cacheAge / 1000)}s old)`);
          return cached.price;
        }
        
        // Use very stale cache as last resort
        if (cached && cacheAge < CACHE_TIERS.FALLBACK) {
          console.warn(`[CRYPTO-API] Using FALLBACK cached rate for ${currency} (${Math.floor(cacheAge / 60000)}min old)`);
          return cached.price;
        }
        
        // No cache available, use hardcoded fallback
        return getFallbackRate(currency);
      } else {
        // Circuit breaker cooldown expired, reset it
        console.log(`[CRYPTO-API] Circuit breaker reset, attempting API calls again`);
        circuitBreakerOpen = false;
        apiFailureCount = 0;
      }
    }

    // Map of cryptocurrency codes to CoinGecko API IDs
    const cryptoIdMap: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      BNB: 'binancecoin',
      ADA: 'cardano',
      SOL: 'solana',
      DOT: 'polkadot',
      AVAX: 'avalanche-2',
      LINK: 'chainlink',
      MATIC: 'polygon-ecosystem-token',
      LTC: 'litecoin',
      USDT: 'tether',
      USDC: 'usd-coin',
      BUSD: 'binance-usd',
      DAI: 'dai',
      TUSD: 'true-usd'
    };

    const coinId = cryptoIdMap[currency];
    if (!coinId) {
      throw new Error(`Unsupported cryptocurrency: ${currency}`);
    }

    // Aggressive rate limiting: wait if we called the API too recently
    const timeSinceLastCall = Date.now() - lastApiCallTime;
    if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_API_CALL_INTERVAL - timeSinceLastCall));
    }

    // Call CoinGecko API with timeout
    lastApiCallTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Dedw3n-Marketplace/1.0'
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const price = data[coinId]?.usd;

    if (!price) {
      throw new Error(`Price not found for cryptocurrency: ${currency}`);
    }

    // SUCCESS: Reset failure counter and cache the fresh price
    apiFailureCount = 0;
    cryptoPriceCache[currency] = {
      price,
      timestamp: Date.now()
    };

    return price;
  } catch (error: any) {
    // API call failed, increment failure counter
    apiFailureCount++;
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error(`[CRYPTO-API] Error fetching rate for ${currency} (failure ${apiFailureCount}/${MAX_FAILURES_BEFORE_CIRCUIT_BREAK}): ${errorDetails}`, error);
    
    // Open circuit breaker if too many failures
    if (apiFailureCount >= MAX_FAILURES_BEFORE_CIRCUIT_BREAK) {
      circuitBreakerOpen = true;
      circuitBreakerResetTime = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
      console.error(`[CRYPTO-API] Circuit breaker OPENED due to ${apiFailureCount} failures. Cooldown until ${new Date(circuitBreakerResetTime).toISOString()}`);
    }
    
    // TIER 2: Try acceptable stale cache (< 15 minutes)
    const cached = cryptoPriceCache[currency];
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
    
    if (cached && cacheAge < CACHE_TIERS.ACCEPTABLE) {
      console.log(`[CRYPTO-API] Using ACCEPTABLE stale rate for ${currency} (${Math.floor(cacheAge / 1000)}s old)`);
      return cached.price;
    }
    
    // TIER 3: Try fallback stale cache (< 60 minutes)
    if (cached && cacheAge < CACHE_TIERS.FALLBACK) {
      console.warn(`[CRYPTO-API] Using FALLBACK stale rate for ${currency} (${Math.floor(cacheAge / 60000)}min old)`);
      return cached.price;
    }
    
    // TIER 4: Use hardcoded fallback rates as last resort
    console.error(`[CRYPTO-API] No cache available, using hardcoded fallback rate for ${currency}`);
    return getFallbackRate(currency);
  }
}

/**
 * Get hardcoded fallback rates for when API is unavailable
 */
function getFallbackRate(currency: string): number {
  const fallbackRates: Record<string, number> = {
    BTC: 40000.0,
    ETH: 2680.0,
    BNB: 596.0,
    ADA: 0.536,
    SOL: 134.0,
    DOT: 7.14,
    AVAX: 35.5,
    LINK: 14.3,
    MATIC: 0.416,
    LTC: 83.5,
    USDT: 1.0,
    USDC: 1.0,
    BUSD: 1.0,
    DAI: 1.0,
    TUSD: 1.0
  };
  
  console.warn(`[CRYPTO-API] Using hardcoded fallback rate for ${currency}`);
  return fallbackRates[currency] || 1.0;
}

/**
 * Generate a mock wallet address for testing
 */
function generateWalletAddress(currency: string): string {
  // Mock wallet addresses - in production, these would be real wallet addresses
  const addressFormats: Record<string, string> = {
    BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    ETH: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8',
    BNB: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
    ADA: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj0vs2qd4a6gtmvenaqhz9s2x3k',
    SOL: '11111111111111111111111111111112',
    DOT: '13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB',
    AVAX: 'X-avax1zrks9fgv0vffs6pn7thpvvy8w5a6qe8qmyqzce',
    LINK: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8',
    MATIC: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8',
    LTC: 'LTC1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    USDT: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8',
    USDC: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8',
    BUSD: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8',
    DAI: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8',
    TUSD: '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8'
  };

  return addressFormats[currency] || '0x742d35Cc6C7D78A5c8dB2B8c6b7A8C8A5C8dB2B8';
}

/**
 * Batch fetch cryptocurrency prices from CoinGecko (single API call for all currencies)
 */
async function batchFetchCryptoPrices(currencies: string[]): Promise<Record<string, number>> {
  const cryptoIdMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    ADA: 'cardano',
    SOL: 'solana',
    DOT: 'polkadot',
    AVAX: 'avalanche-2',
    LINK: 'chainlink',
    MATIC: 'polygon-ecosystem-token',
    LTC: 'litecoin',
    USDT: 'tether',
    USDC: 'usd-coin',
    BUSD: 'binance-usd',
    DAI: 'dai',
    TUSD: 'true-usd'
  };

  const coinIds = currencies.map(c => cryptoIdMap[c]).filter(Boolean);
  if (coinIds.length === 0) {
    return {};
  }

  try {
    // Single API call with all coin IDs (comma-separated)
    const timeSinceLastCall = Date.now() - lastApiCallTime;
    if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_API_CALL_INTERVAL - timeSinceLastCall));
    }

    lastApiCallTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Dedw3n-Marketplace/1.0'
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`CoinGecko API returned non-JSON content type: ${contentType}`);
    }

    const data = await response.json();
    const prices: Record<string, number> = {};

    // Map CoinGecko IDs back to currency symbols
    for (const currency of currencies) {
      const coinId = cryptoIdMap[currency];
      if (coinId && data[coinId]?.usd) {
        prices[currency] = data[coinId].usd;
        // Cache the result
        cryptoPriceCache[currency] = {
          price: data[coinId].usd,
          timestamp: Date.now()
        };
      }
    }

    // Reset failure count on success
    apiFailureCount = 0;
    return prices;
  } catch (error) {
    apiFailureCount++;
    console.error(`[CRYPTO-API] Batch fetch failed (failure ${apiFailureCount}/${MAX_FAILURES_BEFORE_CIRCUIT_BREAK}):`, error);
    
    if (apiFailureCount >= MAX_FAILURES_BEFORE_CIRCUIT_BREAK) {
      circuitBreakerOpen = true;
      circuitBreakerResetTime = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
      console.error(`[CRYPTO-API] Circuit breaker OPENED. Cooldown until ${new Date(circuitBreakerResetTime).toISOString()}`);
    }
    
    return {};
  }
}

/**
 * Backend endpoint to fetch cryptocurrency prices (CORS proxy)
 */
export async function fetchCryptoPricesAPI(req: Request, res: Response) {
  try {
    const { currencies } = req.query;
    
    if (!currencies || typeof currencies !== 'string') {
      return res.status(400).json({ error: "Currencies parameter is required" });
    }

    const currencyList = currencies.split(',').map(c => c.toUpperCase());
    const prices: Record<string, number> = {};

    // Check circuit breaker
    if (circuitBreakerOpen) {
      if (Date.now() < circuitBreakerResetTime) {
        console.log('[CRYPTO-API] Circuit breaker OPEN, using cached/fallback data');
        // Return all cached or fallback prices
        for (const currency of currencyList) {
          const cached = cryptoPriceCache[currency];
          prices[currency] = cached ? cached.price : getFallbackRate(currency);
        }
        return res.json(prices);
      } else {
        // Reset circuit breaker
        circuitBreakerOpen = false;
        apiFailureCount = 0;
        console.log('[CRYPTO-API] Circuit breaker RESET');
      }
    }

    // Check cache for all currencies (extended cache to 5 minutes for better performance)
    const EXTENDED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    const uncachedCurrencies: string[] = [];
    
    for (const currency of currencyList) {
      const cached = cryptoPriceCache[currency];
      if (cached && (Date.now() - cached.timestamp) < EXTENDED_CACHE_TTL) {
        prices[currency] = cached.price;
      } else {
        uncachedCurrencies.push(currency);
      }
    }

    // Batch fetch uncached currencies in a single API call
    if (uncachedCurrencies.length > 0) {
      const freshPrices = await batchFetchCryptoPrices(uncachedCurrencies);
      Object.assign(prices, freshPrices);
      
      // For currencies that failed to fetch, use fallback
      for (const currency of uncachedCurrencies) {
        if (!prices[currency]) {
          const cached = cryptoPriceCache[currency];
          prices[currency] = cached ? cached.price : getFallbackRate(currency);
        }
      }
    }

    res.json(prices);
  } catch (error: any) {
    console.error('Error fetching crypto prices via API:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch cryptocurrency prices'
    });
  }
}

/**
 * Register cryptocurrency payment routes
 */
export function registerCryptoPaymentRoutes(app: any) {
  // CORS proxy for cryptocurrency prices
  app.get("/api/crypto/prices", fetchCryptoPricesAPI);
  
  // Create crypto payment
  app.post("/api/crypto/create-payment", highRiskActionMiddleware, createCryptoPayment);
  
  // Check payment status
  app.get("/api/crypto/payment/:paymentId", checkCryptoPaymentStatus);
  
  // Webhook endpoint for payment confirmations
  app.post("/api/crypto/webhook", handleCryptoPaymentWebhook);
}