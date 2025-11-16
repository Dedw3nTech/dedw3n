/**
 * Startup Data Safeguard
 * 
 * This module runs at application startup to:
 * 1. Check for data loss risks
 * 2. Verify object storage is configured
 * 3. Warn about ephemeral files
 * 4. Optionally auto-migrate files
 */

import { assessDataLossRisk, logDataLossWarnings } from './data-loss-prevention';
import { migrateAllFiles } from './migrate-existing-files';

export interface SafeguardConfig {
  autoMigrate?: boolean;
  exitOnRisk?: boolean;
  verboseLogging?: boolean;
}

/**
 * Run startup safeguards to protect user data
 */
export async function runStartupSafeguards(config: SafeguardConfig = {}): Promise<void> {
  const {
    autoMigrate = false,
    exitOnRisk = false,
    verboseLogging = true,
  } = config;

  try {
    // Production safety check: never allow auto-migration in production
    const isProduction = process.env.REPL_DEPLOYMENT === 'true';
    if (isProduction && autoMigrate) {
      console.error('\n⚠️  WARNING: Auto-migration should not be enabled in production!');
      console.error('⚠️  Auto-migration is designed for development only.');
      console.error('⚠️  Disabling auto-migration for production safety.\n');
    }
    const safeAutoMigrate = isProduction ? false : autoMigrate;
    
    if (verboseLogging) {
      console.log('\n╔═══════════════════════════════════════════════════╗');
      console.log('║       DATA LOSS PREVENTION SAFEGUARD             ║');
      console.log('╚═══════════════════════════════════════════════════╝\n');
    }

    // Log data loss warnings (pass autoMigrate flag to suppress warnings only when safe)
    await logDataLossWarnings(safeAutoMigrate);

    // Assess risk
    const assessment = await assessDataLossRisk();

    // Auto-migrate if configured and at risk (using safe flag)
    if (safeAutoMigrate && assessment.atRisk && assessment.objectStorageConfigured) {
      console.log('\n🔄 AUTO-MIGRATION ENABLED - Starting file migration...\n');
      
      try {
        const migrationResult = await migrateAllFiles();
        
        if (migrationResult.failedFiles === 0) {
          console.log('\n✅ AUTO-MIGRATION COMPLETE - All files protected!\n');
        } else {
          console.log(`\n⚠️  AUTO-MIGRATION COMPLETED WITH ${migrationResult.failedFiles} ERRORS\n`);
        }
      } catch (error) {
        console.error('\n❌ AUTO-MIGRATION FAILED:', error);
        if (exitOnRisk) {
          console.error('\n🛑 EXITING - Fix migration issues before continuing\n');
          process.exit(1);
        }
      }
    }

    // Exit if critical risk and configured to do so
    if (exitOnRisk && assessment.atRisk && !assessment.objectStorageConfigured) {
      console.error('\n🛑 CRITICAL DATA LOSS RISK - Object Storage not configured!');
      console.error('🛑 Application startup blocked to prevent data loss.');
      console.error('🛑 Configure Object Storage and restart the application.\n');
      process.exit(1);
    }

    if (verboseLogging && !assessment.atRisk) {
      console.log('\n✅ All safeguards passed - User data is protected\n');
    }

  } catch (error) {
    console.error('\n⚠️  Safeguard check failed:', error);
    if (exitOnRisk) {
      process.exit(1);
    }
  }
}

/**
 * Quick check - returns true if data is safe, false otherwise
 */
export async function isDataSafe(): Promise<boolean> {
  try {
    const assessment = await assessDataLossRisk();
    return !assessment.atRisk;
  } catch (error) {
    console.error('Error checking data safety:', error);
    return false;
  }
}

/**
 * Get safeguard status for monitoring
 */
export async function getSafeguardStatus(): Promise<{
  safe: boolean;
  objectStorageConfigured: boolean;
  filesAtRisk: number;
  dbRecordsAtRisk: number;
  recommendations: string[];
}> {
  try {
    const assessment = await assessDataLossRisk();
    
    return {
      safe: !assessment.atRisk,
      objectStorageConfigured: assessment.objectStorageConfigured,
      filesAtRisk: assessment.ephemeralFileCount,
      dbRecordsAtRisk: assessment.affectedUsers + assessment.affectedPosts + 
                       assessment.affectedProducts + assessment.affectedEvents +
                       assessment.affectedMessages,
      recommendations: assessment.recommendations,
    };
  } catch (error) {
    console.error('Error getting safeguard status:', error);
    return {
      safe: false,
      objectStorageConfigured: false,
      filesAtRisk: 0,
      dbRecordsAtRisk: 0,
      recommendations: ['Error: Unable to assess data safety'],
    };
  }
}
