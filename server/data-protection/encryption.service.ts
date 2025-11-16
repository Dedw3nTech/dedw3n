/**
 * Encryption Service
 * 
 * Provides cryptographic functions for data encryption, decryption,
 * and hashing using industry-standard algorithms.
 */

import crypto from 'crypto';
import type { EncryptionConfig, EncryptedData } from './types';

/**
 * Default encryption configuration
 */
const DEFAULT_CONFIG: Required<EncryptionConfig> = {
  algorithm: 'aes-256-gcm',
  encoding: 'hex',
};

/**
 * Get encryption key from environment or use default (WARNING: not secure for production)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'default-insecure-key-change-in-production-32chars';
  return crypto.scryptSync(key, 'salt', 32);
}

/**
 * Encryption Service Class
 */
export class EncryptionService {
  private static key: Buffer = getEncryptionKey();

  /**
   * Set custom encryption key
   * 
   * @param key - Encryption key string (will be hashed to proper length)
   */
  static setEncryptionKey(key: string): void {
    this.key = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Encrypt data using AES-256-GCM
   * 
   * @param data - Data to encrypt (string or object)
   * @param config - Encryption configuration
   * @returns Encrypted data with IV and auth tag
   */
  static encrypt(data: string | Record<string, any>, config: EncryptionConfig = {}): EncryptedData {
    const opts = { ...DEFAULT_CONFIG, ...config };
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(opts.algorithm, this.key, iv);

    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', opts.encoding);
    encrypted += cipher.final(opts.encoding);

    const result: EncryptedData = {
      encrypted,
      iv: iv.toString(opts.encoding),
    };

    // Add authentication tag for GCM mode
    if (opts.algorithm === 'aes-256-gcm') {
      result.authTag = (cipher as crypto.CipherGCM).getAuthTag().toString(opts.encoding);
    }

    return result;
  }

  /**
   * Decrypt data
   * 
   * @param encryptedData - Encrypted data object
   * @param config - Encryption configuration (must match encryption config)
   * @returns Decrypted string
   */
  static decrypt(encryptedData: EncryptedData, config: EncryptionConfig = {}): string {
    const opts = { ...DEFAULT_CONFIG, ...config };

    try {
      const iv = Buffer.from(encryptedData.iv, opts.encoding);
      const decipher = crypto.createDecipheriv(opts.algorithm, this.key, iv);

      // Set authentication tag for GCM mode
      if (opts.algorithm === 'aes-256-gcm' && encryptedData.authTag) {
        const authTag = Buffer.from(encryptedData.authTag, opts.encoding);
        (decipher as crypto.DecipherGCM).setAuthTag(authTag);
      }

      let decrypted = decipher.update(encryptedData.encrypted, opts.encoding, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('[ENCRYPTION] Decryption error:', error);
      throw new Error('Decryption failed - data may be corrupted or key is incorrect');
    }
  }

  /**
   * Hash data using SHA-256
   * 
   * @param data - Data to hash
   * @returns Hex-encoded hash
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash data using SHA-512
   * 
   * @param data - Data to hash
   * @returns Hex-encoded hash
   */
  static hashSha512(data: string): string {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * Create HMAC (Hash-based Message Authentication Code)
   * 
   * @param data - Data to sign
   * @param secret - Secret key for HMAC
   * @returns Hex-encoded HMAC
   */
  static hmac(data: string, secret?: string): string {
    const key = secret || this.key.toString('hex');
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC
   * 
   * @param data - Original data
   * @param hmac - HMAC to verify
   * @param secret - Secret key used for HMAC
   * @returns true if HMAC is valid
   */
  static verifyHmac(data: string, hmac: string, secret?: string): boolean {
    const expectedHmac = this.hmac(data, secret);
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
  }

  /**
   * Hash password using bcrypt-compatible algorithm
   * Note: For actual password hashing, use bcrypt library
   * 
   * @param password - Password to hash
   * @param rounds - Number of rounds (cost factor)
   * @returns Hashed password
   */
  static hashPassword(password: string, rounds: number = 10): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000 * rounds, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   * 
   * @param password - Password to verify
   * @param storedHash - Stored hash (salt:hash format)
   * @returns true if password matches
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, hash] = storedHash.split(':');
      const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
    } catch (error) {
      console.error('[ENCRYPTION] Password verification error:', error);
      return false;
    }
  }

  /**
   * Generate random token
   * 
   * @param length - Token length in bytes (default: 32)
   * @returns Hex-encoded random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   * 
   * @returns UUID string
   */
  static generateUuid(): string {
    return crypto.randomUUID();
  }

  /**
   * Encrypt field in an object
   * 
   * @param obj - Object containing the field
   * @param fieldName - Name of the field to encrypt
   * @param config - Encryption configuration
   * @returns Object with encrypted field
   */
  static encryptField<T extends Record<string, any>>(
    obj: T,
    fieldName: keyof T,
    config?: EncryptionConfig
  ): T {
    if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
      const encrypted = this.encrypt(String(obj[fieldName]), config);
      return {
        ...obj,
        [fieldName]: JSON.stringify(encrypted),
      };
    }
    return obj;
  }

  /**
   * Decrypt field in an object
   * 
   * @param obj - Object containing the encrypted field
   * @param fieldName - Name of the field to decrypt
   * @param config - Encryption configuration
   * @returns Object with decrypted field
   */
  static decryptField<T extends Record<string, any>>(
    obj: T,
    fieldName: keyof T,
    config?: EncryptionConfig
  ): T {
    if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
      try {
        const encryptedData = JSON.parse(String(obj[fieldName])) as EncryptedData;
        const decrypted = this.decrypt(encryptedData, config);
        return {
          ...obj,
          [fieldName]: decrypted,
        };
      } catch (error) {
        console.error(`[ENCRYPTION] Failed to decrypt field ${String(fieldName)}:`, error);
        return obj;
      }
    }
    return obj;
  }

  /**
   * Create deterministic hash for data deduplication
   * Uses HMAC for consistent hashing
   * 
   * @param data - Data to hash
   * @returns Deterministic hash
   */
  static deterministicHash(data: string): string {
    return this.hmac(data);
  }
}

/**
 * Convenience function for encryption
 */
export function encrypt(data: string | Record<string, any>, config?: EncryptionConfig): EncryptedData {
  return EncryptionService.encrypt(data, config);
}

/**
 * Convenience function for decryption
 */
export function decrypt(encryptedData: EncryptedData, config?: EncryptionConfig): string {
  return EncryptionService.decrypt(encryptedData, config);
}

/**
 * Convenience function for hashing
 */
export function hash(data: string): string {
  return EncryptionService.hash(data);
}
