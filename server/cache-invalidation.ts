import { cacheService, CACHE_INVALIDATION_PATTERNS } from './cache-service';
import { invalidateHttpCache } from './http-cache-middleware';
import { queryCache } from './query-cache';

export class CacheInvalidator {
  static invalidateProduct(productId?: number): void {
    if (productId) {
      cacheService.delete(`products:${productId}`);
      queryCache.delete(`product:${productId}`);
      invalidateHttpCache(`products/${productId}`);
    }
    
    cacheService.deletePattern(CACHE_INVALIDATION_PATTERNS.PRODUCT_UPDATE);
    cacheService.delete('products:all');
    cacheService.delete('products:popular');
    cacheService.delete('products:trending');
    cacheService.delete('products:featured');
    
    queryCache.delete('products:all');
    queryCache.delete('products:featured');
    queryCache.delete('products:popular');
    
    invalidateHttpCache('products');
    
    console.log(`[Cache Invalidation] Product cache invalidated${productId ? ` for ID ${productId}` : ''}`);
  }

  static invalidateUser(userId: number): void {
    cacheService.delete(`user:${userId}`);
    cacheService.delete(`user:${userId}:profile`);
    cacheService.delete(`user:${userId}:stats`);
    
    queryCache.delete(`user:${userId}`);
    
    invalidateHttpCache(`users/${userId}`);
    invalidateHttpCache(`profile/${userId}`);
    
    console.log(`[Cache Invalidation] User cache invalidated for ID ${userId}`);
  }

  static invalidateCart(userId: number): void {
    cacheService.delete(`cart:${userId}`);
    cacheService.delete(`cart:${userId}:count`);
    
    queryCache.delete(`cart:${userId}`);
    
    invalidateHttpCache(`cart`);
    
    console.log(`[Cache Invalidation] Cart cache invalidated for user ${userId}`);
  }

  static invalidateOrder(orderId?: number, userId?: number): void {
    if (orderId) {
      cacheService.delete(`orders:${orderId}`);
      invalidateHttpCache(`orders/${orderId}`);
    }
    
    if (userId) {
      cacheService.deletePattern(new RegExp(`^orders:user:${userId}`));
      invalidateHttpCache(`users/${userId}/orders`);
    }
    
    cacheService.deletePattern(CACHE_INVALIDATION_PATTERNS.ORDER_UPDATE);
    
    console.log(`[Cache Invalidation] Order cache invalidated`);
  }

  static invalidateCategory(categoryId?: number): void {
    if (categoryId) {
      cacheService.delete(`categories:${categoryId}`);
      queryCache.delete(`category:${categoryId}`);
    }
    
    cacheService.deletePattern(CACHE_INVALIDATION_PATTERNS.CATEGORY_UPDATE);
    cacheService.delete('categories:all');
    
    queryCache.delete('categories:all');
    
    invalidateHttpCache('categories');
    
    console.log(`[Cache Invalidation] Category cache invalidated${categoryId ? ` for ID ${categoryId}` : ''}`);
  }

  static invalidatePost(postId?: number, userId?: number): void {
    if (postId) {
      cacheService.delete(`posts:${postId}`);
      invalidateHttpCache(`posts/${postId}`);
    }
    
    if (userId) {
      cacheService.deletePattern(new RegExp(`^posts:user:${userId}`));
    }
    
    cacheService.delete('posts:feed');
    cacheService.delete('posts:trending');
    
    invalidateHttpCache('feed');
    invalidateHttpCache('posts');
    
    console.log(`[Cache Invalidation] Post cache invalidated`);
  }

  static invalidateVendor(vendorId: number): void {
    cacheService.delete(`vendor:${vendorId}`);
    cacheService.deletePattern(new RegExp(`^vendor:${vendorId}:`));
    
    invalidateHttpCache(`vendors/${vendorId}`);
    
    console.log(`[Cache Invalidation] Vendor cache invalidated for ID ${vendorId}`);
  }

  static invalidateAll(): void {
    cacheService.clear();
    queryCache.clear();
    console.log('[Cache Invalidation] All caches cleared');
  }

  static invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    cacheService.deletePattern(regex);
    console.log(`[Cache Invalidation] Caches invalidated for pattern: ${pattern}`);
  }
}

export function cacheWarmup() {
  console.log('[Cache Warmup] Starting cache warmup...');
}
