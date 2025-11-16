interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now()
    });
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.accessCount++;
    entry.lastAccess = now;
    this.cache.set(key, entry);
    this.stats.hits++;
    
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deletePattern(pattern: RegExp): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 10000) / 100
    };
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }
  
  warmCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
    return this.getOrFetch(key, fetchFn, ttl);
  }
}

export const cacheService = new CacheService(1000);

const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const cleared = cacheService.clearExpired();
  if (cleared > 0) {
    console.log(`[Cache Service] Cleared ${cleared} expired entries`);
  }
}, CLEANUP_INTERVAL);

export const CACHE_TTL = {
  GEOLOCATION: 24 * 60 * 60 * 1000,
  CRYPTO_PRICES: 5 * 60 * 1000,
  USER_LANGUAGE: 10 * 60 * 1000,
  SUBSCRIPTION_STATUS: 5 * 60 * 1000,
  UNREAD_COUNTS: 30 * 1000,
  PRODUCTS: 5 * 60 * 1000,
  CATEGORIES: 30 * 60 * 1000,
  USER_PROFILE: 10 * 60 * 1000,
  CART: 2 * 60 * 1000,
  ORDERS: 5 * 60 * 1000,
  SHORT: 30 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 60 * 60 * 1000,
  VERY_LONG: 24 * 60 * 60 * 1000
};

export interface CacheInvalidationPattern {
  pattern: RegExp;
  relatedKeys?: string[];
}

export const CACHE_INVALIDATION_PATTERNS = {
  PRODUCT_UPDATE: /^products:/,
  USER_UPDATE: /^user:\d+/,
  CART_UPDATE: /^cart:\d+/,
  ORDER_UPDATE: /^orders:/,
  CATEGORY_UPDATE: /^categories:/
};
