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

import type { Express, Request, Response } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { authenticate } from "./jwt-auth";
import { verifyToken } from "./jwt-auth"; // Import for token verification
import { isAuthenticated as unifiedIsAuthenticated } from "./unified-auth"; // Import unified authentication middleware

// Connection management
const connections = new Map<number, Set<WebSocket>>();
const activeCalls = new Map<string, ActiveCall>();

// Connection statistics
interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  authFailures: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  lastError?: {
    time: Date;
    message: string;
    code?: number;
  };
}

// Global connection stats for the server
const connectionStats: ConnectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  authFailures: 0,
  messagesSent: 0,
  messagesReceived: 0,
  errors: 0
};

// Types
interface Connection {
  userId: number;
  socket: WebSocket;
  authenticated: boolean;
  pingInterval: NodeJS.Timeout;
}

interface ActiveCall {
  callId: string;
  initiatorId: number;
  receiverId: number;
  type: "audio" | "video";
  startTime: Date;
  status: "requested" | "ongoing" | "declined" | "ended" | "missed";
  sessionId?: number; // Database reference
}

// Connection management functions
function removeConnection(userId: number, connection: WebSocket) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.delete(connection);
    if (userConnections.size === 0) {
      connections.delete(userId);
      broadcastUserStatus(userId, false);
    }
  }
}

function broadcastUserStatus(userId: number, isOnline: boolean) {
  // Find conversations with this user
  const conversationPartners = new Set<number>();
  
  // For each user that has a connection
  for (const [id, userConnections] of connections.entries()) {
    // Skip the user whose status changed
    if (id === userId) continue;
    
    // Add to conversation partners
    conversationPartners.add(id);
    
    // Send status update
    for (const conn of userConnections) {
      if (conn.readyState === WebSocket.OPEN) {
        conn.send(JSON.stringify({
          type: 'status_update',
          userId: userId,
          isOnline: isOnline,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
}

function sendToUser(userId: number, data: any): boolean {
  const userConnections = connections.get(userId);
  if (!userConnections || userConnections.size === 0) {
    return false;
  }
  
  // Send to all connections for this user
  let delivered = false;
  for (const connection of userConnections) {
    if (connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(data));
      delivered = true;
    }
  }
  
  return delivered;
}

// Message handling
async function handleChatMessage(senderId: number, data: any) {
  try {
    if (!data.receiverId || !data.content) {
      return { success: false, error: "Missing required parameters" };
    }
    
    // Create message in database
    const message = await storage.createMessage({
      senderId,
      receiverId: data.receiverId,
      content: data.content,
      messageType: data.messageType || "text",
      attachmentUrl: data.attachmentUrl,
      attachmentType: data.attachmentType,
      isRead: false
    });
    
    // Send to recipient if online
    const delivered = sendToUser(data.receiverId, {
      type: 'new_message',
      message
    });
    
    // Create notification
    await storage.createNotification({
      userId: data.receiverId,
      type: 'message',
      title: "New message",
      content: data.content.substring(0, 50) + (data.content.length > 50 ? "..." : ""),
      sourceId: senderId,
      isRead: false
    });
    
    return { success: true, message, delivered };
  } catch (error) {
    console.error('Error handling chat message:', error);
    return { success: false, error: "Internal server error" };
  }
}

function handleTypingIndicator(senderId: number, data: any) {
  try {
    if (!data.receiverId || !data.status) {
      return { success: false, error: "Missing required parameters" };
    }
    
    // Send typing indicator to recipient
    const delivered = sendToUser(data.receiverId, {
      type: 'typing_indicator',
      senderId,
      status: data.status,
      timestamp: new Date().toISOString()
    });
    
    return { success: true, delivered };
  } catch (error) {
    console.error('Error handling typing indicator:', error);
    return { success: false, error: "Internal server error" };
  }
}

async function handleReadReceipt(userId: number, data: any) {
  try {
    if (!data.messageIds || !Array.isArray(data.messageIds)) {
      return { success: false, error: "Missing required parameters" };
    }
    
    // Mark messages as read in database
    for (const messageId of data.messageIds) {
      await storage.markMessageAsRead(messageId);
    }
    
    // If senderId is provided, notify them
    if (data.senderId) {
      // Send read receipt to sender
      const delivered = sendToUser(data.senderId, {
        type: 'read_receipt',
        readBy: userId,
        messageIds: data.messageIds,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, delivered };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error handling read receipt:', error);
    return { success: false, error: "Internal server error" };
  }
}

// Call handling
async function handleCallRequest(initiatorId: number, data: any) {
  try {
    if (!data.receiverId || !data.type) {
      return { success: false, error: "Missing required parameters" };
    }
    
    if (data.type !== "audio" && data.type !== "video") {
      return { success: false, error: "Invalid call type" };
    }
    
    // Generate a unique call ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create call in database
    const callSession = await storage.createCallSession({
      initiatorId,
      receiverId: data.receiverId,
      type: data.type,
      status: "requested",
      startTime: new Date()
    });
    
    // Store call in memory
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
    
    // Create notification
    await storage.createNotification({
      userId: data.receiverId,
      type: 'call_request',
      title: `Incoming ${data.type} call`,
      content: "Tap to answer",
      sourceId: initiatorId,
      isRead: false
    });
    
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
    if (!data.callId || !data.action) {
      return { success: false, error: "Missing required parameters" };
    }
    
    if (data.action !== "accept" && data.action !== "decline") {
      return { success: false, error: "Invalid action" };
    }
    
    // Get call from memory
    const call = activeCalls.get(data.callId);
    if (!call) {
      return { success: false, error: "Call not found" };
    }
    
    // Check if user is the intended receiver
    if (call.receiverId !== responderId) {
      return { success: false, error: "Not authorized to respond to this call" };
    }
    
    // Handle response
    if (data.action === "accept") {
      // Update call status
      call.status = "ongoing";
      activeCalls.set(data.callId, call);
      
      // Update database
      await storage.updateCallSession(call.sessionId!, {
        status: "ongoing",
        startTime: new Date()
      });
      
      // Notify initiator
      const delivered = sendToUser(call.initiatorId, {
        type: 'call_accepted',
        callId: data.callId,
        timestamp: new Date().toISOString()
      });
      
      return { 
        success: true, 
        delivered 
      };
    } else {
      // Declined - update call status
      call.status = "declined";
      activeCalls.set(data.callId, call);
      
      // Update database
      await storage.updateCallSession(call.sessionId!, {
        status: "declined",
        endTime: new Date(),
        duration: 0
      });
      
      // Notify initiator
      const delivered = sendToUser(call.initiatorId, {
        type: 'call_declined',
        callId: data.callId,
        timestamp: new Date().toISOString()
      });
      
      // Remove from active calls
      activeCalls.delete(data.callId);
      
      return { 
        success: true, 
        delivered 
      };
    }
  } catch (error) {
    console.error('Error handling call response:', error);
    return { success: false, error: "Internal server error" };
  }
}

async function handleCallEnd(userId: number, data: any) {
  try {
    if (!data.callId) {
      return { success: false, error: "Missing required parameters" };
    }
    
    // Get call from memory
    const call = activeCalls.get(data.callId);
    if (!call) {
      return { success: false, error: "Call not found" };
    }
    
    // Check if user is a participant
    if (call.initiatorId !== userId && call.receiverId !== userId) {
      return { success: false, error: "Not authorized to end this call" };
    }
    
    // Calculate duration
    const endTime = new Date();
    const startTime = call.startTime;
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
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

// WebSocket server setup - DISABLED to prevent port conflicts
function setupWebSockets(server: Server) {
  console.log('[FIXED-MESSAGING] WebSocket setup disabled to prevent port conflicts');
  return null;
  /* DISABLED CODE:
  const wss = new WebSocketServer({ 
    server: server, 
    path: '/ws',
    clientTracking: true,
    // Support echo-protocol for better browser compatibility
    handleProtocols: (protocols, request) => {
      try {
        // If no protocols provided, accept connection without protocol
        if (!protocols || protocols.size === 0) {
          console.log('WebSocket: No protocols provided, accepting without protocol');
          return false; // Accept connection but don't use any protocol
        }
        
        // Convert Set to Array for compatibility
        const protocolArray = Array.from(protocols);
        console.log('WebSocket: Client requested protocols:', protocolArray);
        
        if (protocolArray.includes('echo-protocol')) {
          console.log('WebSocket: Using echo-protocol');
          return 'echo-protocol';
        }
        
        // Accept the connection but don't use any protocol
        console.log('WebSocket: No supported protocols found, accepting without protocol');
        return false; // Use false instead of true to accept without protocol
      } catch (error) {
        // Accept the connection without a protocol if there's an error
        console.error('WebSocket: Error handling protocols:', error);
        return false; // Use false instead of true to accept without protocol
      }
    }
  });
  
  console.log('WebSocket server initialized at /ws path with echo-protocol support');
  
  // Add server status endpoint
  wss.on('headers', (headers, req) => {
    // Add headers to help with client-side debugging
    headers.push('X-WebSocket-Server: Dedwen-Messaging');
    headers.push(`X-WebSocket-Active-Connections: ${connectionStats.activeConnections}`);
  });
  
  wss.on('connection', (ws, req) => {
    // Track connection in stats
    connectionStats.totalConnections++;
    connectionStats.activeConnections++;
    
    // Initialize connection info for diagnostics and tracking
    const connectionInfo = {
      id: connectionId,
      startTime: Date.now(),
      authTime: null,
      userId: null,
      authenticated: false,
      authType: null,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      pingCount: 0,
      pongCount: 0
    };
    
    // Store connection info on the WebSocket object for tracking
    (ws as any)._connectionInfo = connectionInfo;
    
    // Log connection establishment with protocol info
    console.log(`WebSocket connection ${connectionId} established with protocol: ${(ws as any).protocol || 'none'}`);
    
    // Set up error handler for better diagnostics
    ws.on('error', (error) => {
      connectionStats.errors++;
      connectionStats.lastError = {
        time: new Date(),
        message: error.message,
        code: (error as any).code
      };
      
      console.error(`WebSocket error on connection ${connectionId}:`, error);
      
      // For specific error types, add more detailed logging
      if ((error as any).code === 'ECONNRESET') {
        console.log(`Connection ${connectionId} reset by peer - client may have closed tab or navigated away`);
      }
    });
    
    // Get authentication info from URL params if available
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('userId');
    const connectionId = url.searchParams.get('cid') || crypto.randomBytes(4).toString('hex');
    
    console.log(`[WS] New connection: ID=${connectionId}, IP=${req.socket.remoteAddress}, UserAgent=${req.headers['user-agent']}`);
    console.log(`[WS] Auth info - Token: ${token ? token.substring(0, 10) + '...' : 'None'}, UserID: ${userId || 'None'}`);
    
    // If userId and token are provided in URL, attempt immediate authentication
    if (userId && token) {
      console.log(`[WS] Attempting immediate authentication with provided credentials`);
      try {
        const payload = verifyToken(token);
        if (payload && payload.userId === parseInt(userId)) {
          // Add user connection tracking
          const userIdNum = parseInt(userId);
          if (!connections.has(userIdNum)) {
            connections.set(userIdNum, new Set());
          }
          connections.get(userIdNum)?.add(ws);
          
          // Send authenticated message
          ws.send(JSON.stringify({
            type: 'authenticated',
            userId: userIdNum,
            connectionId: connectionId,
            serverTime: new Date().toISOString(),
            activeConnections: connectionStats.activeConnections,
            tokenAuth: true,
            debugInfo: {
              timestamp: new Date().toISOString(),
              serverVersion: '1.0.1'
            }
          }));
        }
      } catch (err) {
        console.error('[WS] Authentication error:', err);
      }
    }
    
    // If no connectionId was provided in URL params, we'll use the one already generated above
    
    console.log(`WebSocket connection established (ID: ${connectionId}, Protocol: ${ws.protocol || 'none'}, Active: ${connectionStats.activeConnections})`);
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
          try {
            // Check for both userId and token
            if (data.userId && typeof data.userId === 'number') {
              // Validate token if provided
              if (data.token) {
                console.log('Validating token for WebSocket authentication');
                const tokenPayload = verifyToken(data.token);
                
                if (!tokenPayload || tokenPayload.userId !== data.userId) {
                  console.error('Invalid token or token userId mismatch');
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Authentication failed: Invalid token',
                    timestamp: new Date().toISOString()
                  }));
                  return;
                }
                
                console.log('Token validated successfully for user', data.userId);
              } else {
                // If no token, check if the session has the same user (for backward compatibility)
                // This is less secure but maintains compatibility with existing clients
                console.log('No token provided, using userId authentication only');
              }
              
              userId = data.userId;
              
              // Store the connection for this user
              let userConnections = connections.get(userId);
              if (!userConnections) {
                userConnections = new Set();
                connections.set(userId, userConnections);
              }
              userConnections.add(ws);
              
              authenticated = true;
              
              // Track online status
              broadcastUserStatus(userId, true);
              
              // Send acknowledgment
              ws.send(JSON.stringify({
                type: 'authenticated',
                userId: userId,
                timestamp: new Date().toISOString()
              }));
              
              console.log(`User ${userId} authenticated on WebSocket`);
              
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
            } else {
              // If userId is missing or invalid
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Authentication failed: Invalid userId',
                timestamp: new Date().toISOString()
              }));
            }
          } catch (error) {
            console.error('Error during WebSocket authentication:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication failed: Server error',
              timestamp: new Date().toISOString()
            }));
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
          case 'chat': // Support both 'message' and 'chat' types for compatibility
            response = await handleChatMessage(userId!, data);
            console.log(`Message handled from user ${userId}:`, JSON.stringify(data).substring(0, 100));
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
    
    ws.on('close', (code, reason) => {
      // Update connection statistics
      connectionStats.activeConnections = Math.max(0, connectionStats.activeConnections - 1);
      
      // Create a descriptive reason string for diagnostics
      let reasonStr = reason?.toString() || '';
      let codeDescription = '';
      
      // Add code description for better diagnostics
      switch (code) {
        case 1000:
          codeDescription = 'normal';
          break;
        case 1001:
          codeDescription = 'going_away';
          break;
        case 1002:
          codeDescription = 'protocol_error';
          break;
        case 1003:
          codeDescription = 'unsupported_data';
          break;
        case 1005:
          codeDescription = 'no_status';
          break;
        case 1006:
          codeDescription = 'abnormal_closure';
          break;
        case 1007:
          codeDescription = 'invalid_frame_payload_data';
          break;
        case 1008:
          codeDescription = 'policy_violation';
          break;
        case 1009:
          codeDescription = 'message_too_big';
          break;
        case 1010:
          codeDescription = 'missing_extension';
          break;
        case 1011:
          codeDescription = 'internal_error';
          break;
        case 1012:
          codeDescription = 'service_restart';
          break;
        case 1013:
          codeDescription = 'try_again_later';
          break;
        case 1014:
          codeDescription = 'bad_gateway';
          break;
        case 1015:
          codeDescription = 'tls_handshake';
          break;
        default:
          codeDescription = 'unknown';
      }
      
      // Comprehensive connection closure logging
      console.log(`WebSocket connection ${connectionId} closed: code=${code} (${codeDescription}), reason=${reasonStr}`);
      
      // For abnormal closures, log additional details to help diagnose issues
      if (code === 1006) {
        console.log('Abnormal WebSocket closure detected - this typically indicates network issues or browser behavior');
      }
      
      // Log connection lifetime metrics
      const connectionInfo = (ws as any)._connectionInfo || {};
      const startTime = connectionInfo.startTime || Date.now();
      const authTime = connectionInfo.authTime || null;
      const userId = connectionInfo.userId || null;
      const authenticated = connectionInfo.authenticated || false;
      const lifetimeSeconds = Math.round((Date.now() - startTime) / 1000);
      const authDuration = authTime ? Math.round((authTime - startTime) / 1000) : 'N/A';
      const authenticatedTime = authTime ? Math.round((Date.now() - authTime) / 1000) : 0;
      
      console.log(`Connection stats: lifetime=${lifetimeSeconds}s, userId=${userId}, authenticated=${authenticated}`);
      if (authenticated) {
        console.log(`Authentication details: authType=${connectionInfo.authType || 'unknown'}, authDuration=${authDuration}s, authenticatedTime=${authenticatedTime}s`);
      }
      console.log(`Connection activity: pings=${connectionInfo.pingCount || 0}, pongs=${connectionInfo.pongCount || 0}`);
      
      // Clear ping interval
      clearInterval(pingInterval);
      
      // Properly clean up connection from the user's connection set if authenticated
      if (connectionInfo.userId) {
        removeConnection(connectionInfo.userId, ws);
        
        // Log active connections state after cleanup
        const activeUserConnections = connections.get(connectionInfo.userId)?.size || 0;
        console.log(`Removing WebSocket connection for user ${connectionInfo.userId}`);
        if (activeUserConnections === 0) {
          console.log(`User ${connectionInfo.userId} now has no active connections`);
          broadcastUserStatus(connectionInfo.userId, false);
        } else {
          console.log(`User ${connectionInfo.userId} still has ${activeUserConnections} active connections`);
        }
      }
      
      // Log overall WebSocket connection stats
      const activeUsers = connections.size;
      const totalConnections = Array.from(connections.values())
        .reduce((acc, conns) => acc + conns.size, 0);
      console.log(`Active WebSocket stats: users=${activeUsers}, connections=${totalConnections}`);
      
      // Connection cleanup is now handled by the more comprehensive code above
    });
    
    ws.on('error', (error) => {
      // Track error in stats
      connectionStats.errors++;
      connectionStats.lastError = {
        time: new Date(),
        message: error.message || 'Unknown WebSocket error',
        code: error.code
      };
      
      console.error(`WebSocket error on connection ${connectionId}:`, error);
      
      // Clear ping interval
      clearInterval(pingInterval);
      
      // Remove connection from user's connections
      if (userId !== null) {
        removeConnection(userId, ws);
        
        // Update active connection count (in case close doesn't fire after error)
        connectionStats.activeConnections = Math.max(0, connectionStats.activeConnections - 1);
      }
    });
  });
  
  return wss;
}

// Main API routes registration
// Import from unified-auth which knows how to handle both authentication methods
import { isAuthenticated as unifiedIsAuthenticated } from "./unified-auth";

export function registerMessagingSuite(app: Express, server: Server) {
  // WebSocket server setup disabled - using unified websocket-handler.ts instead
  console.log('[FIXED-MESSAGING] Skipping WebSocket setup - using unified handler');
  
  // Message APIs
  
  // Get messages between users
  app.get("/api/messages/:userId", unifiedIsAuthenticated, async (req: Request, res: Response) => {
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
  app.get("/api/conversations", unifiedIsAuthenticated, async (req: Request, res: Response) => {
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
  app.post("/api/messages", unifiedIsAuthenticated, async (req: Request, res: Response) => {
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
  
  // Return connection status
  app.get("/api/users/status", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const onlineUsers: number[] = [];
      
      // Get online users
      for (const [userId, connections] of connections.entries()) {
        if (connections.size > 0) {
          onlineUsers.push(userId);
        }
      }
      
      res.json({ onlineUsers });
    } catch (error) {
      console.error('Error getting online users:', error);
      res.status(500).json({ message: "Failed to get online users" });
    }
  });
  
  // Check status of specific users
  app.post("/api/users/status", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ message: "Invalid userIds format" });
      }
      
      const statusMap: Record<number, boolean> = {};
      
      for (const userId of userIds) {
        const userConnections = connections.get(userId);
        statusMap[userId] = !!userConnections && userConnections.size > 0;
      }
      
      res.json({ status: statusMap });
    } catch (error) {
      console.error('Error checking user status:', error);
      res.status(500).json({ message: "Failed to check user status" });
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread/count", unifiedIsAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unread message count:', error);
      res.status(500).json({ message: "Failed to get unread message count" });
    }
  });
  
  return app;
}