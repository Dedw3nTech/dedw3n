/**
 * Sanitization Service
 * 
 * Provides comprehensive input sanitization to prevent XSS, SQL injection,
 * and other injection attacks. Implements defense-in-depth strategies.
 */

import type { SanitizationOptions } from './types';

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: SanitizationOptions = {
  allowHtml: false,
  allowedTags: [],
  allowedAttributes: {},
  stripScripts: true,
  trimWhitespace: true,
};

/**
 * Dangerous HTML tags that should always be removed
 */
const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'link',
  'style',
  'meta',
  'base',
  'form',
];

/**
 * Dangerous HTML attributes that should always be removed
 */
const DANGEROUS_ATTRIBUTES = [
  'onclick',
  'onload',
  'onerror',
  'onmouseover',
  'onmouseout',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'javascript:',
  'data:',
  'vbscript:',
];

/**
 * Sanitization Service Class
 */
export class SanitizationService {
  /**
   * Sanitize a string input
   * 
   * @param input - The input string to sanitize
   * @param options - Sanitization options
   * @returns Sanitized string
   */
  static sanitizeString(input: string, options: SanitizationOptions = {}): string {
    if (typeof input !== 'string') {
      return '';
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    let sanitized = input;

    // Trim whitespace if enabled
    if (opts.trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // If HTML is not allowed, encode all HTML entities
    if (!opts.allowHtml) {
      sanitized = this.encodeHtmlEntities(sanitized);
    } else {
      // Remove dangerous tags and attributes
      sanitized = this.removeDangerousTags(sanitized);
      sanitized = this.removeDangerousAttributes(sanitized);
      
      // Keep only allowed tags if specified
      if (opts.allowedTags && opts.allowedTags.length > 0) {
        sanitized = this.keepAllowedTags(sanitized, opts.allowedTags);
      }
    }

    // Always strip script tags as an extra precaution
    if (opts.stripScripts) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    return sanitized;
  }

  /**
   * Sanitize an object, recursively sanitizing all string values
   * 
   * @param obj - The object to sanitize
   * @param options - Sanitization options
   * @returns Sanitized object
   */
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    options: SanitizationOptions = {}
  ): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value, options);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value, options);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized as T;
  }

  /**
   * Sanitize SQL input to prevent SQL injection
   * 
   * @param input - The SQL input to sanitize
   * @returns Sanitized SQL string
   */
  static sanitizeSql(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove SQL comments
    let sanitized = input.replace(/--.*$/gm, '');
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

    // Escape single quotes
    sanitized = sanitized.replace(/'/g, "''");

    return sanitized;
  }

  /**
   * Sanitize file path to prevent directory traversal
   * 
   * @param filePath - The file path to sanitize
   * @returns Sanitized file path
   */
  static sanitizeFilePath(filePath: string): string {
    if (typeof filePath !== 'string') {
      return '';
    }

    // Remove directory traversal patterns
    let sanitized = filePath.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[\/\\]{2,}/g, '/');
    
    // Remove leading slashes
    sanitized = sanitized.replace(/^[\/\\]+/, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    return sanitized;
  }

  /**
   * Sanitize email address
   * 
   * @param email - The email to sanitize
   * @returns Sanitized email
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return '';
    }

    return email.trim().toLowerCase();
  }

  /**
   * Sanitize phone number (keep only digits and common separators)
   * 
   * @param phone - The phone number to sanitize
   * @returns Sanitized phone number
   */
  static sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') {
      return '';
    }

    // Keep only digits, spaces, dashes, parentheses, and plus sign
    return phone.replace(/[^0-9\s\-\(\)\+]/g, '').trim();
  }

  /**
   * Sanitize URL
   * 
   * @param url - The URL to sanitize
   * @returns Sanitized URL or empty string if invalid
   */
  static sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
      return '';
    }

    const trimmed = url.trim();

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const protocol of dangerousProtocols) {
      if (trimmed.toLowerCase().startsWith(protocol)) {
        return '';
      }
    }

    // Validate URL format
    try {
      const urlObj = new URL(trimmed);
      // Only allow http and https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      return urlObj.toString();
    } catch {
      // If it's a relative URL, return it as-is after basic sanitization
      return trimmed.replace(/[<>"']/g, '');
    }
  }

  /**
   * Encode HTML entities
   * 
   * @param str - The string to encode
   * @returns Encoded string
   */
  private static encodeHtmlEntities(str: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return str.replace(/[&<>"'\/]/g, (char) => entities[char] || char);
  }

  /**
   * Remove dangerous HTML tags
   * 
   * @param html - The HTML string
   * @returns HTML with dangerous tags removed
   */
  private static removeDangerousTags(html: string): string {
    let result = html;
    
    for (const tag of DANGEROUS_TAGS) {
      const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      result = result.replace(regex, '');
      
      // Also remove self-closing tags
      const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      result = result.replace(selfClosing, '');
    }

    return result;
  }

  /**
   * Remove dangerous HTML attributes
   * 
   * @param html - The HTML string
   * @returns HTML with dangerous attributes removed
   */
  private static removeDangerousAttributes(html: string): string {
    let result = html;

    for (const attr of DANGEROUS_ATTRIBUTES) {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      result = result.replace(regex, '');
      
      // Also handle attributes without quotes
      const noQuotes = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]*`, 'gi');
      result = result.replace(noQuotes, '');
    }

    return result;
  }

  /**
   * Keep only allowed HTML tags
   * 
   * @param html - The HTML string
   * @param allowedTags - Array of allowed tag names
   * @returns HTML with only allowed tags
   */
  private static keepAllowedTags(html: string, allowedTags: string[]): string {
    // This is a simplified implementation
    // For production, consider using a library like DOMPurify
    return html.replace(/<([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
      return allowedTags.includes(tag.toLowerCase()) ? match : '';
    });
  }
}

/**
 * Convenience function for sanitizing strings
 */
export function sanitize(input: string, options?: SanitizationOptions): string {
  return SanitizationService.sanitizeString(input, options);
}

/**
 * Convenience function for sanitizing objects
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options?: SanitizationOptions
): T {
  return SanitizationService.sanitizeObject(obj, options);
}
