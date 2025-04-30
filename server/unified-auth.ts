import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt-auth';
import { storage } from './storage';

/**
 * Unified authentication middleware that checks both Passport session 
 * authentication and JWT token authentication. This resolves conflicts
 * between the two authentication systems.
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // First check Passport session authentication
  if (req.isAuthenticated()) {
    console.log('[DEBUG] Request authenticated via session');
    return next();
  }

  // If session authentication fails, check JWT
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[AUTH] Authentication failed - no valid session or JWT');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract JWT token
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.query.token as string;
  
  if (!token) {
    console.log('[AUTH] Authentication failed - no token provided');
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  // Verify JWT token
  const payload = verifyToken(token);
  if (!payload) {
    console.log('[AUTH] Authentication failed - invalid token');
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    // Check if token exists in database and is not revoked
    const authToken = await storage.getAuthToken(token);
    if (!authToken) {
      console.log('[AUTH] Authentication failed - token not found in database');
      return res.status(401).json({ message: 'Token not found' });
    }
    
    if (authToken.isRevoked) {
      console.log('[AUTH] Authentication failed - token revoked');
      return res.status(401).json({ message: 'Token has been revoked' });
    }
    
    // Check if the token has expired
    if (new Date(authToken.expiresAt) < new Date()) {
      await storage.revokeAuthToken(authToken.id, 'Token expired');
      console.log('[AUTH] Authentication failed - token expired');
      return res.status(401).json({ message: 'Token expired' });
    }
    
    // Update token's last active timestamp (don't await to prevent slowing down requests)
    storage.updateTokenLastActive(authToken.id);
    
    // Get the user associated with the token
    const user = await storage.getUser(payload.userId);
    if (!user) {
      console.log('[AUTH] Authentication failed - user not found');
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set authenticated user on request
    req.user = user;
    req.authToken = authToken;
    
    console.log('[DEBUG] Request authenticated via JWT');
    next();
  } catch (error) {
    console.error('[AUTH] Error during authentication:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

/**
 * Middleware to require specific roles for access. Must be used after isAuthenticated.
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};