import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt-auth';
import { storage } from './storage';

// This token is for development purposes only - it will be replaced in production
// with a secure token generation system
const DEVELOPMENT_TOKEN = process.env.TOKEN_SECRET || 'development-token-secret';

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
  
  // Check if we're in a logout state by looking for a special flag in the session
  if (req.session && req.session.userLoggedOut) {
    console.log('[AUTH] User has explicitly logged out, not using auto-login');
    return res.status(401).json({ message: 'Unauthorized - User logged out' });
  }
  
  // Check for explicit logout URL path - never auto-login on logout page
  const isLogoutRelatedPath = req.path.includes('logout') || 
                              req.originalUrl.includes('logout-success') ||
                              req.originalUrl.includes('logout_success');
                              
  if (isLogoutRelatedPath) {
    console.log('[AUTH] Logout-related path detected, skipping auto-login');
    return res.status(401).json({ message: 'Unauthorized - Logout context' });
  }
  
  // Only proceed with auto-login if in development mode and not in logout context
  const isDev = process.env.NODE_ENV === 'development';
  if (!token && isDev && !req.get('x-prevent-autologin')) {
    console.log('[DEBUG] Creating temporary user for debugging (development only)');
    // Fetch a real user from the database for debugging purposes
    try {
      const user = await storage.getUser(4); // Get user with ID 4 from the database
      if (user) {
        req.user = user;
        console.log(`[DEBUG] Using test user: ${user.username} (ID: ${user.id})`);
        return next();
      } else {
        console.log('[AUTH] Authentication failed - test user not found');
        return res.status(401).json({ message: 'Unauthorized' });
      }
    } catch (error) {
      console.error('[AUTH] Error fetching test user:', error);
      return res.status(500).json({ message: 'Internal server error during authentication' });
    }
  } else if (!token) {
    // No token and we're not doing auto-login
    console.log('[AUTH] No authentication token provided and auto-login disabled');
    return res.status(401).json({ message: 'Unauthorized - No auth token' });
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