import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../core/errors';

export interface AuthenticatedRequest extends Request {
  userId?: number;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.headers['x-client-user-id'];
    
    if (!userId || typeof userId !== 'string') {
      throw new AuthenticationError('Authentication required');
    }
    
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      throw new AuthenticationError('Invalid authentication token');
    }
    
    // Set user ID for downstream middleware and controllers
    req.userId = parsedUserId;
    
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User authentication required');
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.headers['x-client-user-id'];
    
    if (userId && typeof userId === 'string') {
      const parsedUserId = parseInt(userId);
      if (!isNaN(parsedUserId)) {
        req.userId = parsedUserId;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue
    next();
  }
};