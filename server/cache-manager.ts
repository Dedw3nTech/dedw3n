/**
 * Advanced Cache Manager
 * Implements multi-layer caching for database queries, API responses, and translations
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, CacheEntry>();
  private statsCache = new Map<string, CacheEntry>();
  private translationCache = new Map<string, CacheEntry>();
  private productCache = new Map<string, CacheEntry>();
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STATS_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly TRANSLATION_TTL = 60 * 60 * 1000; // 1 hour
  private readonly PRODUCT_TTL = 10 * 60 * 1000; // 10 minutes
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private constructor() {
    this.startCleanupInterval();
    console.log('[Cache Manager] Initialized with multi-layer caching');
  }

  private startCleanupInterval() {
    // Clean expired entries every 10 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 10 * 60 * 1000);
  }

  private cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;

    const cleanCache = (cache: Map<string, CacheEntry>) => {
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          cache.delete(key);
          cleaned++;
        }
      }
    };

    cleanCache(this.memoryCache);
    cleanCache(this.statsCache);
    cleanCache(this.translationCache);
    cleanCache(this.productCache);

    if (cleaned > 0) {
      console.log(`[Cache Manager] Cleaned ${cleaned} expired entries`);
    }
  }

  // Generic cache operations
  set(key: string, data: any, ttl = this.DEFAULT_TTL): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  get(key: string): any | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  // Product-specific caching
  setProduct(key: string, data: any): void {
    this.productCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.PRODUCT_TTL,
      hits: 0
    });
  }

  getProduct(key: string): any | null {
    const entry = this.productCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.productCache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  // Translation-specific caching
  setTranslation(key: string, data: any): void {
    this.translationCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.TRANSLATION_TTL,
      hits: 0
    });
  }

  getTranslation(key: string): any | null {
    const entry = this.translationCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.translationCache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  // Statistics caching (longer TTL)
  setStats(key: string, data: any): void {
    this.statsCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.STATS_TTL,
      hits: 0
    });
  }

  getStats(key: string): any | null {
    const entry = this.statsCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.statsCache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  // Cache invalidation
  invalidate(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern);

    const invalidateCache = (cache: Map<string, CacheEntry>) => {
      for (const key of cache.keys()) {
        if (regex.test(key)) {
          cache.delete(key);
          invalidated++;
        }
      }
    };

    invalidateCache(this.memoryCache);
    invalidateCache(this.statsCache);
    invalidateCache(this.translationCache);
    invalidateCache(this.productCache);

    console.log(`[Cache Manager] Invalidated ${invalidated} entries matching pattern: ${pattern}`);
    return invalidated;
  }

  // Cache statistics
  getStats_internal() {
    const getStatsForCache = (cache: Map<string, CacheEntry>, name: string) => {
      const entries = Array.from(cache.values());
      return {
        entries: entries.length,
        totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
        avgHits: entries.length > 0 ? Math.round(entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length) : 0
      };
    };

    return {
      memory: getStatsForCache(this.memoryCache, 'memory'),
      stats: getStatsForCache(this.statsCache, 'stats'),
      translations: getStatsForCache(this.translationCache, 'translations'),
      products: getStatsForCache(this.productCache, 'products'),
      total: this.memoryCache.size + this.statsCache.size + this.translationCache.size + this.productCache.size
    };
  }

  // Clear all caches
  clear(): void {
    this.memoryCache.clear();
    this.statsCache.clear();
    this.translationCache.clear();
    this.productCache.clear();
    console.log('[Cache Manager] All caches cleared');
  }

  // Bulk operations for better performance
  setMany(entries: Array<{key: string, data: any, ttl?: number}>): void {
    entries.forEach(({key, data, ttl}) => {
      this.set(key, data, ttl);
    });
  }

  getMany(keys: string[]): Array<{key: string, data: any | null}> {
    return keys.map(key => ({
      key,
      data: this.get(key)
    }));
  }
}

export const cacheManager = CacheManager.getInstance();