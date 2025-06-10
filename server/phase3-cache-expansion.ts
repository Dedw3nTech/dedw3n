/**
 * Phase 3 Cache Expansion - Aggressive Optimization
 * Target: Push from 61.5% to 95% database load reduction
 * Focus: High-frequency routes and complex query operations
 */

import { cacheMiddleware } from "./cache-middleware";
import { cacheInvalidator } from "./cache-invalidator";
import { cachePerformanceTracker } from "./cache-performance-tracker";
import { db } from "./db";
import { users, products, vendors, categories, orders, posts, messages, notifications } from "@shared/schema";
import { eq, desc, sql, and, gte, lte, count, sum, like, inArray } from "drizzle-orm";

class Phase3CacheExpansion {
  private static instance: Phase3CacheExpansion;

  static getInstance(): Phase3CacheExpansion {
    if (!Phase3CacheExpansion.instance) {
      Phase3CacheExpansion.instance = new Phase3CacheExpansion();
    }
    return Phase3CacheExpansion.instance;
  }

  private constructor() {
    console.log('[Phase 3 Cache] Aggressive optimization activated - targeting 95%');
  }

  // Enhanced user authentication caching with longer TTL
  async getCachedUserByUsername(username: string): Promise<any> {
    return await cacheMiddleware.cached(
      `user:username:${username}`,
      async () => {
        const result = await db.select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        return result[0] || null;
      },
      'user',
      60 * 60 * 1000 // 1 hour for authentication data
    );
  }

  // Comprehensive product listing with extended caching
  async getCachedProductListing(filters: any = {}): Promise<any[]> {
    const filterKey = JSON.stringify(filters);
    const cacheKey = `products:listing:${Buffer.from(filterKey).toString('base64')}`;
    
    return await cacheMiddleware.cached(
      cacheKey,
      async () => {
        let query = db.select({
          id: products.id,
          vendorId: products.vendorId,
          name: products.name,
          description: products.description,
          price: products.price,
          category: products.category,
          imageUrl: products.imageUrl,
          isActive: products.isActive,
          averageRating: products.averageRating,
          salesCount: products.salesCount
        }).from(products);

        if (filters.category) {
          query = query.where(eq(products.category, filters.category));
        }
        
        return await query.orderBy(desc(products.createdAt)).limit(50);
      },
      'products',
      25 * 60 * 1000 // 25 minutes
    );
  }

  // Vendor performance metrics caching
  async getCachedVendorMetrics(vendorId: number): Promise<any> {
    return await cacheMiddleware.cached(
      `vendor:metrics:${vendorId}`,
      async () => {
        const [productCount, orderCount, totalRevenue] = await Promise.all([
          db.select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.vendorId, vendorId)),
          db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(eq(orders.vendorId, vendorId)),
          db.select({ total: sql<number>`sum(${orders.totalAmount})` })
            .from(orders)
            .where(eq(orders.vendorId, vendorId))
        ]);

        return {
          productCount: productCount[0]?.count || 0,
          orderCount: orderCount[0]?.count || 0,
          totalRevenue: totalRevenue[0]?.total || 0,
          lastUpdated: new Date()
        };
      },
      'vendor',
      40 * 60 * 1000 // 40 minutes
    );
  }

  // Category-based product aggregations
  async getCachedCategoryProducts(category: string): Promise<any[]> {
    return await cacheMiddleware.cached(
      `category:products:${category}`,
      async () => {
        return await db.select()
          .from(products)
          .where(and(
            eq(products.category, category),
            eq(products.isActive, true)
          ))
          .orderBy(desc(products.salesCount))
          .limit(30);
      },
      'products',
      35 * 60 * 1000 // 35 minutes
    );
  }

  // User notification counts with aggressive caching
  async getCachedNotificationCounts(userId: number): Promise<any> {
    return await cacheMiddleware.cached(
      `notifications:counts:${userId}`,
      async () => {
        const result = await db.select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          ));
        return { unreadCount: result[0]?.count || 0 };
      },
      'notifications',
      5 * 60 * 1000 // 5 minutes for notifications
    );
  }

  // Featured products with extended TTL
  async getCachedFeaturedProducts(): Promise<any[]> {
    return await cacheMiddleware.cached(
      'products:featured',
      async () => {
        return await db.select()
          .from(products)
          .where(and(
            eq(products.isActive, true),
            gte(products.featuredUntil, new Date())
          ))
          .orderBy(desc(products.featuredUntil))
          .limit(20);
      },
      'products',
      2 * 60 * 60 * 1000 // 2 hours for featured products
    );
  }

  // Order history with pagination caching
  async getCachedUserOrders(userId: number, page: number = 1): Promise<any[]> {
    const offset = (page - 1) * 20;
    return await cacheMiddleware.cached(
      `orders:user:${userId}:page:${page}`,
      async () => {
        return await db.select()
          .from(orders)
          .where(eq(orders.userId, userId))
          .orderBy(desc(orders.createdAt))
          .limit(20)
          .offset(offset);
      },
      'orders',
      15 * 60 * 1000 // 15 minutes
    );
  }

  // Product search results with intelligent caching
  async getCachedProductSearch(searchTerm: string, limit: number = 20): Promise<any[]> {
    const normalizedTerm = searchTerm.toLowerCase().trim();
    return await cacheMiddleware.cached(
      `search:products:${normalizedTerm}:${limit}`,
      async () => {
        return await db.select()
          .from(products)
          .where(and(
            like(products.name, `%${normalizedTerm}%`),
            eq(products.isActive, true)
          ))
          .orderBy(desc(products.salesCount))
          .limit(limit);
      },
      'search',
      30 * 60 * 1000 // 30 minutes for search results
    );
  }

  // Message thread caching
  async getCachedMessageThread(userId1: number, userId2: number): Promise<any[]> {
    const threadKey = [userId1, userId2].sort().join(':');
    return await cacheMiddleware.cached(
      `messages:thread:${threadKey}`,
      async () => {
        return await db.select()
          .from(messages)
          .where(and(
            sql`(${messages.senderId} = ${userId1} AND ${messages.receiverId} = ${userId2}) OR (${messages.senderId} = ${userId2} AND ${messages.receiverId} = ${userId1})`
          ))
          .orderBy(desc(messages.createdAt))
          .limit(50);
      },
      'messages',
      10 * 60 * 1000 // 10 minutes
    );
  }

  // Dashboard analytics with extended caching
  async getCachedDashboardAnalytics(): Promise<any> {
    return await cacheMiddleware.cached(
      'analytics:dashboard',
      async () => {
        const [userCount, productCount, orderCount, revenueSum] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(users),
          db.select({ count: sql<number>`count(*)` }).from(products),
          db.select({ count: sql<number>`count(*)` }).from(orders),
          db.select({ total: sql<number>`sum(${orders.totalAmount})` }).from(orders)
        ]);

        return {
          users: userCount[0]?.count || 0,
          products: productCount[0]?.count || 0,
          orders: orderCount[0]?.count || 0,
          revenue: revenueSum[0]?.total || 0,
          timestamp: new Date()
        };
      },
      'analytics',
      45 * 60 * 1000 // 45 minutes for dashboard
    );
  }

  // Trending products calculation
  async getCachedTrendingProducts(): Promise<any[]> {
    return await cacheMiddleware.cached(
      'products:trending',
      async () => {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        return await db.select({
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          salesCount: products.salesCount,
          averageRating: products.averageRating
        })
        .from(products)
        .where(and(
          eq(products.isActive, true),
          gte(products.createdAt, last7Days)
        ))
        .orderBy(desc(products.salesCount))
        .limit(15);
      },
      'products',
      60 * 60 * 1000 // 1 hour for trending
    );
  }

  // User activity summary caching
  async getCachedUserActivity(userId: number): Promise<any> {
    return await cacheMiddleware.cached(
      `user:activity:summary:${userId}`,
      async () => {
        const [posts, orders, messages] = await Promise.all([
          db.select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(eq(posts.userId, userId)),
          db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(eq(orders.userId, userId)),
          db.select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(eq(messages.senderId, userId))
        ]);

        return {
          postsCount: posts[0]?.count || 0,
          ordersCount: orders[0]?.count || 0,
          messagesCount: messages[0]?.count || 0,
          lastActive: new Date()
        };
      },
      'user',
      30 * 60 * 1000 // 30 minutes
    );
  }

  // Performance tracking for Phase 3
  getPhase3Stats() {
    const metrics = cachePerformanceTracker.getMetrics();
    const progress = cachePerformanceTracker.getProgressToTarget(95);
    
    return {
      phase: 'Phase 3 - Aggressive Optimization',
      currentPerformance: metrics.databaseLoadReduction,
      targetProgress: progress.progress,
      implementedOptimizations: [
        'Extended user authentication caching',
        'Comprehensive product listing optimization',
        'Vendor metrics aggregation caching',
        'Category-based product caching',
        'Enhanced notification counting',
        'Featured products extended TTL',
        'Paginated order history caching',
        'Intelligent search result caching',
        'Message thread optimization',
        'Dashboard analytics consolidation',
        'Trending products calculation',
        'User activity summary caching'
      ],
      nextTarget: '95% database load reduction'
    };
  }

  // Batch invalidation for Phase 3 optimizations
  invalidatePhase3Caches(type: 'user' | 'product' | 'order' | 'message' | 'all', id?: number) {
    switch (type) {
      case 'user':
        if (id) {
          cacheInvalidator.invalidateUser(id);
        }
        break;
      case 'product':
        if (id) {
          cacheInvalidator.invalidateProduct(id);
        }
        cacheInvalidator.invalidateGlobal('trending');
        break;
      case 'order':
        if (id) {
          cacheInvalidator.invalidateOrder(id);
        }
        cacheInvalidator.invalidateGlobal('stats');
        break;
      case 'message':
        // Message invalidation handled by existing system
        break;
      case 'all':
        cacheInvalidator.invalidateGlobal('all');
        break;
    }
    
    console.log(`[Phase 3 Cache] Invalidated ${type} caches`);
  }
}

export const phase3CacheExpansion = Phase3CacheExpansion.getInstance();