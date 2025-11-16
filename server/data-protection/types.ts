/**
 * Data Protection Module - Type Definitions
 * 
 * Comprehensive type definitions for the data protection system.
 * Ensures type safety across all data protection operations.
 */

/**
 * Sanitization options for input data
 */
export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripScripts?: boolean;
  trimWhitespace?: boolean;
}

/**
 * Validation rules for data
 */
export interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'phone' | 'alphanumeric' | 'numeric' | 'custom';
  message?: string;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  algorithm?: 'aes-256-gcm' | 'aes-256-cbc';
  encoding?: 'hex' | 'base64';
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag?: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  userId?: number;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Supported audit actions
 */
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'access_denied'
  | 'data_breach_attempt'
  | 'privacy_request'
  | 'data_deletion';

/**
 * Privacy compliance configuration
 */
export interface PrivacyConfig {
  enableGdpr?: boolean;
  enableCcpa?: boolean;
  dataRetentionDays?: number;
  anonymizeAfterDays?: number;
}

/**
 * Data subject request types (GDPR)
 */
export type DataSubjectRequestType =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'portability'
  | 'restriction'
  | 'objection';

/**
 * Data subject request
 */
export interface DataSubjectRequest {
  id?: string;
  userId: number;
  type: DataSubjectRequestType;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  notes?: string;
}

/**
 * Data masking configuration
 */
export interface MaskingConfig {
  type?: 'full' | 'partial' | 'email' | 'phone' | 'credit_card';
  visibleChars?: number;
  maskChar?: string;
  preserveFormat?: boolean;
}

/**
 * Secure deletion options
 */
export interface SecureDeletionOptions {
  overwritePasses?: number;
  verifyDeletion?: boolean;
  cascadeDelete?: boolean;
}

/**
 * Data retention policy
 */
export interface RetentionPolicy {
  resource: string;
  retentionDays: number;
  deleteAfterRetention: boolean;
  anonymizeInstead?: boolean;
}

/**
 * Access control permission
 */
export interface AccessPermission {
  userId: number;
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
  conditions?: Record<string, any>;
}

/**
 * Data classification level
 */
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

/**
 * Sensitive data field configuration
 */
export interface SensitiveFieldConfig {
  fieldName: string;
  classification: DataClassification;
  encryptAtRest: boolean;
  maskInLogs: boolean;
  includeInExport: boolean;
}
