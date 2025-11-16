import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse as parseUrl } from 'url';
import { storage } from './storage';

interface MeetingParticipant {
  id: string;
  userId: number;
  username: string;
  avatar?: string;
  ws: WebSocket;
}

interface MeetingRoom {
  roomId: string;
  participants: Map<string, MeetingParticipant>;
  createdAt: Date;
}

const meetingRooms = new Map<string, MeetingRoom>();
let meetingWss: WebSocketServer;
let isMeetingWebSocketSetupComplete = false; // Idempotency guard for hot-reload

export function setupMeetingWebSocket(server: Server) {
  // Idempotency guard: prevent duplicate WebSocket server creation
  // This is critical for hot-reload and module re-imports in development
  if (isMeetingWebSocketSetupComplete) {
    console.log('[Meeting-WebSocket] Server already initialized, skipping duplicate setup');
    return meetingWss;
  }
  
  console.log('[Meeting-WebSocket] Setting up Meeting WebSocket server with noServer mode');
  
  // Use noServer: true to prevent automatic upgrade handling
  // Upgrades will be handled by the central dispatcher in routes.ts
  meetingWss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    clientTracking: true,
    maxPayload: 1024 * 1024, // 1MB for video signaling
  });

  meetingWss.on('error', (error) => {
    console.error('[Meeting-WebSocket] Server error:', error);
  });

  meetingWss.on('connection', async (ws, req: any) => {
    // SECURITY: Use server-authenticated userId from request (set by dispatcher)
    // NEVER trust client-provided identity to prevent impersonation attacks
    const authenticatedUserId = req.userId;
    
    if (!authenticatedUserId) {
      console.error('[Meeting-WebSocket] No authenticated userId in request - rejecting connection');
      ws.close(4401, 'Authentication required');
      return;
    }

    console.log(`[Meeting-WebSocket] New meeting connection from authenticated user ${authenticatedUserId}`);
    
    let participantId: string | null = null;
    let currentRoomId: string | null = null;
    let pingInterval: NodeJS.Timeout | null = null;
    let userProfile: any = null;

    // Fetch user profile from database using authenticated ID
    try {
      userProfile = await storage.getUserById(authenticatedUserId);
      if (!userProfile) {
        console.error(`[Meeting-WebSocket] User ${authenticatedUserId} not found in database`);
        ws.close(4404, 'User not found');
        return;
      }
    } catch (error) {
      console.error('[Meeting-WebSocket] Error fetching user profile:', error);
      ws.close(4500, 'Internal server error');
      return;
    }

    const startHeartbeat = () => {
      if (pingInterval) clearInterval(pingInterval);
      
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else if (pingInterval) {
          clearInterval(pingInterval);
        }
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    };

    const handleJoinRoom = (data: any) => {
      // SECURITY: Only accept roomId from client
      // Use server-authenticated identity (prevents impersonation)
      const { roomId } = data;
      
      if (!roomId) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Missing required field: roomId'
        }));
        return;
      }

      // Use authenticated user ID and profile from server (not client payload)
      participantId = `${authenticatedUserId}-${Date.now()}`;
      currentRoomId = roomId;

      if (!meetingRooms.has(roomId)) {
        meetingRooms.set(roomId, {
          roomId,
          participants: new Map(),
          createdAt: new Date()
        });
        console.log(`[Meeting-WebSocket] Created new room: ${roomId}`);
      }

      const room = meetingRooms.get(roomId)!;
      const participant: MeetingParticipant = {
        id: participantId,
        userId: authenticatedUserId,  // Use authenticated ID
        username: userProfile.username, // Use server-side profile
        avatar: userProfile.avatar,      // Use server-side profile
        ws
      };

      room.participants.set(participantId, participant);
      console.log(`[Meeting-WebSocket] User ${userProfile.username} (ID: ${authenticatedUserId}) joined room ${roomId}`);

      startHeartbeat();

      ws.send(JSON.stringify({
        type: 'joined',
        participantId,
        roomId,
        userId: authenticatedUserId,  // Send back authenticated ID
        username: userProfile.username // Send back server-verified username
      }));

      const participantList = Array.from(room.participants.values())
        .filter(p => p.id !== participantId)
        .map(p => ({
          id: p.id,
          userId: p.userId,
          username: p.username,
          avatar: p.avatar
        }));

      ws.send(JSON.stringify({
        type: 'participants',
        participants: participantList
      }));

      broadcastToRoom(roomId, {
        type: 'user-joined',
        userId: participantId,
        username: userProfile.username,
        avatar: userProfile.avatar
      }, participantId);
    };

    const handleLeaveRoom = () => {
      if (!currentRoomId || !participantId) return;

      const room = meetingRooms.get(currentRoomId);
      if (room) {
        const participant = room.participants.get(participantId);
        room.participants.delete(participantId);

        console.log(`[Meeting-WebSocket] User ${participant?.username} left room ${currentRoomId}`);

        broadcastToRoom(currentRoomId, {
          type: 'user-left',
          userId: participantId,
          username: participant?.username
        });

        if (room.participants.size === 0) {
          meetingRooms.delete(currentRoomId);
          console.log(`[Meeting-WebSocket] Room ${currentRoomId} deleted (empty)`);
        }
      }

      currentRoomId = null;
      participantId = null;
      stopHeartbeat();
    };

    const handleSignaling = (data: any) => {
      if (!currentRoomId || !participantId) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Not in a room'
        }));
        return;
      }

      const { type, to, ...payload } = data;
      const room = meetingRooms.get(currentRoomId);
      
      if (!room) return;

      if (to) {
        const targetParticipant = room.participants.get(to);
        if (targetParticipant && targetParticipant.ws.readyState === WebSocket.OPEN) {
          targetParticipant.ws.send(JSON.stringify({
            type,
            from: participantId,
            ...payload
          }));
        }
      }
    };

    const handleChatMessage = (data: any) => {
      if (!currentRoomId || !participantId) return;

      const room = meetingRooms.get(currentRoomId);
      if (!room) return;

      const participant = room.participants.get(participantId);
      if (!participant) return;

      broadcastToRoom(currentRoomId, {
        type: 'chat',
        userId: participant.userId,
        username: participant.username,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    };

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`[Meeting-WebSocket] Received message type: ${data.type}`);

        switch (data.type) {
          case 'join':
            handleJoinRoom(data);
            break;
          case 'leave':
            handleLeaveRoom();
            break;
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            handleSignaling(data);
            break;
          case 'chat':
            handleChatMessage(data);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            console.log(`[Meeting-WebSocket] Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('[Meeting-WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Failed to process message'
        }));
      }
    });

    ws.on('close', () => {
      console.log('[Meeting-WebSocket] Connection closed');
      handleLeaveRoom();
    });

    ws.on('error', (error) => {
      console.error('[Meeting-WebSocket] Connection error:', error);
      handleLeaveRoom();
    });

    ws.on('pong', () => {
      console.log(`[Meeting-WebSocket] Received pong from participant ${participantId}`);
    });
  });

  // Mark setup as complete to prevent duplicate initialization
  isMeetingWebSocketSetupComplete = true;
  console.log('[Meeting-WebSocket] Meeting WebSocket server setup complete');
  return meetingWss;
}

// Export the WebSocket server instance for central upgrade dispatcher
export function getMeetingWebSocketServer(): WebSocketServer {
  if (!meetingWss) {
    throw new Error('[Meeting-WebSocket] Server not initialized - call setupMeetingWebSocket first');
  }
  return meetingWss;
}

function broadcastToRoom(roomId: string, message: any, excludeParticipantId?: string) {
  const room = meetingRooms.get(roomId);
  if (!room) return;

  room.participants.forEach((participant) => {
    if (participant.id !== excludeParticipantId && participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(JSON.stringify(message));
    }
  });
}

export function getMeetingRoomStats() {
  const rooms = Array.from(meetingRooms.entries()).map(([roomId, room]) => ({
    roomId,
    participantCount: room.participants.size,
    createdAt: room.createdAt
  }));

  return {
    totalRooms: meetingRooms.size,
    totalParticipants: Array.from(meetingRooms.values()).reduce(
      (sum, room) => sum + room.participants.size,
      0
    ),
    rooms
  };
}

export function closeMeetingWebSocketServer() {
  if (meetingWss) {
    meetingWss.close();
    meetingRooms.clear();
    console.log('[Meeting-WebSocket] Meeting WebSocket server closed');
  }
}
