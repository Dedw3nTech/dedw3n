/**
 * Enhanced logout implementation with comprehensive session management,
 * cookie clearing, JWT revocation, and cache control headers for maximum security
 */
import { Request, Response } from 'express';
import { revokeToken, revokeAllUserTokens } from './jwt-auth';

export function createEnhancedLogout() {
  return async (req: Request, res: Response) => {
    console.log('[ENHANCED-LOGOUT] Starting comprehensive logout process');
    
    try {
      // Store user ID for JWT revocation before clearing
      // SECURITY FIX: Handle both session-based auth (user.id) and JWT-based auth (user.userId)
      // Convert to number and validate
      const rawUserId = (req.user as any)?.id ?? (req.user as any)?.userId;
      const userId = rawUserId ? Number(rawUserId) : null;
      
      // SECURITY: Revoke ALL JWT tokens from all sources before clearing
      const tokensToRevoke = new Set<string>();
      
      // Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        tokensToRevoke.add(authHeader.substring(7));
      }
      
      // Check ALL possible cookie sources for JWT tokens
      const tokenCookieNames = [
        'jwt', 'token', 'authToken', 'auth', 'user_session', 
        'session_token', 'remember_me', 'tokenId', 'login_token',
        'authentication', 'dedwen_token'
      ];
      
      for (const cookieName of tokenCookieNames) {
        const cookieValue = req.cookies?.[cookieName];
        if (cookieValue && typeof cookieValue === 'string') {
          tokensToRevoke.add(cookieValue);
        }
      }
      
      // Revoke each individual token found
      for (const token of Array.from(tokensToRevoke)) {
        try {
          await revokeToken(token, 'Enhanced logout - individual token');
          console.log('[ENHANCED-LOGOUT] Individual JWT token revoked');
        } catch (tokenError) {
          console.error('[ENHANCED-LOGOUT] Error revoking individual token:', tokenError);
        }
      }
      
      // SECURITY: Revoke all user tokens by userId if available and valid
      if (userId && !isNaN(userId)) {
        try {
          // Revoke all user tokens for complete logout across all devices
          await revokeAllUserTokens(userId, 'Enhanced logout - all devices');
          console.log('[ENHANCED-LOGOUT] All JWT tokens revoked for user:', userId);
        } catch (tokenError) {
          console.error('[ENHANCED-LOGOUT] Error revoking all user tokens:', tokenError);
          // Continue with logout even if token revocation fails
        }
      } else if (rawUserId) {
        console.warn('[ENHANCED-LOGOUT] User ID is not a valid number, skipping revokeAllUserTokens:', rawUserId);
      }
      
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
      
      // 4. Destroy Express session completely - destroy old session first
      if (req.session) {
        const oldSessionId = req.sessionID;
        
        // SECURITY FIX: Destroy the old session from the store before anything else
        await new Promise<void>((resolve) => {
          const sessionStore = (req.session as any).store || (req as any).sessionStore;
          if (sessionStore && sessionStore.destroy) {
            sessionStore.destroy(oldSessionId, (err: any) => {
              if (err) {
                console.error('[ENHANCED-LOGOUT] Error destroying old session from store:', err);
              } else {
                console.log('[ENHANCED-LOGOUT] Old session destroyed from store:', oldSessionId);
              }
              resolve();
            });
          } else {
            console.warn('[ENHANCED-LOGOUT] Session store not accessible for manual cleanup');
            resolve();
          }
        });
        
        // Now destroy the current session object
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
      
      // 5. Clear all possible authentication cookies matching original issuance settings
      // SECURITY FIX: Clear cookies with multiple configurations to match both production and development settings
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Get current domain information
      const host = req.get('host') || '';
      const isReplit = host.includes('.replit.dev');
      
      let cookieDomain: string | undefined = undefined;
      if (isProduction && isReplit) {
        const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
        if (replitMatch) {
          cookieDomain = `.${replitMatch[1]}`;
        }
      }
      
      const baseCookieOptions = {
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      };
      
      // Clear cookies for current domain with all possible configurations
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
        'login_token',
        'remember_me',
        'unified_logout'
      ];
      
      // Multiple cookie configurations to handle all scenarios
      const cookieConfigs = [
        // Production settings (secure: true, sameSite: strict)
        { ...baseCookieOptions, httpOnly: true, secure: true, sameSite: 'strict' as const, domain: cookieDomain },
        // Development settings (secure: false, sameSite: lax)
        { ...baseCookieOptions, httpOnly: true, secure: false, sameSite: 'lax' as const },
        // Client-side cookies (httpOnly: false)
        { ...baseCookieOptions, httpOnly: false, secure: isProduction, sameSite: 'strict' as const, domain: cookieDomain },
        { ...baseCookieOptions, httpOnly: false, secure: false, sameSite: 'lax' as const },
        // Fallback basic configuration
        { ...baseCookieOptions }
      ];
      
      cookiesToClear.forEach(cookieName => {
        cookieConfigs.forEach(config => {
          res.clearCookie(cookieName, config);
        });
      });
      
      // 6. Clear domain-specific cookies for Replit environments (additional attempt)
      if (isReplit) {
        const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
        if (replitMatch) {
          const replitDomain = `.${replitMatch[1]}`;
          cookiesToClear.forEach(cookieName => {
            res.clearCookie(cookieName, { ...baseCookieOptions, httpOnly: true, secure: true, sameSite: 'strict' as const, domain: replitDomain });
            res.clearCookie(cookieName, { ...baseCookieOptions, httpOnly: false, secure: true, sameSite: 'strict' as const, domain: replitDomain });
          });
        }
      }
      
      console.log('[ENHANCED-LOGOUT] All cookies cleared with comprehensive settings');
      
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

import { Request } from 'express';
import { extractGpcSignal, applyGpcHeaders } from './gpc-middleware';

/**
 * Utility function to add security headers to responses
 * Call this directly in route handlers that need extra protection
 */
export function addSecurityHeaders(res: Response): void {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer'
  });
}

/**
 * Comprehensive privacy and security header helper
 * Combines security headers + GPC (Global Privacy Control) compliance
 * Call this on all sensitive routes (messages, cart, orders, payment, user data, etc.)
 */
export function attachPrivacyHeaders(res: Response, req: Request): void {
  // Add security headers
  addSecurityHeaders(res);
  
  // Extract and apply GPC (Global Privacy Control) signal for privacy compliance
  const gpcSignal = extractGpcSignal(req);
  applyGpcHeaders(res, gpcSignal);
}

/**
 * Middleware to check for logout state and prevent access to protected resources
 * Updated to allow authentication flows to proceed and respect cookie expiration
 */
export function logoutStateChecker() {
  return (req: Request, res: Response, next: Function) => {
    // Skip logout check for logout endpoint itself
    if (req.path === '/api/logout') {
      return next();
    }
    
    // Allow authentication and user endpoints to proceed - don't block auth flows
    const authEndpoints = [
      '/api/user',           // User authentication check
      '/api/auth',           // Authentication endpoints
      '/api/login',          // Login flows
      '/api/register',       // Registration flows  
      '/api/session',        // Session management
      '/api/user/language',  // User language settings
      '/api/subscription/status' // User subscription check
    ];
    
    const isAuthEndpoint = authEndpoints.some(endpoint => req.path.startsWith(endpoint));
    if (isAuthEndpoint) {
      // Allow auth endpoints to proceed - they handle their own authentication
      return next();
    }
    
    // For logout cookies, check if they should have expired (10 seconds from unified logout system)
    if (req.cookies?.unified_logout === 'true') {
      // The cookie should expire in 10 seconds, but check if it's actually expired
      // If the cookie exists but should be expired, allow the request to proceed
      const now = Date.now();
      
      // Check if user_logged_out cookie has a timestamp
      const logoutTimestamp = req.cookies?.user_logged_out;
      if (logoutTimestamp && !isNaN(parseInt(logoutTimestamp))) {
        const logoutTime = parseInt(logoutTimestamp);
        const timeSinceLogout = now - logoutTime;
        
        // If more than 15 seconds have passed since logout, allow the request
        if (timeSinceLogout > 15000) {
          console.log('[LOGOUT-CHECKER] Logout cookies expired, allowing request');
          return next();
        }
      }
      
      console.log('[LOGOUT-CHECKER] User marked as logged out via cookies');
      return res.status(401).json({ 
        message: 'User session ended',
        requiresLogin: true,
        logout: true,
        redirect: '/auth'
      });
    }
    
    // Check for other logout signals for non-auth endpoints
    if (req.cookies?.dedwen_logout === 'true' || req.cookies?.user_logged_out) {
      console.log('[LOGOUT-CHECKER] User marked as logged out via other cookies');
      return res.status(401).json({ 
        message: 'User session ended',
        requiresLogin: true,
        logout: true,
        redirect: '/auth'
      });
    }
    
    // Check for logout headers from unified logout system (be less aggressive)
    const hasLogoutHeaders = req.headers['x-user-logged-out'] === 'true' || 
                           req.headers['x-auth-logged-out'] === 'true' ||
                           req.headers['x-unified-logout'] === 'true';
    
    if (hasLogoutHeaders) {
      // Only block if this is clearly a logout request, not a regular auth check
      const isBackgroundLogout = req.headers['x-background-logout'] === 'true';
      if (isBackgroundLogout) {
        console.log('[LOGOUT-CHECKER] Background logout detected, allowing to complete');
        return next();
      }
      
      console.log('[LOGOUT-CHECKER] User marked as logged out via headers');
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