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

import type { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { eq, and, desc, sql } from "drizzle-orm";
import { messages, callSessions, callMetadata, users } from "@shared/schema";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

// WebSocket connections
interface Connection {
  userId: number;
  socket: WebSocket;
  authenticated: boolean;
  pingInterval: NodeJS.Timeout;
}

// Call state management
interface ActiveCall {
  callId: string;
  initiatorId: number;
  receiverId: number;
  type: "audio" | "video";
  startTime: Date;
  status: "requested" | "ongoing" | "declined" | "ended" | "missed";
  sessionId?: number; // Database reference
}

// Global state
const connections = new Map<number, Set<WebSocket>>();
const activeCalls = new Map<string, ActiveCall>();

// Utility functions
function removeConnection(userId: number, connection: WebSocket) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.delete(connection);
    if (userConnections.size === 0) {
      connections.delete(userId);
      
      // Broadcast offline status
      broadcastUserStatus(userId, false);
    }
  }
}

function broadcastUserStatus(userId: number, isOnline: boolean) {
  // Determine which users are interested in this user's status
  // For now, broadcast to all connected users
  const message = JSON.stringify({
    type: 'status_update',
    userId: userId,
    status: isOnline ? 'online' : 'offline',
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

function sendToUser(userId: number, data: any) {
  const userConnections = connections.get(userId);
  if (!userConnections) return false;
  
  const message = JSON.stringify(data);
  let delivered = false;
  
  userConnections.forEach(conn => {
    if (conn.readyState === WebSocket.OPEN) {
      conn.send(message);
      delivered = true;
    }
  });
  
  return delivered;
}

// Message handling
async function handleChatMessage(senderId: number, data: any) {
  try {
    // Check if we have all required fields
    if (!data.receiverId || !data.content) {
      return false;
    }
    
    // Create the message in the database
    const messageData = {
      senderId: senderId,
      receiverId: data.receiverId,
      content: data.content,
      messageType: data.messageType || "text",
      attachmentUrl: data.attachmentUrl,
      attachmentType: data.attachmentType,
      isRead: false
    };
    
    const message = await storage.createMessage(messageData);
    
    // Send message to recipient if they're online
    const delivered = sendToUser(data.receiverId, {
      type: 'new_message',
      message: message
    });
    
    // Send delivery confirmation to sender
    sendToUser(senderId, {
      type: 'message_sent',
      messageId: message.id,
      receiverId: data.receiverId,
      delivered: delivered,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error handling chat message:', error);
    return false;
  }
}

function handleTypingIndicator(senderId: number, data: any) {
  try {
    // Check if recipient exists
    if (!data.receiverId) return false;
    
    // Send typing indicator
    sendToUser(data.receiverId, {
      type: 'typing_indicator',
      senderId: senderId,
      status: data.status, // 'typing', 'stopped'
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error handling typing indicator:', error);
    return false;
  }
}

async function handleReadReceipt(userId: number, data: any) {
  try {
    // Update message read status in database
    if (data.messageIds && Array.isArray(data.messageIds)) {
      for (const messageId of data.messageIds) {
        await storage.markMessageAsRead(messageId);
      }
    } else if (data.messageId) {
      await storage.markMessageAsRead(data.messageId);
    }
    
    // Notify sender if they're online
    if (data.senderId) {
      sendToUser(data.senderId, {
        type: 'read_receipt',
        readBy: userId,
        messageIds: data.messageIds || [data.messageId],
        timestamp: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error handling read receipt:', error);
    return false;
  }
}

// Call handling
async function handleCallRequest(initiatorId: number, data: any) {
  try {
    if (!data.receiverId || !data.type) {
      return { success: false, error: "Missing required parameters" };
    }
    
    // Check if the receiver exists
    const receiver = await storage.getUser(data.receiverId);
    if (!receiver) {
      return { success: false, error: "Recipient not found" };
    }
    
    // Check if receiver is online
    const isOnline = connections.has(data.receiverId);
    if (!isOnline) {
      return { success: false, error: "Recipient is offline" };
    }
    
    // Generate a unique call ID
    const callId = `call_${Date.now()}_${initiatorId}_${data.receiverId}`;
    
    // Create call session in database
    const callSession = await storage.createCallSession({
      initiatorId: initiatorId,
      receiverId: data.receiverId,
      type: data.type,
      status: "requested",
      startTime: new Date(),
      endTime: null,
      duration: 0
    });
    
    // Store active call in memory
    const call: ActiveCall = {
      callId,
      initiatorId,
      receiverId: data.receiverId,
      type: data.type,
      startTime: new Date(),
      status: "requested",
      sessionId: callSession.id
    };
    
    activeCalls.set(callId, call);
    
    // Send call request to recipient
    const delivered = sendToUser(data.receiverId, {
      type: 'call_request',
      callId,
      initiatorId,
      callType: data.type,
      timestamp: new Date().toISOString()
    });
    
    // Set a timeout to mark call as missed if not answered
    setTimeout(async () => {
      const activeCall = activeCalls.get(callId);
      if (activeCall && activeCall.status === "requested") {
        // Update call status to missed
        activeCall.status = "missed";
        
        // Update database
        await storage.updateCallSession(activeCall.sessionId!, {
          status: "missed",
          endTime: new Date(),
          duration: 0
        });
        
        // Notify initiator
        sendToUser(initiatorId, {
          type: 'call_missed',
          callId,
          timestamp: new Date().toISOString()
        });
        
        // Add missed call notification for receiver
        await storage.createNotification({
          userId: data.receiverId,
          type: "missed_call",
          content: `Missed ${data.type} call`,
          relatedUserId: initiatorId,
          isRead: false
        });
      }
    }, 30000); // 30 seconds timeout
    
    return { 
      success: true, 
      callId, 
      delivered 
    };
  } catch (error) {
    console.error('Error handling call request:', error);
    return { success: false, error: "Internal server error" };
  }
}

async function handleCallResponse(responderId: number, data: any) {
  try {
    if (!data.callId || !data.response) {
      return { success: false, error: "Missing required parameters" };
    }
    
    const call = activeCalls.get(data.callId);
    if (!call) {
      return { success: false, error: "Call not found" };
    }
    
    if (call.receiverId !== responderId) {
      return { success: false, error: "Not authorized to respond to this call" };
    }
    
    if (data.response === "accept") {
      // Update call status
      call.status = "ongoing";
      
      // Update database
      await storage.updateCallSession(call.sessionId!, {
        status: "ongoing"
      });
      
      // Notify initiator
      sendToUser(call.initiatorId, {
        type: 'call_accepted',
        callId: data.callId,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, action: "accepted" };
    } else if (data.response === "decline") {
      // Update call status
      call.status = "declined";
      
      // Update database
      await storage.updateCallSession(call.sessionId!, {
        status: "declined",
        endTime: new Date(),
        duration: 0
      });
      
      // Notify initiator
      sendToUser(call.initiatorId, {
        type: 'call_declined',
        callId: data.callId,
        timestamp: new Date().toISOString()
      });
      
      // Remove from active calls
      activeCalls.delete(data.callId);
      
      return { success: true, action: "declined" };
    } else {
      return { success: false, error: "Invalid response" };
    }
  } catch (error) {
    console.error('Error handling call response:', error);
    return { success: false, error: "Internal server error" };
  }
}

async function handleCallEnd(userId: number, data: any) {
  try {
    if (!data.callId) {
      return { success: false, error: "Missing call ID" };
    }
    
    const call = activeCalls.get(data.callId);
    if (!call) {
      return { success: false, error: "Call not found" };
    }
    
    // Check if user is authorized to end this call
    if (call.initiatorId !== userId && call.receiverId !== userId) {
      return { success: false, error: "Not authorized to end this call" };
    }
    
    // Calculate duration
    const endTime = new Date();
    const durationMs = endTime.getTime() - call.startTime.getTime();
    const durationSeconds = Math.round(durationMs / 1000);
    
    // Update database
    await storage.updateCallSession(call.sessionId!, {
      status: "ended",
      endTime,
      duration: durationSeconds
    });
    
    // Notify the other participant
    const otherParticipantId = userId === call.initiatorId ? call.receiverId : call.initiatorId;
    sendToUser(otherParticipantId, {
      type: 'call_ended',
      callId: data.callId,
      duration: durationSeconds,
      timestamp: endTime.toISOString()
    });
    
    // Remove from active calls
    activeCalls.delete(data.callId);
    
    return { 
      success: true, 
      duration: durationSeconds 
    };
  } catch (error) {
    console.error('Error handling call end:', error);
    return { success: false, error: "Internal server error" };
  }
}

// WebRTC signaling
function handleSignaling(userId: number, data: any) {
  try {
    if (!data.callId || !data.recipientId || !data.signal) {
      return { success: false, error: "Missing required parameters" };
    }
    
    const call = activeCalls.get(data.callId);
    if (!call) {
      return { success: false, error: "Call not found" };
    }
    
    // Check if user is authorized to send signals for this call
    if (call.initiatorId !== userId && call.receiverId !== userId) {
      return { success: false, error: "Not authorized for this call" };
    }
    
    // Check if recipient is a participant
    const recipientId = parseInt(data.recipientId);
    if (call.initiatorId !== recipientId && call.receiverId !== recipientId) {
      return { success: false, error: "Recipient is not a participant in this call" };
    }
    
    // Forward the signal
    const delivered = sendToUser(recipientId, {
      type: 'signal',
      callId: data.callId,
      fromUserId: userId,
      signal: data.signal,
      timestamp: new Date().toISOString()
    });
    
    return { 
      success: delivered, 
      delivered 
    };
  } catch (error) {
    console.error('Error handling signaling:', error);
    return { success: false, error: "Internal server error" };
  }
}

// WebSocket server setup
function setupWebSockets(server: Server) {
  const wss = new WebSocketServer({ 
    server: server, 
    path: '/ws',
    clientTracking: true 
  });
  
  console.log('WebSocket server initialized at /ws path');
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    let userId: number | null = null;
    let authenticated = false;
    
    // Setup ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (error) {
          console.error('Error pinging WebSocket:', error);
        }
      }
    }, 30000); // 30 second ping interval
    
    ws.on('message', async (message) => {
      try {
        // Parse message
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'authenticate') {
          if (data.userId && typeof data.userId === 'number') {
            userId = data.userId;
            
            // Store the connection for this user
            let userConnections = connections.get(userId);
            if (!userConnections) {
              userConnections = new Set();
              connections.set(userId, userConnections);
            }
            userConnections.add(ws);
            
            authenticated = true;
            
            // Send acknowledgment
            ws.send(JSON.stringify({
              type: 'authenticated',
              userId: userId,
              timestamp: new Date().toISOString()
            }));
            
            console.log(`User ${userId} authenticated via WebSocket`);
            
            // Broadcast online status
            broadcastUserStatus(userId, true);
            
            // Send any pending call requests
            for (const [callId, call] of activeCalls.entries()) {
              if (call.receiverId === userId && call.status === "requested") {
                ws.send(JSON.stringify({
                  type: 'call_request',
                  callId,
                  initiatorId: call.initiatorId,
                  callType: call.type,
                  timestamp: new Date().toISOString()
                }));
              }
            }
          }
          return;
        }
        
        // All other message types require authentication
        if (!authenticated) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Not authenticated',
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        // Handle different message types
        let response;
        switch (data.type) {
          case 'message':
            response = await handleChatMessage(userId!, data);
            break;
            
          case 'typing':
            response = handleTypingIndicator(userId!, data);
            break;
            
          case 'read_receipt':
            response = await handleReadReceipt(userId!, data);
            break;
            
          case 'call_request':
            response = await handleCallRequest(userId!, data);
            break;
            
          case 'call_response':
            response = await handleCallResponse(userId!, data);
            break;
            
          case 'call_end':
            response = await handleCallEnd(userId!, data);
            break;
            
          case 'signal':
            response = handleSignaling(userId!, data);
            break;
            
          case 'ping':
            // Client-initiated ping/pong for connection testing
            response = { type: 'pong', timestamp: new Date().toISOString() };
            break;
            
          default:
            response = { 
              type: 'error', 
              message: 'Unknown message type', 
              timestamp: new Date().toISOString() 
            };
        }
        
        if (response) {
          ws.send(JSON.stringify(response));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          }));
        }
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Clear ping interval
      clearInterval(pingInterval);
      
      // Remove connection from user's connections
      if (userId !== null) {
        removeConnection(userId, ws);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      
      // Clear ping interval
      clearInterval(pingInterval);
      
      // Remove connection from user's connections
      if (userId !== null) {
        removeConnection(userId, ws);
      }
    });
  });
  
  return wss;
}

// Main API routes registration
export function registerMessagingSuite(app: Express, server: Server) {
  // Set up WebSocket server
  const wss = setupWebSockets(server);
  
  // Message APIs
  
  // Get messages between users
  app.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = parseInt(req.params.userId);
      
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const messages = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
      res.json(messages);
      
      // Mark messages as read
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId === otherUserId);
      if (unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await storage.markMessageAsRead(msg.id);
        }
        
        // Notify other user about read messages
        sendToUser(otherUserId, {
          type: 'read_receipt',
          readBy: currentUserId,
          messageIds: unreadMessages.map(msg => msg.id),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  // Get conversations list
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });
  
  // Send a message
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const senderId = req.user!.id;
      const { receiverId, content, attachmentUrl, attachmentType, messageType } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if recipient exists
      const recipient = await storage.getUser(receiverId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Create message
      const message = await storage.createMessage({
        senderId,
        receiverId,
        content,
        messageType: messageType || "text",
        attachmentUrl,
        attachmentType,
        isRead: false
      });
      
      res.status(201).json(message);
      
      // Send real-time notification if recipient is online
      sendToUser(receiverId, {
        type: 'new_message',
        message
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Delete a message
  app.delete("/api/messages/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      // Get the message
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if user is the sender
      if (message.senderId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this message" });
      }
      
      // Delete the message
      await storage.deleteMessage(messageId);
      res.status(200).json({ message: "Message deleted" });
      
      // Notify the recipient if they're online
      sendToUser(message.receiverId, {
        type: 'message_deleted',
        messageId
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  
  // Mark messages as read
  app.post("/api/messages/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { messageIds, senderId } = req.body;
      
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ message: "Invalid message IDs" });
      }
      
      // Mark messages as read
      for (const messageId of messageIds) {
        await storage.markMessageAsRead(messageId);
      }
      
      res.status(200).json({ message: "Messages marked as read" });
      
      // Notify sender if they're online
      if (senderId) {
        sendToUser(senderId, {
          type: 'read_receipt',
          readBy: userId,
          messageIds,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread/count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unread message count:', error);
      res.status(500).json({ message: "Failed to get unread message count" });
    }
  });
  
  // Call APIs
  
  // Get call history
  app.get("/api/calls/history", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const callHistory = await storage.getUserCallHistory(userId, limit);
      res.json(callHistory);
    } catch (error) {
      console.error('Error getting call history:', error);
      res.status(500).json({ message: "Failed to get call history" });
    }
  });
  
  // Initiate a call
  app.post("/api/calls", isAuthenticated, async (req, res) => {
    try {
      const initiatorId = req.user!.id;
      const { receiverId, type } = req.body;
      
      if (!receiverId || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      if (type !== "audio" && type !== "video") {
        return res.status(400).json({ message: "Invalid call type" });
      }
      
      // Check if recipient exists
      const recipient = await storage.getUser(receiverId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Check if recipient is online
      const isOnline = connections.has(receiverId);
      if (!isOnline) {
        return res.status(400).json({ message: "Recipient is offline" });
      }
      
      // Initiate call
      const result = await handleCallRequest(initiatorId, { receiverId, type });
      
      if (result.success) {
        res.status(201).json({ 
          callId: result.callId,
          status: "initiated" 
        });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      res.status(500).json({ message: "Failed to initiate call" });
    }
  });
  
  // Get active calls
  app.get("/api/calls/active", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Find active calls for this user
      const userActiveCalls = [];
      for (const [callId, call] of activeCalls.entries()) {
        if (call.initiatorId === userId || call.receiverId === userId) {
          userActiveCalls.push({
            callId,
            initiatorId: call.initiatorId,
            receiverId: call.receiverId,
            type: call.type,
            status: call.status,
            startTime: call.startTime
          });
        }
      }
      
      res.json(userActiveCalls);
    } catch (error) {
      console.error('Error getting active calls:', error);
      res.status(500).json({ message: "Failed to get active calls" });
    }
  });
  
  // End a call
  app.post("/api/calls/:callId/end", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { callId } = req.params;
      
      const result = await handleCallEnd(userId, { callId });
      
      if (result.success) {
        res.status(200).json({ 
          message: "Call ended",
          duration: result.duration
        });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error('Error ending call:', error);
      res.status(500).json({ message: "Failed to end call" });
    }
  });
  
  // Call statistics for a user
  app.get("/api/calls/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const stats = await storage.getUserCallStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting call stats:', error);
      res.status(500).json({ message: "Failed to get call statistics" });
    }
  });
  
  // User online status APIs
  
  // Get online status for a list of users
  app.post("/api/users/status", isAuthenticated, async (req, res) => {
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }
      
      const statuses = {};
      for (const userId of userIds) {
        statuses[userId] = connections.has(userId) ? "online" : "offline";
      }
      
      res.json(statuses);
    } catch (error) {
      console.error('Error getting user statuses:', error);
      res.status(500).json({ message: "Failed to get user statuses" });
    }
  });
  
  // Get a specific user's online status
  app.get("/api/users/:userId/status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const isOnline = connections.has(userId);
      res.json({ status: isOnline ? "online" : "offline" });
    } catch (error) {
      console.error('Error getting user status:', error);
      res.status(500).json({ message: "Failed to get user status" });
    }
  });
  
  return wss;
}