/**
 * Production Storage Synchronization System
 * 
 * Automatically syncs object storage between development and production
 * environments after deployments to ensure data consistency.
 * 
 * Features:
 * - Auto-detects environment (development/production)
 * - Syncs storage on deployment
 * - Validates sync integrity
 * - Minimal configuration required
 */

import { objectStorageClient } from './objectStorage';
import { File } from '@google-cloud/storage';

interface SyncConfig {
  sourceBucket: string;
  destinationBucket: string;
  syncPaths: string[];
  dryRun?: boolean;
}

interface SyncResult {
  success: boolean;
  syncedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  totalSize: number;
  errors: Array<{ file: string; error: string }>;
}

export class ProductionStorageSync {
  private environment: 'development' | 'production';
  
  constructor() {
    this.environment = this.detectEnvironment();
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): 'development' | 'production' {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const replitDeployment = process.env.REPL_DEPLOYMENT === 'true';
    
    if (replitDeployment || nodeEnv === 'production') {
      return 'production';
    }
    
    return 'development';
  }

  /**
   * Get environment-specific bucket names
   * NOTE: With Replit Object Storage, the same bucket is used in dev and production
   * This sync system is primarily for legacy setups with separate buckets
   */
  private getBucketConfig(): { dev: string; prod: string } {
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    const bucketMatch = publicPaths.match(/\/([^\/]+)/);
    let currentBucket = bucketMatch ? bucketMatch[1] : '';
    
    if (!currentBucket) {
      currentBucket = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';
      if (!currentBucket) {
        console.warn('[SYNC] No bucket configured in PUBLIC_OBJECT_SEARCH_PATHS or DEFAULT_OBJECT_STORAGE_BUCKET_ID');
      }
    }
    
    const devBucket = process.env.DEV_STORAGE_BUCKET || currentBucket;
    const prodBucket = process.env.PROD_STORAGE_BUCKET || currentBucket;
    
    return {
      dev: devBucket,
      prod: prodBucket
    };
  }

  /**
   * Check if file needs syncing (based on modification time and size)
   */
  private async needsSync(sourceFile: File, destFile: File): Promise<boolean> {
    try {
      const [sourceExists] = await sourceFile.exists();
      const [destExists] = await destFile.exists();
      
      if (!destExists) return true;
      if (!sourceExists) return false;
      
      const [sourceMeta] = await sourceFile.getMetadata();
      const [destMeta] = await destFile.getMetadata();
      
      const sourceTime = new Date(sourceMeta.updated || sourceMeta.timeCreated || 0).getTime();
      const destTime = new Date(destMeta.updated || destMeta.timeCreated || 0).getTime();
      const sourceSize = sourceMeta.size || 0;
      const destSize = destMeta.size || 0;
      
      return sourceTime > destTime || sourceSize !== destSize;
    } catch (error) {
      console.error('[SYNC] Error checking sync status:', error);
      return true;
    }
  }

  /**
   * Sync a single file from source to destination
   */
  private async syncFile(
    sourceFile: File,
    destFile: File
  ): Promise<{ success: boolean; size: number; error?: string }> {
    try {
      const [exists] = await sourceFile.exists();
      if (!exists) {
        return { success: false, size: 0, error: 'Source file not found' };
      }

      const [metadata] = await sourceFile.getMetadata();
      const size = typeof metadata.size === 'string' ? parseInt(metadata.size) : (metadata.size || 0);
      
      await sourceFile.copy(destFile);
      
      if (metadata.metadata) {
        await destFile.setMetadata({
          metadata: metadata.metadata
        });
      }
      
      return { success: true, size };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, size: 0, error: errorMsg };
    }
  }

  /**
   * List all files in a bucket path
   */
  private async listFiles(bucketName: string, prefix?: string): Promise<File[]> {
    try {
      const bucket = objectStorageClient.bucket(bucketName);
      const [files] = await bucket.getFiles({ prefix });
      return files;
    } catch (error) {
      console.error(`[SYNC] Error listing files in ${bucketName}:`, error);
      return [];
    }
  }

  /**
   * Sync storage from development to production
   */
  async syncToProduction(config?: Partial<SyncConfig>): Promise<SyncResult> {
    const buckets = this.getBucketConfig();
    const syncConfig: SyncConfig = {
      sourceBucket: config?.sourceBucket || buckets.dev,
      destinationBucket: config?.destinationBucket || buckets.prod,
      syncPaths: config?.syncPaths || ['public', 'private'],
      dryRun: config?.dryRun || false
    };

    console.log('\n=== Production Storage Sync ===');
    console.log(`Environment: ${this.environment}`);
    console.log(`Source: ${syncConfig.sourceBucket}`);
    console.log(`Destination: ${syncConfig.destinationBucket}`);
    console.log(`Dry Run: ${syncConfig.dryRun ? 'YES' : 'NO'}`);
    
    const result: SyncResult = {
      success: true,
      syncedFiles: 0,
      skippedFiles: 0,
      failedFiles: 0,
      totalSize: 0,
      errors: []
    };

    if (syncConfig.sourceBucket === syncConfig.destinationBucket) {
      console.log('⚠️  Source and destination buckets are the same.');
      console.log('ℹ️  Replit Object Storage uses a single bucket for dev and production.');
      console.log('✓ No sync needed - all data is already in the correct bucket.');
      console.log('=== Sync Complete ===\n');
      return result;
    }
    
    console.log('');

    for (const path of syncConfig.syncPaths) {
      console.log(`Syncing path: ${path}/`);
      
      const sourceFiles = await this.listFiles(syncConfig.sourceBucket, path);
      
      for (const sourceFile of sourceFiles) {
        const fileName = sourceFile.name;
        const sourceBucket = objectStorageClient.bucket(syncConfig.sourceBucket);
        const destBucket = objectStorageClient.bucket(syncConfig.destinationBucket);
        const destFile = destBucket.file(fileName);
        
        const needsSync = await this.needsSync(sourceFile, destFile);
        
        if (!needsSync) {
          result.skippedFiles++;
          continue;
        }
        
        if (syncConfig.dryRun) {
          console.log(`  [DRY RUN] Would sync: ${fileName}`);
          result.syncedFiles++;
          continue;
        }
        
        const syncResult = await this.syncFile(sourceFile, destFile);
        
        if (syncResult.success) {
          result.syncedFiles++;
          result.totalSize += syncResult.size;
          console.log(`  ✓ Synced: ${fileName} (${(syncResult.size / 1024).toFixed(2)} KB)`);
        } else {
          result.failedFiles++;
          result.errors.push({ file: fileName, error: syncResult.error || 'Unknown error' });
          console.log(`  ✗ Failed: ${fileName} - ${syncResult.error}`);
        }
      }
    }

    result.success = result.failedFiles === 0;

    console.log('\n=== Sync Summary ===');
    console.log(`✓ Synced: ${result.syncedFiles}`);
    console.log(`- Skipped: ${result.skippedFiles}`);
    console.log(`✗ Failed: ${result.failedFiles}`);
    console.log(`Total Size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    }
    
    console.log('\n=== Sync Complete ===\n');

    return result;
  }

  /**
   * Auto-sync on deployment (production only)
   */
  async autoSyncOnDeployment(): Promise<SyncResult | null> {
    if (this.environment !== 'production') {
      console.log('[SYNC] Not in production environment - skipping auto-sync');
      return null;
    }

    const lastSyncFile = '.last-production-sync';
    const shouldSync = await this.shouldAutoSync(lastSyncFile);
    
    if (!shouldSync) {
      console.log('[SYNC] Storage already synced for this deployment');
      return null;
    }

    console.log('[SYNC] New deployment detected - starting auto-sync...');
    const result = await this.syncToProduction();
    
    if (result.success) {
      await this.markSyncComplete(lastSyncFile);
    }
    
    return result;
  }

  /**
   * Check if auto-sync should run
   */
  private async shouldAutoSync(markerFile: string): Promise<boolean> {
    try {
      const buckets = this.getBucketConfig();
      const bucket = objectStorageClient.bucket(buckets.prod);
      const file = bucket.file(markerFile);
      
      const [exists] = await file.exists();
      
      if (!exists) return true;
      
      const [metadata] = await file.getMetadata();
      const lastSync = new Date(metadata.updated || metadata.timeCreated || 0);
      const deployTime = new Date();
      const hoursSinceSync = (deployTime.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceSync > 1;
    } catch (error) {
      console.error('[SYNC] Error checking sync status:', error);
      return true;
    }
  }

  /**
   * Mark sync as complete
   */
  private async markSyncComplete(markerFile: string): Promise<void> {
    try {
      const buckets = this.getBucketConfig();
      const bucket = objectStorageClient.bucket(buckets.prod);
      const file = bucket.file(markerFile);
      
      await file.save(JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: this.environment,
        syncedBy: 'auto-sync-system'
      }));
      
      console.log('[SYNC] Sync marker updated successfully');
    } catch (error) {
      console.error('[SYNC] Error updating sync marker:', error);
    }
  }

  /**
   * Validate storage integrity
   */
  async validateSync(): Promise<{
    valid: boolean;
    missingFiles: string[];
    mismatchedFiles: string[];
  }> {
    const buckets = this.getBucketConfig();
    const result = {
      valid: true,
      missingFiles: [] as string[],
      mismatchedFiles: [] as string[]
    };

    const devFiles = await this.listFiles(buckets.dev);
    const prodBucket = objectStorageClient.bucket(buckets.prod);

    for (const devFile of devFiles) {
      const prodFile = prodBucket.file(devFile.name);
      const [exists] = await prodFile.exists();
      
      if (!exists) {
        result.missingFiles.push(devFile.name);
        result.valid = false;
        continue;
      }

      const [devMeta] = await devFile.getMetadata();
      const [prodMeta] = await prodFile.getMetadata();
      
      if (devMeta.size !== prodMeta.size) {
        result.mismatchedFiles.push(devFile.name);
        result.valid = false;
      }
    }

    return result;
  }
}

export const productionStorageSync = new ProductionStorageSync();
