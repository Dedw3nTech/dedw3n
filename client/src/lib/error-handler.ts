/**
 * Centralized Error Handling System
 * 
 * This module provides user-friendly error codes and handling to:
 * 1. Hide technical details from users
 * 2. Generate unique error codes for tracking
 * 3. Provide consistent error reporting
 */

export interface ErrorReport {
  code: string;
  userMessage: string;
  technicalDetails: string;
  category: string;
  timestamp: string;
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTH',
  NETWORK = 'NET',
  VALIDATION = 'VAL',
  SERVER = 'SRV',
  COMPONENT = 'COMP',
  DATABASE = 'DB',
  PERMISSION = 'PERM',
  UNKNOWN = 'UNK'
}

/**
 * Generate a unique error code based on category and hash
 */
function generateErrorCode(category: ErrorCategory, message: string): string {
  const hash = hashString(message);
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `${category}-${hash}-${timestamp}`;
}

/**
 * Simple hash function for error messages
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

/**
 * Categorize error based on message content
 */
function categorizeError(error: string): ErrorCategory {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('401') || errorLower.includes('unauthorized') || 
      errorLower.includes('authentication') || errorLower.includes('login') ||
      errorLower.includes('credentials') || errorLower.includes('password')) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  if (errorLower.includes('403') || errorLower.includes('forbidden') || 
      errorLower.includes('permission') || errorLower.includes('access denied')) {
    return ErrorCategory.PERMISSION;
  }
  
  if (errorLower.includes('network') || errorLower.includes('fetch') || 
      errorLower.includes('connection') || errorLower.includes('timeout')) {
    return ErrorCategory.NETWORK;
  }
  
  if (errorLower.includes('validation') || errorLower.includes('invalid') || 
      errorLower.includes('required') || errorLower.includes('format')) {
    return ErrorCategory.VALIDATION;
  }
  
  if (errorLower.includes('500') || errorLower.includes('503') || 
      errorLower.includes('internal server') || errorLower.includes('server error') ||
      errorLower.includes('service unavailable')) {
    return ErrorCategory.SERVER;
  }
  
  if (errorLower.includes('database') || errorLower.includes('query') ||
      errorLower.includes('sql')) {
    return ErrorCategory.DATABASE;
  }
  
  if (errorLower.includes('render') || errorLower.includes('component') ||
      errorLower.includes('cannot read properties')) {
    return ErrorCategory.COMPONENT;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Get user-friendly message based on error category
 */
function getUserFriendlyMessage(category: ErrorCategory, originalError: string): string {
  const errorLower = originalError.toLowerCase();
  
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      if (errorLower.includes('401') || errorLower.includes('unauthorized')) {
        return 'Your session has expired, or you may need to log in. Please refresh the page. If the technical issue continues, kindly report it.';
      }
      if (errorLower.includes('invalid credentials') || errorLower.includes('password')) {
        return 'The username or password you entered is incorrect.';
      }
      if (errorLower.includes('username') && errorLower.includes('already')) {
        return 'This username is already taken. Please choose a different one.';
      }
      if (errorLower.includes('email') && errorLower.includes('already')) {
        return 'This email is already registered. Please use a different email or log in.';
      }
      return 'Authentication failed. Please check your credentials and try again.';
    
    case ErrorCategory.PERMISSION:
      return 'You don\'t have permission to perform this action.';
    
    case ErrorCategory.NETWORK:
      if (errorLower.includes('timeout')) {
        return 'The request took too long. Please check your internet connection and try again.';
      }
      return 'Network connection issue. Please check your internet connection.';
    
    case ErrorCategory.VALIDATION:
      return 'Please check the information you entered and try again.';
    
    case ErrorCategory.SERVER:
      if (errorLower.includes('503') || errorLower.includes('service unavailable')) {
        return 'The service is temporarily unavailable. Please try again in a few moments.';
      }
      return 'Our server encountered an issue. Please try again in a moment.';
    
    case ErrorCategory.DATABASE:
      return 'A data storage issue occurred. Please try again.';
    
    case ErrorCategory.COMPONENT:
      return 'A display error occurred. Please refresh the page.';
    
    default:
      return 'Something went wrong.';
  }
}

/**
 * Main function to process and format errors for user display
 */
export function processError(error: Error | string | unknown): ErrorReport {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const category = categorizeError(errorMessage);
  const code = generateErrorCode(category, errorMessage);
  const userMessage = getUserFriendlyMessage(category, errorMessage);
  
  return {
    code,
    userMessage,
    technicalDetails: errorMessage,
    category,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract technical details while hiding sensitive information
 */
export function sanitizeTechnicalDetails(error: Error | string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Remove potential sensitive data patterns
  let sanitized = errorMessage
    .replace(/password["\s:=]+[^"\s,}]*/gi, 'password: [REDACTED]')
    .replace(/token["\s:=]+[^"\s,}]*/gi, 'token: [REDACTED]')
    .replace(/api[_-]?key["\s:=]+[^"\s,}]*/gi, 'api_key: [REDACTED]')
    .replace(/secret["\s:=]+[^"\s,}]*/gi, 'secret: [REDACTED]');
  
  return sanitized;
}

/**
 * Utility to check if error should trigger immediate action
 */
export function isAuthError(error: Error | string): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return categorizeError(errorMessage) === ErrorCategory.AUTHENTICATION;
}

/**
 * Utility to check if error is temporary/retryable
 */
export function isRetryableError(error: Error | string): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const category = categorizeError(errorMessage);
  return [ErrorCategory.NETWORK, ErrorCategory.SERVER].includes(category);
}
