/**
 * Production-Grade Error Builder
 * Creates standardized error responses following 2025 best practices
 */

import { ErrorCode, ERROR_CODE_METADATA, ErrorCategory, ErrorSeverity } from './error-codes';
import { logger } from '../logger';

/**
 * Standardized error response structure
 */
export interface StandardErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    retryable: boolean;
    timestamp: string;
    correlationId: string;
    path?: string;
    method?: string;
  };
  details?: any;
  stack?: string;
}

/**
 * Error builder options
 */
interface ErrorBuilderOptions {
  code: ErrorCode;
  message?: string;
  correlationId?: string;
  path?: string;
  method?: string;
  details?: any;
  originalError?: Error;
  context?: Record<string, any>;
}

/**
 * Builds standardized error response with proper logging
 */
export class ErrorBuilder {
  /**
   * Create a standardized error response
   */
  static createError(options: ErrorBuilderOptions): {
    response: StandardErrorResponse;
    httpStatus: number;
  } {
    const metadata = ERROR_CODE_METADATA[options.code];
    const timestamp = new Date().toISOString();
    const correlationId = options.correlationId || this.generateCorrelationId();
    
    // Production-safe message
    const clientMessage = process.env.NODE_ENV === 'production'
      ? (metadata.category === ErrorCategory.SERVER_ERROR 
          ? 'An internal error occurred. Please try again later.'
          : (options.message || metadata.description))
      : (options.message || metadata.description);
    
    // Build error response
    const errorResponse: StandardErrorResponse = {
      error: {
        code: options.code,
        message: clientMessage,
        category: metadata.category,
        severity: metadata.severity,
        retryable: metadata.retryable,
        timestamp,
        correlationId,
        ...(options.path && { path: options.path }),
        ...(options.method && { method: options.method }),
      },
    };
    
    // Add details in development or for client errors
    if (process.env.NODE_ENV !== 'production' && options.details) {
      errorResponse.details = options.details;
    }
    
    // Add stack trace in development
    if (process.env.NODE_ENV !== 'production' && options.originalError?.stack) {
      errorResponse.stack = options.originalError.stack;
    }
    
    // Log error with full context
    this.logError({
      code: options.code,
      message: options.message || metadata.description,
      correlationId,
      path: options.path,
      method: options.method,
      category: metadata.category,
      severity: metadata.severity,
      details: options.details,
      context: options.context,
      originalError: options.originalError,
    });
    
    return {
      response: errorResponse,
      httpStatus: metadata.httpStatus,
    };
  }
  
  /**
   * Log error with structured metadata for monitoring
   */
  private static logError(data: {
    code: ErrorCode;
    message: string;
    correlationId: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    path?: string;
    method?: string;
    details?: any;
    context?: Record<string, any>;
    originalError?: Error;
  }): void {
    const logData: Record<string, any> = {
      errorCode: data.code,
      correlationId: data.correlationId,
      category: data.category,
      severity: data.severity,
      ...(data.path && { path: data.path }),
      ...(data.method && { method: data.method }),
      ...(data.details && { details: data.details }),
      ...(data.context && data.context),
    };
    
    // Use appropriate log level based on severity
    if (data.severity === ErrorSeverity.CRITICAL || data.severity === ErrorSeverity.HIGH) {
      logger.error(data.message, logData, data.originalError, 'error-handler');
    } else if (data.severity === ErrorSeverity.MEDIUM) {
      logger.warn(data.message, logData, 'error-handler');
    } else {
      logger.debug(data.message, logData, 'error-handler');
    }
    
    // Emit metric for monitoring (hook for external monitoring systems)
    this.emitErrorMetric(data.code, data.category, data.severity);
  }
  
  /**
   * Emit error metric for monitoring systems
   * This is a hook that can be connected to Datadog, Prometheus, etc.
   */
  private static emitErrorMetric(
    code: ErrorCode,
    category: ErrorCategory,
    severity: ErrorSeverity
  ): void {
    // Hook for monitoring integration
    // In production, this would send metrics to Datadog, Prometheus, CloudWatch, etc.
    // For now, we log it for visibility
    if (process.env.ENABLE_ERROR_METRICS === 'true') {
      logger.info('Error metric emitted', {
        metric: 'error.occurred',
        errorCode: code,
        category,
        severity,
        timestamp: Date.now(),
      }, 'metrics');
    }
  }
  
  /**
   * Generate a unique correlation ID
   */
  private static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Helper: Create JSON parse error
   */
  static jsonParseError(options: {
    message?: string;
    correlationId?: string;
    path?: string;
    method?: string;
    originalError?: Error;
    context?: Record<string, any>;
  }) {
    return this.createError({
      code: ErrorCode.JSON_PARSE_ERROR,
      ...options,
    });
  }
  
  /**
   * Helper: Create JSON validation error
   */
  static jsonValidationError(options: {
    message?: string;
    correlationId?: string;
    path?: string;
    method?: string;
    details?: any;
  }) {
    return this.createError({
      code: ErrorCode.JSON_VALIDATION_FAILED,
      ...options,
    });
  }
  
  /**
   * Helper: Create external API error
   */
  static externalApiError(options: {
    message?: string;
    correlationId?: string;
    path?: string;
    method?: string;
    originalError?: Error;
    context?: Record<string, any>;
  }) {
    return this.createError({
      code: ErrorCode.EXTERNAL_API_JSON_PARSE_ERROR,
      ...options,
    });
  }
}
