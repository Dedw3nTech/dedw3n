/**
 * Deployment Sync Hook Handler
 * 
 * Automatically triggers storage synchronization when a new deployment is detected.
 * Integrates with Replit's deployment lifecycle.
 */

import { productionStorageSync } from './production-storage-sync';

interface DeploymentInfo {
  environment: string;
  timestamp: Date;
  triggeredBy: 'manual' | 'auto';
}

export class DeploymentSyncHook {
  private isProcessing: boolean = false;

  /**
   * Initialize deployment hook
   */
  async initialize(): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.REPL_DEPLOYMENT === 'true';
    
    if (!isProduction) {
      console.log('[DEPLOY-HOOK] Development environment - sync hook inactive');
      return;
    }

    console.log('[DEPLOY-HOOK] Production environment detected');
    console.log('[DEPLOY-HOOK] Initializing deployment sync hook...');

    await this.checkAndSync();
  }

  /**
   * Check if this is a new deployment and trigger sync if needed
   */
  private async checkAndSync(): Promise<void> {
    if (this.isProcessing) {
      console.log('[DEPLOY-HOOK] Sync already in progress');
      return;
    }

    this.isProcessing = true;

    try {
      const deploymentInfo = this.getDeploymentInfo();
      
      console.log('[DEPLOY-HOOK] Deployment Info:');
      console.log(`  Environment: ${deploymentInfo.environment}`);
      console.log(`  Timestamp: ${deploymentInfo.timestamp.toISOString()}`);
      console.log(`  Triggered By: ${deploymentInfo.triggeredBy}`);

      const result = await productionStorageSync.autoSyncOnDeployment();

      if (result) {
        if (result.success) {
          console.log(`[DEPLOY-HOOK] ✓ Storage sync completed successfully`);
          console.log(`[DEPLOY-HOOK]   - ${result.syncedFiles} files synced`);
          console.log(`[DEPLOY-HOOK]   - ${(result.totalSize / 1024 / 1024).toFixed(2)} MB transferred`);
        } else {
          console.error(`[DEPLOY-HOOK] ✗ Storage sync failed`);
          console.error(`[DEPLOY-HOOK]   - ${result.failedFiles} files failed`);
          result.errors.forEach(e => {
            console.error(`[DEPLOY-HOOK]   - ${e.file}: ${e.error}`);
          });
        }
      }
    } catch (error) {
      console.error('[DEPLOY-HOOK] Error during deployment sync:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get deployment information
   */
  private getDeploymentInfo(): DeploymentInfo {
    const environment = process.env.NODE_ENV || 'development';
    const isReplitDeployment = process.env.REPL_DEPLOYMENT === 'true';
    
    return {
      environment: isReplitDeployment ? 'production' : environment,
      timestamp: new Date(),
      triggeredBy: isReplitDeployment ? 'auto' : 'manual'
    };
  }

  /**
   * Manual sync trigger (can be called from admin endpoints)
   */
  async triggerManualSync(): Promise<void> {
    console.log('[DEPLOY-HOOK] Manual sync triggered');
    await this.checkAndSync();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isProcessing: boolean;
    environment: string;
  } {
    return {
      isProcessing: this.isProcessing,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

export const deploymentSyncHook = new DeploymentSyncHook();
