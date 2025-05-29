import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, like, and, or, desc, asc, sql, count, inArray, lte } from "drizzle-orm";

import {
  users, vendors, products, categories, posts, comments,
  likes, messages, notifications, notificationSettings, reviews, carts,
  wallets, transactions, orders, orderItems, communities,
  communityMembers, membershipTiers, memberships, events,
  eventRegistrations, polls, pollVotes, creatorEarnings, subscriptions,
  videos, videoEngagements, videoAnalytics, videoPlaylists, playlistItems,
  videoPurchases, videoProductOverlays, communityContents, authTokens, follows,
  allowList, blockList, flaggedContent, flaggedImages, moderationReports,
  callSessions, callMetadata, connections, userSessions, trafficAnalytics, savedPosts,
  likedProducts, friendRequests,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type Product, type InsertProduct, type Category, type InsertCategory,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Message, type InsertMessage, type Review, type InsertReview,
  type Cart, type InsertCart, type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Community, type InsertCommunity,
  type Connection, type InsertConnection, type Notification, type InsertNotification,
  type NotificationSettings, type InsertNotificationSettings,
  type LikedProduct, type InsertLikedProduct
} from "@shared/schema";

// Import the messages helpers from our separate module
import * as messageHelpers from './messages';

// Interface for all storage operations
export interface IStorage {
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getUserMessages(userId: number): Promise<Message[]>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getUserConversations(userId: number): Promise<any[]>;
  getConversations(userId: number): Promise<any[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  markMessagesAsRead(currentUserId: number, otherUserId: number): Promise<void>;
  updateMessageContent(id: number, newContent: string): Promise<Message | undefined>;
  searchUserMessages(userId: number, query: string): Promise<any[]>;
  clearConversation(userId1: number, userId2: number): Promise<boolean>;
  getUserMessagingStats(userId: number): Promise<any>;
  deleteMessage(id: number, userId?: number): Promise<boolean>;
  
  // Call operations
  createCallSession(callData: any): Promise<any>;
  updateCallSession(id: number, updateData: any): Promise<any>;
  getUserCallHistory(userId: number, limit?: number): Promise<any[]>;
  getUserCallStats(userId: number): Promise<any>;
  
  // Subscription operations
  getUserSubscription(userId: number): Promise<any | null>;
  createOrUpdateSubscription(subscriptionData: any): Promise<any>;
  
  // Notification operations
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  getNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  getNotificationSettings(userId: number): Promise<NotificationSettings[]>;
  updateNotificationSetting(userId: number, type: string, channel: string, enabled: boolean): Promise<NotificationSettings | undefined>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // User connection operations
  connectUsers(userId1: number, userId2: number): Promise<boolean>;
  disconnectUsers(userId1: number, userId2: number): Promise<boolean>;
  checkConnection(userId1: number, userId2: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
  
  // Follow operations
  followUser(followerId: number, followingId: number): Promise<boolean>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  checkIfUserFollows(followerId: number, followingId: number): Promise<boolean>;
  
  // User social stats
  getUserPostCount(userId: number): Promise<number>;
  getFollowersCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  getUserPosts(userId: number, limit?: number, offset?: number): Promise<Post[]>;
  getFollowers(userId: number, limit?: number, offset?: number): Promise<User[]>;
  getFollowing(userId: number, limit?: number, offset?: number): Promise<User[]>;
  getUserStats(userId: number): Promise<{ postCount: number, followerCount: number, followingCount: number }>;
  
  // Category operations
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  listCategories(): Promise<Category[]>;
  
  // Vendor operations
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendors(limit?: number): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  
  // Product operations
  listProducts(): Promise<Product[]>;
  getProducts(): Promise<Product[]>;
  getPopularProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getTopSellingProducts(limit: number): Promise<any[]>;
  
  // Cart operations
  countCartItems(userId: number): Promise<number>;
  addToCart(cartItem: InsertCart): Promise<Cart>;
  listCartItems(userId: number): Promise<(Cart & { product: Product })[]>;
  getCartItem(id: number): Promise<(Cart & { product: Product }) | undefined>;
  updateCartItem(id: number, update: Partial<Cart>): Promise<(Cart & { product: Product }) | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  incrementPostView(id: number): Promise<boolean>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  getFeedPosts(userId?: number, sortBy?: string, limit?: number, offset?: number): Promise<Post[]>;
  getTrendingPosts(limit?: number): Promise<Post[]>;
  getPopularTags(limit?: number): Promise<{ tag: string, count: number }[]>;
  getSuggestedUsers(limit?: number, currentUserId?: number): Promise<User[]>;
  getAllPostsPaginated(limit: number, offset: number): Promise<(Post & { user: { id: number; username: string; name: string; avatar: string | null }; _count: { likes: number; comments: number; shares: number }; isLiked: boolean; isShared: boolean })[]>;
  getTotalPostsCount(): Promise<number>;
  getPostsByRegion(userId: number, limit: number, offset: number): Promise<Post[]>;
  getPostsByCountry(userId: number, limit: number, offset: number): Promise<Post[]>;
  
  // Like operations
  likePost(postId: number, userId: number): Promise<boolean>;
  unlikePost(postId: number, userId: number): Promise<boolean>;
  checkIfUserLikedPost(postId: number, userId: number): Promise<boolean>;
  getPostLikes(postId: number): Promise<any[]>;
  getPostLike(postId: number, userId: number): Promise<any | undefined>;
  
  // Saved posts operations
  savePost(postId: number, userId: number): Promise<void>;
  unsavePost(postId: number, userId: number): Promise<boolean>;
  checkSavedPost(postId: number, userId: number): Promise<boolean>;
  getSavedPosts(userId: number, options: { limit: number, offset: number }): Promise<Post[]>;
  
  // Liked products operations
  likeProduct(userId: number, productId: number): Promise<LikedProduct>;
  unlikeProduct(userId: number, productId: number): Promise<boolean>;
  checkProductLiked(userId: number, productId: number): Promise<boolean>;
  getUserLikedProducts(userId: number): Promise<Product[]>;
  
  // Friend request operations
  createFriendRequest(request: { senderId: number, recipientId: number, message: string }): Promise<any>;
  getFriendRequest(senderId: number, recipientId: number): Promise<any>;
  getFriendRequests(userId: number): Promise<any[]>;
  acceptFriendRequest(requestId: number, userId: number): Promise<void>;
  rejectFriendRequest(requestId: number, userId: number): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: number, limit?: number, offset?: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;
  getComment(id: number): Promise<Comment | undefined>;
  updateComment(id: number, content: string): Promise<Comment | undefined>;
  
  // Post promotion operations
  promotePost(postId: number, endDate: Date): Promise<Post | undefined>;
  unpromotePost(postId: number): Promise<Post | undefined>;
  
  // Admin analytics operations
  getUserCount(): Promise<number>;
  getProductCount(): Promise<number>;
  getOrderCount(): Promise<number>;
  getCommunityCount(): Promise<number>;
  getUserCommunities(userId: number): Promise<any[]>;
  countPosts(options: any): Promise<number>;
  
  // Order analytics
  countOrders(options: any): Promise<number>;
  calculateTotalRevenue(): Promise<number>;
  calculateAverageOrderValue(): Promise<number>;
  
  // Product analytics
  getTopSellingProducts(limit: number): Promise<any[]>;
  getProductPerformanceMetrics(timeRange: string): Promise<any>;
  getCategoryTrendsData(): Promise<any>;
  getRevenueByCategory(timeRange: string): Promise<any>;
  getInventoryAlerts(): Promise<any[]>;
  
  // Admin analytics
  getUserRegistrationTrends(timeRange: string): Promise<any>;
  getActiveUserStats(timeRange: string): Promise<any>;
  getSalesData(timeRange: string): Promise<any>;
  getProductCategoryDistribution(): Promise<any>;
  getTrafficSourcesData(timeRange: string): Promise<any>;
  
  // Order operations
  getOrder(id: number): Promise<any>;
  updateOrder(id: number, updates: any): Promise<any>;
  updateOrderItemsStatus(orderId: number, status: string): Promise<boolean>;
  deleteUser(userId: number): Promise<boolean>;
  resetUserPassword(userId: number, newPassword: string): Promise<boolean>;
  listPosts(options: any): Promise<any[]>;
  
  // Auth token operations
  getAuthToken(token: string): Promise<any | undefined>;
  createAuthToken(tokenData: any): Promise<any>;
  revokeAuthToken(id: number, reason?: string): Promise<boolean>;
  updateTokenLastActive(id: number): Promise<boolean>;
  revokeAllUserTokens(userId: number, reason?: string): Promise<boolean>;
  revokeAllUserTokensExcept(userId: number, tokenId: number): Promise<boolean>;
  revokeSpecificToken(userId: number, tokenId: number): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;
  incrementLoginAttempts(userId: number): Promise<void>;
  resetLoginAttempts(userId: number): Promise<void>;
  lockUserAccount(userId: number, lock: boolean): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  sessionStore: any;
  
  constructor() {
    // Use memory store to avoid DB session issues
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }
  
  // Message methods - using our message helpers module
  async getMessage(id: number): Promise<Message | undefined> {
    return messageHelpers.getMessage(id);
  }
  
  async getUserMessages(userId: number): Promise<Message[]> {
    return messageHelpers.getUserMessages(userId);
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return messageHelpers.getConversationMessages(userId1, userId2);
  }
  
  async getUserConversations(userId: number): Promise<any[]> {
    return messageHelpers.getUserConversations(userId);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    return messageHelpers.createMessage(message);
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    return messageHelpers.markMessageAsRead(id);
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return messageHelpers.getUnreadMessagesCount(userId);
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    try {
      await db.delete(messages).where(eq(messages.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }
  
  // Call operations implementation
  async createCallSession(callData: any): Promise<any> {
    try {
      const [newCallSession] = await db.insert(callSessions).values(callData).returning();
      return newCallSession;
    } catch (error) {
      console.error('Error creating call session:', error);
      throw new Error('Failed to create call session');
    }
  }
  
  async updateCallSession(id: number, updateData: any): Promise<any> {
    try {
      const [updatedCallSession] = await db
        .update(callSessions)
        .set(updateData)
        .where(eq(callSessions.id, id))
        .returning();
      return updatedCallSession;
    } catch (error) {
      console.error('Error updating call session:', error);
      throw new Error('Failed to update call session');
    }
  }
  
  async getUserCallHistory(userId: number, limit: number = 20): Promise<any[]> {
    try {
      const calls = await db
        .select()
        .from(callSessions)
        .where(
          or(
            eq(callSessions.initiatorId, userId),
            eq(callSessions.receiverId, userId)
          )
        )
        .orderBy(desc(callSessions.startedAt))
        .limit(limit);
        
      // Fetch user details for each call
      const callsWithUsers = await Promise.all(calls.map(async (call) => {
        const otherUserId = call.initiatorId === userId ? call.receiverId : call.initiatorId;
        const otherUser = await this.getUser(otherUserId);
        
        return {
          ...call,
          otherUser: otherUser ? {
            id: otherUser.id,
            username: otherUser.username,
            name: otherUser.name,
            avatar: otherUser.avatar
          } : null,
          isOutgoing: call.initiatorId === userId
        };
      }));
      
      return callsWithUsers;
    } catch (error) {
      console.error('Error getting user call history:', error);
      return [];
    }
  }
  
  async getUserCallStats(userId: number): Promise<any> {
    try {
      // Get total calls
      const [totalResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          or(
            eq(callSessions.initiatorId, userId),
            eq(callSessions.receiverId, userId)
          )
        );
      
      // Get total duration
      const [durationResult] = await db
        .select({ totalDuration: sql`SUM(${callSessions.duration})` })
        .from(callSessions)
        .where(
          and(
            or(
              eq(callSessions.initiatorId, userId),
              eq(callSessions.receiverId, userId)
            ),
            eq(callSessions.status, 'ended')
          )
        );
      
      // Get outgoing calls
      const [outgoingResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(eq(callSessions.initiatorId, userId));
      
      // Get incoming calls
      const [incomingResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(eq(callSessions.receiverId, userId));
      
      // Get missed calls
      const [missedResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          and(
            eq(callSessions.receiverId, userId),
            eq(callSessions.status, 'missed')
          )
        );
      
      // Get video calls
      const [videoResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          and(
            or(
              eq(callSessions.initiatorId, userId),
              eq(callSessions.receiverId, userId)
            ),
            eq(callSessions.callType, 'video')
          )
        );
      
      // Get audio calls
      const [audioResult] = await db
        .select({ count: count() })
        .from(callSessions)
        .where(
          and(
            or(
              eq(callSessions.initiatorId, userId),
              eq(callSessions.receiverId, userId)
            ),
            eq(callSessions.callType, 'audio')
          )
        );
      
      return {
        totalCalls: totalResult.count || 0,
        totalDuration: durationResult.totalDuration || 0,
        outgoingCalls: outgoingResult.count || 0,
        incomingCalls: incomingResult.count || 0,
        missedCalls: missedResult.count || 0,
        videoCalls: videoResult.count || 0,
        audioCalls: audioResult.count || 0
      };
    } catch (error) {
      console.error('Error getting user call stats:', error);
      return {
        totalCalls: 0,
        totalDuration: 0,
        outgoingCalls: 0,
        incomingCalls: 0,
        missedCalls: 0,
        videoCalls: 0,
        audioCalls: 0
      };
    }
  }
  
  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      const [newNotification] = await db.insert(notifications).values(notificationData).returning();
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }
  
  async getNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    try {
      const notificationsList = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
      
      // Try to get actor information for each notification
      const notificationsWithActors = await Promise.all(
        notificationsList.map(async (notification) => {
          if (notification.actorId) {
            const actor = await this.getUser(notification.actorId);
            return {
              ...notification,
              actor: actor ? {
                id: actor.id,
                username: actor.username,
                name: actor.name,
                avatar: actor.avatar
              } : null
            };
          }
          return notification;
        })
      );
      
      return notificationsWithActors;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    try {
      const [updatedNotification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
        
      return updatedNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return undefined;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
        
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  // Notification Settings operations
  async getNotificationSettings(userId: number): Promise<NotificationSettings[]> {
    try {
      const settings = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));
        
      return settings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return [];
    }
  }
  
  async updateNotificationSetting(
    userId: number, 
    type: string, 
    channel: string, 
    enabled: boolean
  ): Promise<NotificationSettings | undefined> {
    try {
      // Check if setting already exists
      const [existingSetting] = await db
        .select()
        .from(notificationSettings)
        .where(
          and(
            eq(notificationSettings.userId, userId),
            eq(notificationSettings.type, type as any),
            eq(notificationSettings.channel, channel as any)
          )
        );
      
      if (existingSetting) {
        // Update existing setting
        const [updated] = await db
          .update(notificationSettings)
          .set({ 
            enabled,
            updatedAt: new Date()
          })
          .where(eq(notificationSettings.id, existingSetting.id))
          .returning();
          
        return updated;
      } else {
        // Create new setting
        const [newSetting] = await db
          .insert(notificationSettings)
          .values({
            userId,
            type: type as any,
            channel: channel as any,
            enabled
          })
          .returning();
          
        return newSetting;
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
      return undefined;
    }
  }
  
  async updateMessageContent(id: number, newContent: string): Promise<Message | undefined> {
    return messageHelpers.updateMessageContent(id, newContent);
  }
  
  async searchUserMessages(userId: number, query: string): Promise<any[]> {
    return messageHelpers.searchUserMessages(userId, query);
  }
  
  async clearConversation(userId1: number, userId2: number): Promise<boolean> {
    return messageHelpers.clearConversation(userId1, userId2);
  }
  
  async getUserMessagingStats(userId: number): Promise<any> {
    return messageHelpers.getUserMessagingStats(userId);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Use SQL LOWER function to perform case-insensitive username lookup
    // This will help with login issues where username case doesn't match exactly
    try {
      const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
      console.log(`[DEBUG] getUserByUsername for '${username}': ${user ? 'Found user' : 'User not found'}`);
      return user;
    } catch (error) {
      console.error(`[ERROR] getUserByUsername error for '${username}':`, error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Use SQL LOWER function to perform case-insensitive email lookup
    try {
      const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
      console.log(`[DEBUG] getUserByEmail for '${email}': ${user ? 'Found user' : 'User not found'}`);
      return user;
    } catch (error) {
      console.error(`[ERROR] getUserByEmail error for '${email}':`, error);
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    if (!query) return [];
    const searchUsers = await db.select()
      .from(users)
      .where(
        or(
          // Search in username
          sql`LOWER(${users.username}) LIKE ${`%${query.toLowerCase()}%`}`,
          // Search in name
          sql`LOWER(${users.name}) LIKE ${`%${query.toLowerCase()}%`}`
        )
      )
      .limit(limit);
    
    // Remove sensitive information before returning
    return searchUsers.map(user => {
      const { password, ...userData } = user;
      return userData as User;
    });
  }
  
  // Category methods
  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async listCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  // Vendor methods
  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor;
  }
  
  async getVendors(limit: number = 50): Promise<Vendor[]> {
    try {
      // Get vendors with associated user information
      const vendorsList = await db
        .select({
          vendor: vendors,
          user: users
        })
        .from(vendors)
        .innerJoin(users, eq(vendors.userId, users.id))
        .limit(limit);
      
      // Format the result for client consumption, removing sensitive information
      return vendorsList.map(item => {
        const { password, ...safeUserData } = item.user;
        return {
          ...item.vendor,
          user: safeUserData
        } as Vendor;
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }
  
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    try {
      const [vendor] = await db
        .select({
          vendor: vendors,
          user: users
        })
        .from(vendors)
        .innerJoin(users, eq(vendors.userId, users.id))
        .where(eq(vendors.id, id));
      
      if (!vendor) {
        return undefined;
      }
      
      const { password, ...safeUserData } = vendor.user;
      return {
        ...vendor.vendor,
        user: safeUserData
      } as Vendor;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      return undefined;
    }
  }
  
  // Cart operations
  async countCartItems(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(carts)
        .where(eq(carts.userId, userId));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting cart items:', error);
      return 0;
    }
  }
  
  async addToCart(cartItem: InsertCart): Promise<Cart> {
    try {
      // Check if product exists
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, cartItem.productId));
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Check if item already exists in cart
      const [existingCartItem] = await db
        .select()
        .from(carts)
        .where(
          and(
            eq(carts.userId, cartItem.userId),
            eq(carts.productId, cartItem.productId)
          )
        );
      
      if (existingCartItem) {
        // Update quantity instead of creating a new item
        const newQuantity = existingCartItem.quantity + (cartItem.quantity || 1);
        const [updatedCartItem] = await db
          .update(carts)
          .set({ 
            quantity: newQuantity
          })
          .where(eq(carts.id, existingCartItem.id))
          .returning();
        
        return updatedCartItem;
      }
      
      // Create new cart item with default quantity if not provided
      const cartItemWithDefaults = {
        ...cartItem,
        quantity: cartItem.quantity || 1
      };
      
      const [newCartItem] = await db
        .insert(carts)
        .values(cartItemWithDefaults)
        .returning();
      
      return newCartItem;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw new Error('Failed to add to cart');
    }
  }
  
  async listCartItems(userId: number): Promise<(Cart & { product: Product })[]> {
    try {
      const cartItemsWithProducts = await db
        .select({
          cart: carts,
          product: products
        })
        .from(carts)
        .innerJoin(products, eq(carts.productId, products.id))
        .where(eq(carts.userId, userId))
        .orderBy(desc(carts.createdAt));
      
      return cartItemsWithProducts.map(({ cart, product }) => ({
        ...cart,
        product
      }));
    } catch (error) {
      console.error('Error listing cart items:', error);
      return [];
    }
  }
  
  async getCartItem(id: number): Promise<(Cart & { product: Product }) | undefined> {
    try {
      const [item] = await db
        .select({
          cart: carts,
          product: products
        })
        .from(carts)
        .innerJoin(products, eq(carts.productId, products.id))
        .where(eq(carts.id, id));
      
      if (!item) {
        return undefined;
      }
      
      return {
        ...item.cart,
        product: item.product
      };
    } catch (error) {
      console.error('Error getting cart item:', error);
      return undefined;
    }
  }
  
  async updateCartItem(id: number, update: Partial<Cart>): Promise<(Cart & { product: Product }) | undefined> {
    try {
      const [updatedItem] = await db
        .update(carts)
        .set(update)
        .where(eq(carts.id, id))
        .returning();
      
      if (!updatedItem) {
        return undefined;
      }
      
      // Get the product details
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, updatedItem.productId));
      
      return {
        ...updatedItem,
        product
      };
    } catch (error) {
      console.error('Error updating cart item:', error);
      return undefined;
    }
  }
  
  async removeCartItem(id: number): Promise<boolean> {
    try {
      await db
        .delete(carts)
        .where(eq(carts.id, id));
      
      return true;
    } catch (error) {
      console.error('Error removing cart item:', error);
      return false;
    }
  }
  
  // User connection methods
  async connectUsers(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Check if connection already exists
      const [existingConnection] = await db
        .select()
        .from(connections)
        .where(
          and(
            eq(connections.userId, userId1),
            eq(connections.connectedUserId, userId2)
          )
        );
      
      if (existingConnection) {
        // If connection exists but status is not 'connected', update it
        if (existingConnection.status !== 'connected') {
          await db
            .update(connections)
            .set({ 
              status: 'connected',
              updatedAt: new Date()
            })
            .where(eq(connections.id, existingConnection.id));
        }
        return true;
      }
      
      // Create a new connection
      await db.insert(connections).values({
        userId: userId1,
        connectedUserId: userId2,
        status: 'connected',
        initiatedBy: userId1
      });
      
      return true;
    } catch (error) {
      console.error('Error connecting users:', error);
      return false;
    }
  }
  
  // User follow methods
  async followUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      // Check if follow already exists
      const isAlreadyFollowing = await this.checkIfUserFollows(followerId, followingId);
      if (isAlreadyFollowing) {
        return true;
      }
      
      // Create a new follow relationship
      await db
        .insert(follows)
        .values({
          followerId,
          followingId, // Schema uses followingId
          createdAt: new Date()
        });
      
      // Create notification for the followed user
      await this.createNotification({
        userId: followingId,
        type: 'follow',
        content: 'started following you',
        actorId: followerId,
        read: false,
        createdAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      // Delete the follow relationship
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }
  
  async checkIfUserFollows(followerId: number, followingId: number): Promise<boolean> {
    try {
      const [follow] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
      
      return !!follow;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
  
  // User stats methods
  async getUserPostCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.userId, userId));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting user post count:', error);
      return 0;
    }
  }
  
  async getFollowersCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followingId, userId));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting followers count:', error);
      return 0;
    }
  }
  
  async getFollowingCount(userId: number): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  }
  
  async getUserPosts(userId: number, limit: number = 10, offset: number = 0): Promise<Post[]> {
    try {
      const userPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, userId))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
      
      return userPosts;
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  }
  
  async getFollowers(userId: number, limit: number = 10, offset: number = 0): Promise<User[]> {
    try {
      const followers = await db
        .select({ 
          user: users
        })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId))
        .orderBy(desc(follows.createdAt))
        .limit(limit)
        .offset(offset);
      
      return followers.map(f => {
        const { password, ...userData } = f.user;
        return userData as User;
      });
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }
  
  async getFollowing(userId: number, limit: number = 10, offset: number = 0): Promise<User[]> {
    try {
      const following = await db
        .select({ 
          user: users
        })
        .from(follows)
        .innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, userId))
        .orderBy(desc(follows.createdAt))
        .limit(limit)
        .offset(offset);
      
      return following.map(f => {
        const { password, ...userData } = f.user;
        return userData as User;
      });
    } catch (error) {
      console.error('Error getting following users:', error);
      return [];
    }
  }
  
  async getUserStats(userId: number): Promise<{ postCount: number, followerCount: number, followingCount: number }> {
    try {
      // Get post count
      const postCount = await this.getUserPostCount(userId);
      
      // Get followers count
      const followerCount = await this.getFollowersCount(userId);
      
      // Get following count
      const followingCount = await this.getFollowingCount(userId);
      
      return {
        postCount,
        followerCount,
        followingCount
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        postCount: 0,
        followerCount: 0,
        followingCount: 0
      };
    }
  }

  async disconnectUsers(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Delete the connection
      await db
        .delete(connections)
        .where(
          and(
            eq(connections.userId, userId1),
            eq(connections.connectedUserId, userId2)
          )
        );
      
      // Also delete the connection in the opposite direction if it exists
      await db
        .delete(connections)
        .where(
          and(
            eq(connections.userId, userId2),
            eq(connections.connectedUserId, userId1)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error disconnecting users:', error);
      return false;
    }
  }

  async checkConnection(userId1: number, userId2: number): Promise<boolean> {
    try {
      // Check if connection exists in either direction
      const [connection] = await db
        .select()
        .from(connections)
        .where(
          or(
            and(
              eq(connections.userId, userId1),
              eq(connections.connectedUserId, userId2),
              eq(connections.status, 'connected')
            ),
            and(
              eq(connections.userId, userId2),
              eq(connections.connectedUserId, userId1),
              eq(connections.status, 'connected')
            )
          )
        );
      
      return !!connection;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }
  
  // Subscription methods
  async getUserSubscription(userId: number): Promise<any | null> {
    try {
      // Get only fields that exist in the database schema
      const [subscription] = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          creatorId: subscriptions.creatorId,
          planName: subscriptions.planName,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
          interval: subscriptions.interval,
          status: subscriptions.status,
          currentPeriodStart: subscriptions.currentPeriodStart,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          expiresAt: subscriptions.expiresAt,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          tier: subscriptions.tier,
          stripeCustomerId: subscriptions.stripeCustomerId,
          stripeSubscriptionId: subscriptions.stripeSubscriptionId,
          paypalSubscriptionId: subscriptions.paypalSubscriptionId,
          createdAt: subscriptions.createdAt,
          updatedAt: subscriptions.updatedAt
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));
      
      return subscription || null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }
  
  async createOrUpdateSubscription(subscriptionData: any): Promise<any> {
    try {
      // Make sure to rename "plan" to "planName" if it exists
      if (subscriptionData.plan && !subscriptionData.planName) {
        subscriptionData.planName = subscriptionData.plan;
        delete subscriptionData.plan; // Remove the plan field since it doesn't exist in the database
      }
      
      // Check if subscription exists
      const [existingSubscription] = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, subscriptionData.userId));
      
      if (existingSubscription) {
        // Update existing subscription
        const [updatedSubscription] = await db
          .update(subscriptions)
          .set({
            ...subscriptionData,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, existingSubscription.id))
          .returning();
        
        return updatedSubscription;
      } else {
        // Create new subscription
        const [newSubscription] = await db
          .insert(subscriptions)
          .values({
            ...subscriptionData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return newSubscription;
      }
    } catch (error) {
      console.error('Error creating/updating subscription:', error);
      throw new Error('Failed to create or update subscription');
    }
  }
  
  // Product methods
  async listProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return undefined;
    }
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    try {
      // First get the post
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      
      if (!post) {
        return undefined;
      }
      
      // Then get the user
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        })
        .from(users)
        .where(eq(users.id, post.userId));
      
      // Get comment count
      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.postId, id));
      
      // Get like count
      const [likeCount] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.postId, id));
      
      // Create a return object with the necessary fields
      const postData = {
        ...post,
        comments: commentCount.count || 0,
        likes: likeCount.count || 0
      };
      
      // Add user data as a separate property (returned as JSON to frontend)
      // @ts-ignore - user property will be handled by frontend types
      postData.user = user;
      
      return postData;
    } catch (error) {
      console.error('Error getting post:', error);
      return undefined;
    }
  }
  
  async incrementPostView(id: number): Promise<boolean> {
    try {
      // Get current post
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id));
      
      if (!post) {
        return false;
      }
      
      // Increment views
      const currentViews = post.views || 0;
      
      await db
        .update(posts)
        .set({ views: currentViews + 1 })
        .where(eq(posts.id, id));
      
      return true;
    } catch (error) {
      console.error('Error incrementing post view:', error);
      return false;
    }
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    try {
      console.log('Creating post with data:', post);
      const [newPost] = await db.insert(posts).values(post).returning();
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  // Get individual post by ID with user details
  async getPostById(postId: number): Promise<any> {
    try {
      const [post] = await db
        .select({
          id: posts.id,
          userId: posts.userId,
          content: posts.content,
          title: posts.title,
          contentType: posts.contentType,
          imageUrl: posts.imageUrl,
          videoUrl: posts.videoUrl,
          productId: posts.productId,
          likes: posts.likes,
          comments: posts.comments,
          shares: posts.shares,
          views: posts.views,
          tags: posts.tags,
          isPromoted: posts.isPromoted,
          promotionEndDate: posts.promotionEndDate,
          isPublished: posts.isPublished,
          isFlagged: posts.isFlagged,
          flagReason: posts.flagReason,
          reviewStatus: posts.reviewStatus,
          reviewedAt: posts.reviewedAt,
          reviewedBy: posts.reviewedBy,
          moderationNote: posts.moderationNote,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.id, postId));

      return post;
    } catch (error) {
      console.error('Error getting post by ID:', error);
      throw error;
    }
  }

  // Get comments for a specific post
  async getPostComments(postId: number): Promise<any[]> {
    try {
      const postComments = await db
        .select({
          id: comments.id,
          userId: comments.userId,
          postId: comments.postId,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));

      return postComments;
    } catch (error) {
      console.error('Error getting post comments:', error);
      throw error;
    }
  }

  // Add a comment to a post
  async addComment(commentData: { postId: number; userId: number; content: string }): Promise<any> {
    try {
      const [comment] = await db
        .insert(comments)
        .values({
          postId: commentData.postId,
          userId: commentData.userId,
          content: commentData.content,
          createdAt: new Date()
        })
        .returning();

      // Get comment with user details
      const [commentWithUser] = await db
        .select({
          id: comments.id,
          userId: comments.userId,
          postId: comments.postId,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, comment.id));

      return commentWithUser;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Increment post comment count
  async incrementPostComments(postId: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({ 
          comments: sql`${posts.comments} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
    } catch (error) {
      console.error('Error incrementing post comments:', error);
      throw error;
    }
  }

  // Toggle post like
  async togglePostLike(postId: number, userId: number): Promise<{ liked: boolean }> {
    try {
      // Check if already liked
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

      if (existingLike) {
        // Unlike
        await db
          .delete(likes)
          .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
        
        await db
          .update(posts)
          .set({ 
            likes: sql`${posts.likes} - 1`,
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));

        return { liked: false };
      } else {
        // Like
        await db
          .insert(likes)
          .values({
            postId,
            userId,
            createdAt: new Date()
          });
        
        await db
          .update(posts)
          .set({ 
            likes: sql`${posts.likes} + 1`,
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));

        return { liked: true };
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }

  // Toggle post save
  async togglePostSave(postId: number, userId: number): Promise<{ saved: boolean }> {
    try {
      // Check if already saved
      const [existingSave] = await db
        .select()
        .from(savedPosts)
        .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));

      if (existingSave) {
        // Unsave
        await db
          .delete(savedPosts)
          .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));

        return { saved: false };
      } else {
        // Save
        await db
          .insert(savedPosts)
          .values({
            postId,
            userId,
            createdAt: new Date()
          });

        return { saved: true };
      }
    } catch (error) {
      console.error('Error toggling post save:', error);
      throw error;
    }
  }

  // Increment post shares
  async incrementPostShares(postId: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({ 
          shares: sql`${posts.shares} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
    } catch (error) {
      console.error('Error incrementing post shares:', error);
      throw error;
    }
  }

  // Increment post views
  async incrementPostViews(postId: number): Promise<void> {
    try {
      await db
        .update(posts)
        .set({ 
          views: sql`${posts.views} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
    } catch (error) {
      console.error('Error incrementing post views:', error);
      throw error;
    }
  }

  async getAllPosts(): Promise<(Post & { user: { id: number; username: string; name: string; avatar: string | null; city: string | null; country: string | null; region: string | null } })[]> {
    try {
      const postsWithUsers = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            city: users.city,
            country: users.country,
            region: users.region
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.isPublished, true))
        .orderBy(desc(posts.createdAt));

      return postsWithUsers.map(({ post, user }) => ({
        ...post,
        user
      }));
    } catch (error) {
      console.error('Error getting all posts:', error);
      return [];
    }
  }

  async getAllPostsPaginated(limit: number, offset: number): Promise<(Post & { user: { id: number; username: string; name: string; avatar: string | null }; _count: { likes: number; comments: number; shares: number }; isLiked: boolean; isShared: boolean })[]> {
    try {
      const postsWithUsers = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.isPublished, true))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      return postsWithUsers.map(({ post, user }) => ({
        ...post,
        user,
        _count: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0
        },
        isLiked: false,
        isShared: false
      }));
    } catch (error) {
      console.error('Error getting paginated posts:', error);
      return [];
    }
  }

  async getTotalPostsCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.isPublished, true));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total posts count:', error);
      return 0;
    }
  }
  
  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    try {
      const [updatedPost] = await db
        .update(posts)
        .set({
          ...postData,
          updatedAt: new Date()
        })
        .where(eq(posts.id, id))
        .returning();
      return updatedPost;
    } catch (error) {
      console.error('Error updating post:', error);
      return undefined;
    }
  }
  
  async deletePost(id: number): Promise<boolean> {
    try {
      await db.delete(posts).where(eq(posts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }
  
  async getFeedPosts(userId?: number, sortBy: string = 'recent', limit: number = 10, offset: number = 0): Promise<Post[]> {
    try {
      let query = db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id));
      
      // If userId is provided, filter to only show posts from users they follow
      if (userId) {
        const followingUserIds = await db
          .select({ followingId: follows.followingId })
          .from(follows)
          .where(eq(follows.followerId, userId));
        
        // Only add the filter if they follow anyone
        if (followingUserIds.length > 0) {
          const userIdsToInclude = [userId, ...followingUserIds.map(f => f.followingId)];
          query = db
            .select({
              post: posts,
              user: {
                id: users.id,
                username: users.username,
                name: users.name,
                avatar: users.avatar
              }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(inArray(posts.userId, userIdsToInclude));
        }
      }
      
      // Sort by the specified criteria
      if (sortBy === 'recent') {
        query = query.orderBy(desc(posts.createdAt));
      } else if (sortBy === 'popular') {
        // Sort by a combination of likes, comments, and recency
        query = query.orderBy(desc(sql`${posts.likes} + ${posts.comments}`));
      } else if (sortBy === 'trending') {
        // For trending, prioritize recent posts with engagement
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        query = query
          .where(sql`${posts.createdAt} > ${oneWeekAgo}`)
          .orderBy(desc(sql`${posts.likes} + ${posts.comments} * 2`));
      }
      
      const results = await query.limit(limit).offset(offset);
      
      return results.map(({ post, user }) => ({
        ...post,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        }
      })) as Post[];
    } catch (error) {
      console.error('Error getting feed posts:', error);
      return [];
    }
  }
  
  async getTrendingPosts(limit: number = 10): Promise<Post[]> {
    try {
      // Get posts from the last 7 days with the most engagement
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const trendingPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(sql`${posts.createdAt} > ${oneWeekAgo}`)
        .orderBy(desc(sql`(${posts.likes} * 1.0) + (${posts.comments} * 2.0)`))
        .limit(limit);
      
      return trendingPosts.map(({ post, user }) => ({
        ...post,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        }
      })) as Post[];
    } catch (error) {
      console.error('Error getting trending posts:', error);
      return [];
    }
  }
  
  async getPopularTags(limit: number = 20): Promise<{ tag: string, count: number }[]> {
    try {
      // Get most used tags from posts
      // Note: This implementation assumes the tags are stored in a string array column
      // You might need to adjust based on your actual schema
      const tagCounts = await db
        .select({
          tag: sql<string>`unnest(${posts.tags})`,
          count: count()
        })
        .from(posts)
        .where(sql`${posts.tags} IS NOT NULL AND array_length(${posts.tags}, 1) > 0`)
        .groupBy(sql`unnest(${posts.tags})`)
        .orderBy(desc(count()))
        .limit(limit);
      
      return tagCounts.map(tc => ({
        tag: tc.tag,
        count: Number(tc.count)
      }));
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return [];
    }
  }
  
  async getSuggestedUsers(limit: number = 10, currentUserId?: number): Promise<User[]> {
    try {
      let query = db
        .select()
        .from(users)
        .where(
          // Exclude the current user
          currentUserId ? sql`${users.id} <> ${currentUserId}` : sql`1=1`
        )
        .orderBy(sql`RANDOM()`) // Simple random suggestion for now
        .limit(limit);
      
      const suggestedUsers = await query;
      
      // Remove sensitive information
      return suggestedUsers.map(user => {
        const { password, ...userData } = user;
        return userData as User;
      });
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return [];
    }
  }
  
  // Like operations
  async likePost(postId: number, userId: number): Promise<boolean> {
    try {
      // Check if like already exists
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      if (existingLike) {
        // Already liked
        return true;
      }
      
      // Create a new like
      await db.insert(likes).values({
        postId,
        userId
      });
      
      // Increment the post's like count
      await db
        .update(posts)
        .set({
          likes: sql`${posts.likes} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
      
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }
  
  async unlikePost(postId: number, userId: number): Promise<boolean> {
    try {
      // Find and delete the like
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      if (!existingLike) {
        // Not liked yet
        return true;
      }
      
      // Delete the like
      await db
        .delete(likes)
        .where(eq(likes.id, existingLike.id));
      
      // Decrement the post's like count
      await db
        .update(posts)
        .set({
          likes: sql`GREATEST(${posts.likes} - 1, 0)`, // Ensure likes don't go below 0
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));
      
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  }
  
  async checkIfUserLikedPost(postId: number, userId: number): Promise<boolean> {
    try {
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      return !!existingLike;
    } catch (error) {
      console.error('Error checking if user liked post:', error);
      return false;
    }
  }
  
  async getPostLikes(postId: number): Promise<any[]> {
    try {
      const postLikes = await db
        .select({
          like: likes,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor
          }
        })
        .from(likes)
        .leftJoin(users, eq(likes.userId, users.id))
        .where(eq(likes.postId, postId))
        .orderBy(desc(likes.createdAt));
      
      return postLikes.map(({ like, user }) => ({
        id: like.id,
        userId: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        isVendor: user.isVendor,
        createdAt: like.createdAt
      }));
    } catch (error) {
      console.error('Error getting post likes:', error);
      return [];
    }
  }
  
  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    try {
      const [newComment] = await db.insert(comments).values(comment).returning();
      
      // Increment the post's comment count
      await db
        .update(posts)
        .set({
          comments: sql`${posts.comments} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, newComment.postId));
      
      return newComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }
  
  async getPostComments(postId: number, limit: number = 10, offset: number = 0): Promise<Comment[]> {
    try {
      const postComments = await db
        .select({
          comment: comments,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset);
      
      return postComments.map(({ comment, user }) => ({
        ...comment,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        }
      })) as Comment[];
    } catch (error) {
      console.error('Error getting post comments:', error);
      return [];
    }
  }
  
  async deleteComment(id: number): Promise<boolean> {
    try {
      // Get the comment first to know which post to update
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id));
      
      if (!comment) {
        return false;
      }
      
      // Delete the comment
      await db.delete(comments).where(eq(comments.id, id));
      
      // Decrement the post's comment count
      await db
        .update(posts)
        .set({
          comments: sql`GREATEST(${posts.comments} - 1, 0)`, // Ensure comments don't go below 0
          updatedAt: new Date()
        })
        .where(eq(posts.id, comment.postId));
      
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    try {
      const [comment] = await db
        .select({
          comment: comments,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, id));
      
      if (!comment) {
        return undefined;
      }
      
      return {
        ...comment.comment,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          name: comment.user.name,
          avatar: comment.user.avatar
        }
      } as Comment;
    } catch (error) {
      console.error('Error getting comment:', error);
      return undefined;
    }
  }
  
  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    try {
      const [updatedComment] = await db
        .update(comments)
        .set({
          content,
          updatedAt: new Date()
        })
        .where(eq(comments.id, id))
        .returning();
      
      if (!updatedComment) {
        return undefined;
      }
      
      // Get the user information to include in the response
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        })
        .from(users)
        .where(eq(users.id, updatedComment.userId));
      
      return {
        ...updatedComment,
        user
      } as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      return undefined;
    }
  }
  
  async getPostLike(postId: number, userId: number): Promise<any | undefined> {
    try {
      const [like] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.postId, postId),
            eq(likes.userId, userId)
          )
        );
      
      return like;
    } catch (error) {
      console.error('Error getting post like:', error);
      return undefined;
    }
  }
  
  // Saved posts operations
  async savePost(postId: number, userId: number): Promise<void> {
    try {
      // Check if already saved
      const alreadySaved = await this.checkSavedPost(postId, userId);
      
      if (alreadySaved) {
        return; // Already saved
      }
      
      // Save the post
      await db.insert(savedPosts).values({
        postId,
        userId
      });
    } catch (error) {
      console.error('Error saving post:', error);
      throw new Error('Failed to save post');
    }
  }
  
  async unsavePost(postId: number, userId: number): Promise<boolean> {
    try {
      // Delete the saved post record
      const result = await db
        .delete(savedPosts)
        .where(
          and(
            eq(savedPosts.postId, postId),
            eq(savedPosts.userId, userId)
          )
        );
      
      // Return true if at least one record was deleted
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error unsaving post:', error);
      return false;
    }
  }
  
  async checkSavedPost(postId: number, userId: number): Promise<boolean> {
    try {
      const [savedPost] = await db
        .select()
        .from(savedPosts)
        .where(
          and(
            eq(savedPosts.postId, postId),
            eq(savedPosts.userId, userId)
          )
        );
      
      return !!savedPost; // Return true if savedPost exists, false otherwise
    } catch (error) {
      console.error('Error checking saved post:', error);
      return false;
    }
  }
  
  async getSavedPosts(userId: number, options: { limit: number, offset: number }): Promise<Post[]> {
    try {
      // First, get the saved post IDs for this user
      const savedPostItems = await db
        .select()
        .from(savedPosts)
        .where(eq(savedPosts.userId, userId))
        .orderBy(desc(savedPosts.createdAt))
        .limit(options.limit)
        .offset(options.offset);
      
      if (savedPostItems.length === 0) {
        return [];
      }
      
      // Get the post IDs
      const postIds = savedPostItems.map(item => item.postId);
      
      // Fetch the actual posts with these IDs
      const postsData = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          },
          savedAt: savedPosts.createdAt
        })
        .from(posts)
        .innerJoin(savedPosts, eq(posts.id, savedPosts.postId))
        .innerJoin(users, eq(posts.userId, users.id))
        .where(
          and(
            inArray(posts.id, postIds),
            eq(savedPosts.userId, userId)
          )
        )
        .orderBy(desc(savedPosts.createdAt));
      
      // Format the posts for the response
      return postsData.map(data => {
        const { post, user, savedAt } = data;
        return {
          ...post,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar
          },
          savedAt
        } as Post;
      });
    } catch (error) {
      console.error('Error getting saved posts:', error);
      return [];
    }
  }
  
  async promotePost(postId: number, endDate: Date): Promise<Post | undefined> {
    try {
      const [promotedPost] = await db
        .update(posts)
        .set({
          isPromoted: true,
          promotionEndDate: endDate,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId))
        .returning();
      
      return promotedPost;
    } catch (error) {
      console.error('Error promoting post:', error);
      return undefined;
    }
  }
  
  async unpromotePost(postId: number): Promise<Post | undefined> {
    try {
      const [unpromoted] = await db
        .update(posts)
        .set({
          isPromoted: false,
          promotionEndDate: null,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId))
        .returning();
      
      return unpromoted;
    } catch (error) {
      console.error('Error un-promoting post:', error);
      return undefined;
    }
  }
  
  // Admin analytics methods
  async getUserCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(users);
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }
  
  async getProductCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(products);
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting product count:', error);
      return 0;
    }
  }
  
  async getOrderCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(orders);
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting order count:', error);
      return 0;
    }
  }
  
  async getCommunityCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(communities);
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting community count:', error);
      return 0;
    }
  }
  
  async getUserCommunities(userId: number): Promise<any[]> {
    try {
      // Get communities created by the user
      const userCommunities = await db.select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        coverImage: communities.coverImage,
        icon: communities.icon,
        memberCount: communities.memberCount,
        creatorId: communities.creatorId,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        createdAt: communities.createdAt
      })
        .from(communities)
        .where(eq(communities.creatorId, userId))
        .orderBy(desc(communities.createdAt));
      
      // Also get communities the user is a member of but didn't create
      const memberCommunities = await db.select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        coverImage: communities.coverImage,
        icon: communities.icon,
        memberCount: communities.memberCount,
        creatorId: communities.creatorId,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        createdAt: communities.createdAt
      })
        .from(communityMembers)
        .innerJoin(communities, eq(communityMembers.communityId, communities.id))
        .where(
          and(
            eq(communityMembers.userId, userId),
            sql`${communities.creatorId} != ${userId}`
          )
        )
        .orderBy(desc(communities.createdAt));
      
      // Combine the two sets
      return [...userCommunities, ...memberCommunities];
    } catch (error) {
      console.error('Error getting user communities:', error);
      return [];
    }
  }
  
  async countPosts(options: any): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(posts);
      
      if (options.isFlagged !== undefined) {
        query = query.where(eq(posts.isFlagged, options.isFlagged));
      }
      
      if (options.reviewStatus) {
        query = query.where(eq(posts.reviewStatus, options.reviewStatus));
      }
      
      const [result] = await query;
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting posts:', error);
      return 0;
    }
  }
  
  // Order analytics
  async countOrders(options: any): Promise<number> {
    try {
      let query = db.select({ count: count() }).from(orders);
      
      if (options.status) {
        query = query.where(eq(orders.status, options.status));
      }
      
      const [result] = await query;
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting orders:', error);
      return 0;
    }
  }
  
  async calculateTotalRevenue(): Promise<number> {
    try {
      const [result] = await db
        .select({ total: sql`SUM(${orders.totalAmount})` })
        .from(orders)
        .where(eq(orders.paymentStatus, 'completed'));
      
      return result?.total || 0;
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      return 0;
    }
  }
  
  async calculateAverageOrderValue(): Promise<number> {
    try {
      const [result] = await db
        .select({ avg: sql`AVG(${orders.totalAmount})` })
        .from(orders)
        .where(eq(orders.paymentStatus, 'completed'));
      
      return result?.avg || 0;
    } catch (error) {
      console.error('Error calculating average order value:', error);
      return 0;
    }
  }
  
  // Product analytics
  async getTopSellingProducts(limit: number): Promise<any[]> {
    try {
      // For now, return empty array since orders/orderItems tables may not exist yet
      // This prevents the app from crashing
      return [];
    } catch (error) {
      console.error('Error getting top selling products:', error);
      return [];
    }
  }
  
  async getProductPerformanceMetrics(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Get product performance metrics
      const totalSold = await db
        .select({
          count: sql`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        );
      
      const totalRevenue = await db
        .select({
          revenue: sql`SUM(${orderItems.price} * ${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        );
      
      // Get growth compared to previous period
      const previousStartDate = new Date(startDate);
      const previousPeriodLength = endDate.getTime() - startDate.getTime();
      previousStartDate.setTime(previousStartDate.getTime() - previousPeriodLength);
      
      const previousPeriod = await db
        .select({
          count: sql`SUM(${orderItems.quantity})`,
          revenue: sql`SUM(${orderItems.price} * ${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${previousStartDate}`,
            sql`${orders.createdAt} < ${startDate}`
          )
        );
      
      // Calculate growth percentages
      const salesGrowth = previousPeriod[0]?.count > 0 
        ? ((totalSold[0]?.count || 0) - (previousPeriod[0]?.count || 0)) / (previousPeriod[0]?.count || 1) * 100 
        : 0;
      
      const revenueGrowth = previousPeriod[0]?.revenue > 0 
        ? ((totalRevenue[0]?.revenue || 0) - (previousPeriod[0]?.revenue || 0)) / (previousPeriod[0]?.revenue || 1) * 100 
        : 0;
      
      return {
        totalSold: totalSold[0]?.count || 0,
        totalRevenue: totalRevenue[0]?.revenue || 0,
        salesGrowth: salesGrowth,
        revenueGrowth: revenueGrowth,
        timeRange: timeRange
      };
    } catch (error) {
      console.error('Error getting product performance metrics:', error);
      return {
        totalSold: 0,
        totalRevenue: 0,
        salesGrowth: 0,
        revenueGrowth: 0,
        timeRange: timeRange
      };
    }
  }
  
  async getCategoryTrendsData(): Promise<any> {
    try {
      // Get product counts by category
      const categoryCounts = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          count: count(products.id)
        })
        .from(products)
        .leftJoin(categories, eq(products.category, categories.name))
        .groupBy(products.category, categories.name);
      
      // Get sales counts by category
      const categorySales = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          totalSold: sql`SUM(${orderItems.quantity})`,
          revenue: sql`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.category, categories.name))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orders.paymentStatus, 'completed'))
        .groupBy(products.category, categories.name);
      
      // Combine the data
      const combinedData = categorySales.map(salesData => {
        const countData = categoryCounts.find(c => c.category === salesData.category);
        return {
          category: salesData.category,
          name: salesData.categoryName,
          productCount: countData?.count || 0,
          totalSold: salesData.totalSold,
          revenue: salesData.revenue
        };
      });
      
      return combinedData;
    } catch (error) {
      console.error('Error getting category trends data:', error);
      return [];
    }
  }
  
  async getRevenueByCategory(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Get revenue by category
      const categoryRevenue = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          revenue: sql`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.category, categories.name))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        )
        .groupBy(products.category, categories.name)
        .orderBy(desc(sql`SUM(${orderItems.unitPrice} * ${orderItems.quantity})`));
      
      return {
        categories: categoryRevenue.map(c => c.categoryName),
        data: categoryRevenue.map(c => c.revenue),
        timeRange: timeRange
      };
    } catch (error) {
      console.error('Error getting revenue by category:', error);
      return {
        categories: [],
        data: [],
        timeRange: timeRange
      };
    }
  }
  
  async getInventoryAlerts(): Promise<any[]> {
    try {
      // Get products with low inventory
      const lowInventory = await db
        .select({
          id: products.id,
          name: products.name,
          stock: products.quantity, // Using quantity field instead of stock
          category: categories.name,
          price: products.price,
          thumbnail: products.thumbnail // Using thumbnail field instead of image
        })
        .from(products)
        .leftJoin(categories, eq(products.category, categories.name))
        .where(
          or(
            lte(products.quantity, 5), // Low stock threshold
            eq(products.quantity, 0)   // Out of stock
          )
        )
        .orderBy(asc(products.quantity))
        .limit(20);
      
      return lowInventory.map(product => ({
        ...product,
        status: product.stock === 0 ? 'Out of stock' : 'Low stock',
        alertLevel: product.stock === 0 ? 'high' : 'medium'
      }));
    } catch (error) {
      console.error('Error getting inventory alerts:', error);
      return [];
    }
  }
  
  // Admin dashboard analytics
  async getUserRegistrationTrends(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      let interval = 'day'; // SQL interval type - day, week, month
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
        interval = 'day';
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
        interval = 'day';
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
        interval = 'week';
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
        interval = 'month';
      }
      
      // Get user registration counts by interval
      const registrations = await db
        .select({
          date: sql`date_trunc(${interval}, ${users.createdAt})`,
          count: count()
        })
        .from(users)
        .where(
          and(
            sql`${users.createdAt} >= ${startDate}`,
            sql`${users.createdAt} <= ${endDate}`
          )
        )
        .groupBy(sql`date_trunc(${interval}, ${users.createdAt})`)
        .orderBy(sql`date_trunc(${interval}, ${users.createdAt})`);
      
      return {
        labels: registrations.map(r => r.date.toISOString().split('T')[0]),
        data: registrations.map(r => r.count),
        timeRange: timeRange
      };
    } catch (error) {
      console.error('Error getting user registration trends:', error);
      return {
        labels: [],
        data: [],
        timeRange: timeRange
      };
    }
  }
  
  async getActiveUserStats(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Count active users based on login activity
      const [activeUsers] = await db
        .select({ count: count() })
        .from(userSessions)
        .where(
          and(
            sql`${userSessions.lastActiveAt} >= ${startDate}`,
            sql`${userSessions.lastActiveAt} <= ${endDate}`
          )
        )
        .groupBy(userSessions.userId);
      
      // Count active users based on recent post activity
      const [activePosters] = await db
        .select({ count: count() })
        .from(posts)
        .where(
          and(
            sql`${posts.createdAt} >= ${startDate}`,
            sql`${posts.createdAt} <= ${endDate}`
          )
        )
        .groupBy(posts.userId);
      
      // Get total users count
      const [totalUsers] = await db
        .select({ count: count() })
        .from(users);
      
      return {
        activeUsers: activeUsers?.count || 0,
        activePosters: activePosters?.count || 0,
        totalUsers: totalUsers?.count || 0,
        activePercentage: totalUsers?.count > 0
          ? (activeUsers?.count || 0) / totalUsers.count * 100
          : 0,
        timeRange: timeRange
      };
    } catch (error) {
      console.error('Error getting active user stats:', error);
      return {
        activeUsers: 0,
        activePosters: 0,
        totalUsers: 0,
        activePercentage: 0,
        timeRange: timeRange
      };
    }
  }
  
  async getSalesData(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      let interval = 'day'; // SQL interval type - day, week, month
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
        interval = 'day';
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
        interval = 'day';
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
        interval = 'week';
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
        interval = 'month';
      }
      
      // Get sales data by interval
      const salesData = await db
        .select({
          date: sql`date_trunc(${interval}, ${orders.createdAt})`,
          orderCount: count(),
          revenue: sql`SUM(${orders.totalAmount})`
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        )
        .groupBy(sql`date_trunc(${interval}, ${orders.createdAt})`)
        .orderBy(sql`date_trunc(${interval}, ${orders.createdAt})`);
      
      return {
        labels: salesData.map(d => d.date.toISOString().split('T')[0]),
        orderCounts: salesData.map(d => d.orderCount),
        revenue: salesData.map(d => d.revenue),
        timeRange: timeRange
      };
    } catch (error) {
      console.error('Error getting sales data:', error);
      return {
        labels: [],
        orderCounts: [],
        revenue: [],
        timeRange: timeRange
      };
    }
  }
  
  async getProductCategoryDistribution(): Promise<any> {
    try {
      // Get product counts by category
      const categoryDistribution = await db
        .select({
          category: products.category,
          categoryName: categories.name,
          count: count()
        })
        .from(products)
        .leftJoin(categories, eq(products.category, categories.name))
        .groupBy(products.category, categories.name);
      
      // Calculate total products
      const totalProducts = categoryDistribution.reduce((sum, category) => sum + category.count, 0);
      
      // Calculate percentages
      const distribution = categoryDistribution.map(category => ({
        name: category.categoryName,
        value: category.count,
        percentage: totalProducts > 0 ? (category.count / totalProducts * 100).toFixed(2) : 0
      }));
      
      return {
        labels: distribution.map(d => d.name),
        data: distribution.map(d => d.value),
        percentages: distribution.map(d => d.percentage)
      };
    } catch (error) {
      console.error('Error getting product category distribution:', error);
      return {
        labels: [],
        data: [],
        percentages: []
      };
    }
  }
  
  async getTrafficSourcesData(timeRange: string): Promise<any> {
    try {
      // Calculate time period for the query
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      } else if (timeRange === '12months') {
        startDate.setMonth(endDate.getMonth() - 12);
      }
      
      // Get traffic sources from analytics table
      const trafficSources = await db
        .select({
          source: trafficAnalytics.source,
          sessions: sql`SUM(${trafficAnalytics.sessions})`,
          conversions: sql`SUM(${trafficAnalytics.conversions})`,
          revenue: sql`SUM(${trafficAnalytics.revenue})`
        })
        .from(trafficAnalytics)
        .where(
          and(
            sql`${trafficAnalytics.date} >= ${startDate}`,
            sql`${trafficAnalytics.date} <= ${endDate}`
          )
        )
        .groupBy(trafficAnalytics.source)
        .orderBy(desc(sql`SUM(${trafficAnalytics.sessions})`));
      
      return {
        sources: trafficSources.map(s => s.source),
        sessions: trafficSources.map(s => s.sessions),
        conversions: trafficSources.map(s => s.conversions),
        revenue: trafficSources.map(s => s.revenue),
        timeRange: timeRange
      };
    } catch (error) {
      console.error('Error getting traffic sources data:', error);
      return {
        sources: ['Direct', 'Social', 'Search', 'Referral'],
        sessions: [0, 0, 0, 0],
        conversions: [0, 0, 0, 0],
        revenue: [0, 0, 0, 0],
        timeRange: timeRange
      };
    }
  }
  
  // Order operations
  async getOrder(id: number): Promise<any> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id));
      
      if (!order) {
        return undefined;
      }
      
      // Get order items
      const orderItems = await db
        .select({
          item: orderItems,
          product: {
            id: products.id,
            name: products.name,
            image: products.image
          }
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id));
      
      // Get user details
      const user = await this.getUser(order.userId);
      
      return {
        ...order,
        items: orderItems.map(item => ({
          ...item.item,
          product: item.product
        })),
        user: user ? {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        } : null
      };
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }
  
  async updateOrder(id: number, updates: any): Promise<any> {
    try {
      const [updatedOrder] = await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, id))
        .returning();
      
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order:', error);
      return undefined;
    }
  }
  
  async updateOrderItemsStatus(orderId: number, status: string): Promise<boolean> {
    try {
      await db
        .update(orderItems)
        .set({ status })
        .where(eq(orderItems.orderId, orderId));
      
      return true;
    } catch (error) {
      console.error('Error updating order items status:', error);
      return false;
    }
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async resetUserPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      console.error('Error resetting user password:', error);
      return false;
    }
  }
  
  async listPosts(options: any): Promise<any[]> {
    try {
      let query = db.select({
        post: posts,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id));
      
      // Apply filters
      if (options.isFlagged !== undefined) {
        query = query.where(eq(posts.isFlagged, options.isFlagged));
      }
      
      if (options.reviewStatus) {
        query = query.where(eq(posts.reviewStatus, options.reviewStatus));
      }
      
      if (options.search) {
        query = query.where(
          or(
            like(posts.content, `%${options.search}%`),
            like(posts.title, `%${options.search}%`)
          )
        );
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      // Order by creation date (newest first)
      query = query.orderBy(desc(posts.createdAt));
      
      const result = await query;
      
      // Format the results
      return result.map(item => ({
        ...item.post,
        user: item.user
      }));
    } catch (error) {
      console.error('Error listing posts:', error);
      return [];
    }
  }
  
  // Auth token operations
  async getAuthToken(token: string): Promise<any | undefined> {
    try {
      const [authToken] = await db.select().from(authTokens).where(eq(authTokens.token, token));
      return authToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return undefined;
    }
  }

  async createAuthToken(tokenData: any): Promise<any> {
    try {
      const [newToken] = await db.insert(authTokens).values(tokenData).returning();
      return newToken;
    } catch (error) {
      console.error('Error creating auth token:', error);
      throw new Error('Failed to create auth token');
    }
  }

  async revokeAuthToken(id: number, reason: string = 'User initiated'): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedAt: new Date(),
          revocationReason: reason,
          updatedAt: new Date()
        })
        .where(eq(authTokens.id, id));
      return true;
    } catch (error) {
      console.error('Error revoking auth token:', error);
      return false;
    }
  }

  async updateTokenLastActive(id: number): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          lastActiveAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(authTokens.id, id));
      return true;
    } catch (error) {
      console.error('Error updating token last active:', error);
      return false;
    }
  }

  async revokeAllUserTokens(userId: number, reason: string = 'Security measure'): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedAt: new Date(),
          revocationReason: reason,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(authTokens.userId, userId),
            eq(authTokens.isRevoked, false)
          )
        );
      return true;
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      return false;
    }
  }

  async revokeAllUserTokensExcept(userId: number, tokenId: number): Promise<boolean> {
    try {
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedAt: new Date(),
          revocationReason: 'Revoked by user (logout from all other devices)',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(authTokens.userId, userId),
            eq(authTokens.isRevoked, false),
            sql`${authTokens.id} != ${tokenId}`
          )
        );
      return true;
    } catch (error) {
      console.error('Error revoking all user tokens except current:', error);
      return false;
    }
  }

  async revokeSpecificToken(userId: number, tokenId: number): Promise<boolean> {
    try {
      const [token] = await db
        .select()
        .from(authTokens)
        .where(
          and(
            eq(authTokens.id, tokenId),
            eq(authTokens.userId, userId)
          )
        );
      
      if (!token) {
        return false;
      }
      
      return await this.revokeAuthToken(tokenId, 'Revoked by user');
    } catch (error) {
      console.error('Error revoking specific token:', error);
      return false;
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Revoke expired tokens
      await db
        .update(authTokens)
        .set({ 
          isRevoked: true, 
          revokedAt: new Date(),
          revocationReason: 'Token expired',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(authTokens.isRevoked, false),
            sql`${authTokens.expiresAt} < CURRENT_TIMESTAMP`
          )
        );
      
      // Optional: delete very old tokens (e.g., more than 30 days old)
      await db
        .delete(authTokens)
        .where(sql`${authTokens.expiresAt} < CURRENT_TIMESTAMP - INTERVAL '30 days'`);
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }

  async incrementLoginAttempts(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set((user) => ({ 
          failedLoginAttempts: sql`COALESCE(${user.failedLoginAttempts}, 0) + 1`,
          updatedAt: new Date()
        }))
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error incrementing login attempts:', error);
    }
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          failedLoginAttempts: 0,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error resetting login attempts:', error);
    }
  }

  async lockUserAccount(userId: number, lock: boolean): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          isLocked: lock,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error locking/unlocking user account:', error);
    }
  }

  // Additional messaging methods
  async getConversations(userId: number): Promise<any[]> {
    return this.getUserConversations(userId);
  }

  async markMessagesAsRead(currentUserId: number, otherUserId: number): Promise<void> {
    try {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.receiverId, currentUserId),
            eq(messages.senderId, otherUserId),
            eq(messages.isRead, false)
          )
        );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async deleteMessage(id: number, userId?: number): Promise<boolean> {
    try {
      if (userId) {
        // Only allow deletion if the user is the sender
        const [message] = await db
          .select()
          .from(messages)
          .where(and(eq(messages.id, id), eq(messages.senderId, userId)));
        
        if (!message) {
          return false;
        }
      }

      await db.delete(messages).where(eq(messages.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Missing methods from interface
  async checkPostLike(postId: number, userId: number): Promise<boolean> {
    return this.hasUserLikedPost(userId, postId);
  }

  async checkPostSave(postId: number, userId: number): Promise<boolean> {
    try {
      const [existingSave] = await db
        .select()
        .from(savedPosts)
        .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));
      
      return !!existingSave;
    } catch (error) {
      console.error('Error checking if user saved post:', error);
      return false;
    }
  }

  async getUserFeed(userId: number, limit: number = 10, offset: number = 0): Promise<Post[]> {
    try {
      console.log(`[DEBUG] getUserFeed called for user ${userId}`);
      const userFeed = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor,
            city: users.city,
            country: users.country,
            region: users.region
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(follows, and(eq(follows.followingId, posts.userId), eq(follows.followerId, userId)))
        .where(
          or(
            eq(posts.userId, userId), // User's own posts
            eq(follows.followerId, userId) // Posts from followed users
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      console.log(`[DEBUG] Found ${userFeed.length} posts, first user data:`, userFeed[0]?.user);
      
      const result = userFeed.map(({ post, user }) => ({
        ...post,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          isVendor: user.isVendor,
          city: user.city,
          country: user.country,
          region: user.region
        }
      })) as Post[];
      
      console.log(`[DEBUG] Returning post with user:`, result[0]?.user);
      return result;
    } catch (error) {
      console.error('Error getting user feed:', error);
      return [];
    }
  }

  async getUserFollowerCount(userId: number): Promise<number> {
    return this.getFollowersCount(userId);
  }

  // Liked products operations
  async likeProduct(userId: number, productId: number): Promise<LikedProduct> {
    try {
      const [likedProduct] = await db
        .insert(likedProducts)
        .values({ userId, productId })
        .returning();
      return likedProduct;
    } catch (error) {
      console.error('Error liking product:', error);
      throw error;
    }
  }

  async unlikeProduct(userId: number, productId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(likedProducts)
        .where(and(eq(likedProducts.userId, userId), eq(likedProducts.productId, productId)));
      return true;
    } catch (error) {
      console.error('Error unliking product:', error);
      return false;
    }
  }

  async checkProductLiked(userId: number, productId: number): Promise<boolean> {
    try {
      const [liked] = await db
        .select()
        .from(likedProducts)
        .where(and(eq(likedProducts.userId, userId), eq(likedProducts.productId, productId)))
        .limit(1);
      return !!liked;
    } catch (error) {
      console.error('Error checking if product is liked:', error);
      return false;
    }
  }

  async getUserLikedProducts(userId: number): Promise<Product[]> {
    try {
      const likedProductsData = await db
        .select({
          product: products,
          vendor: vendors,
        })
        .from(likedProducts)
        .innerJoin(products, eq(likedProducts.productId, products.id))
        .innerJoin(vendors, eq(products.vendorId, vendors.id))
        .where(eq(likedProducts.userId, userId))
        .orderBy(desc(likedProducts.createdAt));

      return likedProductsData.map(({ product, vendor }) => ({
        ...product,
        vendor: {
          id: vendor.id,
          storeName: vendor.storeName,
          rating: vendor.rating
        }
      })) as Product[];
    } catch (error) {
      console.error('Error getting user liked products:', error);
      return [];
    }
  }

  async getUserFollowingCount(userId: number): Promise<number> {
    return this.getFollowingCount(userId);
  }

  async getPostsByRegion(userId: number, limit: number, offset: number): Promise<Post[]> {
    try {
      // First get the current user's region
      const [currentUser] = await db.select({ region: users.region }).from(users).where(eq(users.id, userId));
      
      if (!currentUser || !currentUser.region) {
        // If user has no region set, return empty array
        return [];
      }

      // Get posts from users in the same region
      const regionPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(eq(users.region, currentUser.region))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      // Transform the results to match the Post interface
      return regionPosts.map(row => ({
        ...row.post,
        user: row.user || {
          id: 0,
          username: 'Unknown',
          name: 'Unknown User',
          avatar: null,
          isVendor: false
        }
      })) as Post[];
    } catch (error) {
      console.error('Error getting posts by region:', error);
      return [];
    }
  }

  async getPostsByCountry(userId: number, limit: number, offset: number): Promise<Post[]> {
    try {
      // First get the current user's country
      const [currentUser] = await db.select({ country: users.country }).from(users).where(eq(users.id, userId));
      
      if (!currentUser || !currentUser.country) {
        // If user has no country set, return empty array
        return [];
      }

      // Get posts from users in the same country
      const countryPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar,
            isVendor: users.isVendor
          }
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(eq(users.country, currentUser.country))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      // Transform the results to match the Post interface
      return countryPosts.map(row => ({
        ...row.post,
        user: row.user || {
          id: 0,
          username: 'Unknown',
          name: 'Unknown User',
          avatar: null,
          isVendor: false
        }
      })) as Post[];
    } catch (error) {
      console.error('Error getting posts by country:', error);
      return [];
    }
  }

  // Add missing methods for API endpoints
  async getProducts(): Promise<Product[]> {
    try {
      return await db.select().from(products).orderBy(desc(products.createdAt));
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async getPopularProducts(): Promise<Product[]> {
    try {
      // Return products ordered by creation date since rating column may not exist
      return await db.select().from(products)
        .orderBy(desc(products.createdAt))
        .limit(10);
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  async deletePost(id: number, userId?: number): Promise<boolean> {
    try {
      if (userId) {
        // Verify the user owns the post or is admin
        const [post] = await db.select().from(posts).where(eq(posts.id, id));
        if (!post || (post.userId !== userId)) {
          return false;
        }
      }
      
      await db.delete(posts).where(eq(posts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  // Friend request operations
  async createFriendRequest(request: { senderId: number, recipientId: number, message: string }): Promise<any> {
    try {
      const [friendRequest] = await db
        .insert(friendRequests)
        .values({
          senderId: request.senderId,
          recipientId: request.recipientId,
          message: request.message,
          status: 'pending'
        })
        .returning();
      return friendRequest;
    } catch (error) {
      console.error('Error creating friend request:', error);
      throw error;
    }
  }

  async getFriendRequest(senderId: number, recipientId: number): Promise<any> {
    try {
      const [friendRequest] = await db
        .select()
        .from(friendRequests)
        .where(and(
          eq(friendRequests.senderId, senderId),
          eq(friendRequests.recipientId, recipientId),
          eq(friendRequests.status, 'pending')
        ))
        .limit(1);
      return friendRequest;
    } catch (error) {
      console.error('Error getting friend request:', error);
      return undefined;
    }
  }

  async getFriendRequests(userId: number): Promise<any[]> {
    try {
      const requests = await db
        .select({
          id: friendRequests.id,
          senderId: friendRequests.senderId,
          recipientId: friendRequests.recipientId,
          message: friendRequests.message,
          status: friendRequests.status,
          createdAt: friendRequests.createdAt,
          sender: {
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(friendRequests)
        .innerJoin(users, eq(friendRequests.senderId, users.id))
        .where(and(
          eq(friendRequests.recipientId, userId),
          eq(friendRequests.status, 'pending')
        ))
        .orderBy(desc(friendRequests.createdAt));
      return requests;
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return [];
    }
  }

  async acceptFriendRequest(requestId: number, userId: number): Promise<void> {
    try {
      // First get the friend request
      const [request] = await db
        .select()
        .from(friendRequests)
        .where(and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.recipientId, userId),
          eq(friendRequests.status, 'pending')
        ));

      if (!request) {
        throw new Error('Friend request not found');
      }

      // Update the friend request status
      await db
        .update(friendRequests)
        .set({ status: 'accepted' })
        .where(eq(friendRequests.id, requestId));

      // Create mutual connections
      await db.insert(connections).values({
        userId1: request.senderId,
        userId2: request.recipientId,
        status: 'active'
      });

      await db.insert(connections).values({
        userId1: request.recipientId,
        userId2: request.senderId,
        status: 'active'
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  async rejectFriendRequest(requestId: number, userId: number): Promise<void> {
    try {
      await db
        .update(friendRequests)
        .set({ status: 'rejected' })
        .where(and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.recipientId, userId),
          eq(friendRequests.status, 'pending')
        ));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
