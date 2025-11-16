/**
 * Audit Service
 * 
 * Provides comprehensive audit logging for tracking data access,
 * modifications, and security events. Essential for compliance
 * and security monitoring.
 */

import type { AuditLogEntry, AuditAction } from './types';

/**
 * In-memory audit log storage
 * For production, consider using a database or external logging service
 */
const auditLogs: AuditLogEntry[] = [];

/**
 * Maximum number of audit logs to keep in memory
 */
const MAX_LOGS_IN_MEMORY = 10000;

/**
 * Audit Service Class
 */
export class AuditService {
  /**
   * Log an audit event
   * 
   * @param entry - Audit log entry
   * @returns Created audit log entry with ID and timestamp
   */
  static log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      ...entry,
    };

    // Add to in-memory storage
    auditLogs.push(auditEntry);

    // Maintain maximum size
    if (auditLogs.length > MAX_LOGS_IN_MEMORY) {
      auditLogs.shift();
    }

    // Log to console based on severity
    this.logToConsole(auditEntry);

    // In production, also write to database or external service
    this.persistLog(auditEntry);

    return auditEntry;
  }

  /**
   * Log a data access event
   * 
   * @param userId - User ID accessing the data
   * @param resource - Resource being accessed
   * @param resourceId - Optional resource ID
   * @param metadata - Additional metadata
   * @returns Audit log entry
   */
  static logAccess(
    userId: number | undefined,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): AuditLogEntry {
    return this.log({
      userId,
      action: 'read',
      resource,
      resourceId,
      details: metadata,
      status: 'success',
      severity: 'low',
    });
  }

  /**
   * Log a data modification event
   * 
   * @param userId - User ID modifying the data
   * @param action - Action performed (create, update, delete)
   * @param resource - Resource being modified
   * @param resourceId - Resource ID
   * @param metadata - Additional metadata
   * @returns Audit log entry
   */
  static logModification(
    userId: number | undefined,
    action: 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    metadata?: Record<string, any>
  ): AuditLogEntry {
    return this.log({
      userId,
      action,
      resource,
      resourceId,
      details: metadata,
      status: 'success',
      severity: action === 'delete' ? 'high' : 'medium',
    });
  }

  /**
   * Log a security event
   * 
   * @param userId - User ID involved
   * @param action - Security action
   * @param details - Event details
   * @param severity - Event severity
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @returns Audit log entry
   */
  static logSecurityEvent(
    userId: number | undefined,
    action: AuditAction,
    details: Record<string, any>,
    severity: AuditLogEntry['severity'] = 'medium',
    ipAddress?: string,
    userAgent?: string
  ): AuditLogEntry {
    return this.log({
      userId,
      action,
      resource: 'security',
      details,
      status: 'warning',
      severity,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a failed access attempt
   * 
   * @param userId - User ID attempting access
   * @param resource - Resource access was attempted on
   * @param reason - Reason for failure
   * @param ipAddress - IP address
   * @returns Audit log entry
   */
  static logAccessDenied(
    userId: number | undefined,
    resource: string,
    reason: string,
    ipAddress?: string
  ): AuditLogEntry {
    return this.log({
      userId,
      action: 'access_denied',
      resource,
      details: { reason },
      status: 'failure',
      severity: 'high',
      ipAddress,
    });
  }

  /**
   * Log a data export event (important for GDPR compliance)
   * 
   * @param userId - User ID requesting export
   * @param resource - Resource being exported
   * @param format - Export format
   * @returns Audit log entry
   */
  static logDataExport(
    userId: number,
    resource: string,
    format: string
  ): AuditLogEntry {
    return this.log({
      userId,
      action: 'export',
      resource,
      details: { format },
      status: 'success',
      severity: 'medium',
    });
  }

  /**
   * Get audit logs with filtering
   * 
   * @param filters - Filter criteria
   * @returns Filtered audit logs
   */
  static getLogs(filters: {
    userId?: number;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: AuditLogEntry['severity'];
    limit?: number;
  } = {}): AuditLogEntry[] {
    let filtered = [...auditLogs];

    if (filters.userId !== undefined) {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }

    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action);
    }

    if (filters.resource) {
      filtered = filtered.filter((log) => log.resource === filters.resource);
    }

    if (filters.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= filters.endDate!);
    }

    if (filters.severity) {
      filtered = filtered.filter((log) => log.severity === filters.severity);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Get security alerts (high and critical severity events)
   * 
   * @param limit - Maximum number of alerts to return
   * @returns Security alerts
   */
  static getSecurityAlerts(limit: number = 100): AuditLogEntry[] {
    return auditLogs
      .filter((log) => log.severity === 'high' || log.severity === 'critical')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Generate audit report for a user
   * 
   * @param userId - User ID
   * @param startDate - Report start date
   * @param endDate - Report end date
   * @returns Audit report
   */
  static generateUserReport(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): {
    userId: number;
    totalActions: number;
    actionBreakdown: Record<AuditAction, number>;
    recentActivity: AuditLogEntry[];
  } {
    const userLogs = this.getLogs({ userId, startDate, endDate });

    const actionBreakdown = userLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<AuditAction, number>);

    return {
      userId,
      totalActions: userLogs.length,
      actionBreakdown,
      recentActivity: userLogs.slice(0, 50),
    };
  }

  /**
   * Clear old audit logs
   * 
   * @param olderThan - Delete logs older than this date
   * @returns Number of logs deleted
   */
  static clearOldLogs(olderThan: Date): number {
    const initialLength = auditLogs.length;
    const filtered = auditLogs.filter((log) => log.timestamp >= olderThan);
    auditLogs.length = 0;
    auditLogs.push(...filtered);
    return initialLength - auditLogs.length;
  }

  /**
   * Generate unique audit ID
   * 
   * @returns Audit ID
   */
  private static generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log to console based on severity
   * 
   * @param entry - Audit log entry
   */
  private static logToConsole(entry: AuditLogEntry): void {
    const message = `[AUDIT] ${entry.action.toUpperCase()} - ${entry.resource} by user ${entry.userId || 'anonymous'} - ${entry.status}`;

    switch (entry.severity) {
      case 'critical':
        console.error(`🚨 ${message}`, entry.details);
        break;
      case 'high':
        console.warn(`⚠️  ${message}`, entry.details);
        break;
      case 'medium':
        console.log(`ℹ️  ${message}`);
        break;
      case 'low':
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(message);
        }
        break;
    }
  }

  /**
   * Persist log to database or external service
   * Placeholder for production implementation
   * 
   * @param entry - Audit log entry
   */
  private static async persistLog(entry: AuditLogEntry): Promise<void> {
    // In production, implement database persistence or send to logging service
    // Examples:
    // - Write to database table
    // - Send to Elasticsearch
    // - Send to CloudWatch
    // - Send to Datadog
    
    // For now, this is a no-op
    // await db.insert(auditLogs).values(entry);
  }
}

/**
 * Convenience function for logging audit events
 */
export function logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  return AuditService.log(entry);
}

/**
 * Convenience function for logging access
 */
export function logAccess(
  userId: number | undefined,
  resource: string,
  resourceId?: string
): AuditLogEntry {
  return AuditService.logAccess(userId, resource, resourceId);
}
