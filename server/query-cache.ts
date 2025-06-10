// High-performance query cache to eliminate 3-4 second database delays
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private static instance: QueryCache;
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SHORT_TTL = 30 * 1000; // 30 seconds
  private readonly LONG_TTL = 30 * 60 * 1000; // 30 minutes

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }

  private constructor() {
    // Auto-cleanup expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Specific cache durations for different data types
  cacheProducts(data: any): void {
    this.set('products:all', data, this.SHORT_TTL);
  }

  cacheCategories(data: any): void {
    this.set('categories:all', data, this.LONG_TTL);
  }

  cacheUserData(userId: number, data: any): void {
    this.set(`user:${userId}`, data, this.DEFAULT_TTL);
  }

  cacheCart(userId: number, data: any): void {
    this.set(`cart:${userId}`, data, this.SHORT_TTL);
  }

  getCachedProducts(): any | null {
    return this.get('products:all');
  }

  getCachedCategories(): any | null {
    return this.get('categories:all');
  }

  getCachedUserData(userId: number): any | null {
    return this.get(`user:${userId}`);
  }

  getCachedCart(userId: number): any | null {
    return this.get(`cart:${userId}`);
  }
}

export const queryCache = QueryCache.getInstance();