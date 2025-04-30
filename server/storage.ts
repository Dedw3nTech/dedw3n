import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, like, and, or, desc, asc, sql, count, inArray, lte } from "drizzle-orm";

import {
  users, vendors, products, categories, posts, comments,
  likes, messages, notifications, reviews, carts,
  wallets, transactions, orders, orderItems, communities,
  communityMembers, membershipTiers, memberships, events,
  eventRegistrations, polls, pollVotes, creatorEarnings, subscriptions,
  videos, videoEngagements, videoAnalytics, videoPlaylists, playlistItems,
  videoPurchases, videoProductOverlays, communityContents, authTokens, follows,
  allowList, blockList, flaggedContent, flaggedImages, moderationReports,
  callSessions, callMetadata, connections, userSessions, trafficAnalytics,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type Product, type InsertProduct, type Category, type InsertCategory,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Message, type InsertMessage, type Review, type InsertReview,
  type Cart, type InsertCart, type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Community, type InsertCommunity,
  type Connection, type InsertConnection
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
  getUnreadMessageCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  updateMessageContent(id: number, newContent: string): Promise<Message | undefined>;
  searchUserMessages(userId: number, query: string): Promise<any[]>;
  clearConversation(userId1: number, userId2: number): Promise<boolean>;
  getUserMessagingStats(userId: number): Promise<any>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Call operations
  createCallSession(callData: any): Promise<any>;
  updateCallSession(id: number, updateData: any): Promise<any>;
  getUserCallHistory(userId: number, limit?: number): Promise<any[]>;
  getUserCallStats(userId: number): Promise<any>;
  
  // Subscription operations
  getUserSubscription(userId: number): Promise<any | null>;
  createOrUpdateSubscription(subscriptionData: any): Promise<any>;
  
  // Notification operations
  createNotification(notificationData: any): Promise<any>;
  
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
  getVendors(limit?: number): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  
  // Product operations
  listProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  getFeedPosts(userId?: number, sortBy?: string, limit?: number, offset?: number): Promise<Post[]>;
  getTrendingPosts(limit?: number): Promise<Post[]>;
  getPopularTags(limit?: number): Promise<{ tag: string, count: number }[]>;
  getSuggestedUsers(limit?: number, currentUserId?: number): Promise<User[]>;
  
  // Like operations
  likePost(postId: number, userId: number): Promise<boolean>;
  unlikePost(postId: number, userId: number): Promise<boolean>;
  checkIfUserLikedPost(postId: number, userId: number): Promise<boolean>;
  getPostLikes(postId: number): Promise<any[]>;
  getPostLike(postId: number, userId: number): Promise<any | undefined>;
  
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
  async createNotification(notificationData: any): Promise<any> {
    try {
      const [newNotification] = await db.insert(notifications).values(notificationData).returning();
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
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
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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
      const [subscription] = await db
        .select()
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
      // Check if subscription exists
      const [existingSubscription] = await db
        .select()
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

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    try {
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      return post;
    } catch (error) {
      console.error('Error getting post:', error);
      return undefined;
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
      // Join order items with products to get the top selling products
      const topProducts = await db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          totalSold: sql`SUM(${orderItems.quantity})`,
          totalRevenue: sql`SUM(${orderItems.price} * ${orderItems.quantity})`,
          productImage: products.image
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orders.paymentStatus, 'completed'))
        .groupBy(orderItems.productId, products.name, products.image)
        .orderBy(desc(sql`SUM(${orderItems.quantity})`))
        .limit(limit);
      
      return topProducts;
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
          categoryId: products.categoryId,
          categoryName: categories.name,
          count: count(products.id)
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .groupBy(products.categoryId, categories.name);
      
      // Get sales counts by category
      const categorySales = await db
        .select({
          categoryId: products.categoryId,
          categoryName: categories.name,
          totalSold: sql`SUM(${orderItems.quantity})`,
          revenue: sql`SUM(${orderItems.price} * ${orderItems.quantity})`
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(eq(orders.paymentStatus, 'completed'))
        .groupBy(products.categoryId, categories.name);
      
      // Combine the data
      const combinedData = categorySales.map(salesData => {
        const countData = categoryCounts.find(c => c.categoryId === salesData.categoryId);
        return {
          categoryId: salesData.categoryId,
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
          categoryId: products.categoryId,
          categoryName: categories.name,
          revenue: sql`SUM(${orderItems.price} * ${orderItems.quantity})`
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.paymentStatus, 'completed'),
            sql`${orders.createdAt} >= ${startDate}`,
            sql`${orders.createdAt} <= ${endDate}`
          )
        )
        .groupBy(products.categoryId, categories.name)
        .orderBy(desc(sql`SUM(${orderItems.price} * ${orderItems.quantity})`));
      
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
          stock: products.stock,
          category: categories.name,
          price: products.price,
          image: products.image
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          or(
            lte(products.stock, 5), // Low stock threshold
            eq(products.stock, 0)   // Out of stock
          )
        )
        .orderBy(asc(products.stock))
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
          categoryId: products.categoryId,
          categoryName: categories.name,
          count: count()
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .groupBy(products.categoryId, categories.name);
      
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
}

export const storage = new DatabaseStorage();
