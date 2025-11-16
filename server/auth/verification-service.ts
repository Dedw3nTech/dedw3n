import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';

export interface VerificationToken {
  token: string;
  hashedToken: string;
  expiresAt: Date;
}

export interface VerificationResult {
  isValid: boolean;
  reason?: 'expired' | 'invalid' | 'used' | 'not_found';
  message?: string;
}

export class VerificationService {
  private readonly TOKEN_LENGTH = 32;
  private readonly EXPIRY_HOURS = 24;
  private readonly REMINDER_HOURS = 6; // Send reminder when 6 hours left
  
  /**
   * Generate a secure random token
   */
  generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }
  
  /**
   * Generate a secure token with hashed version and expiry
   */
  async generateSecureToken(): Promise<VerificationToken> {
    const token = this.generateToken();
    const hashedToken = await this.hashToken(token);
    const expiresAt = this.calculateExpiry();
    
    return {
      token,
      hashedToken,
      expiresAt
    };
  }
  
  /**
   * Hash a token using bcrypt for secure storage
   */
  async hashToken(token: string): Promise<string> {
    // Using a consistent salt rounds for token hashing
    const saltRounds = 10;
    return bcrypt.hash(token, saltRounds);
  }
  
  /**
   * Create a SHA256 hash for quick lookups (less secure, for non-critical uses)
   */
  quickHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  
  /**
   * Verify a token against its hash
   */
  async verifyToken(
    token: string,
    storedHash: string,
    expiresAt?: Date | null
  ): Promise<VerificationResult> {
    // Check expiration first
    if (expiresAt && this.isExpired(expiresAt)) {
      return {
        isValid: false,
        reason: 'expired',
        message: 'This verification link has expired. Please request a new one.'
      };
    }
    
    // Verify the token hash
    try {
      const isMatch = await bcrypt.compare(token, storedHash);
      
      if (!isMatch) {
        return {
          isValid: false,
          reason: 'invalid',
          message: 'Invalid verification token. Please check the link or request a new one.'
        };
      }
      
      return {
        isValid: true
      };
    } catch (error) {
      console.error('[VERIFICATION] Error verifying token:', error);
      return {
        isValid: false,
        reason: 'invalid',
        message: 'An error occurred during verification. Please try again.'
      };
    }
  }
  
  /**
   * Check if a token has expired
   */
  isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
  
  /**
   * Calculate expiry date from now
   */
  calculateExpiry(hours: number = this.EXPIRY_HOURS): Date {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);
    return expiryDate;
  }
  
  /**
   * Get hours remaining until expiry
   */
  getHoursRemaining(expiresAt: Date): number {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  }
  
  /**
   * Check if a reminder should be sent
   */
  shouldSendReminder(expiresAt: Date): boolean {
    const hoursRemaining = this.getHoursRemaining(expiresAt);
    return hoursRemaining > 0 && hoursRemaining <= this.REMINDER_HOURS;
  }
  
  /**
   * Generate a verification URL
   */
  generateVerificationUrl(
    baseUrl: string,
    token: string,
    type: 'email' | 'password-reset' = 'email'
  ): string {
    const path = type === 'email' ? '/verify-email' : '/reset-password';
    const url = new URL(path, baseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }
  
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Generate a short verification code (for SMS or simplified verification)
   */
  generateShortCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }
  
  /**
   * Create a time-limited token with embedded timestamp
   */
  createTimeLimitedToken(data: any, secret: string): string {
    const timestamp = Date.now();
    const payload = JSON.stringify({ data, timestamp });
    const hash = createHash('sha256')
      .update(payload + secret)
      .digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + hash;
    return token;
  }
  
  /**
   * Verify a time-limited token
   */
  verifyTimeLimitedToken(
    token: string,
    secret: string,
    maxAgeMs: number = 24 * 60 * 60 * 1000
  ): { valid: boolean; data?: any; expired?: boolean } {
    try {
      const [payloadBase64, hash] = token.split('.');
      if (!payloadBase64 || !hash) {
        return { valid: false };
      }
      
      const payload = Buffer.from(payloadBase64, 'base64').toString();
      const { data, timestamp } = JSON.parse(payload);
      
      // Verify hash
      const expectedHash = createHash('sha256')
        .update(payload + secret)
        .digest('hex');
      
      if (hash !== expectedHash) {
        return { valid: false };
      }
      
      // Check age
      const age = Date.now() - timestamp;
      if (age > maxAgeMs) {
        return { valid: false, expired: true };
      }
      
      return { valid: true, data };
    } catch (error) {
      console.error('[VERIFICATION] Error verifying time-limited token:', error);
      return { valid: false };
    }
  }
}

// Export singleton instance
export const verificationService = new VerificationService();