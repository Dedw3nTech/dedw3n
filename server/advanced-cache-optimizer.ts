/**
 * Advanced Cache Optimizer - Phase 2 Implementation
 * Comprehensive caching for analytics, user operations, and high-frequency queries
 * Target: 95% database load reduction
 */

import { cacheMiddleware } from "./cache-middleware";
import { cacheInvalidator } from "./cache-invalidator";
import { cachePerformanceTracker } from "./cache-performance-tracker";
import { db } from "./db";
import { users, products, vendors, categories, orders, posts, messages } from "@shared/schema";
import { eq, desc, sql, and, gte, lte, count, sum } from "drizzle-orm";

class AdvancedCacheOptimizer {
  private static instance: AdvancedCacheOptimizer;

  static getInstance(): AdvancedCacheOptimizer {
    if (!AdvancedCacheOptimizer.instance) {
      AdvancedCacheOptimizer.instance = new AdvancedCacheOptimizer();
    }
    return AdvancedCacheOptimizer.instance;
  }

  private constructor() {
    console.log('[Advanced Cache] Phase 2 optimization initialized');
  }

  // Analytics caching with 30-minute TTL for admin dashboard
  async getCachedUserCount(): Promise<number> {
    return await cacheMiddleware.cached(
      'analytics:user_count',
      async () => {
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        return result[0]?.count || 0;
      },
      'analytics',
      30 * 60 * 1000
    );
  }

  async getCachedProductCount(): Promise<number> {
    return await cacheMiddleware.cached(
      'analytics:product_count',
      async () => {
        const result = await db.select({ count: sql<number>`count(*)` }).from(products);
        return result[0]?.count || 0;
      },
      'analytics',
      30 * 60 * 1000
    );
  }

  async getCachedOrderCount(): Promise<number> {
    return await cacheMiddleware.cached(
      'analytics:order_count',
      async () => {
        const result = await db.select({ count: sql<number>`count(*)` }).from(orders);
        return result[0]?.count || 0;
      },
      'analytics',
      30 * 60 * 1000
    );
  }

  async getCachedVendorCount(): Promise<number> {
    return await cacheMiddleware.cached(
      'analytics:vendor_count',
      async () => {
        const result = await db.select({ count: sql<number>`count(*)` }).from(vendors);
        return result[0]?.count || 0;
      },
      'analytics',
      30 * 60 * 1000
    );
  }

  // Category-based caching for products
  async getCachedProductsByCategory(category: string, limit: number = 20): Promise<any[]> {
    return await cacheMiddleware.cached(
      `products:category:${category}:${limit}`,
      async () => {
        return await db.select()
          .from(products)
          .where(eq(products.category, category))
          .orderBy(desc(products.createdAt))
          .limit(limit);
      },
      'products',
      20 * 60 * 1000 // 20 minutes
    );
  }

  // User profile caching with extended TTL
  async getCachedUserProfile(userId: number): Promise<any> {
    return await cacheMiddleware.cached(
      `user:profile:${userId}`,
      async () => {
        const result = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        return result[0] || null;
      },
      'user',
      45 * 60 * 1000 // 45 minutes for user profiles
    );
  }

  // Vendor data caching
  async getCachedVendorData(vendorId: number): Promise<any> {
    return await cacheMiddleware.cached(
      `vendor:data:${vendorId}`,
      async () => {
        const result = await db.select()
          .from(vendors)
          .where(eq(vendors.id, vendorId))
          .limit(1);
        return result[0] || null;
      },
      'vendor',
      25 * 60 * 1000 // 25 minutes
    );
  }

  // Recent orders caching for dashboard
  async getCachedRecentOrders(limit: number = 10): Promise<any[]> {
    return await cacheMiddleware.cached(
      `orders:recent:${limit}`,
      async () => {
        return await db.select()
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(limit);
      },
      'orders',
      10 * 60 * 1000 // 10 minutes
    );
  }

  // Popular products with extended caching
  async getCachedPopularProducts(limit: number = 20): Promise<any[]> {
    return await cacheMiddleware.cached(
      `products:popular:${limit}`,
      async () => {
        return await db.select()
          .from(products)
          .orderBy(desc(products.salesCount))
          .limit(limit);
      },
      'products',
      60 * 60 * 1000 // 1 hour for popular products
    );
  }

  // Category statistics caching
  async getCachedCategoryStats(): Promise<any[]> {
    return await cacheMiddleware.cached(
      'analytics:category_stats',
      async () => {
        return await db.select({
          category: products.category,
          count: sql<number>`count(*)`,
          avgPrice: sql<number>`avg(${products.price})`
        })
        .from(products)
        .groupBy(products.category)
        .orderBy(desc(sql<number>`count(*)`));
      },
      'analytics',
      45 * 60 * 1000 // 45 minutes
    );
  }

  // Revenue analytics caching
  async getCachedTotalRevenue(): Promise<number> {
    return await cacheMiddleware.cached(
      'analytics:total_revenue',
      async () => {
        const result = await db.select({ 
          total: sql<number>`sum(${orders.totalAmount})` 
        }).from(orders);
        return result[0]?.total || 0;
      },
      'analytics',
      30 * 60 * 1000
    );
  }

  // Search results caching
  async getCachedSearchResults(query: string, limit: number = 20): Promise<any[]> {
    const normalizedQuery = query.toLowerCase().trim();
    return await cacheMiddleware.cached(
      `search:${normalizedQuery}:${limit}`,
      async () => {
        return await db.select()
          .from(products)
          .where(sql`LOWER(${products.name}) LIKE ${'%' + normalizedQuery + '%'}`)
          .orderBy(desc(products.salesCount))
          .limit(limit);
      },
      'search',
      15 * 60 * 1000 // 15 minutes for search results
    );
  }

  // User activity stats caching
  async getCachedUserActivityStats(userId: number): Promise<any> {
    return await cacheMiddleware.cached(
      `user:activity:${userId}`,
      async () => {
        const [postCount, orderCount] = await Promise.all([
          db.select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(eq(posts.userId, userId)),
          db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(eq(orders.userId, userId))
        ]);
        
        return {
          posts: postCount[0]?.count || 0,
          orders: orderCount[0]?.count || 0,
          lastActivity: new Date()
        };
      },
      'user',
      20 * 60 * 1000 // 20 minutes
    );
  }

  // Batch invalidation for complex operations
  invalidateAnalytics() {
    cacheInvalidator.invalidateGlobal('stats');
    console.log('[Advanced Cache] Analytics cache invalidated');
  }

  invalidateProductCaches(productId?: number) {
    if (productId) {
      cacheInvalidator.invalidateProduct(productId);
    }
    cacheInvalidator.invalidateGlobal('popular');
    console.log('[Advanced Cache] Product caches invalidated');
  }

  invalidateUserCaches(userId: number) {
    cacheInvalidator.invalidateUser(userId);
    console.log(`[Advanced Cache] User ${userId} caches invalidated`);
  }

  // Performance monitoring
  getOptimizationStats() {
    const metrics = cachePerformanceTracker.getMetrics();
    const progress = cachePerformanceTracker.getProgressToTarget(95);
    
    return {
      currentPerformance: metrics.databaseLoadReduction,
      targetProgress: progress.progress,
      optimization: 'Phase 2 Advanced Caching',
      cacheHitRate: metrics.hitRate,
      totalRequests: metrics.totalRequests
    };
  }
}

export const advancedCacheOptimizer = AdvancedCacheOptimizer.getInstance();