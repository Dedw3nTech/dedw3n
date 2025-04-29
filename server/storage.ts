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
  getConversationMessages(userId1: number, userId2: number): Promise<Message[]>;
  getUserConversations(userId: number): Promise<any[]>;
  getUnreadMessagesCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  updateMessageContent(id: number, newContent: string): Promise<Message | undefined>;
  searchUserMessages(userId: number, query: string): Promise<any[]>;
  clearConversation(userId1: number, userId2: number): Promise<boolean>;
  getUserMessagingStats(userId: number): Promise<any>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  
  // Category operations
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
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
  
  async getConversationMessages(userId1: number, userId2: number): Promise<Message[]> {
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
  
  async getUnreadMessagesCount(userId: number): Promise<number> {
    return messageHelpers.getUnreadMessagesCount(userId);
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
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
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
