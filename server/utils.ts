/**
 * Utility functions for the server
 */

/**
 * Safely stringifies an object to JSON, handling circular references
 * @param obj The object to stringify
 * @returns JSON string representation of the object
 */
export function safeJsonStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Parse a JSON string safely, returning null if parsing fails
 * @param str The string to parse
 * @returns Parsed object or null if parsing fails
 */
export function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Safely converts an unknown error to a string message
 * @param error The error object
 * @returns Error message as string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  try {
    return safeJsonStringify(error);
  } catch {
    return 'Unknown error';
  }
}

/**
 * Truncates a string to a maximum length, adding ellipsis if truncated
 * @param str The string to truncate
 * @param maxLength Maximum length of the string
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number = 100): string {
  if (!str) return '';
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength) + '...';
}

/**
 * Creates a deep clone of an object
 * @param obj The object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    // Fallback for objects that can't be stringified
    const clone: any = Array.isArray(obj) ? [] : {};
    
    Object.keys(obj as object).forEach((key) => {
      clone[key] = deepClone((obj as any)[key]);
    });
    
    return clone as T;
  }
}

/**
 * Removes sensitive information from an object
 * @param obj The object to sanitize
 * @param sensitiveKeys Array of sensitive key names to remove
 * @returns Sanitized object
 */
export function sanitizeObject<T extends object>(obj: T, sensitiveKeys: string[] = ['password', 'token', 'secret']): T {
  const sanitized = { ...obj };
  
  sensitiveKeys.forEach(key => {
    if (key in sanitized) {
      (sanitized as any)[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Creates a random ID string
 * @param length Length of the ID
 * @returns Random ID string
 */
export function generateRandomId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Checks if an object is empty
 * @param obj The object to check
 * @returns True if the object has no properties
 */
export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Groups an array of objects by a key
 * @param array Array to group
 * @param key Property to group by
 * @returns Object with groups
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Formats a date to ISO string or falls back to current date
 * @param date Date to format
 * @returns ISO date string
 */
export function formatDateOrNow(date?: Date | string | null): string {
  if (!date) {
    return new Date().toISOString();
  }
  
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  
  return date.toISOString();
}