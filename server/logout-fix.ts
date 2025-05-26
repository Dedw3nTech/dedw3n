/**
 * Simple and effective logout endpoint
 */
import { Request, Response } from 'express';

export function createLogoutEndpoint() {
  return async (req: Request, res: Response) => {
    try {
      console.log('[LOGOUT] Starting logout process');
      
      // 1. Clear Passport.js session
      if (req.isAuthenticated()) {
        req.logout((err) => {
          if (err) {
            console.error('[LOGOUT] Session logout error:', err);
          } else {
            console.log('[LOGOUT] Session logout successful');
          }
        });
      }
      
      // 2. Destroy session completely
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('[LOGOUT] Session destroy error:', err);
          } else {
            console.log('[LOGOUT] Session destroyed');
          }
        });
      }
      
      // 3. Clear all auth cookies
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('token', { path: '/' });
      res.clearCookie('auth', { path: '/' });
      
      // 4. Clear user reference
      req.user = undefined;
      
      // 5. Set logout headers
      res.setHeader('X-Auth-Logged-Out', 'true');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      console.log('[LOGOUT] Logout completed successfully');
      
      // Return simple success response
      res.status(200).json({ 
        success: true, 
        message: 'Logged out successfully',
        redirect: '/auth'
      });
      
    } catch (error) {
      console.error('[LOGOUT] Logout error:', error);
      res.status(200).json({ 
        success: true, 
        message: 'Logged out',
        redirect: '/auth'
      });
    }
  };
}