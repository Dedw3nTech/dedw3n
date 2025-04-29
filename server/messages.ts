import { eq, or, and, count } from 'drizzle-orm';
import { db } from './db';
import { 
  messages, users,
  type Message, type InsertMessage 
} from '@shared/schema';

export async function getMessage(id: number): Promise<Message | undefined> {
  const [message] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id));
  return message;
}

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

export async function getUserConversations(userId: number): Promise<any[]> {
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
  const conversations: any[] = [];
  for (const otherUserId of Array.from(conversationUserIds)) {
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

export async function createMessage(message: InsertMessage): Promise<Message> {
  const [result] = await db
    .insert(messages)
    .values(message)
    .returning();
  return result;
}

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
