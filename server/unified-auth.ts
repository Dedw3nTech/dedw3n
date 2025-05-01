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
  
  // Extract JWT token from authorization header, query parameter, or cookies
  let token: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = req.query.token as string;
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Check for logout state indicators
  
  // Check for explicit "X-User-Logged-Out" header that the client sends after logout
  if (req.headers['x-user-logged-out'] === 'true') {
    console.log('[AUTH] X-User-Logged-Out header detected, rejecting authentication');
    return res.status(401).json({ message: 'Unauthorized - User explicitly logged out' });
  }
  
  // Check for userLoggedOut flag in the session
  // @ts-ignore: Property may not exist on session type
  if (req.session && req.session.userLoggedOut === true) {
    console.log('[AUTH] Session logout flag detected, rejecting authentication');
    return res.status(401).json({ message: 'Unauthorized - User logged out via session flag' });
  }
  
  // Check for logout-related cookie that persists across requests
  const cookies = req.headers.cookie || '';
  if (cookies.includes('user_logged_out=true')) {
    console.log('[AUTH] Logout cookie detected, rejecting authentication');
    return res.status(401).json({ message: 'Unauthorized - User logged out via cookie' });
  }
  
  // No token found, return unauthorized
  if (!token) {
    console.log('[AUTH] No authentication token provided');
    return res.status(401).json({ message: 'Unauthorized - No valid authentication token' });
  }

  // Verify JWT token
  const payload = verifyToken(token);
  if (!payload) {
    console.log('[AUTH] Authentication failed - invalid token');
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    console.log(`[AUTH] Processing JWT token: ${token.substring(0, 10)}...`);
    console.log(`[AUTH] Token payload:`, payload);
    
    // Check if getAuthToken method exists in storage
    if (!storage.getAuthToken) {
      console.log('[AUTH] getAuthToken method not found in storage, skipping database validation');
      // If we can't verify in database, just use the payload directly
      const user = await storage.getUser(payload.userId);
      if (!user) {
        console.log(`[AUTH] Authentication failed - user with ID ${payload.userId} not found`);
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Set authenticated user on request without token info
      req.user = user;
      console.log(`[AUTH] Request authenticated via JWT without database validation for user ID: ${user.id}`);
      return next();
    }
    
    // Check if token exists in database and is not revoked
    console.log(`[AUTH] Looking up token in database...`);
    const authToken = await storage.getAuthToken(token);
    
    if (!authToken) {
      console.log('[AUTH] Authentication failed - token not found in database');
      // Fallback: if token is not in database but JWT is valid, still allow access
      // This is useful for compatibility with existing tokens
      console.log('[AUTH] Falling back to JWT payload validation without database check');
      const user = await storage.getUser(payload.userId);
      if (!user) {
        console.log(`[AUTH] Authentication failed - user with ID ${payload.userId} not found`);
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Set authenticated user on request without token info
      req.user = user;
      console.log(`[AUTH] Request authenticated via JWT fallback for user ID: ${user.id}`);
      return next();
    }
    
    console.log(`[AUTH] Token found in database:`, authToken);
    
    if (authToken.isRevoked) {
      console.log('[AUTH] Authentication failed - token revoked');
      return res.status(401).json({ message: 'Token has been revoked' });
    }
    
    // Check if the token has expired
    if (new Date(authToken.expiresAt) < new Date()) {
      console.log('[AUTH] Authentication failed - token expired');
      if (storage.revokeAuthToken) {
        await storage.revokeAuthToken(authToken.id, 'Token expired');
      }
      return res.status(401).json({ message: 'Token expired' });
    }
    
    // Update token's last active timestamp if the method exists
    if (storage.updateTokenLastActive) {
      storage.updateTokenLastActive(authToken.id);
    }
    
    // Get the user associated with the token
    const user = await storage.getUser(payload.userId);
    if (!user) {
      console.log(`[AUTH] Authentication failed - user with ID ${payload.userId} not found`);
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set authenticated user and token on request
    req.user = user;
    req.authToken = authToken;
    
    console.log(`[AUTH] Request authenticated via JWT for user ID: ${user.id}`);
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