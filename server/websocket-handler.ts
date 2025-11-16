import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import type { IncomingMessage } from 'http';
import { storage } from './storage';
import { authenticateWebSocketRequest, rejectWebSocketUpgrade } from './websocket-auth';

// ============================================================================
// SIMPLIFIED WEBSOCKET AUTHENTICATION (Clean Coding Best Practices)
// ============================================================================
// This implementation follows the architect's guidance:
// - Reuse Express sessionParser for authentication
// - Reject unauthenticated upgrades immediately
// - Remove custom cache/timeout logic
// - Rely on req.session.passport.user for userId
// ============================================================================

// Global WebSocket connection management
// Use Set to allow multiple connections per user (prevents orphaned connections)
const wsClients = new Map<number, Set<WebSocket>>();
let wss: WebSocketServer;
let isWebSocketSetupComplete = false; // Idempotency guard for hot-reload

/**
 * Adds a WebSocket connection for a user.
 * Properly manages multiple connections per user.
 */
function addUserConnection(userId: number, ws: WebSocket): void {
  if (!wsClients.has(userId)) {
    wsClients.set(userId, new Set());
  }
  wsClients.get(userId)!.add(ws);
  console.log(`[WebSocket] User ${userId} now has ${wsClients.get(userId)!.size} active connection(s)`);
}

/**
 * Removes a WebSocket connection for a user.
 * Cleans up empty sets to prevent memory leaks.
 */
function removeUserConnection(userId: number, ws: WebSocket): void {
  const connections = wsClients.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      wsClients.delete(userId);
      console.log(`[WebSocket] User ${userId} has no more active connections`);
    } else {
      console.log(`[WebSocket] User ${userId} still has ${connections.size} active connection(s)`);
    }
  }
}

/**
 * Sends a message to all of a user's active connections.
 */
function sendToUser(userId: number, message: string): void {
  const connections = wsClients.get(userId);
  if (connections) {
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

/**
 * Broadcasts a message to a specific user (exported for use in routes)
 * @param message - The message object to send
 * @param userId - The ID of the user to send to
 */
export function broadcastMessage(message: { id: number; senderId: number; receiverId: number; content: string; [key: string]: any }, userId: number): void {
  const payload: WebSocketMessage = {
    type: 'message',
    data: message,
    timestamp: new Date().toISOString()
  };
  sendToUser(userId, JSON.stringify(payload));
}

// WebSocket message interface
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read_receipt' | 'connection_status' | 'error' | 'ping' | 'pong';
  data?: any;
  userId?: number;
  targetUserId?: number;
  messageId?: number;
  timestamp?: string;
  error?: {
    code: string;
    message: string;
    persistent: boolean;
  };
}

// Extend IncomingMessage to include session
interface AuthenticatedRequest extends IncomingMessage {
  session?: any;
}

// Store reference to meeting WebSocket server for central dispatcher
let meetingWssRef: WebSocketServer | null = null;

export function setupWebSocket(server: Server, sessionStore: any, cookieSecret: string) {
  // Idempotency guard: prevent duplicate WebSocket server creation
  if (isWebSocketSetupComplete) {
    console.log('[WebSocket] Server already initialized, skipping duplicate setup');
    return wss;
  }
  
  console.log('[WebSocket] Setting up simplified WebSocket server with session-based auth');
  
  // Create WebSocket server with noServer: true to handle upgrade manually
  wss = new WebSocketServer({ 
    noServer: true,
    perMessageDeflate: false,
    clientTracking: true,
    maxPayload: 256 * 1024, // 256KB max payload
    skipUTF8Validation: false,
  });

  // Central HTTP upgrade dispatcher - routes to correct WebSocket server
  // Uses shared authentication utility for consistent security
  server.on('upgrade', async (req: AuthenticatedRequest, socket, head) => {
    const url = req.url || '';
    console.log(`[WebSocket-Dispatcher] ====== UPGRADE REQUEST ======`);
    console.log(`[WebSocket-Dispatcher] Path: ${url}`);
    
    // Determine which WebSocket server should handle this upgrade
    const isMeetingPath = url.startsWith('/ws/meeting');
    const isMessagingPath = url.startsWith('/ws?') || url === '/ws';
    
    if (!isMeetingPath && !isMessagingPath) {
      console.log(`[WebSocket-Dispatcher] Ignoring non-WebSocket path: ${url}`);
      return;
    }
    
    console.log(`[WebSocket-Dispatcher] Target: ${isMeetingPath ? 'MEETING' : 'MESSAGING'}`);

    // Handle socket errors
    socket.on('error', (err) => {
      console.error('[WebSocket-Dispatcher] Socket error during upgrade:', err);
    });

    // Authenticate using shared utility (eliminates code duplication)
    const authResult = await authenticateWebSocketRequest(req, sessionStore, cookieSecret);
    
    if (!authResult.authenticated) {
      console.warn(`[WebSocket-Dispatcher] Authentication failed: ${authResult.error}`);
      rejectWebSocketUpgrade(socket, authResult.error);
      return;
    }

    console.log(`[WebSocket-Dispatcher] ✅ User ${authResult.userId} authenticated successfully`);

    // Attach authenticated user ID to request for handlers
    (req as any).userId = authResult.userId;
    (req as any).sessionId = authResult.sessionId;

    // Route to appropriate WebSocket server
    if (isMeetingPath) {
      if (!meetingWssRef) {
        console.error('[WebSocket-Dispatcher] Meeting WebSocket server not initialized!');
        socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
        socket.destroy();
        return;
      }

      console.log('[WebSocket-Dispatcher] Routing to Meeting WebSocket server');
      try {
        meetingWssRef.handleUpgrade(req, socket, head, (ws) => {
          meetingWssRef!.emit('connection', ws, req);
        });
      } catch (error) {
        console.error('[WebSocket-Dispatcher] Meeting upgrade failed:', error);
        socket.destroy();
      }
    } else if (isMessagingPath) {
      console.log('[WebSocket-Dispatcher] Routing to Messaging WebSocket server');
      try {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      } catch (error) {
        console.error('[WebSocket-Dispatcher] Messaging upgrade failed:', error);
        socket.destroy();
      }
    }
  });

  // Add error handling for the WebSocket server itself
  wss.on('error', (error) => {
    console.error('[WebSocket] Server error:', error);
  });

  console.log('[WebSocket] WebSocket server created successfully');

  // Handle WebSocket connections - user is pre-authenticated from upgrade handler
  wss.on('connection', async (ws, req: any) => {
    let userId: number | null = req.userId;
    let pingInterval: NodeJS.Timeout | null = null;
    let isAuthenticated = !!userId;

    const stopHeartbeat = () => {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    };

    // Handle incoming messages
    ws.on('message', async (data) => {
      if (!isAuthenticated || !userId) {
        ws.close(4401, 'Not authenticated');
        return;
      }

      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'message':
            await handleChatMessage(message, userId, ws);
            break;

          case 'typing':
            await handleTypingStatus(message, userId);
            break;

          case 'read_receipt':
            await handleReadReceipt(message, userId);
            break;

          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;

          default:
            console.warn(`[WebSocket] Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            code: 'MESSAGE_PROCESSING_ERROR',
            message: 'Failed to process message',
            persistent: false
          },
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      if (userId) {
        console.log(`[WebSocket] User ${userId} disconnected: code=${code}`);
        removeUserConnection(userId, ws);
      }
      stopHeartbeat();
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      if (userId) {
        removeUserConnection(userId, ws);
      }
      stopHeartbeat();
    });

    // Handle native WebSocket pong events
    ws.on('pong', () => {
      // Silent heartbeat acknowledgment
    });

    // User is already authenticated from upgrade handler
    if (!userId) {
      ws.close(4401, 'Not authenticated');
      return;
    }

    console.log(`[WebSocket] User ${userId} connected`);

    // Register client connection (supports multiple connections per user)
    addUserConnection(userId, ws);

    // Start heartbeat
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval!);
      }
    }, 30000);

    // Send connection success message immediately
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'connection_status',
        data: {
          status: 'connected',
          userId,
          persistent: true,
          serverTime: new Date().toISOString(),
          authMethod: 'session'
        }
      }));
      console.log(`[WebSocket] Sent connection_status to user ${userId}`);
    } else {
      console.error(`[WebSocket] Cannot send connection_status - socket not open. State: ${ws.readyState}`);
    }
  });

  // Mark setup as complete to prevent duplicate initialization
  isWebSocketSetupComplete = true;
  console.log('[WebSocket] WebSocket server setup complete');
  return wss;
}

// Register meeting WebSocket server for central dispatcher
export function registerMeetingWebSocketServer(meetingWss: WebSocketServer) {
  meetingWssRef = meetingWss;
  console.log('[WebSocket] Meeting WebSocket server registered with central dispatcher');
}

// Handle chat messages
async function handleChatMessage(message: WebSocketMessage, senderId: number, senderWs: WebSocket) {
  try {
    const receiverId = message.data?.receiverId || message.targetUserId;
    
    if (!message.data?.content || !receiverId) {
      throw new Error('Invalid message data');
    }

    // Save message to database
    const newMessage = await storage.createMessage({
      senderId,
      receiverId: receiverId,
      content: message.data.content,
      attachmentUrl: message.data.attachmentUrl,
      attachmentType: message.data.attachmentType
    });

    // Send to all of target user's active connections
    sendToUser(receiverId, JSON.stringify({
      type: 'message',
      data: newMessage,
      timestamp: new Date().toISOString()
    }));

    // Confirm to sender
    senderWs.send(JSON.stringify({
      type: 'message_sent',
      data: newMessage,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('[WebSocket] Failed to handle chat message:', error);
    senderWs.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send message',
        persistent: false
      },
      timestamp: new Date().toISOString()
    }));
  }
}

// Handle typing status
async function handleTypingStatus(message: WebSocketMessage, userId: number) {
  try {
    const targetUserId = message.data?.targetUserId || message.targetUserId;
    
    if (!targetUserId) {
      return;
    }

    sendToUser(targetUserId, JSON.stringify({
      type: 'typing',
      data: {
        userId,
        isTyping: message.data?.isTyping || false
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('[WebSocket] Failed to handle typing status:', error);
  }
}

// Handle read receipt
async function handleReadReceipt(message: WebSocketMessage, userId: number) {
  try {
    const messageId = message.messageId || message.data?.messageId;
    
    if (!messageId) {
      return;
    }

    // Mark message as read
    await storage.markMessageAsRead(messageId);

    // Notify sender if online
    const msg = await storage.getMessage(messageId);
    if (msg) {
      sendToUser(msg.senderId, JSON.stringify({
        type: 'read_receipt',
        data: {
          messageId,
          readBy: userId
        },
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error('[WebSocket] Failed to handle read receipt:', error);
  }
}

// Cleanup function
export function closeWebSocketServer() {
  if (wss) {
    wss.close();
    wsClients.clear();
    console.log('[WebSocket] WebSocket server closed');
  }
}

// Logout handler - notify all connections and disconnect
export function handleUserLogout(userId: number) {
  const connections = wsClients.get(userId);
  if (connections && connections.size > 0) {
    const logoutMessage = JSON.stringify({
      type: 'connection_status',
      data: {
        status: 'logged_out',
        message: 'User logged out',
        persistent: true
      },
      timestamp: new Date().toISOString()
    });

    // Notify and close all connections
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(logoutMessage);
        } catch (error) {
          console.error('[WebSocket] Failed to send logout notification:', error);
        }
        ws.close(1000, 'User logged out');
      }
    });
    
    // Clear all connections for this user
    wsClients.delete(userId);
    console.log(`[WebSocket] User ${userId} logged out - closed ${connections.size} connection(s)`);
  }
}

// Alias for backward compatibility with clean-logout.ts
export function disconnectUserWebSocket(userId: number) {
  handleUserLogout(userId);
}

// No-op for backward compatibility - session cache removed in simplified auth
export function invalidateSessionCache(sessionId: string) {
  console.log(`[WebSocket] Session cache invalidation called (no-op in simplified auth)`);
}
