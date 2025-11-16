/**
 * Masking Service
 * 
 * Provides data masking and anonymization capabilities to protect
 * sensitive information when displaying or logging data.
 */

import type { MaskingConfig } from './types';

/**
 * Default masking configuration
 */
const DEFAULT_CONFIG: MaskingConfig = {
  type: 'partial',
  visibleChars: 4,
  maskChar: '*',
  preserveFormat: true,
};

/**
 * Masking Service Class
 */
export class MaskingService {
  /**
   * Mask a string value based on configuration
   * 
   * @param value - Value to mask
   * @param config - Masking configuration
   * @returns Masked value
   */
  static mask(value: string, config: MaskingConfig = {}): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    const opts = { ...DEFAULT_CONFIG, ...config };

    switch (opts.type) {
      case 'full':
        return this.maskFull(value, opts.maskChar);
      
      case 'partial':
        return this.maskPartial(value, opts.visibleChars, opts.maskChar);
      
      case 'email':
        return this.maskEmail(value, opts.maskChar);
      
      case 'phone':
        return this.maskPhone(value, opts.maskChar, opts.preserveFormat);
      
      case 'credit_card':
        return this.maskCreditCard(value, opts.maskChar);
      
      default:
        return this.maskPartial(value, opts.visibleChars, opts.maskChar);
    }
  }

  /**
   * Fully mask a value
   * 
   * @param value - Value to mask
   * @param maskChar - Character to use for masking
   * @returns Fully masked value
   */
  static maskFull(value: string, maskChar: string = '*'): string {
    return maskChar.repeat(value.length);
  }

  /**
   * Partially mask a value, showing only last N characters
   * 
   * @param value - Value to mask
   * @param visibleChars - Number of characters to show
   * @param maskChar - Character to use for masking
   * @returns Partially masked value
   */
  static maskPartial(value: string, visibleChars: number = 4, maskChar: string = '*'): string {
    if (value.length <= visibleChars) {
      return value;
    }

    const masked = maskChar.repeat(value.length - visibleChars);
    const visible = value.slice(-visibleChars);
    return masked + visible;
  }

  /**
   * Mask an email address
   * Shows first character and domain, masks the rest
   * Example: john.doe@example.com -> j******@example.com
   * 
   * @param email - Email to mask
   * @param maskChar - Character to use for masking
   * @returns Masked email
   */
  static maskEmail(email: string, maskChar: string = '*'): string {
    const parts = email.split('@');
    
    if (parts.length !== 2) {
      return email;
    }

    const [username, domain] = parts;
    
    if (username.length <= 1) {
      return email;
    }

    const maskedUsername = username[0] + maskChar.repeat(Math.max(6, username.length - 1));
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask a phone number
   * Shows last 4 digits, masks the rest
   * Example: +1234567890 -> *******890 or (123) 456-7890 -> (***) ***-7890
   * 
   * @param phone - Phone number to mask
   * @param maskChar - Character to use for masking
   * @param preserveFormat - Whether to preserve formatting
   * @returns Masked phone number
   */
  static maskPhone(phone: string, maskChar: string = '*', preserveFormat: boolean = true): string {
    if (!preserveFormat) {
      const digits = phone.replace(/\D/g, '');
      return this.maskPartial(digits, 4, maskChar);
    }

    // Preserve format while masking digits
    return phone.replace(/\d(?=\d{0,3}(?:\D|$))/g, maskChar);
  }

  /**
   * Mask a credit card number
   * Shows last 4 digits, masks the rest
   * Example: 4532123456789012 -> ************9012
   * 
   * @param cardNumber - Credit card number
   * @param maskChar - Character to use for masking
   * @returns Masked card number
   */
  static maskCreditCard(cardNumber: string, maskChar: string = '*'): string {
    const digits = cardNumber.replace(/\D/g, '');
    
    if (digits.length < 4) {
      return cardNumber;
    }

    const masked = maskChar.repeat(digits.length - 4);
    const visible = digits.slice(-4);
    return masked + visible;
  }

  /**
   * Mask a social security number
   * Shows last 4 digits, masks the rest
   * Example: 123-45-6789 -> ***-**-6789
   * 
   * @param ssn - Social security number
   * @param maskChar - Character to use for masking
   * @returns Masked SSN
   */
  static maskSSN(ssn: string, maskChar: string = '*'): string {
    const parts = ssn.split('-');
    
    if (parts.length === 3) {
      return `${maskChar.repeat(3)}-${maskChar.repeat(2)}-${parts[2]}`;
    }

    return this.maskPartial(ssn, 4, maskChar);
  }

  /**
   * Anonymize a string by replacing it with a hash
   * 
   * @param value - Value to anonymize
   * @returns Anonymized hash
   */
  static anonymize(value: string): string {
    // Simple hash-based anonymization
    let hash = 0;
    
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return `anon_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Redact sensitive data from a string
   * Replaces sensitive patterns with [REDACTED]
   * 
   * @param text - Text to redact
   * @param patterns - Array of regex patterns to redact
   * @returns Redacted text
   */
  static redact(text: string, patterns: RegExp[] = []): string {
    let redacted = text;

    // Default patterns for common sensitive data
    const defaultPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
    ];

    const allPatterns = [...defaultPatterns, ...patterns];

    for (const pattern of allPatterns) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }

    return redacted;
  }

  /**
   * Mask sensitive fields in an object
   * 
   * @param obj - Object to mask
   * @param sensitiveFields - Array of field names to mask
   * @param config - Masking configuration
   * @returns Object with masked fields
   */
  static maskObject<T extends Record<string, any>>(
    obj: T,
    sensitiveFields: string[],
    config: MaskingConfig = {}
  ): T {
    const masked: any = { ...obj };

    for (const field of sensitiveFields) {
      if (masked[field] !== undefined && typeof masked[field] === 'string') {
        masked[field] = this.mask(masked[field], config);
      }
    }

    return masked as T;
  }

  /**
   * Create a pseudonymized version of user data
   * Replaces identifiable information while preserving data utility
   * 
   * @param userData - User data to pseudonymize
   * @returns Pseudonymized data
   */
  static pseudonymize(userData: Record<string, any>): Record<string, any> {
    const pseudonymized: Record<string, any> = {};

    for (const [key, value] of Object.entries(userData)) {
      if (typeof value === 'string') {
        // Pseudonymize common PII fields
        if (['email', 'emailAddress'].includes(key)) {
          pseudonymized[key] = this.maskEmail(value);
        } else if (['phone', 'phoneNumber', 'mobile'].includes(key)) {
          pseudonymized[key] = this.maskPhone(value);
        } else if (['ssn', 'socialSecurityNumber'].includes(key)) {
          pseudonymized[key] = this.maskSSN(value);
        } else if (['name', 'firstName', 'lastName', 'fullName'].includes(key)) {
          pseudonymized[key] = this.anonymize(value);
        } else {
          pseudonymized[key] = value;
        }
      } else {
        pseudonymized[key] = value;
      }
    }

    return pseudonymized;
  }
}

/**
 * Convenience function for masking values
 */
export function mask(value: string, config?: MaskingConfig): string {
  return MaskingService.mask(value, config);
}

/**
 * Convenience function for masking emails
 */
export function maskEmail(email: string): string {
  return MaskingService.maskEmail(email);
}

/**
 * Convenience function for masking phone numbers
 */
export function maskPhone(phone: string): string {
  return MaskingService.maskPhone(phone);
}
