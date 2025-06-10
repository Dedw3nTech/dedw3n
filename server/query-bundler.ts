/**
 * Query Bundler - Eliminates N+1 query patterns
 * Batches multiple database operations into single optimized queries
 */

import { cacheManager } from "./cache-manager";
import { performanceMonitor } from "./performance-monitor";
import { db } from "./db";
import { users, products, vendors, categories, messages, notifications } from "@shared/schema";
import { eq, inArray, desc } from "drizzle-orm";

interface BatchRequest {
  type: 'user' | 'product' | 'vendor' | 'category' | 'message' | 'notification';
  ids: number[];
  requestId: string;
}

class QueryBundler {
  private static instance: QueryBundler;
  private pendingRequests = new Map<string, BatchRequest[]>();
  private requestPromises = new Map<string, Promise<any>>();
  private batchDelay = 10; // milliseconds

  static getInstance(): QueryBundler {
    if (!QueryBundler.instance) {
      QueryBundler.instance = new QueryBundler();
    }
    return QueryBundler.instance;
  }

  private constructor() {
    console.log('[Query Bundler] Initialized batch query optimization');
  }

  // Batch user lookups
  async getUsers(ids: number[]): Promise<Map<number, any>> {
    const cacheKey = `batch:users:${ids.sort().join(',')}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) return new Map(cached);

    const result = await performanceMonitor.safeAsyncOperation(
      () => db.select().from(users).where(inArray(users.id, ids)),
      'batchGetUsers'
    );

    if (result) {
      const userMap = new Map(result.map(user => [user.id, user]));
      cacheManager.set(cacheKey, Array.from(userMap.entries()), 5 * 60 * 1000);
      return userMap;
    }
    return new Map();
  }

  // Batch product lookups with vendor data
  async getProductsWithVendors(productIds: number[]): Promise<Map<number, any>> {
    const cacheKey = `batch:products_vendors:${productIds.sort().join(',')}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) return new Map(cached);

    const result = await performanceMonitor.safeAsyncOperation(
      () => db.select({
        product: products,
        vendor: vendors,
        user: users
      })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(inArray(products.id, productIds)),
      'batchGetProductsWithVendors'
    );

    if (result) {
      const productMap = new Map(result.map(item => [
        item.product.id,
        {
          ...item.product,
          vendor: item.vendor ? {
            ...item.vendor,
            user: item.user
          } : null
        }
      ]));
      cacheManager.set(cacheKey, Array.from(productMap.entries()), 10 * 60 * 1000);
      return productMap;
    }
    return new Map();
  }

  // Batch conversation data with user info
  async getConversationsWithUsers(userIds: number[]): Promise<Map<number, any>> {
    const cacheKey = `batch:conversations:${userIds.sort().join(',')}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) return new Map(cached);

    const result = await performanceMonitor.safeAsyncOperation(
      () => db.select({
        message: messages,
        sender: users
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(inArray(messages.senderId, userIds))
      .orderBy(desc(messages.createdAt)),
      'batchGetConversationsWithUsers'
    );

    if (result) {
      const conversationMap = new Map();
      result.forEach(item => {
        if (!conversationMap.has(item.message.senderId)) {
          conversationMap.set(item.message.senderId, []);
        }
        conversationMap.get(item.message.senderId).push({
          ...item.message,
          sender: item.sender
        });
      });
      cacheManager.set(cacheKey, Array.from(conversationMap.entries()), 3 * 60 * 1000);
      return conversationMap;
    }
    return new Map();
  }

  // Batch notification data
  async getNotificationsWithUsers(notificationIds: number[]): Promise<Map<number, any>> {
    const cacheKey = `batch:notifications:${notificationIds.sort().join(',')}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) return new Map(cached);

    const result = await performanceMonitor.safeAsyncOperation(
      () => db.select({
        notification: notifications,
        actor: users
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(inArray(notifications.id, notificationIds))
      .orderBy(desc(notifications.createdAt)),
      'batchGetNotificationsWithUsers'
    );

    if (result) {
      const notificationMap = new Map(result.map(item => [
        item.notification.id,
        {
          ...item.notification,
          actor: item.actor
        }
      ]));
      cacheManager.set(cacheKey, Array.from(notificationMap.entries()), 5 * 60 * 1000);
      return notificationMap;
    }
    return new Map();
  }

  // Generic batch operation with intelligent caching
  async batchOperation<T>(
    operation: () => Promise<T[]>,
    cacheKey: string,
    ttl: number = 5 * 60 * 1000
  ): Promise<T[]> {
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await performanceMonitor.safeAsyncOperation(
      operation,
      `batchOperation:${cacheKey}`
    );

    if (result) {
      cacheManager.set(cacheKey, result, ttl);
      return result;
    }
    return [];
  }

  // Preload related data for dashboard views
  async preloadDashboardData(userId: number): Promise<{
    user: any;
    products: any[];
    orders: any[];
    messages: any[];
    notifications: any[];
  }> {
    const cacheKey = `dashboard:${userId}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    // Execute all queries in parallel
    const [userResult, productsResult, ordersResult, messagesResult, notificationsResult] = await Promise.all([
      this.getUsers([userId]),
      performanceMonitor.safeAsyncOperation(
        () => db.select().from(products).where(eq(products.vendorId, userId)).limit(10),
        'preloadUserProducts'
      ),
      performanceMonitor.safeAsyncOperation(
        () => db.query.orders.findMany({
          where: eq(db.query.orders.userId, userId),
          limit: 10,
          orderBy: desc(db.query.orders.createdAt)
        }),
        'preloadUserOrders'
      ),
      performanceMonitor.safeAsyncOperation(
        () => db.select().from(messages).where(eq(messages.receiverId, userId)).limit(5),
        'preloadUserMessages'
      ),
      performanceMonitor.safeAsyncOperation(
        () => db.select().from(notifications).where(eq(notifications.userId, userId)).limit(5),
        'preloadUserNotifications'
      )
    ]);

    const dashboardData = {
      user: userResult.get(userId) || null,
      products: productsResult || [],
      orders: ordersResult || [],
      messages: messagesResult || [],
      notifications: notificationsResult || []
    };

    // Cache for 2 minutes (dashboard data changes frequently)
    cacheManager.set(cacheKey, dashboardData, 2 * 60 * 1000);
    return dashboardData;
  }

  // Clear related caches when data changes
  invalidateRelatedCaches(type: string, ids: number[]): void {
    const patterns = [
      `batch:${type}:.*`,
      `dashboard:.*`,
      `conversation:.*`,
      `product:.*`
    ];

    patterns.forEach(pattern => {
      cacheManager.invalidate(pattern);
    });

    console.log(`[Query Bundler] Invalidated caches for ${type} with IDs: ${ids.join(',')}`);
  }

  // Get performance statistics
  getStats(): any {
    return {
      pendingRequests: this.pendingRequests.size,
      promiseCache: this.requestPromises.size,
      cacheStats: cacheManager.getStats_internal()
    };
  }
}

export const queryBundler = QueryBundler.getInstance();