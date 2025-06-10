import { cacheManager } from "./cache-manager";

class CacheInvalidator {
  private static instance: CacheInvalidator;

  static getInstance(): CacheInvalidator {
    if (!CacheInvalidator.instance) {
      CacheInvalidator.instance = new CacheInvalidator();
    }
    return CacheInvalidator.instance;
  }

  private constructor() {
    console.log('[Cache Invalidator] Initialized smart cache invalidation system');
  }

  // User data invalidation
  invalidateUser(userId: number) {
    const patterns = [
      `user:${userId}`,
      `notifications:${userId}`,
      `messages:${userId}`,
      `conversations:${userId}`,
      `vendor:${userId}`,
      `dashboard:${userId}`,
      `feed:${userId}:.*`,
      `following:${userId}`,
      `stats:${userId}`,
      `unread:.*:${userId}`
    ];

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] User ${userId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Product data invalidation
  invalidateProduct(productId: number, vendorId?: number) {
    const patterns = [
      `product:${productId}`,
      `trending:products`,
      `popular:products`,
      `products:category:.*`,
      `products:search:.*`
    ];

    if (vendorId) {
      patterns.push(
        `vendor:${vendorId}:products`,
        `vendor:${vendorId}:stats`,
        `dashboard:${vendorId}`
      );
    }

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Product ${productId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Post/content invalidation
  invalidatePost(postId: number, userId: number) {
    const patterns = [
      `post:${postId}`,
      `feed:.*`,
      `posts:user:${userId}`,
      `trending:posts`,
      `popular:posts`,
      `comments:${postId}`
    ];

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Post ${postId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Message invalidation
  invalidateMessage(senderId: number, receiverId: number) {
    const patterns = [
      `conversations:${senderId}`,
      `conversations:${receiverId}`,
      `messages:${senderId}:${receiverId}`,
      `messages:${receiverId}:${senderId}`,
      `unread:messages:${receiverId}`,
      `unread:count:${receiverId}`
    ];

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Message between ${senderId}-${receiverId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Notification invalidation
  invalidateNotification(userId: number) {
    const patterns = [
      `notifications:${userId}`,
      `unread:notifications:${userId}`,
      `notification:count:${userId}`
    ];

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Notifications for user ${userId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Order invalidation
  invalidateOrder(userId: number, vendorId?: number) {
    const patterns = [
      `orders:${userId}`,
      `order:notifications:${userId}`,
      `stats:${userId}`
    ];

    if (vendorId) {
      patterns.push(
        `vendor:${vendorId}:orders`,
        `vendor:${vendorId}:stats`,
        `revenue:${vendorId}`
      );
    }

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Order for user ${userId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Vendor invalidation
  invalidateVendor(vendorId: number, userId: number) {
    const patterns = [
      `vendor:${vendorId}`,
      `vendor:${userId}:.*`,
      `products:vendor:${vendorId}`,
      `stats:vendor:${vendorId}`,
      `revenue:vendor:${vendorId}`,
      `orders:vendor:${vendorId}`,
      `dashboard:${userId}`
    ];

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Vendor ${vendorId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Community invalidation
  invalidateCommunity(communityId: number) {
    const patterns = [
      `community:${communityId}`,
      `community:${communityId}:posts`,
      `community:${communityId}:members`,
      `communities:popular`,
      `communities:trending`
    ];

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Community ${communityId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Category invalidation
  invalidateCategory(categoryId: number) {
    const patterns = [
      `category:${categoryId}`,
      `products:category:${categoryId}`,
      `trending:category:${categoryId}`,
      `categories:all`
    ];

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Category ${categoryId}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Bulk invalidation for global changes
  invalidateGlobal(type: 'trending' | 'popular' | 'stats' | 'all') {
    let patterns: string[] = [];

    switch (type) {
      case 'trending':
        patterns = ['trending:.*', 'popular:.*'];
        break;
      case 'popular':
        patterns = ['popular:.*', 'top:.*'];
        break;
      case 'stats':
        patterns = ['stats:.*', 'analytics:.*', 'revenue:.*'];
        break;
      case 'all':
        cacheManager.clear();
        console.log('[Cache Invalidator] Cleared all caches');
        return;
    }

    let invalidated = 0;
    patterns.forEach(pattern => {
      invalidated += cacheManager.invalidate(pattern);
    });

    console.log(`[Cache Invalidator] Global ${type}: invalidated ${invalidated} entries`);
    return invalidated;
  }

  // Time-based invalidation for scheduled cleanup
  invalidateExpired() {
    // This is handled by CacheManager's cleanup interval
    // But we can trigger it manually if needed
    console.log('[Cache Invalidator] Triggering manual cleanup of expired entries');
  }

  // Get invalidation statistics
  getStats() {
    return {
      cacheSize: cacheManager.getStats_internal().total,
      lastInvalidation: new Date().toISOString()
    };
  }
}

export const cacheInvalidator = CacheInvalidator.getInstance();