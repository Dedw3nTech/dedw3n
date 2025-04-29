import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Middleware for authentication check
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export function registerMessageRoutes(app: Express) {
  // Get conversations for the current user
  app.get("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserConversations(userId);
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
      
      res.json(messages);
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
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Validate the receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Create the message
      const newMessage = await storage.createMessage({
        senderId,
        receiverId,
        content
        // isRead will default to false in the schema
      });
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Start a new conversation
  app.post("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const { recipientUsername, firstMessage } = req.body;
      
      if (!recipientUsername) {
        return res.status(400).json({ message: "Recipient username is required" });
      }
      
      if (!firstMessage || !firstMessage.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
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
        content: firstMessage
        // isRead will default to false in the schema
      });
      
      res.status(201).json({
        message: newMessage,
        recipientId: recipient.id,
        recipientUsername: recipient.username
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadMessagesCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread message count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });
}