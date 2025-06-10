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
import { verifyToken } from "./jwt-auth"; // Import for token verification
import { isAuthenticated as unifiedIsAuthenticated } from "./unified-auth";

// Define global types for WebSocket tracking
declare global {
  var userStatusUpdates: Map<number, number>; // Map of userId to last status update timestamp
}

// Connection management
const connections = new Map<number, Set<WebSocket>>();
const activeCalls = new Map<string, ActiveCall>();
const userStatusUpdates = new Map<number, number>(); // Track the last time user status was broadcast

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
  
  // Enhanced cleanup to prevent memory leaks
  if ((connection as any)._pingInterval) {
    clearInterval((connection as any)._pingInterval);
    (connection as any)._pingInterval = null;
  }
  
  // Clear custom properties
  (connection as any)._connectionInfo = null;
  (connection as any)._userId = null;
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

// WebSocket server setup
function setupWebSockets(server: Server) {
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
    },
    // Add WebSocket protocol options for better stability
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Below 1024 should be enough, but tuned higher for safety
      threshold: 1024 
    }
  });
  
  console.log('WebSocket server initialized at /ws path with echo-protocol support');
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established - Protocol:', ws.protocol || 'none');
    let userId: number | null = null;
    let authenticated = false;
    
    // Enhanced connection tracking with detailed metadata
    const connectionId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Setup ping interval to keep connection alive
    // Lower ping interval for better connection reliability (15 seconds)
    const PING_INTERVAL = 15000;
    
    // Add pong timeout to detect dead connections
    let lastPong = Date.now();
    
    // Track connection metadata on WebSocket object
    (ws as any).connectionId = connectionId;
    (ws as any).startTime = startTime;
    (ws as any).lastActivity = startTime;
    (ws as any).pingCount = 0;
    (ws as any).pongCount = 0;
    (ws as any).authenticated = false;
    (ws as any).authTime = null;
    
    console.log(`WebSocket connection ${connectionId} established with protocol: ${ws.protocol || 'none'}`);
    
    ws.on('pong', () => {
      // Track last pong for connection health monitoring
      lastPong = Date.now();
      (ws as any).lastActivity = Date.now();
      (ws as any).pongCount++;
      console.debug(`Received pong from client (connection ${connectionId})`);
    });
    
    // Setup ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          // Enhanced connection monitoring
          const connectionAge = Date.now() - startTime;
          const timeSinceLastPong = Date.now() - lastPong;
          
          // Check if connection is responsive (60 second threshold)
          if (timeSinceLastPong > 60000) {
            console.warn(`WebSocket connection ${connectionId} unresponsive for 60+ seconds, terminating`);
            console.log(`Connection stats before termination: age=${Math.floor(connectionAge/1000)}s, pings=${(ws as any).pingCount}, pongs=${(ws as any).pongCount}, userId=${userId}, authenticated=${authenticated}`);
            
            // Store termination reason in the connection object before closing
            (ws as any).terminationReason = 'pong_timeout';
            (ws as any).terminationTime = Date.now();
            
            ws.terminate(); // Force close unresponsive connection
            return;
          }
          
          // Log connection status every 5 minutes (or ~20 pings)
          if ((ws as any).pingCount % 20 === 0) {
            console.log(`Connection ${connectionId} status: age=${Math.floor(connectionAge/1000)}s, pings=${(ws as any).pingCount}, pongs=${(ws as any).pongCount}, userId=${userId}, authenticated=${authenticated}`);
          }
          
          // Send ping to keep connection alive
          (ws as any).pingCount++;
          ws.ping();
        } catch (error) {
          console.error(`Error pinging WebSocket connection ${connectionId}:`, error);
        }
      } else if (ws.readyState === WebSocket.CLOSING) {
        console.log(`WebSocket connection ${connectionId} is closing, monitoring ping will stop once closed`);
      } else if (ws.readyState === WebSocket.CLOSED) {
        console.log(`WebSocket connection ${connectionId} is now closed, clearing ping interval`);
        clearInterval(pingInterval);
      }
    }, PING_INTERVAL);
    
    ws.on('message', async (message) => {
      try {
        // Log raw message for debugging
        const messageStr = message.toString();
        console.debug(`WebSocket message received: ${messageStr.substring(0, 100)}${messageStr.length > 100 ? '...' : ''}`);
        
        // Parse message
        const data = JSON.parse(messageStr);
        
        // Handle authentication
        if (data.type === 'authenticate') {
          try {
            // Check for both userId and token
            if (data.userId && typeof data.userId === 'number') {
              // Validate token if provided
              if (data.token) {
                console.log('Validating token for WebSocket authentication');
                try {
                  const tokenPayload = verifyToken(data.token);
                  
                  if (!tokenPayload) {
                    console.error('Invalid token format or expired token');
                    ws.send(JSON.stringify({
                      type: 'error',
                      message: 'Authentication failed: Invalid or expired token',
                      timestamp: new Date().toISOString()
                    }));
                    return;
                  }
                  
                  if (tokenPayload.userId !== data.userId) {
                    console.error(`Token userId mismatch: token=${tokenPayload.userId}, request=${data.userId}`);
                    ws.send(JSON.stringify({
                      type: 'error',
                      message: 'Authentication failed: User ID mismatch',
                      timestamp: new Date().toISOString()
                    }));
                    return;
                  }
                  
                  console.log('Token validated successfully for user', data.userId);
                } catch (tokenError) {
                  console.error('Token validation error:', tokenError);
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Authentication failed: Token validation error',
                    timestamp: new Date().toISOString()
                  }));
                  return;
                }
              } else {
                // If no token, check if the session has the same user (for backward compatibility)
                // This is less secure but maintains compatibility with existing clients
                console.log('No token provided, using userId authentication only - allowing for backward compatibility');
              }
              
              userId = data.userId;
              
              // Store the connection for this user
              let userConnections = connections.get(userId);
              if (!userConnections) {
                userConnections = new Set();
                connections.set(userId, userConnections);
              }
              userConnections.add(ws);
              
              // Update connection metadata with authentication success
              authenticated = true;
              (ws as any).authenticated = true;
              (ws as any).authTime = Date.now();
              (ws as any).authType = data.token ? 'token' : 'userId';
              (ws as any).userId = userId;
              
              // Track online status
              broadcastUserStatus(userId, true);
              
              // Get connection duration in seconds
              const connectionDuration = Math.floor((Date.now() - startTime) / 1000);
              
              // Send detailed acknowledgment with enhanced connection info
              ws.send(JSON.stringify({
                type: 'authenticated',
                userId: userId,
                connectionId: connectionId, // Use the full UUID we generated at connection start
                serverTime: new Date().toISOString(),
                activeConnections: connections.size, // Send number of active users with connections
                tokenAuth: !!data.token, // Indicate if token was used for authentication
                connectionStats: {
                  startTime: new Date(startTime).toISOString(),
                  authTime: new Date().toISOString(),
                  connectionDuration: connectionDuration, // How long it took to authenticate
                  pings: (ws as any).pingCount,
                  pongs: (ws as any).pongCount
                },
                debugInfo: {
                  timestamp: new Date().toISOString(),
                  serverVersion: '1.0.2', // Increment version to match our improvements
                  protocol: ws.protocol || 'none'
                }
              }));
              
              console.log(`User ${userId} authenticated on WebSocket connection ${connectionId} after ${connectionDuration}s (using ${(ws as any).authType})`);
              console.log(`Connection ${connectionId} now has ${userConnections.size} active connections for user ${userId}`);
              
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
            
          case 'logout':
            // Handle explicit client logout
            console.log(`User ${userId} explicitly logged out from WebSocket`);
            
            // Mark user as offline
            if (userId) {
              broadcastUserStatus(userId, false);
              console.log(`Broadcasting offline status for user ${userId}`);
            }
            
            // Send confirmation
            response = {
              type: 'logout_confirmed',
              timestamp: new Date().toISOString(),
              message: 'Logout successful'
            };
            
            // Don't remove the connection here - the onclose handler will do that
            // This allows the response to be sent before the connection is closed
            break;
            
          case 'ping':
            // Track the ping for connection activity monitoring
            console.debug("Received ping from client", userId ? `(User: ${userId})` : "(Unauthenticated)");
            
            // Include more detailed connection data in the pong response
            response = {
              type: 'pong',
              timestamp: new Date().toISOString(),
              connectionId: data.connectionId || 'unknown',
              serverUptime: process.uptime(), // Server uptime in seconds
              pingReceived: true,
              connectionCount: connections.size || 0
            };
            
            // If this is an authenticated connection, update activity timestamp
            if (authenticated && userId) {
              // Refresh user's online status without spamming - only every 5 minutes
              const lastUpdate = userStatusUpdates.get(userId) || 0;
              const now = Date.now();
              if (now - lastUpdate > 5 * 60 * 1000) { // 5 minutes
                broadcastUserStatus(userId, true);
                userStatusUpdates.set(userId, now);
                console.debug(`Refreshed online status for user ${userId} after ping`);
              }
            }
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
      // Get connection lifetime details
      const endTime = Date.now();
      const connectionLifetime = endTime - startTime;
      const authTime = (ws as any).authTime || null;
      const authDuration = authTime ? authTime - startTime : null;
      const authenticatedTime = authTime ? endTime - authTime : null;
      
      // Categorize close codes for better diagnostics
      let closeCategory = 'unknown';
      let expectedClose = false;
      
      // WebSocket standard close codes: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
      switch(code) {
        case 1000:
          closeCategory = 'normal';
          expectedClose = true;
          break;
        case 1001:
          closeCategory = 'going_away';
          expectedClose = true;
          break;
        case 1002:
          closeCategory = 'protocol_error';
          break;
        case 1003:
          closeCategory = 'unsupported_data';
          break;
        case 1005:
          closeCategory = 'no_status';
          break;
        case 1006:
          closeCategory = 'abnormal';
          break;
        case 1007:
          closeCategory = 'invalid_frame_payload_data';
          break;
        case 1008:
          closeCategory = 'policy_violation';
          break;
        case 1009:
          closeCategory = 'message_too_big';
          break;
        case 1010:
          closeCategory = 'missing_extension';
          break;
        case 1011:
          closeCategory = 'internal_error';
          break;
        case 1012:
          closeCategory = 'service_restart';
          expectedClose = true;
          break;
        case 1013:
          closeCategory = 'try_again_later';
          expectedClose = true;
          break;
        case 1014:
          closeCategory = 'bad_gateway';
          break;
        case 1015:
          closeCategory = 'tls_handshake';
          break;
        case 4000:
          closeCategory = 'ping_timeout';
          break;
        default:
          if (code >= 4000) {
            closeCategory = 'application_defined';
          }
      }
      
      // Log detailed connection closure information
      console.log(`WebSocket connection ${connectionId} closed: code=${code} (${closeCategory}), reason=${reason || 'No reason provided'}`);
      console.log(`Connection stats: lifetime=${Math.floor(connectionLifetime/1000)}s, userId=${userId}, authenticated=${(ws as any).authenticated || false}`);
      
      if (authTime) {
        console.log(`Authentication details: authType=${(ws as any).authType}, authDuration=${Math.floor(authDuration/1000)}s, authenticatedTime=${Math.floor(authenticatedTime/1000)}s`);
      }
      
      console.log(`Connection activity: pings=${(ws as any).pingCount || 0}, pongs=${(ws as any).pongCount || 0}`);
      
      // Clear ping interval
      clearInterval(pingInterval);
      
      // Remove connection from user's connections
      if (userId !== null) {
        console.log(`Removing WebSocket connection for user ${userId}`);
        removeConnection(userId, ws);
      }
      
      // Log current active connections
      const activeUsers = [...connections.keys()].length;
      let totalConnections = 0;
      
      for (const [_, userConns] of connections) {
        totalConnections += userConns.size;
      }
      
      console.log(`Active WebSocket stats: users=${activeUsers}, connections=${totalConnections}`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      
      // Clear ping interval
      clearInterval(pingInterval);
      
      // Remove connection from user's connections
      if (userId !== null) {
        console.log(`Removing WebSocket connection for user ${userId} due to error`);
        removeConnection(userId, ws);
      }
      
      // Don't terminate here - let the close event handle it
      // But do check if connection is still open, and close it if needed
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'Internal server error');
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