import { Request, Response } from 'express';
import { disconnectUserWebSocket, invalidateSessionCache } from './websocket-handler';
import { revokeToken, revokeAllUserTokens } from './jwt-auth';

export function createCleanLogout() {
  return async (req: Request, res: Response) => {
    console.log('[CLEAN-LOGOUT] Starting comprehensive logout process');
    
    try {
      // Store user ID before clearing for WebSocket cleanup and JWT revocation
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
          await revokeToken(token, 'User logout - individual token');
          console.log('[CLEAN-LOGOUT] Individual JWT token revoked');
        } catch (tokenError) {
          console.error('[CLEAN-LOGOUT] Error revoking individual token:', tokenError);
        }
      }
      
      // SECURITY: Revoke all user tokens by userId if available and valid
      if (userId && !isNaN(userId)) {
        try {
          // Revoke all user tokens for complete logout
          await revokeAllUserTokens(userId, 'User logout');
          console.log('[CLEAN-LOGOUT] All JWT tokens revoked for user:', userId);
        } catch (tokenError) {
          console.error('[CLEAN-LOGOUT] Error revoking all user tokens:', tokenError);
          // Continue with logout even if token revocation fails
        }
      } else if (rawUserId) {
        console.warn('[CLEAN-LOGOUT] User ID is not a valid number, skipping revokeAllUserTokens:', rawUserId);
      }
      
      // 1. Clear user from request
      req.user = undefined;
      
      // 1a. Clear ALL possible session user references
      if (req.session) {
        // Clear passport session data
        if ((req.session as any).passport) {
          delete (req.session as any).passport;
        }
        // Clear direct userId reference
        if ((req.session as any).userId) {
          delete (req.session as any).userId;
        }
        // Clear any other user data
        if ((req.session as any).user) {
          delete (req.session as any).user;
        }
        // Clear proxy account data
        if ((req.session as any).activeProxyAccountId) {
          delete (req.session as any).activeProxyAccountId;
        }
        console.log('[CLEAN-LOGOUT] Cleared all session user references');
      }
      
      // 2. Disconnect WebSocket if user was authenticated
      if (userId) {
        try {
          disconnectUserWebSocket(userId);
          console.log('[CLEAN-LOGOUT] WebSocket disconnected for user:', userId);
        } catch (wsError) {
          console.error('[CLEAN-LOGOUT] WebSocket disconnect error:', wsError);
        }
      }
      
      // 3. Logout from Passport if authenticated
      if (req.isAuthenticated && req.isAuthenticated()) {
        await new Promise<void>((resolve) => {
          req.logout((err) => {
            if (err) {
              console.error('[CLEAN-LOGOUT] Passport logout error:', err);
            }
            resolve();
          });
        });
        console.log('[CLEAN-LOGOUT] Passport logout completed');
      }
      
      // 4. Destroy session completely - destroy old session first, then the current one
      if (req.session) {
        const oldSessionId = req.sessionID;
        
        // SECURITY: Invalidate WebSocket session cache BEFORE destroying session
        if (oldSessionId) {
          try {
            invalidateSessionCache(oldSessionId);
            console.log('[CLEAN-LOGOUT] WebSocket session cache invalidated');
          } catch (cacheError) {
            console.error('[CLEAN-LOGOUT] Error invalidating session cache:', cacheError);
          }
        }
        
        // SECURITY FIX: Destroy the old session from the store before doing anything else
        await new Promise<void>((resolve) => {
          // Access the session store to destroy the old session
          const sessionStore = (req.session as any).store || (req as any).sessionStore;
          if (sessionStore && sessionStore.destroy) {
            sessionStore.destroy(oldSessionId, (err: any) => {
              if (err) {
                console.error('[CLEAN-LOGOUT] Error destroying old session from store:', err);
              } else {
                console.log('[CLEAN-LOGOUT] Old session destroyed from store:', oldSessionId);
              }
              resolve();
            });
          } else {
            console.warn('[CLEAN-LOGOUT] Session store not accessible for manual cleanup');
            resolve();
          }
        });
        
        // Now destroy the current session object
        await new Promise<void>((resolve) => {
          req.session.destroy((err) => {
            if (err) {
              console.error('[CLEAN-LOGOUT] Session destroy error:', err);
            } else {
              console.log('[CLEAN-LOGOUT] Current session destroyed');
            }
            resolve();
          });
        });
      }
      
      // 5. Clear ALL cookies matching the original cookie issuance settings
      // SECURITY FIX: Match the cookie settings from auth.ts to properly clear production cookies
      const isProduction = process.env.NODE_ENV === 'production';
      
      const baseCookieOptions = {
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      };
      
      // Get domain for cookie clearing (same logic as in auth.ts)
      const host = req.get('host') || '';
      let cookieDomain: string | undefined = undefined;
      if (isProduction && host.includes('.replit.dev')) {
        const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
        if (replitMatch) {
          cookieDomain = `.${replitMatch[1]}`;
        }
      }
      
      // Cookie configurations matching issuance settings
      const cookieConfigs = [
        // Match production settings (secure: true in production, sameSite: strict)
        { ...baseCookieOptions, httpOnly: true, secure: isProduction, sameSite: 'strict' as const, domain: cookieDomain },
        // Match development settings (secure: false, sameSite: lax)
        { ...baseCookieOptions, httpOnly: true, secure: false, sameSite: 'lax' as const },
        // Also try without httpOnly for client-side cookies
        { ...baseCookieOptions, httpOnly: false, secure: isProduction, sameSite: 'strict' as const, domain: cookieDomain },
        { ...baseCookieOptions, httpOnly: false, secure: false, sameSite: 'lax' as const },
        // Fallback basic configuration
        { ...baseCookieOptions }
      ];
      
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
        'remember_me',
        'unified_logout'
      ];
      
      // Clear each cookie with all configurations
      cookiesToClear.forEach(cookieName => {
        cookieConfigs.forEach(config => {
          res.clearCookie(cookieName, config);
        });
      });
      
      console.log('[CLEAN-LOGOUT] All cookies cleared with matching settings');
      
      // 6. Set cache headers to prevent caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      console.log('[CLEAN-LOGOUT] Logout completed successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('[CLEAN-LOGOUT] Critical error during logout:', error);
      
      // Fallback: ensure user is cleared even on error
      req.user = undefined;
      
      // Try to clear basic session
      if (req.session) {
        req.session.destroy(() => {});
      }
      
      return res.status(200).json({
        success: true,
        message: 'Logged out with warnings',
        timestamp: Date.now()
      });
    }
  };
}
