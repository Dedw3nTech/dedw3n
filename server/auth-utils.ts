/**
 * Authentication Utilities
 * 
 * Clean, reusable authentication helper functions (NOT middleware).
 * These are pure functions that return auth results for manual inline use.
 * 
 * @requirements NO middleware - only manual inline authentication
 */

import type { Request } from 'express';
import { storage } from './storage';

export interface AuthResult {
  authenticated: boolean;
  userId?: number;
  user?: any;
  error?: string;
}

/**
 * Manual authentication check - pure function (NOT middleware)
 * 
 * Checks multiple authentication methods in priority order:
 * 1. Session authentication (Passport) - includes fallback to session store
 * 2. JWT token in Authorization header
 * 
 * @returns AuthResult with authentication status and user data
 */
export async function checkAuthentication(req: Request): Promise<AuthResult> {
  try {
    // Priority 1: Check session authentication (Passport)
    // First check if req.user is populated by Passport
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = req.user as any;
      return { authenticated: true, userId: user.id, user };
    }

    // Fallback: Check if user exists in session store even if req.user is not populated
    if (req.session && (req.session as any).passport && (req.session as any).passport.user) {
      const userId = (req.session as any).passport.user;
      if (userId && !isNaN(Number(userId))) {
        const user = await storage.getUser(Number(userId));
        if (user) {
          return { authenticated: true, userId: user.id, user };
        }
      }
    }

    // Priority 2: Check JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { verifyToken } = await import('./jwt-auth');
        const decoded = verifyToken(token);
        if (decoded && decoded.userId) {
          const user = await storage.getUser(decoded.userId);
          if (user) {
            return { authenticated: true, userId: user.id, user };
          }
        }
      } catch (jwtError) {
        // JWT verification failed, continue to return not authenticated
      }
    }

    return { authenticated: false, error: 'Authentication required' };

  } catch (error) {
    console.error('[AUTH-UTILS] Authentication check failed:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}
