import { Request, Response } from 'express';
import { invalidateSessionCache } from './websocket-handler';

/**
 * Instant Logout Handler
 * Optimized for near-zero latency logout
 * Returns immediately while cleanup happens asynchronously
 */
export function createInstantLogout() {
  return (req: Request, res: Response) => {
    // Capture session ID BEFORE sending response (for cache invalidation)
    const sessionId = req.sessionID;
    
    // Clear auth cookies immediately before sending response
    const cookiesToClear = [
      'connect.sid',
      'sessionId', 
      'dedwen_session',
      'token',
      'auth',
      'authToken',
      'jwt',
      'user_session',
      'session_token',
      'instant_logout_flag'
    ];
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0
    };
    
    cookiesToClear.forEach(name => {
      res.clearCookie(name, cookieOptions);
      res.clearCookie(name, { ...cookieOptions, httpOnly: false });
    });
    
    // Send response IMMEDIATELY - don't wait for anything
    res.status(200).json({ success: true, instant: true });
    
    // All cleanup happens AFTER response is sent (non-blocking)
    setImmediate(() => {
      performAsyncCleanup(req, sessionId);
    });
  };
}

/**
 * Async cleanup that runs after response is sent
 * This doesn't block the user's logout experience
 */
function performAsyncCleanup(req: Request, sessionId?: string): void {
  try {
    // SECURITY: Invalidate WebSocket session cache FIRST (before session destroy)
    if (sessionId) {
      try {
        invalidateSessionCache(sessionId);
        console.log('[INSTANT-LOGOUT] WebSocket session cache invalidated');
      } catch (cacheError) {
        console.error('[INSTANT-LOGOUT] Error invalidating session cache:', cacheError);
      }
    }
    
    // Clear user reference
    req.user = undefined;
    
    // Passport logout (if available) - don't wait
    if (req.isAuthenticated && req.isAuthenticated()) {
      req.logout((err) => {
        if (err) {
          console.error('[INSTANT-LOGOUT] Passport cleanup error:', err);
        }
      });
    }
    
    // Session destroy (if exists) - don't wait
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('[INSTANT-LOGOUT] Session cleanup error:', err);
        }
      });
    }
  } catch (error) {
    // Silent fail - user already logged out
    console.error('[INSTANT-LOGOUT] Cleanup error:', error);
  }
}