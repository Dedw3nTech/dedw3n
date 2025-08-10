/**
 * Enhanced logout implementation with comprehensive session management,
 * cookie clearing, and cache control headers for maximum security
 */
import { Request, Response } from 'express';

export function createEnhancedLogout() {
  return async (req: Request, res: Response) => {
    console.log('[ENHANCED-LOGOUT] Starting comprehensive logout process');
    
    try {
      // 1. Set comprehensive anti-caching headers immediately
      const antiCacheHeaders = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Clear-Site-Data': '"cache", "cookies", "storage", "executionContexts"',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'X-Auth-Logged-Out': 'true',
        'X-Session-Cleared': 'true',
        'X-User-Logged-Out': 'true'
      };
      
      res.set(antiCacheHeaders);
      
      // 2. Clear user reference immediately
      req.user = undefined;
      
      // 3. Destroy Passport.js session
      if (req.isAuthenticated && req.isAuthenticated()) {
        await new Promise<void>((resolve) => {
          req.logout((err) => {
            if (err) {
              console.error('[ENHANCED-LOGOUT] Passport logout error:', err);
            } else {
              console.log('[ENHANCED-LOGOUT] Passport session cleared');
            }
            resolve();
          });
        });
      }
      
      // 4. Destroy Express session completely
      if (req.session) {
        await new Promise<void>((resolve, reject) => {
          req.session.destroy((err) => {
            if (err) {
              console.error('[ENHANCED-LOGOUT] Session destroy error:', err);
              reject(err);
            } else {
              console.log('[ENHANCED-LOGOUT] Express session destroyed');
              resolve();
            }
          });
        });
      }
      
      // 5. Clear all possible authentication cookies with comprehensive options
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        domain: undefined as string | undefined,
        maxAge: 0
      };
      
      // Get current domain information
      const host = req.get('host') || '';
      const isReplit = host.includes('.replit.dev');
      
      // Clear cookies for current domain
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
        'authentication',
        'login_token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        res.clearCookie(cookieName, cookieOptions);
        // Also clear without httpOnly for client-side cookies
        res.clearCookie(cookieName, { ...cookieOptions, httpOnly: false });
      });
      
      // 6. Clear domain-specific cookies for Replit environments
      if (isReplit) {
        const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
        if (replitMatch) {
          const replitDomain = `.${replitMatch[1]}`;
          cookiesToClear.forEach(cookieName => {
            res.clearCookie(cookieName, { ...cookieOptions, domain: replitDomain });
            res.clearCookie(cookieName, { ...cookieOptions, domain: replitDomain, httpOnly: false });
          });
        }
      }
      
      // 7. Set logout signal cookies (short-lived for cross-tab coordination)
      const logoutSignalOptions = {
        httpOnly: false, // Allow JavaScript access for cross-tab cleanup
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 10000, // 10 seconds
        path: '/'
      };
      
      res.cookie('dedwen_logout', 'true', logoutSignalOptions);
      res.cookie('user_logged_out', Date.now().toString(), logoutSignalOptions);
      res.cookie('cross_domain_logout', 'true', logoutSignalOptions);
      
      // 8. Additional security headers for sensitive data protection
      res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
        'X-Permitted-Cross-Domain-Policies': 'none'
      });
      
      console.log('[ENHANCED-LOGOUT] Comprehensive logout completed successfully');
      
      // 9. Return success response with security metadata
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
        security: {
          sessionDestroyed: true,
          cookiesCleared: true,
          cacheDisabled: true,
          crossDomainCleanup: isReplit
        },
        redirect: '/logout-success'
      });
      
    } catch (error) {
      console.error('[ENHANCED-LOGOUT] Logout error:', error);
      
      // Even on error, ensure basic security measures
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Auth-Logged-Out': 'true'
      });
      
      // Clear user reference
      req.user = undefined;
      
      // Return success to prevent client hanging
      return res.status(200).json({
        success: true,
        message: 'Logged out',
        timestamp: new Date().toISOString(),
        error: 'Partial logout completed due to technical issue'
      });
    }
  };
}

/**
 * Middleware to add security headers to all sensitive pages
 */
export function addSecurityHeaders() {
  return (req: Request, res: Response, next: Function) => {
    // Check if this is a sensitive route that needs extra protection
    const sensitiveRoutes = [
      '/api/user',
      '/api/messages',
      '/api/notifications',
      '/api/cart',
      '/api/orders',
      '/api/profile',
      '/api/wallet',
      '/api/payment'
    ];
    
    const isSensitiveRoute = sensitiveRoutes.some(route => req.path.startsWith(route));
    
    if (isSensitiveRoute) {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer'
      });
    }
    
    next();
  };
}

/**
 * Middleware to check for logout state and prevent access to protected resources
 */
export function logoutStateChecker() {
  return (req: Request, res: Response, next: Function) => {
    // Skip logout check for logout endpoint itself
    if (req.path === '/api/logout') {
      return next();
    }
    
    // Check for logout headers from unified logout system
    if (req.headers['x-user-logged-out'] === 'true' || 
        req.headers['x-auth-logged-out'] === 'true' ||
        req.headers['x-unified-logout'] === 'true') {
      console.log('[LOGOUT-CHECKER] User marked as logged out via headers');
      return res.status(401).json({ 
        message: 'User session ended',
        requiresLogin: true,
        logout: true,
        redirect: '/auth'
      });
    }
    
    // Check for logout cookies
    if (req.cookies?.dedwen_logout === 'true' || 
        req.cookies?.user_logged_out ||
        req.cookies?.unified_logout === 'true') {
      console.log('[LOGOUT-CHECKER] User marked as logged out via cookies');
      return res.status(401).json({ 
        message: 'User session ended',
        requiresLogin: true,
        logout: true,
        redirect: '/auth'
      });
    }
    
    next();
  };
}