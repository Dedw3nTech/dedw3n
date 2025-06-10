import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar, json, unique, primaryKey, pgEnum, index } from "drizzle-orm/pg-core";
import { count, and, or, eq, desc } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "./db";
import { 
  users, communities, communityMembers, carts, orders, orderItems, products, 
  vendors, posts, comments, messages, likes, follows, categories, wallets, 
  transactions, reviews
} from '@shared/schema';

// Define database interface
export interface IStorage {
  // Other methods...
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getUserMessages(userId: number): Promise<Message[]>;
  getConversationMessages(userId1: number, userId2: number): Promise<Message[]>;
  getUserConversations(userId: number): Promise<any[]>;
  getUnreadMessagesCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Other methods...
}

// Database storage implementation for PostgreSQL
export class DatabaseStorage implements IStorage {
  // Other methods...
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> { 
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }
  
  async getUserMessages(userId: number): Promise<Message[]> { 
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async getConversationMessages(userId1: number, userId2: number): Promise<Message[]> {
    // Get messages between two users
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async getUserConversations(userId: number): Promise<any[]> {
    // Get all messages where the user is either sender or receiver
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ))
      .orderBy(messages.createdAt);

    // Get unique user IDs that this user has conversed with
    const conversationUserIds = new Set<number>();
    userMessages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      conversationUserIds.add(otherUserId);
    });

    // Build conversations summary
    const conversations = [];
    for (const otherUserId of conversationUserIds) {
      // Get the other user's information
      const [otherUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, otherUserId));

      if (!otherUser) continue;

      // Get messages between these users
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, userId),
              eq(messages.receiverId, otherUserId)
            ),
            and(
              eq(messages.senderId, otherUserId),
              eq(messages.receiverId, userId)
            )
          )
        )
        .orderBy(messages.createdAt);
        
      const latestMessage = conversationMessages.length > 0 
        ? conversationMessages[conversationMessages.length - 1] 
        : null;

      // Count unread messages
      const unreadCount = conversationMessages.filter(
        msg => msg.receiverId === userId && !msg.isRead
      ).length;

      // Create a conversation summary
      const { password, ...safeOtherUser } = otherUser;
      
      conversations.push({
        id: otherUserId, // Using the other user's ID as the conversation ID
        participants: [
          { id: userId }, // Current user
          { 
            id: otherUserId,
            username: safeOtherUser.username,
            name: safeOtherUser.name,
            avatar: safeOtherUser.avatar,
            isOnline: false // We'll need to implement online status tracking
          }
        ],
        lastMessage: latestMessage,
        unreadCount,
        updatedAt: latestMessage?.createdAt || new Date()
      });
    }

    // Sort by latest message date
    return conversations.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db
      .insert(messages)
      .values(message)
      .returning();
    return result;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
      
    if (!message) return undefined;
    
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
      
    return updatedMessage;
  }
  
  async getUnreadMessagesCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
      
    return result[0]?.count || 0;
  }
  
  // Other methods...
}

export const storage = new DatabaseStorage();

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = typeof carts.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
