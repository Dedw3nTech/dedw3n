import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcryptjs";
import { logger } from "../logger";

// CRITICAL: PASSWORD_PEPPER must be set in environment variables
// Changing or losing this value will invalidate ALL existing user passwords
if (!process.env.PASSWORD_PEPPER) {
  logger.error('CRITICAL: PASSWORD_PEPPER environment variable not set', {
    impact: 'All user login attempts will fail',
    action: 'Set PASSWORD_PEPPER in environment secrets'
  }, undefined, 'startup');
  throw new Error('PASSWORD_PEPPER environment variable is required');
}

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER;

// Simplified password security settings for better user experience
const PASSWORD_MIN_LENGTH = 6;

const scryptAsync = promisify(scrypt);

/**
 * Validates password strength
 * @param password The password to validate
 * @returns Object with validation result and error messages
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Minimum length requirement
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  // Must contain at least one number or special character
  if (!/[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Calculates password entropy for strength measurement
 * @param password The password to calculate entropy for
 * @returns Entropy value in bits
 */
export function calculatePasswordEntropy(password: string): number {
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26; // lowercase letters
  if (/[A-Z]/.test(password)) charset += 26; // uppercase letters  
  if (/\d/.test(password)) charset += 10; // numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) charset += 32; // special characters
  
  return password.length * Math.log2(charset);
}

/**
 * Enhanced password hashing with salt and pepper
 * @param password The plain text password to hash
 * @returns The hashed password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Add pepper to password before hashing for additional security layer
  const pepperedPassword = password + PASSWORD_PEPPER;
  
  // Generate cryptographically secure salt
  const salt = randomBytes(16).toString("hex");
  const keylen = 32; // 256-bit output key
  
  try {
    const buf = (await scryptAsync(pepperedPassword, salt, keylen)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    return hashedPassword;
  } catch (error) {
    logger.error('Password hashing failed', undefined, error as Error, 'api');
    throw new Error('Password hashing failed');
  }
}

/**
 * Compares a supplied password with a stored hash
 * Supports both modern scrypt+pepper format and legacy bcrypt format
 * @param supplied The plain text password to verify
 * @param stored The stored password hash
 * @returns True if passwords match, false otherwise
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored || !supplied) {
    logger.error('Missing password for comparison', undefined, undefined, 'api');
    return false;
  }
  
  try {
    // Check if this is a bcrypt hash (legacy format from user.service.ts)
    // Bcrypt hashes start with $2a$, $2b$, or $2y$ and don't contain a "." separator
    if (stored.startsWith('$2') && !stored.includes('.')) {
      logger.debug('Detected legacy bcrypt password - attempting verification', undefined, 'api');
      try {
        const isValid = await bcrypt.compare(supplied, stored);
        if (isValid) {
          logger.debug('Legacy bcrypt password verified successfully', undefined, 'api');
        }
        return isValid;
      } catch (bcryptError) {
        logger.error('Bcrypt verification failed', undefined, bcryptError as Error, 'api');
        return false;
      }
    }
    
    // Standard scrypt+pepper flow
    const [hashed, salt] = stored.split(".");
    
    if (!hashed || !salt) {
      logger.warn('Invalid stored password format - not scrypt format', undefined, 'api');
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const keylen = hashedBuf.length; // Use the actual length of the stored hash
    
    // Try with pepper first (new password format)
    try {
      const pepperedSupplied = supplied + PASSWORD_PEPPER;
      const suppliedBufWithPepper = (await scryptAsync(pepperedSupplied, salt, keylen)) as Buffer;
      
      if (timingSafeEqual(hashedBuf, suppliedBufWithPepper)) {
        return true;
      }
    } catch (pepperError) {
      logger.debug('Pepper-based verification failed - trying legacy format', undefined, 'api');
    }
    
    // Fallback to legacy format without pepper (for existing users)
    // Try different key lengths that might have been used originally
    const commonKeyLengths = [keylen, 32, 64]; // Current, standard scrypt, extended
    
    for (const tryKeylen of commonKeyLengths) {
      try {
        const suppliedBufLegacy = (await scryptAsync(supplied, salt, tryKeylen)) as Buffer;
        
        // Handle different buffer lengths for comparison
        if (tryKeylen !== keylen) {
          // If trying different key length, create a buffer of the right size
          const adjustedBuf = Buffer.alloc(keylen);
          suppliedBufLegacy.copy(adjustedBuf, 0, 0, Math.min(suppliedBufLegacy.length, keylen));
          
          if (timingSafeEqual(hashedBuf, adjustedBuf)) {
            return true;
          }
        } else {
          if (timingSafeEqual(hashedBuf, suppliedBufLegacy)) {
            return true;
          }
        }
      } catch (legacyError) {
        // Continue trying other key lengths
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Password comparison failed', undefined, error as Error, 'api');
    return false;
  }
}
