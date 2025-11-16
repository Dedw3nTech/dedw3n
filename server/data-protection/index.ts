/**
 * Data Protection Module
 * 
 * A comprehensive, enterprise-grade data protection system implementing
 * best practices for data security, privacy, and compliance.
 * 
 * Features:
 * - Input sanitization and validation
 * - Output encoding (XSS prevention)
 * - Data encryption and hashing
 * - Audit logging
 * - Privacy compliance (GDPR, CCPA)
 * - Data masking and anonymization
 * - Secure deletion
 * - Access control
 * 
 * @module data-protection
 */

export * from './types';
export * from './sanitization.service';
export * from './encryption.service';
export * from './audit.service';
export * from './privacy.service';
export * from './masking.service';
export * from './deletion.service';
export * from './validation.service';
export * from './encoding.service';

import { EncryptionService } from './encryption.service';
import { PrivacyService } from './privacy.service';

/**
 * Data Protection Module Version
 */
export const DATA_PROTECTION_VERSION = '1.0.0';

/**
 * Module initialization flag
 */
let isInitialized = false;

/**
 * Module configuration
 */
let moduleConfig = {
  enableAuditLogging: true,
  enableGdprCompliance: true,
};

/**
 * Initialize the data protection module
 * 
 * @param config - Optional configuration for the module
 * @returns Promise<void>
 */
export async function initializeDataProtection(config?: {
  enableAuditLogging?: boolean;
  enableGdprCompliance?: boolean;
  encryptionKey?: string;
}): Promise<void> {
  if (isInitialized) {
    console.log('[DATA-PROTECTION] Module already initialized');
    return;
  }

  console.log('[DATA-PROTECTION] Initializing data protection module...');

  // Apply configuration
  if (config) {
    if (config.enableAuditLogging !== undefined) {
      moduleConfig.enableAuditLogging = config.enableAuditLogging;
    }
    
    if (config.enableGdprCompliance !== undefined) {
      moduleConfig.enableGdprCompliance = config.enableGdprCompliance;
    }

    // Configure encryption key
    if (config.encryptionKey) {
      EncryptionService.setEncryptionKey(config.encryptionKey);
      console.log('[DATA-PROTECTION] Custom encryption key configured');
    } else if (process.env.ENCRYPTION_KEY) {
      EncryptionService.setEncryptionKey(process.env.ENCRYPTION_KEY);
      console.log('[DATA-PROTECTION] Encryption key loaded from environment');
    } else {
      console.warn('[DATA-PROTECTION] WARNING: No encryption key configured. Using default (not secure for production)');
    }
  } else {
    // Try to load from environment if no config provided
    if (process.env.ENCRYPTION_KEY) {
      EncryptionService.setEncryptionKey(process.env.ENCRYPTION_KEY);
      console.log('[DATA-PROTECTION] Encryption key loaded from environment');
    } else {
      console.warn('[DATA-PROTECTION] WARNING: No encryption key configured. Using default (not secure for production)');
    }
  }

  // Configure privacy service
  PrivacyService.configure({
    enableGdpr: moduleConfig.enableGdprCompliance,
    enableCcpa: moduleConfig.enableGdprCompliance,
  });

  isInitialized = true;
  
  console.log('[DATA-PROTECTION] Configuration:');
  console.log(`  - Audit Logging: ${moduleConfig.enableAuditLogging ? 'enabled' : 'disabled'}`);
  console.log(`  - GDPR Compliance: ${moduleConfig.enableGdprCompliance ? 'enabled' : 'disabled'}`);
  console.log(`[DATA-PROTECTION] Module initialized successfully (v${DATA_PROTECTION_VERSION})`);
}

/**
 * Get current module configuration
 */
export function getDataProtectionConfig() {
  return { ...moduleConfig };
}

/**
 * Check if module is initialized
 */
export function isDataProtectionInitialized(): boolean {
  return isInitialized;
}
