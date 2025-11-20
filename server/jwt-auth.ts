import { Request, Response, NextFunction, Express } from 'express';
import { randomBytes } from 'crypto';
import type { IStorage } from './storage';
import { InsertAuthToken, User } from '@shared/schema';
import { 
  generateSecureToken, 
  verifyTokenSignature, 
  createTokenPayload,
  TokenPayload
} from './security/token-utils';

// Re-export TokenPayload for backwards compatibility
export type { TokenPayload };

// Declare module express-session with a custom user object
declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload | User;
    token?: string; 
    authToken?: any;
  }
}

// Storage will be injected to avoid circular dependency
let storageInstance: IStorage;

/**
 * Initialize JWT auth with storage instance
 * MUST be called after storage is initialized to avoid circular dependency
 */
export function initializeJwtAuth(storage: IStorage): void {
  storageInstance = storage;
}

/**
 * Verifies token signature and expiration (synchronous, does NOT check database)
 * Use verifyTokenWithDatabase() for full verification including revocation check
 */
export function verifyToken(token: string): TokenPayload | null {
  return verifyTokenSignature(token);
}

/**
 * Verifies and decodes a token with database revocation check
 * SECURITY: Always use this for authentication - checks token is not revoked
 */
export async function verifyTokenWithDatabase(token: string): Promise<TokenPayload | null> {
  try {
    // First verify signature and expiration
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }
    
    if (!storageInstance) {
      console.error('[SECURITY] Storage not initialized in JWT auth');
      return null;
    }
    
    // CRITICAL: Check database to ensure token hasn't been revoked
    const authToken = await storageInstance.getAuthToken(token);
    if (!authToken) {
      console.warn('[SECURITY] Token not found in database - possibly forged or cleaned up');
      return null;
    }
    
    // Check if token has been revoked
    if (authToken.isRevoked) {
      console.warn('[SECURITY] Token has been revoked');
      return null;
    }
    
    // Check database expiration (double-check against payload)
    if (new Date(authToken.expiresAt) < new Date()) {
      console.warn('[SECURITY] Token expired according to database');
      // Auto-revoke expired token
      await storageInstance.revokeAuthToken(authToken.id, 'Token expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification with database failed:', error);
    return null;
  }
}

/**
 * Generate a token for authentication
 */
export async function generateToken(
  userId: number, 
  role: string, 
  deviceInfo: { 
    clientId?: string, 
    deviceType?: string, 
    deviceInfo?: string,
    ipAddress?: string 
  } = {}
): Promise<{ token: string, expiresAt: Date }> {
  if (!storageInstance) {
    throw new Error('Storage not initialized in JWT auth. Call initializeJwtAuth() first.');
  }
  
  // Create the token payload using token-utils
  const { payload, expiresAt } = createTokenPayload(userId, role);
  
  // Generate the token using token-utils
  const token = generateSecureToken(payload);
  
  // Store token in database for tracking/revocation
  const tokenData: InsertAuthToken = {
    userId,
    token,
    clientId: deviceInfo.clientId || '',
    deviceType: deviceInfo.deviceType || 'unknown',
    deviceInfo: deviceInfo.deviceInfo || '',
    ipAddress: deviceInfo.ipAddress || '',
    expiresAt,
    isRevoked: false,
  };
  
  await storageInstance.createAuthToken(tokenData);
  
  return { token, expiresAt };
}

/**
 * Middleware to authenticate tokens with full database verification
 * SECURITY: Uses verifyTokenWithDatabase to check revocation status
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Get token from Authorization header or query parameter
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.query.token as string;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }
  
  // Store raw token for later use
  req.token = token;
    
  (async () => {
    try {
      // SECURITY: Use database verification to check revocation
      const payload = await verifyTokenWithDatabase(token);
      if (!payload) {
        return res.status(403).json({ message: 'Invalid or revoked token' });
      }
      
      // Get full token record for additional context
      const authToken = await storageInstance.getAuthToken(token);
      if (!authToken) {
        // Should never happen if verifyTokenWithDatabase passed, but safety check
        return res.status(401).json({ message: 'Token not found' });
      }
      
      // Update token's last active timestamp (don't await to prevent slowing down requests)
      storage.updateTokenLastActive(authToken.id).catch(err => {
        console.error('[AUTH] Failed to update token last active:', err);
      });
      
      // Store payload and token record for route handlers
      req.user = payload;
      req.authToken = authToken;
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Internal server error during authentication' });
    }
  })();
}

/**
 * Middleware to require specific roles for access
 */
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Only proceed if authenticate middleware was used before this
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user's role is in the allowed roles
    const userRole = (req.user as TokenPayload).role || (req.user as User).role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
}

/**
 * Revoke a specific token
 */
export async function revokeToken(token: string, reason: string = 'User initiated'): Promise<boolean> {
  try {
    if (!storageInstance) {
      throw new Error('Storage not initialized in JWT auth');
    }
    
    // Try to verify token but don't throw if invalid
    const payload = verifyToken(token);
    
    // Find and revoke the token
    const authToken = await storageInstance.getAuthToken(token);
    if (!authToken) {
      return false;
    }
    
    await storageInstance.revokeAuthToken(authToken.id, reason);
    return true;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
}

/**
 * Revoke all tokens for a user
 */
export async function revokeAllUserTokens(userId: number, reason: string = 'Security measure'): Promise<boolean> {
  try {
    if (!storageInstance) {
      throw new Error('Storage not initialized in JWT auth');
    }
    
    await storageInstance.revokeAllUserTokens(userId, reason);
    return true;
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
    return false;
  }
}

/**
 * Housekeeping function to clean up expired tokens
 * Call this periodically (e.g., once a day via a cron job)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    if (!storageInstance) {
      throw new Error('Storage not initialized in JWT auth');
    }
    
    await storageInstance.cleanupExpiredTokens();
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}

/**
 * Setup JWT authentication routes
 * @param app Express application
 */
export function setupJwtAuth(app: any): void {
  // DISABLED: All JWT authentication routes disabled to prevent conflicts with session-based auth
  console.log('[JWT-AUTH] JWT authentication system disabled - using session-based authentication instead');
}
