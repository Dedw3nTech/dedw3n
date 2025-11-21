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
 * Enhanced with detailed error context for production debugging
 * @param str The string to parse
 * @param context Optional context string for logging (e.g., 'user preferences', 'API response')
 * @returns Parsed object or null if parsing fails
 */
export function safeJsonParse(str: string, context?: string): any {
  try {
    if (!str || typeof str !== 'string') {
      // Use logger for structured logging (imported dynamically to avoid circular dependency)
      import('./logger').then(({ logger }) => {
        logger.warn('JSON parsing failed - invalid input', {
          context: context || 'unknown',
          inputType: typeof str,
          isNull: str === null,
          isUndefined: str === undefined
        }, 'json-parser');
      });
      return null;
    }
    
    return JSON.parse(str);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const truncatedStr = str?.length > 100 ? str.substring(0, 100) + '...' : str;
    
    // Use logger for structured logging
    import('./logger').then(({ logger }) => {
      logger.warn('JSON parsing failed', {
        context: context || 'unknown',
        errorType: error instanceof SyntaxError ? 'SYNTAX_ERROR' : 'UNKNOWN_ERROR',
        errorMessage,
        inputPreview: truncatedStr,
        inputLength: str?.length || 0,
      }, 'json-parser');
    });
    
    return null;
  }
}

/**
 * Parse JSON with validation and proper error propagation for critical operations
 * Use this for critical parsing where null is not acceptable
 * @param str The string to parse
 * @param context Context for error messages
 * @returns Parsed object
 * @throws Error with descriptive message if parsing fails
 */
export function safeJsonParseWithValidation<T = any>(str: string, context: string): T {
  if (!str || typeof str !== 'string') {
    const error = new Error(`${context}: Invalid input - expected non-empty string, got ${typeof str}`);
    (error as any).code = 'INVALID_INPUT';
    (error as any).context = context;
    throw error;
  }
  
  try {
    const parsed = JSON.parse(str);
    
    if (parsed === null || parsed === undefined) {
      const error = new Error(`${context}: Parsed JSON is null or undefined`);
      (error as any).code = 'NULL_RESULT';
      (error as any).context = context;
      throw error;
    }
    
    return parsed as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      const truncatedStr = str.length > 100 ? str.substring(0, 100) + '...' : str;
      const enrichedError = new Error(`${context}: Invalid JSON format - ${error.message}. Input preview: ${truncatedStr}`);
      (enrichedError as any).code = 'JSON_SYNTAX_ERROR';
      (enrichedError as any).context = context;
      (enrichedError as any).originalError = error;
      throw enrichedError;
    }
    
    throw error;
  }
}

/**
 * Parse JSON from external API with proper error handling
 * Use this for third-party API responses to catch and classify errors properly
 * @param str The JSON string from external API
 * @param apiName Name of the external API for context
 * @returns Parsed object or null if parsing fails
 */
export function safeJsonParseExternal<T = any>(str: string, apiName: string): T | null {
  try {
    if (!str || typeof str !== 'string') {
      // Use logger for structured logging
      import('./logger').then(({ logger }) => {
        logger.error('External API returned invalid JSON response', {
          apiName,
          inputType: typeof str,
          isNull: str === null,
          isUndefined: str === undefined,
        }, undefined, 'json-parser-external');
      });
      return null;
    }
    
    return JSON.parse(str) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const truncatedStr = str?.length > 200 ? str.substring(0, 200) + '...' : str;
    
    // Use logger for structured logging - external API failures are high severity
    import('./logger').then(({ logger }) => {
      logger.error('External API JSON parsing failed', {
        apiName,
        errorType: error instanceof SyntaxError ? 'SYNTAX_ERROR' : 'UNKNOWN_ERROR',
        errorMessage,
        responsePreview: truncatedStr,
        responseLength: str?.length || 0,
        severity: 'HIGH',
      }, error as Error, 'json-parser-external');
    });
    
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