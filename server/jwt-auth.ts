import { Request, Response, NextFunction, Express } from 'express';
import { randomBytes, createHmac } from 'crypto';
import { storage } from './storage';
import { InsertAuthToken, User } from '@shared/schema';

// Default token expiration in seconds (24 hours)
const TOKEN_EXPIRES_IN = 86400;
// Get the token secret from environment variable with fallback for development
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'dedw3n-development-secret-key-for-jwt-authentication-do-not-use-in-production';

// Log the token secret source for debugging (without exposing the actual secret)
console.log(`[AUTH] Using token secret from ${process.env.TOKEN_SECRET ? 'environment variable' : 'fallback value'}`);

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
 * Verifies and decodes a token
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
 * Middleware to authenticate tokens
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
  
  // Verify token using our custom verification
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Invalid token' });
  }
    
  (async () => {
    try {
      // Check if token exists in database and is not revoked
      const authToken = await storage.getAuthToken(token);
      if (!authToken) {
        return res.status(401).json({ message: 'Token not found' });
      }
      
      if (authToken.isRevoked) {
        return res.status(401).json({ message: 'Token has been revoked' });
      }
      
      // Check if the token has expired
      if (new Date(authToken.expiresAt) < new Date()) {
        await storage.revokeAuthToken(authToken.id, 'Token expired');
        return res.status(401).json({ message: 'Token expired' });
      }
      
      // Update token's last active timestamp (don't await to prevent slowing down requests)
      storage.updateTokenLastActive(authToken.id);
      
      // Store payload for route handlers
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
  // Login route
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Validate credentials
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if account is locked
      if (user.isLocked) {
        return res.status(403).json({ message: 'Account is locked. Please contact support.' });
      }
      
      // Verify password (implement password verification)
      const isPasswordValid = await verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        await storage.incrementLoginAttempts(user.id);
        
        // Check if we should lock the account
        const updatedUser = await storage.getUser(user.id);
        if (updatedUser && updatedUser.failedLoginAttempts && updatedUser.failedLoginAttempts >= 5) {
          await storage.lockUserAccount(user.id, true);
          return res.status(403).json({ 
            message: 'Account locked due to too many failed attempts. Please contact support.' 
          });
        }
        
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Reset failed login attempts on successful login
      await storage.resetLoginAttempts(user.id);
      
      // Update last login timestamp
      await storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Generate authentication token
      const deviceInfo = {
        clientId: req.body.clientId || '',
        deviceType: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || ''
      };
      
      const { token, expiresAt } = await generateToken(user.id, user.role, deviceInfo);
      
      // Return the token
      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          isVendor: user.isVendor
        },
        token,
        expiresAt
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Logout route
  app.post('/api/auth/logout', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.token) {
        return res.status(400).json({ message: 'No active session' });
      }
      
      const success = await revokeToken(req.token, 'User logout');
      if (success) {
        return res.json({ message: 'Logged out successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to logout properly' });
      }
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get current user - COMMENTED OUT as this is now handled by unified auth in routes.ts
  /*
  app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // If the user data comes from token payload
    if ('userId' in req.user) {
      // Need to get full user data from DB since token just has basic info
      storage.getUser(req.user.userId)
        .then(user => {
          if (user) {
            res.json({
              id: user.id,
              username: user.username,
              name: user.name,
              email: user.email,
              role: user.role,
              isVendor: user.isVendor,
              bio: user.bio,
              avatar: user.avatar
            });
          } else {
            res.status(404).json({ message: 'User not found' });
          }
        })
        .catch(err => {
          console.error('Error fetching user details:', err);
          res.status(500).json({ message: 'Internal server error' });
        });
    } else {
      // Already have full user object
      const user = req.user;
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        isVendor: user.isVendor,
        bio: user.bio,
        avatar: user.avatar
      });
    }
  });
  */
  
  // Refresh token
  app.post('/api/auth/refresh', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user || !('userId' in req.user)) {
        return res.status(401).json({ message: 'Invalid session' });
      }
      
      // Revoke current token
      if (req.token) {
        await revokeToken(req.token, 'Token refresh');
      }
      
      // Generate new token
      const deviceInfo = {
        clientId: req.body.clientId || '',
        deviceType: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || ''
      };
      
      const { token, expiresAt } = await generateToken(
        req.user.userId, 
        req.user.role, 
        deviceInfo
      );
      
      res.json({ token, expiresAt });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // List active sessions
  app.get('/api/auth/sessions', authenticate, requireRole('user'), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = 'userId' in req.user ? req.user.userId : req.user.id;
      const sessions = await storage.getActiveUserSessions(userId);
      
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Revoke specific session
  app.delete('/api/auth/sessions/:tokenId', authenticate, requireRole('user'), async (req: Request, res: Response) => {
    try {
      const { tokenId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = 'userId' in req.user ? req.user.userId : req.user.id;
      
      // Convert tokenId to number as our storage method requires a number
      const tokenIdNum = parseInt(tokenId, 10);
      if (isNaN(tokenIdNum)) {
        return res.status(400).json({ message: 'Invalid token ID format' });
      }
      
      const success = await storage.revokeSpecificToken(userId, tokenIdNum);
      
      if (success) {
        res.json({ message: 'Session revoked successfully' });
      } else {
        res.status(404).json({ message: 'Session not found or already revoked' });
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Revoke all sessions (except current)
  app.delete('/api/auth/sessions', authenticate, requireRole('user'), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.token) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = 'userId' in req.user ? req.user.userId : req.user.id;
      
      // Get the current auth token to exclude it
      const currentAuthToken = req.authToken;
      
      if (!currentAuthToken) {
        return res.status(400).json({ message: 'Current session not found' });
      }
      
      await storage.revokeAllUserTokensExcept(userId, currentAuthToken.id);
      
      res.json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Schedule cleanup of expired tokens (once a day)
  setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);
}