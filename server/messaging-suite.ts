/**
 * Integrated Messaging Suite
 * 
 * A comprehensive messaging system that includes:
 * - Text messages
 * - Media attachments
 * - Audio calls
 * - Video calls
 * - Real-time status updates
 * - Read receipts
 * - Typing indicators
 */

import { Express, Request, Response, NextFunction } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import { Server } from "http";
import {
  messages,
  users,
  callSessions,
  callMetadata,
  notifications,
  Message,
  User
} from "@shared/schema";
import { storage } from "./storage";
import { z } from "zod";
import { eq, and, or, desc, not, asc, sql } from "drizzle-orm";
import { db } from "./db";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// WebSocket connection store
const connections = new Map<number, Set<WebSocket>>();
// Active call sessions
const activeCalls = new Map<string, {
  callId: string;
  initiatorId: number;
  receiverId: number;
  type: string;
  startTime: Date;
  status: string;
  sessionId?: number;
}>();

// Remove a specific connection for a user
function removeConnection(userId: number, connection: WebSocket) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.delete(connection);
    if (userConnections.size === 0) {
      connections.delete(userId);
      // Broadcast user offline status
      broadcastUserStatus(userId, false);
    }
  }
}

// Broadcast user online/offline status to followers
function broadcastUserStatus(userId: number, isOnline: boolean) {
  // We need to notify all users who follow this user or have active conversations with them
  // This would be implemented using a separate query to find relevant users
  // For now, we'll broadcast to all users for simplicity
  const message = JSON.stringify({
    type: "status_update",
    userId: userId,
    status: isOnline ? "online" : "offline",
    timestamp: new Date().toISOString()
  });
  
  connections.forEach((userConnections, recipientId) => {
    if (recipientId !== userId) { // Don't send to the user themselves
      userConnections.forEach(conn => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    }
  });
}

// Send a message to a specific user through all their connections
function sendToUser(userId: number, data: any) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    const message = JSON.stringify(data);
    userConnections.forEach(conn => {
      if (conn.readyState === WebSocket.OPEN) {
        conn.send(message);
      }
    });
    return true;
  }
  return false;
}

// Handle text chat messages
async function handleChatMessage(senderId: number, data: any) {
  try {
    // Validate message data
    const messageData = {
      senderId,
      receiverId: data.receiverId,
      content: data.content,
      messageType: data.messageType || "text",
      attachmentUrl: data.attachmentUrl,
      attachmentType: data.attachmentType
    };
    
    // Create the message in database
    const newMessage = await storage.createMessage(messageData);
    
    // Format the response
    const messageResponse = {
      type: "new_message",
      message: newMessage
    };
    
    // Send to the recipient if they're online
    const delivered = sendToUser(data.receiverId, messageResponse);
    
    // Also send back to sender for confirmation
    sendToUser(senderId, {
      type: "message_sent",
      messageId: newMessage.id,
      receiverId: data.receiverId,
      delivered,
      timestamp: new Date().toISOString()
    });
    
    // Create a notification for the recipient
    await db.insert(notifications).values({
      userId: data.receiverId,
      type: "message",
      content: `New message from ${senderId}`,
      isRead: false,
      sourceId: newMessage.id,
      sourceType: "message",
      createdAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error handling chat message:", error);
    return false;
  }
}

// Handle typing indicators
function handleTypingIndicator(senderId: number, data: any) {
  try {
    // Send typing indicator to recipient
    return sendToUser(data.receiverId, {
      type: "typing_indicator",
      senderId,
      status: data.status, // 'typing', 'stopped'
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error handling typing indicator:", error);
    return false;
  }
}

// Handle read receipts
async function handleReadReceipt(userId: number, data: any) {
  try {
    // Mark messages as read
    const messageIds = Array.isArray(data.messageIds) ? data.messageIds : [data.messageIds];
    
    for (const messageId of messageIds) {
      await storage.markMessageAsRead(messageId);
    }
    
    // Send read receipt to the original sender
    if (data.senderId) {
      sendToUser(data.senderId, {
        type: "read_receipt",
        readBy: userId,
        messageIds,
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error handling read receipt:", error);
    return false;
  }
}

// Handle call requests
async function handleCallRequest(initiatorId: number, data: any) {
  try {
    const receiverId = data.receiverId;
    const callType = data.callType || "audio"; // audio or video
    
    // Generate unique call ID
    const callId = randomUUID();
    
    // Store call session information
    activeCalls.set(callId, {
      callId,
      initiatorId,
      receiverId,
      type: callType,
      startTime: new Date(),
      status: "requested"
    });
    
    // Create a call session record in the database
    const [callSession] = await db.insert(callSessions).values({
      callId,
      initiatorId,
      receiverId,
      callType,
      status: "requested",
      startedAt: new Date()
    }).returning();
    
    // Update active call with session ID
    const activeCall = activeCalls.get(callId);
    if (activeCall) {
      activeCall.sessionId = callSession.id;
    }
    
    // Send call request to recipient
    const delivered = sendToUser(receiverId, {
      type: "call_request",
      callId,
      initiatorId,
      callType,
      timestamp: new Date().toISOString()
    });
    
    // Send response to initiator
    sendToUser(initiatorId, {
      type: "call_initiated",
      callId,
      receiverId,
      callType,
      delivered,
      timestamp: new Date().toISOString()
    });
    
    // Create a message for the call request
    await storage.createMessage({
      senderId: initiatorId,
      receiverId,
      content: `${callType} call`,
      messageType: "call_request",
    });
    
    return callId;
  } catch (error) {
    console.error("Error handling call request:", error);
    return null;
  }
}

// Handle call responses (accept/decline)
async function handleCallResponse(responderId: number, data: any) {
  try {
    const { callId, response } = data; // response: "accept" or "decline"
    const activeCall = activeCalls.get(callId);
    
    if (!activeCall) {
      throw new Error(`Call ${callId} not found`);
    }
    
    if (activeCall.receiverId !== responderId) {
      throw new Error("Unauthorized to respond to this call");
    }
    
    if (response === "accept") {
      // Update call status
      activeCall.status = "ongoing";
      
      // Update database call session
      if (activeCall.sessionId) {
        await db.update(callSessions)
          .set({ status: "ongoing" })
          .where(eq(callSessions.id, activeCall.sessionId));
      }
      
      // Notify the initiator
      sendToUser(activeCall.initiatorId, {
        type: "call_accepted",
        callId,
        responderId,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } else if (response === "decline") {
      // Update call status
      activeCall.status = "declined";
      
      // Update database call session
      if (activeCall.sessionId) {
        await db.update(callSessions)
          .set({ 
            status: "declined",
            endedAt: new Date(), 
            duration: Math.round((new Date().getTime() - activeCall.startTime.getTime()) / 1000)
          })
          .where(eq(callSessions.id, activeCall.sessionId));
      }
      
      // Notify the initiator
      sendToUser(activeCall.initiatorId, {
        type: "call_declined",
        callId,
        responderId,
        timestamp: new Date().toISOString()
      });
      
      // Create a message for the declined call
      await storage.createMessage({
        senderId: responderId,
        receiverId: activeCall.initiatorId,
        content: "Call declined",
        messageType: "call_missed",
      });
      
      // Remove the call from active calls
      activeCalls.delete(callId);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error handling call response:", error);
    return false;
  }
}

// Handle call ending
async function handleCallEnd(userId: number, data: any) {
  try {
    const { callId, reason } = data;
    const activeCall = activeCalls.get(callId);
    
    if (!activeCall) {
      throw new Error(`Call ${callId} not found`);
    }
    
    if (activeCall.initiatorId !== userId && activeCall.receiverId !== userId) {
      throw new Error("Unauthorized to end this call");
    }
    
    // Calculate call duration
    const duration = Math.round((new Date().getTime() - activeCall.startTime.getTime()) / 1000);
    
    // Update database call session
    if (activeCall.sessionId) {
      await db.update(callSessions)
        .set({ 
          status: "ended",
          endedAt: new Date(), 
          duration
        })
        .where(eq(callSessions.id, activeCall.sessionId));
      
      // Store call quality and metrics if provided
      if (data.metrics) {
        await db.insert(callMetadata).values({
          callSessionId: activeCall.sessionId,
          metadata: data.metrics
        });
      }
    }
    
    // Notify the other participant
    const otherParticipantId = userId === activeCall.initiatorId 
      ? activeCall.receiverId 
      : activeCall.initiatorId;
    
    sendToUser(otherParticipantId, {
      type: "call_ended",
      callId,
      endedBy: userId,
      duration,
      reason,
      timestamp: new Date().toISOString()
    });
    
    // Create a message for the call
    await storage.createMessage({
      senderId: userId,
      receiverId: otherParticipantId,
      content: `${activeCall.type} call (${duration} seconds)`,
      messageType: "call_ended",
    });
    
    // Remove the call from active calls
    activeCalls.delete(callId);
    
    return true;
  } catch (error) {
    console.error("Error handling call end:", error);
    return false;
  }
}

// Handle ICE candidates and signaling for WebRTC
function handleSignaling(userId: number, data: any) {
  try {
    const { callId, recipientId, signal } = data;
    
    // Check if call exists and user is a participant
    const activeCall = activeCalls.get(callId);
    if (!activeCall) {
      throw new Error(`Call ${callId} not found`);
    }
    
    if (activeCall.initiatorId !== userId && activeCall.receiverId !== userId) {
      throw new Error("Unauthorized to send signals for this call");
    }
    
    // Forward signal to the other participant
    return sendToUser(recipientId, {
      type: "signal",
      callId,
      senderId: userId,
      signal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error handling signaling:", error);
    return false;
  }
}

// Setup WebSocket server
function setupWebSockets(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on("connection", (ws) => {
    // User ID will be set after authentication
    let userId: number | null = null;
    
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === "authenticate") {
          if (data.userId) {
            userId = parseInt(data.userId);
            
            // Store the connection
            let userConnections = connections.get(userId);
            if (!userConnections) {
              userConnections = new Set();
              connections.set(userId, userConnections);
            }
            userConnections.add(ws);
            
            // Broadcast online status
            broadcastUserStatus(userId, true);
            
            // Confirm authentication
            ws.send(JSON.stringify({
              type: "authenticated",
              userId,
              timestamp: new Date().toISOString()
            }));
          }
          return;
        }
        
        // All other message types require authentication
        if (userId === null) {
          ws.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        // Handle different message types
        switch (data.type) {
          case "message":
            await handleChatMessage(userId, data);
            break;
            
          case "typing":
            handleTypingIndicator(userId, data);
            break;
            
          case "read_receipt":
            await handleReadReceipt(userId, data);
            break;
            
          case "call_request":
            await handleCallRequest(userId, data);
            break;
            
          case "call_response":
            await handleCallResponse(userId, data);
            break;
            
          case "call_end":
            await handleCallEnd(userId, data);
            break;
            
          case "signal":
            handleSignaling(userId, data);
            break;
            
          case "ping":
            ws.send(JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString()
            }));
            break;
            
          default:
            ws.send(JSON.stringify({
              type: "error",
              message: "Unknown message type",
              timestamp: new Date().toISOString()
            }));
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format or server error",
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    ws.on("close", () => {
      if (userId !== null) {
        removeConnection(userId, ws);
      }
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      if (userId !== null) {
        removeConnection(userId, ws);
      }
    });
  });
  
  return wss;
}

// Register HTTP routes for messaging
export function registerMessagingSuite(app: Express, server: Server) {
  // Create WebSocket server
  const wss = setupWebSockets(server);
  
  // Get conversations for the current user
  app.get("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserConversations(userId);
      
      // Add online status information
      const enhancedConversations = conversations.map(conversation => {
        const partnerId = conversation.participants.find((p: any) => p.id !== userId)?.id;
        return {
          ...conversation,
          isOnline: partnerId ? connections.has(partnerId) : false
        };
      });
      
      res.json(enhancedConversations);
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
      
      // Check if the other user is online
      const isOnline = connections.has(otherUserId);
      
      // Check if there's an active call with this user
      let activeCall = null;
      for (const [callId, call] of activeCalls.entries()) {
        if ((call.initiatorId === currentUserId && call.receiverId === otherUserId) ||
            (call.initiatorId === otherUserId && call.receiverId === currentUserId)) {
          activeCall = {
            callId,
            type: call.type,
            status: call.status,
            initiatorId: call.initiatorId
          };
          break;
        }
      }
      
      // Format enhanced response with user details
      const response = {
        messages,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          name: otherUser.name,
          avatar: otherUser.avatar,
          bio: otherUser.bio,
          isOnline
        },
        activeCall
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
      
      // Validate the receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Create the message
      const newMessage = await storage.createMessage({
        senderId,
        receiverId,
        content: req.body.content,
        messageType: req.body.messageType || "text",
        attachmentUrl: req.body.attachmentUrl,
        attachmentType: req.body.attachmentType
      });
      
      // Check if receiver is online and notify them via WebSocket
      const delivered = sendToUser(receiverId, {
        type: "new_message",
        message: newMessage
      });
      
      // Return enhanced response
      res.status(201).json({
        message: newMessage,
        delivered,
        sender: {
          id: senderId
        },
        receiver: {
          id: receiverId,
          username: receiver.username,
          isOnline: connections.has(receiverId)
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Start a new conversation
  app.post("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const senderId = (req.user as any).id;
      const { recipientUsername, firstMessage, attachmentUrl, attachmentType, messageType } = req.body;
      
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
        messageType: messageType || "text",
        attachmentUrl,
        attachmentType
      });
      
      // Check if recipient is online and notify them
      const delivered = sendToUser(recipient.id, {
        type: "new_message",
        message: newMessage
      });
      
      // Get sender details
      const sender = await storage.getUser(senderId);
      
      res.status(201).json({
        message: newMessage,
        delivered,
        conversation: {
          id: recipient.id, // Using recipient's ID as conversation ID
          recipientId: recipient.id,
          recipientUsername: recipient.username,
          recipientName: recipient.name,
          recipientAvatar: recipient.avatar,
          senderName: sender?.name,
          lastMessage: newMessage,
          isOnline: connections.has(recipient.id)
        }
      });
    } catch (error) {
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
      
      // Send read receipts via WebSocket
      sendToUser(otherUserId, {
        type: "read_receipt",
        readBy: currentUserId,
        messageIds: unreadMessages.map(msg => msg.id),
        timestamp: new Date().toISOString()
      });
      
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
      
      // Use soft delete by replacing content
      const updatedMessage = await storage.updateMessageContent(
        messageId, 
        "[Message deleted]"
      );
      
      // Notify the other user if they're online
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      sendToUser(otherUserId, {
        type: "message_deleted",
        messageId: messageId,
        timestamp: new Date().toISOString()
      });
      
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
  
  // Get call history
  app.get("/api/calls/history", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Get all calls involving this user
      const calls = await db.select({
        id: callSessions.id,
        callId: callSessions.callId,
        initiatorId: callSessions.initiatorId,
        receiverId: callSessions.receiverId,
        callType: callSessions.callType,
        status: callSessions.status,
        startedAt: callSessions.startedAt,
        endedAt: callSessions.endedAt,
        duration: callSessions.duration
      })
      .from(callSessions)
      .where(or(
        eq(callSessions.initiatorId, userId),
        eq(callSessions.receiverId, userId)
      ))
      .orderBy(desc(callSessions.startedAt))
      .limit(50);
      
      // Get unique user IDs
      const userIds = new Set<number>();
      calls.forEach(call => {
        userIds.add(call.initiatorId);
        userIds.add(call.receiverId);
      });
      
      // Get user details
      const userDetails = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar
      })
      .from(users)
      .where(users.id.in([...userIds]));
      
      // Create a map for quick lookup
      const userMap = new Map();
      userDetails.forEach(user => userMap.set(user.id, user));
      
      // Add detailed information to each call
      const enhancedCalls = calls.map(call => {
        const otherUserId = call.initiatorId === userId ? call.receiverId : call.initiatorId;
        return {
          ...call,
          direction: call.initiatorId === userId ? "outgoing" : "incoming",
          otherUser: userMap.get(otherUserId) || { id: otherUserId },
          missed: call.status === "missed" || (call.status === "requested" && !call.endedAt)
        };
      });
      
      res.json(enhancedCalls);
    } catch (error) {
      console.error("Error getting call history:", error);
      res.status(500).json({ message: "Failed to get call history" });
    }
  });
  
  // Get call details
  app.get("/api/calls/:callId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const callId = parseInt(req.params.callId);
      
      // Get call details
      const [call] = await db.select()
        .from(callSessions)
        .where(eq(callSessions.id, callId));
      
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }
      
      // Verify the user was part of this call
      if (call.initiatorId !== userId && call.receiverId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this call" });
      }
      
      // Get additional call metadata if it exists
      const [metadata] = await db.select()
        .from(callMetadata)
        .where(eq(callMetadata.callSessionId, callId));
      
      // Get user details for both participants
      const [initiator] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar
      })
      .from(users)
      .where(eq(users.id, call.initiatorId));
      
      const [receiver] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar
      })
      .from(users)
      .where(eq(users.id, call.receiverId));
      
      res.json({
        ...call,
        initiator,
        receiver,
        direction: call.initiatorId === userId ? "outgoing" : "incoming",
        metadata: metadata?.metadata || {}
      });
    } catch (error) {
      console.error("Error getting call details:", error);
      res.status(500).json({ message: "Failed to get call details" });
    }
  });
  
  // Get messaging statistics
  app.get("/api/messages/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const stats = await storage.getUserMessagingStats(userId);
      
      // Add call statistics
      const callStats = await db.select({
        totalCalls: sql`count(*)`,
        audioCalls: sql`sum(case when ${callSessions.callType} = 'audio' then 1 else 0 end)`,
        videoCalls: sql`sum(case when ${callSessions.callType} = 'video' then 1 else 0 end)`,
        totalDuration: sql`sum(${callSessions.duration})`,
        missedCalls: sql`sum(case when ${callSessions.status} = 'missed' then 1 else 0 end)`,
        outgoingCalls: sql`sum(case when ${callSessions.initiatorId} = ${userId} then 1 else 0 end)`,
        incomingCalls: sql`sum(case when ${callSessions.receiverId} = ${userId} then 1 else 0 end)`,
      })
      .from(callSessions)
      .where(or(
        eq(callSessions.initiatorId, userId),
        eq(callSessions.receiverId, userId)
      ));
      
      // Combine messaging and call stats
      const combinedStats = {
        ...stats,
        calls: callStats[0]
      };
      
      res.json(combinedStats);
    } catch (error) {
      console.error("Error getting messaging statistics:", error);
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
  
  return wss;
}