import { Request, Response } from 'express';

/**
 * Fast, reliable logout endpoint that prioritizes speed and reliability
 * Eliminates complex async operations that cause delays
 */
export function createFastLogout() {
  return (req: Request, res: Response) => {
    console.log('[FAST-LOGOUT] Starting immediate logout process');
    
    try {
      // 1. Immediate response - don't wait for cleanup
      res.status(200).json({ 
        success: true, 
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
      });
      
      // 2. Background cleanup (non-blocking)
      setImmediate(() => {
        try {
          // Clear user from request
          req.user = undefined;
          
          // Quick session cleanup without waiting for callbacks
          if (req.session) {
            req.session.destroy(() => {
              console.log('[FAST-LOGOUT] Session destroyed');
            });
          }
          
          // Clear authentication cookies
          res.clearCookie('connect.sid', { path: '/' });
          res.clearCookie('token', { path: '/' });
          res.clearCookie('auth', { path: '/' });
          res.clearCookie('sessionId', { path: '/' });
          
          console.log('[FAST-LOGOUT] Background cleanup completed');
        } catch (error) {
          console.error('[FAST-LOGOUT] Background cleanup error:', error);
        }
      });
      
    } catch (error) {
      console.error('[FAST-LOGOUT] Logout error:', error);
      // Always return success to prevent client hanging
      res.status(200).json({ 
        success: true, 
        message: 'Logged out',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to handle logout state efficiently
 */
export function logoutStateMiddleware() {
  return (req: Request, res: Response, next: Function) => {
    // Check for explicit logout headers
    if (req.headers['x-user-logged-out'] === 'true') {
      console.log('[FAST-LOGOUT] User marked as logged out via header');
      return res.status(401).json({ message: 'User logged out' });
    }
    
    next();
  };
}