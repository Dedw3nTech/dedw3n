import { eq, or, and, count, like, desc, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  messages, users,
  type Message, type InsertMessage 
} from '@shared/schema';
import { logger } from './logger';

/**
 * Get a specific message by ID
 */
export async function getMessage(id: number): Promise<Message | undefined> {
  const [message] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id));
  return message;
}

/**
 * Get all messages for a user (as sender or receiver)
 */
export async function getUserMessages(userId: number): Promise<Message[]> {
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

/**
 * Get messages between two users (a conversation)
 */
export async function getConversationMessages(userId1: number, userId2: number): Promise<Message[]> {
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

/**
 * Get all conversations for a user
 * Returns an array of conversation objects with participant details and message stats
 */
export async function getUserConversations(userId: number): Promise<any[]> {
  try {
    logger.debug('Getting conversations for user', { userId }, 'api');
    
    // Get all messages where the user is either sender or receiver
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ))
      .orderBy(messages.createdAt);

    logger.debug('Found messages for user', { userId, count: userMessages.length }, 'api');

    // Get unique user IDs that this user has conversed with
    const conversationUserIds = new Set<number>();
    userMessages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      conversationUserIds.add(otherUserId);
    });

    logger.debug('Identified conversation participants', { userId, participantCount: conversationUserIds.size }, 'api');

    // Build conversations summary
    const conversations: any[] = [];
    for (const otherUserId of Array.from(conversationUserIds)) {
      // Get the other user's information
      const [otherUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, otherUserId));

      if (!otherUser) {
        logger.debug('User not found, skipping conversation', { otherUserId }, 'api');
        continue;
      }

      logger.debug('Building conversation', { userId, otherUserId, username: otherUser.username }, 'api');

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
      
      const conversation = {
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
        updatedAt: latestMessage?.createdAt || new Date(),
        messageCount: conversationMessages.length
      };
      
      logger.debug('Created conversation', { userId, otherUserId, messageCount: conversationMessages.length, unreadCount }, 'api');
      conversations.push(conversation);
    }

    logger.debug('Total conversations created', { userId, count: conversations.length }, 'api');

    // Sort by latest message date
    return conversations.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  } catch (error) {
    logger.error('Failed to get user conversations', { userId }, error as Error, 'api');
    return [];
  }
}

/**
 * Create a new message
 */
export async function createMessage(message: InsertMessage): Promise<Message> {
  const [result] = await db
    .insert(messages)
    .values(message)
    .returning();
  return result;
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(id: number): Promise<Message | undefined> {
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

/**
 * Count unread messages for a user
 */
export async function getUnreadMessagesCount(userId: number): Promise<number> {
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

/**
 * Update message content (used for "deleting" messages)
 */
export async function updateMessageContent(id: number, newContent: string): Promise<Message | undefined> {
  const [message] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id));
    
  if (!message) return undefined;
  
  const [updatedMessage] = await db
    .update(messages)
    .set({ content: newContent })
    .where(eq(messages.id, id))
    .returning();
    
  return updatedMessage;
}

/**
 * Search for messages by content
 */
export async function searchUserMessages(userId: number, query: string): Promise<any[]> {
  // Search for messages containing the query
  const matchingMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        ),
        like(messages.content, `%${query}%`)
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(50);
  
  // Group messages by conversation
  const conversationMap = new Map<number, any>();
  
  for (const message of matchingMessages) {
    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
    
    if (!conversationMap.has(otherUserId)) {
      // Get user details
      const [otherUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, otherUserId));
      
      if (!otherUser) continue;
      
      const { password, ...safeOtherUser } = otherUser;
      
      conversationMap.set(otherUserId, {
        conversationId: otherUserId,
        user: safeOtherUser,
        messages: []
      });
    }
    
    // Add message to the conversation
    const conversation = conversationMap.get(otherUserId);
    conversation.messages.push({
      ...message,
      isFromUser: message.senderId === userId
    });
  }
  
  // Convert map to array
  return Array.from(conversationMap.values());
}

/**
 * Delete all messages in a conversation (soft delete by updating content)
 */
export async function clearConversation(userId1: number, userId2: number): Promise<boolean> {
  const deletedContent = "[Message deleted]";
  
  try {
    await db
      .update(messages)
      .set({ content: deletedContent })
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
      );
    
    return true;
  } catch (error) {
    logger.error('Failed to clear conversation', { userId1, userId2 }, error as Error, 'api');
    return false;
  }
}

/**
 * Get messaging stats for a user
 */
export async function getUserMessagingStats(userId: number): Promise<any> {
  // Total sent messages
  const sentResult = await db
    .select({ count: count() })
    .from(messages)
    .where(eq(messages.senderId, userId));
  
  // Total received messages
  const receivedResult = await db
    .select({ count: count() })
    .from(messages)
    .where(eq(messages.receiverId, userId));
  
  // Unread messages
  const unreadResult = await db
    .select({ count: count() })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      )
    );
  
  // Users chatted with
  const uniqueUsers = await db
    .select({
      distinctUsers: sql`COUNT(DISTINCT CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END)`
    })
    .from(messages)
    .where(
      or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      )
    );
  
  return {
    sentCount: sentResult[0]?.count || 0,
    receivedCount: receivedResult[0]?.count || 0,
    unreadCount: unreadResult[0]?.count || 0,
    conversationCount: uniqueUsers[0]?.distinctUsers || 0
  };
}
