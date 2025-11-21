/**
 * Standardized Error Codes for Production JSON Error Handling
 * Following 2025 best practices for error classification and monitoring
 */

export enum ErrorCode {
  // JSON Parsing Errors (1000-1099)
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
  JSON_INVALID_SYNTAX = 'JSON_INVALID_SYNTAX',
  JSON_UNEXPECTED_TOKEN = 'JSON_UNEXPECTED_TOKEN',
  JSON_VALIDATION_FAILED = 'JSON_VALIDATION_FAILED',
  JSON_SCHEMA_MISMATCH = 'JSON_SCHEMA_MISMATCH',
  
  // Request Validation Errors (1100-1199)
  REQUEST_BODY_MISSING = 'REQUEST_BODY_MISSING',
  REQUEST_BODY_INVALID = 'REQUEST_BODY_INVALID',
  REQUEST_CONTENT_TYPE_INVALID = 'REQUEST_CONTENT_TYPE_INVALID',
  REQUEST_PAYLOAD_TOO_LARGE = 'REQUEST_PAYLOAD_TOO_LARGE',
  
  // External API Errors (1200-1299)
  EXTERNAL_API_INVALID_RESPONSE = 'EXTERNAL_API_INVALID_RESPONSE',
  EXTERNAL_API_JSON_PARSE_ERROR = 'EXTERNAL_API_JSON_PARSE_ERROR',
  
  // Server Errors (5000-5099)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Rate Limiting (4000-4099)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_MALFORMED_REQUESTS = 'TOO_MANY_MALFORMED_REQUESTS',
}

/**
 * Error classification for monitoring and alerting
 */
export enum ErrorCategory {
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  EXTERNAL_ERROR = 'EXTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
}

/**
 * Error severity for alerting thresholds
 */
export enum ErrorSeverity {
  LOW = 'LOW',          // Expected client errors
  MEDIUM = 'MEDIUM',    // Unexpected but recoverable
  HIGH = 'HIGH',        // Critical issues requiring attention
  CRITICAL = 'CRITICAL' // System-wide failures
}

/**
 * Metadata for each error code
 */
interface ErrorCodeMetadata {
  httpStatus: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  description: string;
}

/**
 * Error code metadata registry
 */
export const ERROR_CODE_METADATA: Record<ErrorCode, ErrorCodeMetadata> = {
  [ErrorCode.JSON_PARSE_ERROR]: {
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'Failed to parse JSON request body'
  },
  [ErrorCode.JSON_INVALID_SYNTAX]: {
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'JSON syntax is invalid'
  },
  [ErrorCode.JSON_UNEXPECTED_TOKEN]: {
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'Unexpected token in JSON'
  },
  [ErrorCode.JSON_VALIDATION_FAILED]: {
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'JSON structure does not match expected schema'
  },
  [ErrorCode.JSON_SCHEMA_MISMATCH]: {
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'JSON data does not conform to schema'
  },
  [ErrorCode.REQUEST_BODY_MISSING]: {
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'Request body is required but missing'
  },
  [ErrorCode.REQUEST_BODY_INVALID]: {
    httpStatus: 400,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'Request body format is invalid'
  },
  [ErrorCode.REQUEST_CONTENT_TYPE_INVALID]: {
    httpStatus: 415,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.LOW,
    retryable: false,
    description: 'Content-Type header must be application/json'
  },
  [ErrorCode.REQUEST_PAYLOAD_TOO_LARGE]: {
    httpStatus: 413,
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    description: 'Request payload exceeds size limit'
  },
  [ErrorCode.EXTERNAL_API_INVALID_RESPONSE]: {
    httpStatus: 502,
    category: ErrorCategory.EXTERNAL_ERROR,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    description: 'External API returned invalid response'
  },
  [ErrorCode.EXTERNAL_API_JSON_PARSE_ERROR]: {
    httpStatus: 502,
    category: ErrorCategory.EXTERNAL_ERROR,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    description: 'Failed to parse JSON from external API'
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    description: 'Internal server error occurred'
  },
  [ErrorCode.DATABASE_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    description: 'Database operation failed'
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    httpStatus: 429,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    description: 'Rate limit exceeded'
  },
  [ErrorCode.TOO_MANY_MALFORMED_REQUESTS]: {
    httpStatus: 429,
    category: ErrorCategory.CLIENT_ERROR, // Client error so message is shown in production
    severity: ErrorSeverity.HIGH,
    retryable: true,
    description: 'Too many malformed requests detected'
  },
};
