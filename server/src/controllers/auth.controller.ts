import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BaseController } from '../core/base.controller';
import { AuthService, LoginResult, RegisterData, PasswordResetRequest, PasswordResetData } from '../services/auth.service';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password must be at most 128 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  avatar: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional()
});

const logoutSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required')
});

const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format')
});

const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password must be at most 128 characters')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128, 'Password must be at most 128 characters')
});

export class AuthController extends BaseController {
  
  constructor(private authService: AuthService) {
    super();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const credentials = this.validateBody(loginSchema, req.body);
      
      const metadata = {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      };

      const result: LoginResult = await this.authService.login(credentials, metadata);

      // Set session cookie
      res.cookie('session_id', result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: result.expiresAt
      });

      return {
        user: result.user,
        expiresAt: result.expiresAt,
        message: 'Login successful'
      };
    });
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const userData = this.validateBody(registerSchema, req.body);

      const result: LoginResult = await this.authService.register(userData);

      // Set session cookie
      res.cookie('session_id', result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: result.expiresAt
      });

      return {
        user: result.user,
        expiresAt: result.expiresAt,
        message: 'Registration successful'
      };
    });
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const sessionId = req.cookies?.session_id;
      
      if (sessionId) {
        await this.authService.logout(sessionId);
      }

      // Clear session cookie
      res.clearCookie('session_id');

      return {
        message: 'Logout successful'
      };
    });
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const userId = this.getUserId(req);
      
      const deletedCount = await this.authService.logoutAllSessions(userId);

      // Clear current session cookie
      res.clearCookie('session_id');

      return {
        deletedSessions: deletedCount,
        message: 'All sessions logged out successfully'
      };
    });
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const userId = this.getUserId(req);
      
      // User is already available from authentication middleware
      const user = (req as any).user;
      
      return {
        user,
        message: 'User profile retrieved successfully'
      };
    });
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const resetRequest = this.validateBody(passwordResetRequestSchema, req.body);

      await this.authService.requestPasswordReset(resetRequest);

      // Always return success for security (don't reveal if email exists)
      return {
        message: 'If the email exists, a password reset link has been sent'
      };
    });
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const resetData = this.validateBody(passwordResetSchema, req.body);

      const success = await this.authService.resetPassword(resetData);

      return {
        success,
        message: 'Password reset successful'
      };
    });
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const passwordData = this.validateBody(changePasswordSchema, req.body);
      const userId = this.getUserId(req);

      const success = await this.authService.changePassword(
        userId,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      return {
        success,
        message: 'Password changed successfully'
      };
    });
  };

  validateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const sessionId = req.cookies?.session_id;
      
      if (!sessionId) {
        return {
          valid: false,
          message: 'No session found'
        };
      }

      const user = await this.authService.validateSession(sessionId);

      return {
        valid: !!user,
        user: user || null,
        message: user ? 'Session is valid' : 'Session is invalid or expired'
      };
    });
  };

  cleanup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      // This endpoint should be protected by admin middleware when implemented
      const result = await this.authService.cleanupExpiredData();

      return {
        cleaned: result,
        message: 'Expired data cleaned up successfully'
      };
    });
  };
}