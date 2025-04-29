import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, like, and, or, desc, sql, count, inArray } from "drizzle-orm";

import {
  users, vendors, products, categories, posts, comments,
  likes, messages, notifications, reviews, carts,
  wallets, transactions, orders, orderItems, communities,
  communityMembers, membershipTiers, memberships, events,
  eventRegistrations, polls, pollVotes, creatorEarnings, subscriptions,
  videos, videoEngagements, videoAnalytics, videoPlaylists, playlistItems,
  videoPurchases, videoProductOverlays, communityContents, authTokens, follows,
  allowList, blockList, flaggedContent, flaggedImages, moderationReports,
  callSessions, callMetadata,
  type User, type InsertUser, type Vendor, type InsertVendor,
  type Product, type InsertProduct, type Category, type InsertCategory,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Message, type InsertMessage, type Review, type InsertReview,
  type Cart, type InsertCart, type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Community, type InsertCommunity
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
  
  // Notification operations
  createNotification(notificationData: any): Promise<any>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
  
  // Category operations
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  listCategories(): Promise<Category[]>;
  
  // Vendor operations
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  
  // Product operations
  listProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
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
  
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }
  
  // Product methods
  async listProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
}

export const storage = new DatabaseStorage();
