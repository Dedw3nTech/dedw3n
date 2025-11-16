import { cacheService, CACHE_TTL } from './cache-service';
import type { IStorage } from './storage';

export class CacheWarmup {
  constructor(private storage: IStorage) {}

  async warmCriticalData(): Promise<void> {
    console.log('[Cache Warmup] Starting cache warmup for critical data...');
    
    try {
      const [categories, products] = await Promise.all([
        this.storage.listCategories(),
        this.storage.listProducts()
      ]);
      
      cacheService.set('categories:all', categories, CACHE_TTL.CATEGORIES);
      console.log(`[Cache Warmup] Warmed ${categories.length} categories`);
      
      const featured = products.slice(0, 20);
      cacheService.set('products:featured', featured, CACHE_TTL.PRODUCTS);
      console.log(`[Cache Warmup] Warmed ${featured.length} featured products`);
      
      const popular = products.slice(0, 50);
      cacheService.set('products:popular', popular, CACHE_TTL.PRODUCTS);
      console.log(`[Cache Warmup] Warmed ${popular.length} popular products`);
      
      console.log('[Cache Warmup] Cache warmup completed successfully');
    } catch (error) {
      console.error('[Cache Warmup] Error during cache warmup:', error);
    }
  }

  private async warmCategories(): Promise<void> {
    try {
      const categories = await this.storage.listCategories();
      cacheService.set('categories:all', categories, CACHE_TTL.CATEGORIES);
      console.log(`[Cache Warmup] Warmed ${categories.length} categories`);
    } catch (error) {
      console.error('[Cache Warmup] Failed to warm categories:', error);
    }
  }

  private async warmProducts(): Promise<void> {
    try {
      const products = await this.storage.listProducts();
      
      const featured = products.slice(0, 20);
      cacheService.set('products:featured', featured, CACHE_TTL.PRODUCTS);
      console.log(`[Cache Warmup] Warmed ${featured.length} featured products`);
      
      const popular = products.slice(0, 50);
      cacheService.set('products:popular', popular, CACHE_TTL.PRODUCTS);
      console.log(`[Cache Warmup] Warmed ${popular.length} popular products`);
    } catch (error) {
      console.error('[Cache Warmup] Failed to warm products:', error);
    }
  }

  async refreshCache(key: string): Promise<boolean> {
    console.log(`[Cache Warmup] Refreshing cache for key: ${key}`);
    
    try {
      switch (key) {
        case 'categories':
          await this.warmCategories();
          return true;
        case 'products':
        case 'featured':
        case 'popular':
          await this.warmProducts();
          return true;
        case 'all':
          await this.warmCriticalData();
          return true;
        default:
          console.warn(`[Cache Warmup] Unknown cache key: ${key}`);
          return false;
      }
    } catch (error) {
      console.error(`[Cache Warmup] Error refreshing cache for ${key}:`, error);
      return false;
    }
  }
}

export function createCacheWarmup(storage: IStorage): CacheWarmup {
  return new CacheWarmup(storage);
}
