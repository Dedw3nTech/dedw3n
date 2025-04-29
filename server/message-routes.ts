import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertMessageSchema } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

// Middleware for authentication check
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Define validation schemas
const sendMessageSchema = insertMessageSchema.extend({
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional()
});

const startConversationSchema = z.object({
  recipientUsername: z.string().min(1, "Recipient username is required"),
  firstMessage: z.string().min(1, "Message content is required"),
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional()
});

export function registerMessageRoutes(app: Express) {
  // Get conversations for the current user
  app.get("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserConversations(userId);
      
      // Enhance participants with current user info
      const currentUser = await storage.getUser(userId);
      if (currentUser) {
        const { password, ...safeCurrentUser } = currentUser;
        conversations.forEach(conversation => {
          // Add or update the current user's info in participants
          const participantIndex = conversation.participants.findIndex(
            (p: any) => p.id === userId
          );
          
          if (participantIndex >= 0) {
            conversation.participants[participantIndex] = {
              ...conversation.participants[participantIndex],
              ...safeCurrentUser,
            };
          }
        });
      }
      
      res.json(conversations);
    } catch (error) {
      console.error("Error getting conversations:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });
  
  // Get messages for a specific conversation
  app.get("/api/messages/conversations/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      // Validate the other user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get messages between these users
      const messages = await storage.getConversationMessages(currentUserId, otherUserId);
      
      // Mark messages from the other user as read
      const unreadMessages = messages.filter(
        msg => msg.senderId === otherUserId && !msg.isRead
      );
      
      // Update read status in parallel
      await Promise.all(
        unreadMessages.map(msg => storage.markMessageAsRead(msg.id))
      );
      
      // Format enhanced response with user details
      const response = {
        messages,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          name: otherUser.name,
          avatar: otherUser.avatar,
          bio: otherUser.bio
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  // Send a message to an existing conversation
  app.post("/api/messages/conversations/:userId", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const receiverId = parseInt(req.params.userId);
      
      // Validate message data
      const validatedData = sendMessageSchema.parse({
        ...req.body,
        senderId,
        receiverId
      });
      
      // Validate the receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Create the message
      const newMessage = await storage.createMessage(validatedData);
      
      // Return enhanced response
      res.status(201).json({
        message: newMessage,
        sender: {
          id: senderId
        },
        receiver: {
          id: receiverId,
          username: receiver.username
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Start a new conversation
  app.post("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      
      // Validate request data
      const validatedData = startConversationSchema.parse(req.body);
      const { recipientUsername, firstMessage, attachmentUrl, attachmentType } = validatedData;
      
      // Find the recipient user
      const recipient = await storage.getUserByUsername(recipientUsername);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Don't allow messaging self
      if (recipient.id === senderId) {
        return res.status(400).json({ message: "Cannot message yourself" });
      }
      
      // Create the first message
      const newMessage = await storage.createMessage({
        senderId,
        receiverId: recipient.id,
        content: firstMessage,
        attachmentUrl,
        attachmentType
      });
      
      // Get sender details
      const sender = await storage.getUser(senderId);
      
      res.status(201).json({
        message: newMessage,
        conversation: {
          id: recipient.id, // Using recipient's ID as conversation ID
          recipientId: recipient.id,
          recipientUsername: recipient.username,
          recipientName: recipient.name,
          recipientAvatar: recipient.avatar,
          senderName: sender?.name,
          lastMessage: newMessage
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error starting conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread/count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadMessagesCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread message count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });
  
  // Mark all messages as read in a conversation
  app.post("/api/messages/mark-read/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      // Get all unread messages from the other user
      const messages = await storage.getConversationMessages(currentUserId, otherUserId);
      const unreadMessages = messages.filter(
        msg => msg.senderId === otherUserId && !msg.isRead
      );
      
      // Mark all as read in parallel
      await Promise.all(
        unreadMessages.map(msg => storage.markMessageAsRead(msg.id))
      );
      
      res.json({ 
        success: true, 
        markedCount: unreadMessages.length 
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });
  
  // Delete a message (soft delete or hide for the user)
  app.delete("/api/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messageId = parseInt(req.params.messageId);
      
      // Get the message
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if user is sender or receiver
      if (message.senderId !== userId && message.receiverId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this message" });
      }
      
      // For now, we're actually deleting the message
      // In a real app, you might want to implement soft delete instead
      // await storage.deleteMessage(messageId);
      
      // For now, let's just mark it with [Message deleted] content
      const updatedMessage = await storage.updateMessageContent(
        messageId, 
        "[Message deleted]"
      );
      
      res.json({ 
        success: true,
        message: "Message deleted successfully",
        messageId: messageId
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  
  // Search messages
  app.get("/api/messages/search", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const results = await storage.searchUserMessages(userId, query);
      res.json(results);
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ message: "Failed to search messages" });
    }
  });
  
  // Send message with attachment
  app.post("/api/messages/with-attachment/:userId", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const receiverId = parseInt(req.params.userId);
      
      // Validate message data
      const validatedData = sendMessageSchema.parse({
        ...req.body,
        senderId,
        receiverId
      });
      
      // Validate the receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Check attachment information
      if (!validatedData.attachmentUrl || !validatedData.attachmentType) {
        return res.status(400).json({ 
          message: "Attachment URL and type are required for attachment messages" 
        });
      }
      
      // Create the message with attachment
      const newMessage = await storage.createMessage(validatedData);
      
      // Return enhanced response
      res.status(201).json({
        message: newMessage,
        sender: {
          id: senderId
        },
        receiver: {
          id: receiverId,
          username: receiver.username
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error sending message with attachment:", error);
      res.status(500).json({ message: "Failed to send message with attachment" });
    }
  });
  
  // Get messaging statistics for the current user
  app.get("/api/messages/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const stats = await storage.getUserMessagingStats(userId);
      
      // Add additional info
      const currentTime = new Date();
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      
      // Get recent message count (last 7 days)
      // This would be more efficient with a direct query counting messages within date range
      // For now, we'll filter the messages after fetching
      const allMessages = await storage.getUserMessages(userId);
      const recentMessages = allMessages.filter(
        msg => msg.createdAt ? new Date(msg.createdAt) >= lastWeekDate : false
      );
      
      // Calculate activity metrics
      let lastActiveDate = new Date();
      if (allMessages.length > 0) {
        const validDates: number[] = [];
        allMessages.forEach(msg => {
          if (msg.createdAt) {
            validDates.push(new Date(msg.createdAt).getTime());
          }
        });
        if (validDates.length > 0) {
          lastActiveDate = new Date(Math.max(...validDates));
        }
      }
      
      const activityData = {
        totalSent: stats.sentCount,
        totalReceived: stats.receivedCount,
        unreadCount: stats.unreadCount,
        conversationCount: stats.conversationCount,
        recentMessageCount: recentMessages.length,
        lastActive: lastActiveDate,
        mostActiveWith: null as any
      };
      
      // Determine most active conversation partner if there are messages
      if (allMessages.length > 0) {
        // Count messages by user
        const messageCounts = new Map<number, number>();
        allMessages.forEach(msg => {
          const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
          messageCounts.set(otherId, (messageCounts.get(otherId) || 0) + 1);
        });
        
        // Find user with most messages
        let maxCount = 0;
        let maxUserId = null;
        messageCounts.forEach((count, id) => {
          if (count > maxCount) {
            maxCount = count;
            maxUserId = id;
          }
        });
        
        // Get most active user details
        if (maxUserId) {
          const mostActiveUser = await storage.getUser(maxUserId);
          if (mostActiveUser) {
            const { password, ...safeUser } = mostActiveUser;
            activityData.mostActiveWith = {
              ...safeUser,
              messageCount: maxCount
            };
          }
        }
      }
      
      res.json(activityData);
    } catch (error) {
      console.error("Error getting messaging stats:", error);
      res.status(500).json({ message: "Failed to get messaging statistics" });
    }
  });
  
  // Clear all messages in a conversation
  app.delete("/api/messages/conversations/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = parseInt(req.params.userId);
      
      // Validate the other user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Clear the conversation
      const success = await storage.clearConversation(currentUserId, otherUserId);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Conversation cleared successfully" 
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: "Failed to clear conversation" 
        });
      }
    } catch (error) {
      console.error("Error clearing conversation:", error);
      res.status(500).json({ message: "Failed to clear conversation" });
    }
  });
}