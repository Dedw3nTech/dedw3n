import { cacheManager } from "./cache-manager";
import { performanceMonitor } from "./performance-monitor";
import { cachePerformanceTracker } from "./cache-performance-tracker";

interface CacheOptions {
  ttl?: number;
  category?: 'user' | 'product' | 'content' | 'stats' | 'translation';
  invalidateOn?: string[];
}

class UniversalCacheMiddleware {
  private static instance: UniversalCacheMiddleware;

  static getInstance(): UniversalCacheMiddleware {
    if (!UniversalCacheMiddleware.instance) {
      UniversalCacheMiddleware.instance = new UniversalCacheMiddleware();
    }
    return UniversalCacheMiddleware.instance;
  }

  private constructor() {
    console.log('[Cache Middleware] Initialized universal caching layer');
  }

  async cacheOrFetch<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, category = 'user' } = options;
    
    // Check cache first based on category
    let cached: T | null = null;
    switch (category) {
      case 'user':
        cached = cacheManager.get(cacheKey);
        break;
      case 'product':
        cached = cacheManager.getProduct(cacheKey);
        break;
      case 'stats':
        cached = cacheManager.getStats(cacheKey);
        break;
      case 'translation':
        cached = cacheManager.getTranslation(cacheKey);
        break;
      default:
        cached = cacheManager.get(cacheKey);
    }

    if (cached) {
      cachePerformanceTracker.trackCacheHit(cacheKey);
      return cached;
    }
    
    // Fetch from database with performance tracking
    const start = Date.now();
    try {
      const data = await fetchFunction();
      const duration = Date.now() - start;
      
      // Store in appropriate cache based on category
      switch (category) {
        case 'user':
          cacheManager.set(cacheKey, data, ttl);
          break;
        case 'product':
          cacheManager.setProduct(cacheKey, data);
          break;
        case 'stats':
          cacheManager.setStats(cacheKey, data);
          break;
        case 'translation':
          cacheManager.setTranslation(cacheKey, data);
          break;
        default:
          cacheManager.set(cacheKey, data, ttl);
      }
      
      cachePerformanceTracker.trackCacheMiss(cacheKey);
      performanceMonitor.trackQuery(duration);
      
      return data;
    } catch (error) {
      const duration = Date.now() - start;
      performanceMonitor.trackQuery(duration);
      performanceMonitor.trackError();
      console.error(`[Cache Middleware] Failed to fetch ${cacheKey}:`, error);
      throw error;
    }
  }

  async batchCacheOrFetch<T>(
    requests: Array<{
      cacheKey: string;
      fetchFunction: () => Promise<T>;
      options?: CacheOptions;
    }>
  ): Promise<T[]> {
    const results: T[] = [];
    const uncachedRequests: typeof requests = [];

    // Check cache for all requests first
    for (const request of requests) {
      const { cacheKey, options = {} } = request;
      const { category = 'user' } = options;

      let cached: T | null = null;
      switch (category) {
        case 'user':
          cached = cacheManager.get(cacheKey);
          break;
        case 'product':
          cached = cacheManager.getProduct(cacheKey);
          break;
        case 'stats':
          cached = cacheManager.getStats(cacheKey);
          break;
        case 'translation':
          cached = cacheManager.getTranslation(cacheKey);
          break;
        default:
          cached = cacheManager.get(cacheKey);
      }

      if (cached) {
        performanceMonitor.trackCacheHit(cacheKey);
        results.push(cached);
      } else {
        uncachedRequests.push(request);
      }
    }

    // Fetch uncached data in parallel
    if (uncachedRequests.length > 0) {
      const fetchPromises = uncachedRequests.map(async (request) => {
        return await this.cacheOrFetch(
          request.cacheKey,
          request.fetchFunction,
          request.options
        );
      });

      const fetchedData = await Promise.all(fetchPromises);
      results.push(...fetchedData);
    }

    return results;
  }

  generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  // Time-based cache keys for frequently changing data
  generateTimeBucketKey(prefix: string, bucketMinutes: number = 5): string {
    const now = Date.now();
    const bucket = Math.floor(now / (bucketMinutes * 60 * 1000));
    return `${prefix}:${bucket}`;
  }

  // Cache statistics for monitoring
  getCacheStats() {
    return {
      middleware: 'UniversalCacheMiddleware',
      version: '1.0.0',
      cacheManager: cacheManager.getStats_internal(),
      performance: performanceMonitor.getMetrics()
    };
  }
}

// Performance monitoring extensions
declare module './performance-monitor' {
  interface PerformanceMonitor {
    trackCacheHit(cacheKey: string): void;
    trackCacheMiss(cacheKey: string): void;
  }
}

// Extend performance monitor with cache tracking
const originalPerformanceMonitor = performanceMonitor as any;
originalPerformanceMonitor.cacheHits = new Map<string, number>();
originalPerformanceMonitor.cacheMisses = new Map<string, number>();

originalPerformanceMonitor.trackCacheHit = function(cacheKey: string) {
  const hits = this.cacheHits.get(cacheKey) || 0;
  this.cacheHits.set(cacheKey, hits + 1);
};

originalPerformanceMonitor.trackCacheMiss = function(cacheKey: string) {
  const misses = this.cacheMisses.get(cacheKey) || 0;
  this.cacheMisses.set(cacheKey, misses + 1);
};

export const cacheMiddleware = UniversalCacheMiddleware.getInstance();