/**
 * Storage Sync Startup Integration
 * 
 * Simple integration module that initializes the production storage
 * sync system during application startup.
 */

import { deploymentSyncHook } from './deployment-sync-hook';
import { productionStorageSync } from './production-storage-sync';

/**
 * Initialize storage sync system
 * Called during application startup
 */
export async function initializeStorageSync(): Promise<void> {
  try {
    console.log('\n=== Storage Sync System ===');
    console.log('[STORAGE-SYNC] Initializing...');
    
    await deploymentSyncHook.initialize();
    
    console.log('[STORAGE-SYNC] System ready');
    console.log('=== Storage Sync Complete ===\n');
  } catch (error) {
    console.error('[STORAGE-SYNC] Initialization error:', error);
  }
}

/**
 * Manual sync endpoint handler
 * For admin-triggered synchronization
 */
export async function triggerManualStorageSync(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('[STORAGE-SYNC] Manual sync requested');
    
    const result = await productionStorageSync.syncToProduction();
    
    return {
      success: result.success,
      message: result.success ? 'Storage sync completed successfully' : 'Storage sync failed',
      details: {
        syncedFiles: result.syncedFiles,
        skippedFiles: result.skippedFiles,
        failedFiles: result.failedFiles,
        totalSize: result.totalSize,
        errors: result.errors
      }
    };
  } catch (error) {
    console.error('[STORAGE-SYNC] Manual sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate storage sync status
 */
export async function validateStorageSync(): Promise<{
  valid: boolean;
  missingFiles: number;
  mismatchedFiles: number;
  details?: any;
}> {
  try {
    const validation = await productionStorageSync.validateSync();
    
    return {
      valid: validation.valid,
      missingFiles: validation.missingFiles.length,
      mismatchedFiles: validation.mismatchedFiles.length,
      details: {
        missingFiles: validation.missingFiles.slice(0, 10),
        mismatchedFiles: validation.mismatchedFiles.slice(0, 10)
      }
    };
  } catch (error) {
    console.error('[STORAGE-SYNC] Validation error:', error);
    return {
      valid: false,
      missingFiles: 0,
      mismatchedFiles: 0
    };
  }
}

/**
 * Get sync system status
 */
export function getStorageSyncStatus(): {
  environment: string;
  configured: boolean;
  hookActive: boolean;
} {
  const status = deploymentSyncHook.getSyncStatus();
  const isConfigured = !!(
    process.env.DEV_STORAGE_BUCKET &&
    process.env.PROD_STORAGE_BUCKET &&
    process.env.PUBLIC_OBJECT_SEARCH_PATHS
  );

  return {
    environment: status.environment,
    configured: isConfigured,
    hookActive: status.environment === 'production'
  };
}
