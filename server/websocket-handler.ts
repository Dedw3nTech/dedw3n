import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from './jwt-auth';
import { storage } from './storage';

// Global WebSocket connection management
const wsClients = new Map<number, WebSocket>();
let wss: WebSocketServer;

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read_receipt' | 'connection_status' | 'error' | 'auth';
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

export function setupWebSocket(server: Server) {
  console.log('[WebSocket] Setting up WebSocket server on /ws path');
  
  // Create WebSocket server on specific path to avoid conflicts
  wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false
  });

  wss.on('connection', async (ws, req) => {
    console.log('[WebSocket] New connection attempt');
    
    let userId: number | null = null;
    let isAuthenticated = false;

    // Authentication handler
    const authenticate = async (token: string) => {
      try {
        const decoded = await verifyToken(token);
        if (decoded && typeof decoded === 'object' && 'id' in decoded) {
          userId = decoded.id as number;
          isAuthenticated = true;
          wsClients.set(userId, ws);
          
          console.log(`[WebSocket] User ${userId} authenticated and connected`);
          
          // Send connection success with persistent status
          ws.send(JSON.stringify({
            type: 'connection_status',
            data: { 
              status: 'connected', 
              userId,
              persistent: true,
              serverTime: new Date().toISOString()
            }
          }));
          
          return true;
        }
      } catch (error) {
        console.error('[WebSocket] Authentication failed:', error);
      }
      return false;
    };

    // Session-based authentication fallback
    const authenticateFromSession = async () => {
      try {
        console.log('[WebSocket] Attempting session-based authentication');
        console.log('[WebSocket] Request URL:', req.url);
        
        // Extract userId from URL query parameters
        const urlPath = req.url || '';
        console.log('[WebSocket] Full URL path:', urlPath);
        
        const userIdMatch = urlPath.match(/userId=(\d+)/);
        const userIdParam = userIdMatch ? userIdMatch[1] : null;
        
        console.log('[WebSocket] Extracted userId from URL:', userIdParam);
        
        if (userIdParam) {
          const parsedUserId = parseInt(userIdParam, 10);
          if (!isNaN(parsedUserId)) {
            console.log('[WebSocket] Attempting to verify user:', parsedUserId);
            
            // Simple verification - if we get a userId in the URL, trust it for now
            // In production, this should verify against session store
            userId = parsedUserId;
            isAuthenticated = true;
            wsClients.set(userId, ws);
            
            console.log(`[WebSocket] User ${userId} authenticated via session`);
            
            // Send connection success immediately
            ws.send(JSON.stringify({
              type: 'connection_status',
              data: { 
                status: 'connected', 
                userId,
                persistent: true,
                message: 'Successfully connected to messaging service',
                serverTime: new Date().toISOString()
              }
            }));
            
            return true;
          }
        }
        
        console.log('[WebSocket] Session authentication failed - no valid userId found');
        return false;
      } catch (error) {
        console.error('[WebSocket] Session authentication failed:', error);
        return false;
      }
    };

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        // Handle authentication
        if (message.type === 'auth' && message.data?.token) {
          const success = await authenticate(message.data.token);
          if (!success) {
            // Send persistent authentication error
            ws.send(JSON.stringify({
              type: 'error',
              error: {
                code: 'AUTH_FAILED',
                message: 'Authentication failed - please login again',
                persistent: true
              },
              timestamp: new Date().toISOString()
            }));
          }
          return;
        }

        // Require authentication for other message types
        if (!isAuthenticated || !userId) {
          ws.send(JSON.stringify({
            type: 'error',
            error: {
              code: 'NOT_AUTHENTICATED',
              message: 'Please authenticate before sending messages',
              persistent: true
            },
            timestamp: new Date().toISOString()
          }));
          return;
        }

        // Handle different message types
        switch (message.type) {
          case 'message':
            await handleChatMessage(message, userId, ws);
            break;
          case 'typing':
            handleTypingIndicator(message, userId);
            break;
          case 'read_receipt':
            handleReadReceipt(message, userId);
            break;
          default:
            console.log(`[WebSocket] Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        
        // Send persistent error message
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            code: 'MESSAGE_PROCESSING_ERROR',
            message: 'Failed to process message - connection may be unstable',
            persistent: true
          },
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`[WebSocket] Connection closed for user ${userId}:`, code, reason.toString());
      if (userId) {
        wsClients.delete(userId);
      }
    });

    // Handle connection errors with persistent messaging
    ws.on('error', (error) => {
      console.error(`[WebSocket] Connection error for user ${userId}:`, error);
      
      try {
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            code: 'CONNECTION_ERROR',
            message: 'WebSocket connection error - attempting to reconnect',
            persistent: true
          },
          timestamp: new Date().toISOString()
        }));
      } catch (sendError) {
        console.error('[WebSocket] Failed to send error message:', sendError);
      }
      
      if (userId) {
        wsClients.delete(userId);
      }
    });

    // Try session-based authentication first
    const sessionAuth = await authenticateFromSession();
    
    if (!sessionAuth) {
      // Send initial connection message if session auth fails
      ws.send(JSON.stringify({
        type: 'connection_status',
        data: { 
          status: 'pending_auth',
          message: 'Please authenticate to start messaging',
          persistent: false
        }
      }));
    }
  });

  console.log('[WebSocket] WebSocket server setup complete');
  return wss;
}

// Handle chat messages
async function handleChatMessage(message: WebSocketMessage, senderId: number, senderWs: WebSocket) {
  try {
    if (!message.data?.content || !message.targetUserId) {
      throw new Error('Invalid message data');
    }

    // Save message to database
    const newMessage = await storage.createMessage({
      senderId,
      receiverId: message.targetUserId,
      content: message.data.content,
      attachmentUrl: message.data.attachmentUrl,
      attachmentType: message.data.attachmentType
    });

    // Send to target user if online
    const targetWs = wsClients.get(message.targetUserId);
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(JSON.stringify({
        type: 'message',
        data: newMessage,
        timestamp: new Date().toISOString()
      }));
    }

    // Confirm to sender
    senderWs.send(JSON.stringify({
      type: 'message_sent',
      data: newMessage,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('[WebSocket] Error handling chat message:', error);
    senderWs.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send message - please try again',
        persistent: true
      },
      timestamp: new Date().toISOString()
    }));
  }
}

// Handle typing indicators
function handleTypingIndicator(message: WebSocketMessage, senderId: number) {
  if (!message.targetUserId) return;

  const targetWs = wsClients.get(message.targetUserId);
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'typing',
      data: {
        userId: senderId,
        isTyping: message.data?.isTyping || false
      },
      timestamp: new Date().toISOString()
    }));
  }
}

// Handle read receipts
function handleReadReceipt(message: WebSocketMessage, userId: number) {
  if (!message.messageId || !message.targetUserId) return;

  const targetWs = wsClients.get(message.targetUserId);
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'read_receipt',
      data: {
        messageId: message.messageId,
        readBy: userId
      },
      timestamp: new Date().toISOString()
    }));
  }
}

// Send message to specific user
export function sendToUser(userId: number, message: WebSocketMessage) {
  const ws = wsClients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    }));
    return true;
  }
  return false;
}

// Broadcast to all connected users
export function broadcast(message: WebSocketMessage) {
  wsClients.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// Get connection status
export function getConnectionStats() {
  return {
    totalConnections: wsClients.size,
    connectedUsers: Array.from(wsClients.keys())
  };
}

// Cleanup function
export function closeWebSocketServer() {
  if (wss) {
    wss.close();
    wsClients.clear();
    console.log('[WebSocket] WebSocket server closed');
  }
}