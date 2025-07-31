import { BaseService } from '../core/base.service';
import { AuthRepository, LoginCredentials, SessionData, TokenData } from '../repositories/auth.repository';
import { UserService } from './user.service';
import { BusinessError, ValidationError, AuthenticationError } from '../core/errors';
import bcrypt from 'bcryptjs';

export interface LoginResult {
  user: any;
  session: SessionData;
  expiresAt: Date;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

export class AuthService extends BaseService {
  
  constructor(
    private authRepository: AuthRepository,
    private userService: UserService
  ) {
    super();
  }

  async login(credentials: LoginCredentials, metadata?: { userAgent?: string; ipAddress?: string }): Promise<LoginResult> {
    try {
      // Validate input
      if (!this.validateEmail(credentials.email)) {
        throw new ValidationError('Invalid email format');
      }

      if (!credentials.password || credentials.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      // Authenticate user
      const user = await this.authRepository.authenticateUser(credentials);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Create session (24 hours)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const session = await this.authRepository.createSession(user.id, expiresAt, metadata);

      console.log(`[AUTH_SERVICE] User ${user.username} logged in successfully`);

      return {
        user,
        session,
        expiresAt
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }
      console.error('[AUTH_SERVICE] Login error:', error);
      throw new BusinessError('Login failed');
    }
  }

  async register(userData: RegisterData): Promise<LoginResult> {
    try {
      // Validate input
      await this.validateRegistrationData(userData);

      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(userData.email);
      if (existingUser) {
        throw new BusinessError('User with this email already exists');
      }

      const existingUsername = await this.userService.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new BusinessError('Username is already taken');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const newUser = await this.userService.createUser({
        ...userData,
        password: hashedPassword
      });

      // Create initial session
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const session = await this.authRepository.createSession(newUser.id, expiresAt);

      console.log(`[AUTH_SERVICE] User ${newUser.username} registered successfully`);

      return {
        user: newUser,
        session,
        expiresAt
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError) {
        throw error;
      }
      console.error('[AUTH_SERVICE] Registration error:', error);
      throw new BusinessError('Registration failed');
    }
  }

  async logout(sessionId: string): Promise<boolean> {
    try {
      const deleted = await this.authRepository.deleteSession(sessionId);
      
      if (deleted) {
        console.log(`[AUTH_SERVICE] Session ${sessionId} logged out successfully`);
      }
      
      return deleted;
    } catch (error) {
      console.error('[AUTH_SERVICE] Logout error:', error);
      throw new BusinessError('Logout failed');
    }
  }

  async logoutAllSessions(userId: number): Promise<number> {
    try {
      const deletedCount = await this.authRepository.deleteUserSessions(userId);
      
      console.log(`[AUTH_SERVICE] Logged out ${deletedCount} sessions for user ${userId}`);
      
      return deletedCount;
    } catch (error) {
      console.error('[AUTH_SERVICE] Logout all sessions error:', error);
      throw new BusinessError('Failed to logout all sessions');
    }
  }

  async validateSession(sessionId: string): Promise<any | null> {
    try {
      const session = await this.authRepository.getSession(sessionId);
      if (!session) {
        return null;
      }

      // Get user data
      const user = await this.userService.getUserById(session.userId);
      if (!user) {
        // Clean up orphaned session
        await this.authRepository.deleteSession(sessionId);
        return null;
      }

      return user;
    } catch (error) {
      console.error('[AUTH_SERVICE] Session validation error:', error);
      return null;
    }
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<TokenData> {
    try {
      if (!this.validateEmail(request.email)) {
        throw new ValidationError('Invalid email format');
      }

      const user = await this.userService.getUserByEmail(request.email);
      if (!user) {
        // Don't reveal if email exists for security
        throw new BusinessError('If the email exists, a reset link will be sent');
      }

      // Create password reset token (1 hour expiry)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const token = await this.authRepository.createToken(user.id, 'password_reset', expiresAt);

      console.log(`[AUTH_SERVICE] Password reset requested for user ${user.id}`);

      return token;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError) {
        throw error;
      }
      console.error('[AUTH_SERVICE] Password reset request error:', error);
      throw new BusinessError('Password reset request failed');
    }
  }

  async resetPassword(resetData: PasswordResetData): Promise<boolean> {
    try {
      // Validate new password
      if (!resetData.newPassword || resetData.newPassword.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }

      // Validate token
      const token = await this.authRepository.getToken(resetData.token, 'password_reset');
      if (!token) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(resetData.newPassword, 12);

      // Update user password
      await this.userService.updateUser(token.userId, { password: hashedPassword });

      // Mark token as used
      await this.authRepository.useToken(token.id);

      // Logout all sessions for security
      await this.authRepository.deleteUserSessions(token.userId);

      console.log(`[AUTH_SERVICE] Password reset successful for user ${token.userId}`);

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[AUTH_SERVICE] Password reset error:', error);
      throw new BusinessError('Password reset failed');
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        throw new ValidationError('New password must be at least 6 characters');
      }

      // Get current user
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.userService.updateUser(userId, { password: hashedPassword });

      console.log(`[AUTH_SERVICE] Password changed successfully for user ${userId}`);

      return true;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }
      console.error('[AUTH_SERVICE] Password change error:', error);
      throw new BusinessError('Password change failed');
    }
  }

  async cleanupExpiredData(): Promise<{ sessions: number; tokens: number }> {
    try {
      const [expiredSessions, expiredTokens] = await Promise.all([
        this.authRepository.cleanupExpiredSessions(),
        this.authRepository.cleanupExpiredTokens()
      ]);

      console.log(`[AUTH_SERVICE] Cleanup completed: ${expiredSessions} sessions, ${expiredTokens} tokens`);

      return {
        sessions: expiredSessions,
        tokens: expiredTokens
      };
    } catch (error) {
      console.error('[AUTH_SERVICE] Cleanup error:', error);
      throw new BusinessError('Cleanup failed');
    }
  }

  private async validateRegistrationData(userData: RegisterData): Promise<void> {
    if (!this.validateEmail(userData.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!userData.username || userData.username.length < 3 || userData.username.length > 50) {
      throw new ValidationError('Username must be between 3 and 50 characters');
    }

    if (!userData.password || userData.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    if (!userData.name || userData.name.length < 1 || userData.name.length > 100) {
      throw new ValidationError('Name must be between 1 and 100 characters');
    }

    if (userData.bio && userData.bio.length > 500) {
      throw new ValidationError('Bio must be at most 500 characters');
    }

    // Username validation (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      throw new ValidationError('Username can only contain letters, numbers, and underscores');
    }
  }
}