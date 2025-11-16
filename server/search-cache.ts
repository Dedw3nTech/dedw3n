interface CachedSearchResult {
  results: any[];
  timestamp: number;
  query: string;
  language: string;
  totalResults: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class SearchCacheService {
  private cache: Map<string, CachedSearchResult>;
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from search parameters
   */
  private getCacheKey(query: string, language: string, marketplace: string = 'all'): string {
    return `${query.toLowerCase().trim()}:${language.toUpperCase()}:${marketplace}`;
  }

  /**
   * Get cached search results if available and not expired
   */
  getCachedResults(query: string, language: string, marketplace: string = 'all'): any[] | null {
    const cacheKey = this.getCacheKey(query, language, marketplace);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Check if cache is still valid
    const isExpired = (Date.now() - cached.timestamp) > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    console.log(`[SearchCache] Cache HIT for query: "${query}" (${language})`);
    return cached.results;
  }

  /**
   * Cache search results
   */
  cacheSearchResults(
    query: string, 
    language: string, 
    results: any[], 
    marketplace: string = 'all'
  ): void {
    const cacheKey = this.getCacheKey(query, language, marketplace);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now(),
      query,
      language,
      totalResults: results.length
    });

    console.log(`[SearchCache] Cached ${results.length} results for: "${query}" (${language})`);
  }

  /**
   * Invalidate cache entries for a specific product
   */
  invalidateProductCache(productId: number): void {
    let invalidatedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      const hasProduct = value.results.some((r: any) => r.id === productId);
      if (hasProduct) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      console.log(`[SearchCache] Invalidated ${invalidatedCount} cache entries for product ${productId}`);
    }
  }

  /**
   * Invalidate all cache entries matching a query pattern
   */
  invalidateByPattern(pattern: string): void {
    let invalidatedCount = 0;
    const lowerPattern = pattern.toLowerCase();

    for (const [key, value] of this.cache.entries()) {
      if (value.query.toLowerCase().includes(lowerPattern)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    console.log(`[SearchCache] Invalidated ${invalidatedCount} cache entries matching pattern: "${pattern}"`);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[SearchCache] Cleared all ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  /**
   * Periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, value] of this.cache.entries()) {
        if ((now - value.timestamp) > this.CACHE_TTL) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`[SearchCache] Cleaned ${cleanedCount} expired cache entries`);
      }
    }, 60000); // Run every minute
  }

  /**
   * Pre-warm cache with popular queries
   */
  async prewarmCache(popularQueries: string[], language: string = 'EN'): Promise<void> {
    console.log(`[SearchCache] Pre-warming cache with ${popularQueries.length} popular queries`);
    // This would be called with actual search results from a pre-warming service
  }
}

// Export singleton instance
export const searchCacheService = new SearchCacheService();
