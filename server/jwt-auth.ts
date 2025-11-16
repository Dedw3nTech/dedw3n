import { Request, Response, NextFunction, Express } from 'express';
import { randomBytes, createHmac } from 'crypto';
import { storage } from './storage';
import { InsertAuthToken, User } from '@shared/schema';

// Default token expiration in seconds (24 hours)
const TOKEN_EXPIRES_IN = 86400;

// SECURITY: Require TOKEN_SECRET in production, fail fast if missing
if (!process.env.TOKEN_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[CRITICAL ERROR] TOKEN_SECRET environment variable is not set in production!');
  console.error('[CRITICAL ERROR] This is a critical security vulnerability - tokens cannot be securely issued.');
  console.error('[CRITICAL ERROR] Please set TOKEN_SECRET in your environment secrets immediately.');
  throw new Error('TOKEN_SECRET environment variable is required in production');
}

// Get the token secret from environment variable with secure fallback for development only
const TOKEN_SECRET = process.env.TOKEN_SECRET || 
  (process.env.NODE_ENV === 'development' 
    ? 'dedw3n-development-secret-key-for-jwt-authentication-do-not-use-in-production'
    : '');

// Validate secret is not empty (should never happen with above checks, but safety check)
if (!TOKEN_SECRET) {
  throw new Error('TOKEN_SECRET is required but not set');
}

// Log the token secret source for debugging (without exposing the actual secret)
console.log(`[AUTH] Using token secret from ${process.env.TOKEN_SECRET ? 'environment variable' : 'development fallback'}`);

// Declare module express-session with a custom user object
declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload | User;
    token?: string; 
    authToken?: any;
  }
}

export interface TokenPayload {
  userId: number;
  role: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Verifies a password against a stored hash
 * @param plain The plain text password to verify
 * @param stored The stored hash to verify against
 * @returns True if the password matches, false otherwise
 */
async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    // Extract the salt from the stored hash
    const [hashedPassword, salt] = stored.split('.');
    
    if (!hashedPassword || !salt) {
      console.error('Invalid stored password format');
      return false;
    }
    
    // Hash the plain password with the same salt
    const hashedBuffer = createHmac('sha512', salt)
      .update(plain)
      .digest();
    
    // Convert the hash to a hex string
    const hashedInputPassword = hashedBuffer.toString('hex');
    
    // Compare the hashed input to the stored hash
    return hashedInputPassword === hashedPassword;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generates a secure token string using the crypto module
 */
function generateSecureToken(payload: TokenPayload): string {
  // Convert payload to string
  const payloadStr = JSON.stringify(payload);
  
  // Create a signature using HMAC SHA-256
  const signature = createHmac('sha256', TOKEN_SECRET)
    .update(payloadStr)
    .digest('hex');
  
  // Combine payload and signature
  const base64Payload = Buffer.from(payloadStr).toString('base64');
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies token signature and expiration (synchronous, does NOT check database)
 * Use verifyTokenWithDatabase() for full verification including revocation check
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    // Split token into parts
    const [base64Payload, signature] = token.split('.');
    
    // Check if token format is valid
    if (!base64Payload || !signature) {
      return null;
    }
    
    // Decode the payload
    const payloadStr = Buffer.from(base64Payload, 'base64').toString();
    const payload = JSON.parse(payloadStr) as TokenPayload;
    
    // Verify signature
    const expectedSignature = createHmac('sha256', TOKEN_SECRET)
      .update(payloadStr)
      .digest('hex');
    
    // Check if signatures match
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Check if token has expired
    if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
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
    
    // CRITICAL: Check database to ensure token hasn't been revoked
    const authToken = await storage.getAuthToken(token);
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
      await storage.revokeAuthToken(authToken.id, 'Token expired');
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
  // Generate a unique token identifier
  const tokenId = randomBytes(32).toString('hex');
  
  // Set expiration date
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN * 1000);
  
  // Create the token payload
  const payload: TokenPayload = {
    userId,
    role,
    tokenId,
    issuedAt,
    expiresAt: Math.floor(expiresAt.getTime() / 1000)
  };
  
  // Generate the token
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
  
  await storage.createAuthToken(tokenData);
  
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
      const authToken = await storage.getAuthToken(token);
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
    // Try to verify token but don't throw if invalid
    const payload = verifyToken(token);
    
    // Find and revoke the token
    const authToken = await storage.getAuthToken(token);
    if (!authToken) {
      return false;
    }
    
    await storage.revokeAuthToken(authToken.id, reason);
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
    await storage.revokeAllUserTokens(userId, reason);
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
    await storage.cleanupExpiredTokens();
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
