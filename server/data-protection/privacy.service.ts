/**
 * Privacy Service
 * 
 * Provides privacy compliance features including GDPR, CCPA, data retention,
 * right to be forgotten, and data portability.
 */

import type { 
  PrivacyConfig, 
  DataSubjectRequest, 
  DataSubjectRequestType,
  RetentionPolicy 
} from './types';
import { AuditService } from './audit.service';

/**
 * Default privacy configuration
 */
const DEFAULT_CONFIG: Required<PrivacyConfig> = {
  enableGdpr: true,
  enableCcpa: true,
  dataRetentionDays: 365,
  anonymizeAfterDays: 730,
};

/**
 * In-memory storage for data subject requests
 * In production, store in database
 */
const dataSubjectRequests: DataSubjectRequest[] = [];

/**
 * Retention policies registry
 */
const retentionPolicies: RetentionPolicy[] = [];

/**
 * Privacy Service Class
 */
export class PrivacyService {
  private static config: Required<PrivacyConfig> = DEFAULT_CONFIG;

  /**
   * Configure privacy service
   * 
   * @param config - Privacy configuration
   */
  static configure(config: PrivacyConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Submit a data subject request (GDPR Article 15-20)
   * 
   * @param userId - User ID making the request
   * @param type - Type of request
   * @param notes - Additional notes
   * @returns Created data subject request
   */
  static submitDataSubjectRequest(
    userId: number,
    type: DataSubjectRequestType,
    notes?: string
  ): DataSubjectRequest {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type,
      status: 'pending',
      requestedAt: new Date(),
      notes,
    };

    dataSubjectRequests.push(request);

    // Log audit event
    AuditService.log({
      userId,
      action: 'privacy_request',
      resource: 'data_subject_request',
      resourceId: request.id,
      details: { requestType: type },
      status: 'success',
      severity: 'high',
    });

    return request;
  }

  /**
   * Get data subject request by ID
   * 
   * @param requestId - Request ID
   * @returns Data subject request or undefined
   */
  static getRequest(requestId: string): DataSubjectRequest | undefined {
    return dataSubjectRequests.find((req) => req.id === requestId);
  }

  /**
   * Get all requests for a user
   * 
   * @param userId - User ID
   * @returns Array of data subject requests
   */
  static getUserRequests(userId: number): DataSubjectRequest[] {
    return dataSubjectRequests.filter((req) => req.userId === userId);
  }

  /**
   * Update request status
   * 
   * @param requestId - Request ID
   * @param status - New status
   * @param notes - Optional notes
   * @returns Updated request or undefined
   */
  static updateRequestStatus(
    requestId: string,
    status: DataSubjectRequest['status'],
    notes?: string
  ): DataSubjectRequest | undefined {
    const request = this.getRequest(requestId);
    
    if (request) {
      request.status = status;
      
      if (status === 'completed') {
        request.completedAt = new Date();
      }
      
      if (notes) {
        request.notes = notes;
      }

      // Log audit event
      AuditService.log({
        userId: request.userId,
        action: 'update',
        resource: 'data_subject_request',
        resourceId: requestId,
        details: { newStatus: status },
        status: 'success',
        severity: 'medium',
      });
    }

    return request;
  }

  /**
   * Right to Access - Get all data for a user (GDPR Article 15)
   * 
   * @param userId - User ID
   * @returns User data package
   */
  static async getUserData(userId: number): Promise<Record<string, any>> {
    // This is a placeholder - in production, gather data from all tables
    const userData = {
      userId,
      exportedAt: new Date().toISOString(),
      data: {
        // Collect from all relevant tables
        // profile: await db.select().from(users).where(eq(users.id, userId)),
        // posts: await db.select().from(posts).where(eq(posts.userId, userId)),
        // etc...
      },
    };

    // Log data export
    AuditService.logDataExport(userId, 'user_data', 'json');

    return userData;
  }

  /**
   * Right to Data Portability - Export user data in machine-readable format (GDPR Article 20)
   * 
   * @param userId - User ID
   * @param format - Export format
   * @returns Exported data
   */
  static async exportUserData(
    userId: number,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    const userData = await this.getUserData(userId);

    switch (format) {
      case 'json':
        return JSON.stringify(userData, null, 2);
      
      case 'csv':
        // Convert to CSV format
        return this.convertToCSV(userData);
      
      case 'xml':
        // Convert to XML format
        return this.convertToXML(userData);
      
      default:
        return JSON.stringify(userData, null, 2);
    }
  }

  /**
   * Register a data retention policy
   * 
   * @param policy - Retention policy
   */
  static registerRetentionPolicy(policy: RetentionPolicy): void {
    retentionPolicies.push(policy);
  }

  /**
   * Get retention policy for a resource
   * 
   * @param resource - Resource type
   * @returns Retention policy or undefined
   */
  static getRetentionPolicy(resource: string): RetentionPolicy | undefined {
    return retentionPolicies.find((policy) => policy.resource === resource);
  }

  /**
   * Check if data should be retained
   * 
   * @param resource - Resource type
   * @param createdAt - When the data was created
   * @returns true if data should be retained
   */
  static shouldRetainData(resource: string, createdAt: Date): boolean {
    const policy = this.getRetentionPolicy(resource);
    
    if (!policy) {
      // Default retention period
      const daysSinceCreation = this.getDaysSince(createdAt);
      return daysSinceCreation <= this.config.dataRetentionDays;
    }

    const daysSinceCreation = this.getDaysSince(createdAt);
    return daysSinceCreation <= policy.retentionDays;
  }

  /**
   * Check if data should be anonymized
   * 
   * @param createdAt - When the data was created
   * @returns true if data should be anonymized
   */
  static shouldAnonymizeData(createdAt: Date): boolean {
    const daysSinceCreation = this.getDaysSince(createdAt);
    return daysSinceCreation > this.config.anonymizeAfterDays;
  }

  /**
   * Get consent status for a user and purpose
   * Placeholder for consent management
   * 
   * @param userId - User ID
   * @param purpose - Purpose of data processing
   * @returns true if consent is granted
   */
  static hasConsent(userId: number, purpose: string): boolean {
    // In production, check against consent management system
    // For now, return true as placeholder
    return true;
  }

  /**
   * Record consent
   * 
   * @param userId - User ID
   * @param purpose - Purpose of data processing
   * @param granted - Whether consent is granted
   */
  static recordConsent(userId: number, purpose: string, granted: boolean): void {
    // In production, store in consent management table
    AuditService.log({
      userId,
      action: 'update',
      resource: 'consent',
      details: { purpose, granted },
      status: 'success',
      severity: 'medium',
    });
  }

  /**
   * Generate unique request ID
   * 
   * @returns Request ID
   */
  private static generateRequestId(): string {
    return `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get days since a date
   * 
   * @param date - Date to compare
   * @returns Number of days
   */
  private static getDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Convert data to CSV format
   * Simplified implementation
   * 
   * @param data - Data to convert
   * @returns CSV string
   */
  private static convertToCSV(data: Record<string, any>): string {
    // Simplified CSV conversion
    return JSON.stringify(data);
  }

  /**
   * Convert data to XML format
   * Simplified implementation
   * 
   * @param data - Data to convert
   * @returns XML string
   */
  private static convertToXML(data: Record<string, any>): string {
    // Simplified XML conversion
    return `<?xml version="1.0"?><data>${JSON.stringify(data)}</data>`;
  }
}

/**
 * Convenience function for submitting data subject requests
 */
export function submitPrivacyRequest(
  userId: number,
  type: DataSubjectRequestType,
  notes?: string
): DataSubjectRequest {
  return PrivacyService.submitDataSubjectRequest(userId, type, notes);
}

/**
 * Convenience function for checking data retention
 */
export function shouldRetainData(resource: string, createdAt: Date): boolean {
  return PrivacyService.shouldRetainData(resource, createdAt);
}
