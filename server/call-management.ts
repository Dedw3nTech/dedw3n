import { Router, type Request, type Response } from 'express';
import { db } from './db';
import { callSessions, users, notifications, insertCallSessionSchema, type InsertCallSession } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { isAuthenticated } from './unified-auth';
import { randomBytes } from 'crypto';

/**
 * Call Management Module
 * Handles WebRTC signaling and call session management
 * Clean Coding Principle: Single Responsibility - manages only call-related operations
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique call ID
 */
function generateCallId(): string {
  return `call_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

/**
 * Creates a notification for call events
 */
async function createCallNotification(
  userId: number,
  callType: string,
  callStatus: string,
  callerName: string
): Promise<void> {
  const notificationMap = {
    requested: {
      title: `Incoming ${callType} call`,
      content: `${callerName} is calling you...`
    },
    missed: {
      title: 'Missed call',
      content: `You missed a ${callType} call from ${callerName}`
    },
    declined: {
      title: 'Call declined',
      content: `${callerName} declined your call`
    }
  };

  const notification = notificationMap[callStatus as keyof typeof notificationMap];
  
  if (notification) {
    await db.insert(notifications).values({
      userId,
      type: 'message',
      title: notification.title,
      content: notification.content,
      isRead: false
    });
  }
}

// ============================================================================
// API Routes
// ============================================================================

export function registerCallRoutes(app: Router) {
  
  /**
   * POST /api/calls/initiate
   * Initiates a new call session
   */
  app.post('/api/calls/initiate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { receiverId, callType } = req.body;

      if (!receiverId || !callType) {
        return res.status(400).json({ error: 'receiverId and callType are required' });
      }

      if (!['audio', 'video'].includes(callType)) {
        return res.status(400).json({ error: 'callType must be audio or video' });
      }

      // Check if receiver exists
      const [receiver] = await db
        .select()
        .from(users)
        .where(eq(users.id, receiverId))
        .limit(1);

      if (!receiver) {
        return res.status(404).json({ error: 'Receiver not found' });
      }

      // Check if there's an ongoing call between these users
      // Clean up stale requested calls (calls that were never answered)
      const existingCalls = await db
        .select()
        .from(callSessions)
        .where(
          and(
            or(
              and(
                eq(callSessions.initiatorId, userId),
                eq(callSessions.receiverId, receiverId)
              ),
              and(
                eq(callSessions.initiatorId, receiverId),
                eq(callSessions.receiverId, userId)
              )
            ),
            or(
              eq(callSessions.status, 'requested'),
              eq(callSessions.status, 'ongoing')
            )
          )
        );

      // Auto-expire stale requested calls (never answered/started)
      // If a call is still in 'requested' status, it means it was never picked up
      for (const call of existingCalls) {
        if (call.status === 'requested') {
          await db
            .update(callSessions)
            .set({ 
              status: 'missed',
              endedAt: new Date()
            })
            .where(eq(callSessions.id, call.id));
          console.log(`[Call Management] Auto-expired stale requested call ${call.callId}`);
        }
      }

      // Check for truly active (ongoing) calls
      const [activeCall] = existingCalls.filter(call => call.status === 'ongoing');

      if (activeCall) {
        return res.status(409).json({ 
          error: 'There is already an active call with this user',
          callId: activeCall.callId
        });
      }

      const callId = generateCallId();
      const user = (req as any).user;

      // Create call session
      const [newCall] = await db
        .insert(callSessions)
        .values({
          callId,
          initiatorId: userId,
          receiverId,
          callType,
          status: 'requested'
        })
        .returning();

      // Create notification for receiver
      await createCallNotification(
        receiverId,
        callType,
        'requested',
        user.name || user.username
      );

      res.status(201).json({
        success: true,
        call: newCall
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  });

  /**
   * POST /api/calls/:callId/accept
   * Accepts an incoming call
   */
  app.post('/api/calls/:callId/accept', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { callId } = req.params;

      // Find the call
      const [call] = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.callId, callId))
        .limit(1);

      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify user is the receiver
      if (call.receiverId !== userId) {
        return res.status(403).json({ error: 'Only the receiver can accept this call' });
      }

      // Verify call is in requested state
      if (call.status !== 'requested') {
        return res.status(400).json({ error: 'Call is not in requested state' });
      }

      // Update call status to ongoing
      const [updatedCall] = await db
        .update(callSessions)
        .set({ 
          status: 'ongoing',
          startedAt: new Date()
        })
        .where(eq(callSessions.id, call.id))
        .returning();

      res.json({
        success: true,
        call: updatedCall
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      res.status(500).json({ error: 'Failed to accept call' });
    }
  });

  /**
   * POST /api/calls/:callId/connect
   * Marks an outgoing call as connected (when receiver picks up)
   */
  app.post('/api/calls/:callId/connect', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { callId } = req.params;

      // Find the call
      const [call] = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.callId, callId))
        .limit(1);

      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify user is either caller or receiver
      if (call.initiatorId !== userId && call.receiverId !== userId) {
        return res.status(403).json({ error: 'Not authorized for this call' });
      }

      // Handle call connection verification
      // NOTE: This endpoint confirms an already-ongoing call connection
      // The /accept endpoint is the ONLY way to transition requested→ongoing
      // In production WebRTC: caller hits this after WebRTC negotiation completes
      
      if (call.status === 'ongoing') {
        // Call is connected - return success
        console.log(`[Call Management] Call ${callId} confirmed ongoing`);
        res.json({
          success: true,
          call
        });
      } else if (call.status === 'requested') {
        // Call is still ringing - waiting for receiver to accept
        console.log(`[Call Management] Call ${callId} still ringing`);
        res.json({
          success: false,
          ringing: true,
          call
        });
      } else {
        // Call was declined, missed, or ended
        console.log(`[Call Management] Call ${callId} is ${call.status}`);
        res.status(409).json({
          success: false,
          error: `Call is ${call.status}`,
          call
        });
      }
    } catch (error) {
      console.error('Error connecting call:', error);
      res.status(500).json({ error: 'Failed to connect call' });
    }
  });

  /**
   * POST /api/calls/:callId/reject
   * Rejects an incoming call
   */
  app.post('/api/calls/:callId/reject', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { callId } = req.params;

      // Find the call
      const [call] = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.callId, callId))
        .limit(1);

      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify user is the receiver
      if (call.receiverId !== userId) {
        return res.status(403).json({ error: 'Only the receiver can reject this call' });
      }

      // Verify call is in requested state
      if (call.status !== 'requested') {
        return res.status(400).json({ error: 'Call is not in requested state' });
      }

      // Update call status to declined
      const [updatedCall] = await db
        .update(callSessions)
        .set({ 
          status: 'declined',
          endedAt: new Date()
        })
        .where(eq(callSessions.id, call.id))
        .returning();

      // Get initiator info for notification
      const [initiator] = await db
        .select()
        .from(users)
        .where(eq(users.id, call.initiatorId))
        .limit(1);

      // Notify initiator
      const user = (req as any).user;
      await createCallNotification(
        call.initiatorId,
        call.callType,
        'declined',
        user.name || user.username
      );

      res.json({
        success: true,
        call: updatedCall
      });
    } catch (error) {
      console.error('Error rejecting call:', error);
      res.status(500).json({ error: 'Failed to reject call' });
    }
  });

  /**
   * POST /api/calls/:callId/end
   * Ends an ongoing call
   */
  app.post('/api/calls/:callId/end', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { callId } = req.params;
      const { duration } = req.body;

      // Find the call
      const [call] = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.callId, callId))
        .limit(1);

      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify user is part of the call
      if (call.initiatorId !== userId && call.receiverId !== userId) {
        return res.status(403).json({ error: 'You are not part of this call' });
      }

      // Calculate duration if not provided
      let callDuration = duration;
      if (!callDuration && call.startedAt) {
        callDuration = Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000);
      }

      // Update call status
      const newStatus = call.status === 'requested' ? 'missed' : 'ended';
      const [updatedCall] = await db
        .update(callSessions)
        .set({ 
          status: newStatus,
          endedAt: new Date(),
          duration: callDuration || 0
        })
        .where(eq(callSessions.id, call.id))
        .returning();

      // If call was missed, notify receiver
      if (newStatus === 'missed') {
        const [initiator] = await db
          .select()
          .from(users)
          .where(eq(users.id, call.initiatorId))
          .limit(1);

        await createCallNotification(
          call.receiverId,
          call.callType,
          'missed',
          initiator.name || initiator.username
        );
      }

      res.json({
        success: true,
        call: updatedCall
      });
    } catch (error) {
      console.error('Error ending call:', error);
      res.status(500).json({ error: 'Failed to end call' });
    }
  });

  /**
   * GET /api/calls/history
   * Gets call history for the authenticated user
   */
  app.get('/api/calls/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get call history
      const calls = await db
        .select({
          id: callSessions.id,
          callId: callSessions.callId,
          initiatorId: callSessions.initiatorId,
          receiverId: callSessions.receiverId,
          callType: callSessions.callType,
          status: callSessions.status,
          startedAt: callSessions.startedAt,
          endedAt: callSessions.endedAt,
          duration: callSessions.duration,
          initiatorName: users.name,
          initiatorUsername: users.username,
          initiatorAvatar: users.avatar
        })
        .from(callSessions)
        .leftJoin(users, eq(
          callSessions.initiatorId === userId 
            ? callSessions.receiverId 
            : callSessions.initiatorId,
          users.id
        ))
        .where(
          or(
            eq(callSessions.initiatorId, userId),
            eq(callSessions.receiverId, userId)
          )
        )
        .orderBy(callSessions.startedAt)
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        calls
      });
    } catch (error) {
      console.error('Error fetching call history:', error);
      res.status(500).json({ error: 'Failed to fetch call history' });
    }
  });

  /**
   * GET /api/calls/conversation/:otherUserId
   * Gets call history for a specific conversation
   */
  app.get('/api/calls/conversation/:otherUserId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const otherUserId = parseInt(req.params.otherUserId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Get call history between these two users
      const calls = await db
        .select()
        .from(callSessions)
        .where(
          or(
            and(
              eq(callSessions.initiatorId, userId),
              eq(callSessions.receiverId, otherUserId)
            ),
            and(
              eq(callSessions.initiatorId, otherUserId),
              eq(callSessions.receiverId, userId)
            )
          )
        )
        .orderBy(callSessions.startedAt);

      res.json({
        success: true,
        calls
      });
    } catch (error) {
      console.error('Error fetching conversation call history:', error);
      res.status(500).json({ error: 'Failed to fetch call history' });
    }
  });

  /**
   * GET /api/calls/:callId
   * Gets details of a specific call
   */
  app.get('/api/calls/:callId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { callId } = req.params;

      // Find the call
      const [call] = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.callId, callId))
        .limit(1);

      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify user is part of the call
      if (call.initiatorId !== userId && call.receiverId !== userId) {
        return res.status(403).json({ error: 'You are not part of this call' });
      }

      res.json({
        success: true,
        call
      });
    } catch (error) {
      console.error('Error fetching call:', error);
      res.status(500).json({ error: 'Failed to fetch call' });
    }
  });
}
