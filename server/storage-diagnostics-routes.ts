/**
 * Storage Diagnostics API Routes
 * 
 * Provides admin endpoints to diagnose and troubleshoot storage access issues
 * in both development and production environments.
 * 
 * CLEAN CODING: Diagnostic routes only - no data modification
 */

import { Request, Response } from 'express';
import { productionStorageAccess } from './production-storage-access';
import { storageEnvironmentValidator } from './storage-environment-validator';
import { requireRole } from './unified-auth';

/**
 * Get comprehensive storage diagnostics
 * Admin only endpoint
 */
export async function getStorageDiagnostics(req: Request, res: Response) {
  try {
    console.log('[STORAGE-DIAGNOSTICS] Running comprehensive diagnostics...');
    
    const [accessDiagnostics, envValidation] = await Promise.all([
      productionStorageAccess.runDiagnostics(),
      Promise.resolve(storageEnvironmentValidator.validateEnvironment())
    ]);
    
    const response = {
      timestamp: new Date().toISOString(),
      environment: accessDiagnostics.environment,
      status: {
        overall: envValidation.isValid && accessDiagnostics.config.hasAccess ? 'healthy' : 'unhealthy',
        environmentValid: envValidation.isValid,
        storageAccessible: accessDiagnostics.config.hasAccess,
        bucketExists: accessDiagnostics.bucketExists,
        canRead: accessDiagnostics.canRead,
        canWrite: accessDiagnostics.canWrite
      },
      environment_variables: {
        summary: envValidation.summary,
        variables: envValidation.variables,
        criticalIssues: envValidation.criticalIssues,
        warnings: envValidation.warnings
      },
      storage_access: {
        config: accessDiagnostics.config,
        sampleFilesAccessible: accessDiagnostics.sampleFilesAccessible,
        issues: accessDiagnostics.issues,
        recommendations: accessDiagnostics.recommendations
      }
    };
    
    console.log(`[STORAGE-DIAGNOSTICS] Status: ${response.status.overall}`);
    
    res.json(response);
  } catch (error) {
    console.error('[STORAGE-DIAGNOSTICS] Error running diagnostics:', error);
    res.status(500).json({
      error: 'Failed to run storage diagnostics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Validate environment variables
 * Admin only endpoint
 */
export function validateEnvironmentVariables(req: Request, res: Response) {
  try {
    const validation = storageEnvironmentValidator.validateEnvironment();
    
    res.json({
      isValid: validation.isValid,
      environment: validation.environment,
      summary: validation.summary,
      variables: validation.variables,
      criticalIssues: validation.criticalIssues,
      warnings: validation.warnings,
      setupInstructions: validation.isValid 
        ? null 
        : storageEnvironmentValidator.getSetupInstructions()
    });
  } catch (error) {
    console.error('[STORAGE-DIAGNOSTICS] Error validating environment:', error);
    res.status(500).json({
      error: 'Failed to validate environment variables',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Ensure production storage access
 * Admin only endpoint - attempts to fix common issues
 */
export async function ensureStorageAccess(req: Request, res: Response) {
  try {
    console.log('[STORAGE-DIAGNOSTICS] Ensuring storage access...');
    
    const result = await productionStorageAccess.ensureProductionAccess();
    
    res.json({
      success: result.success,
      message: result.message,
      actions: result.actions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[STORAGE-DIAGNOSTICS] Error ensuring storage access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ensure storage access',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get storage configuration
 * Admin only endpoint
 */
export function getStorageConfig(req: Request, res: Response) {
  try {
    const config = productionStorageAccess.getStorageConfig();
    
    res.json({
      bucketName: config.bucketName,
      publicPaths: config.publicPaths,
      privateDir: config.privateDir,
      isConfigured: config.isConfigured,
      hasAccess: config.hasAccess,
      errors: config.errors,
      environment: process.env.NODE_ENV || 'development',
      isProduction: process.env.REPL_DEPLOYMENT === 'true'
    });
  } catch (error) {
    console.error('[STORAGE-DIAGNOSTICS] Error getting storage config:', error);
    res.status(500).json({
      error: 'Failed to get storage configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Register storage diagnostics routes
 */
export function registerStorageDiagnosticsRoutes(app: any) {
  console.log('[STORAGE-DIAGNOSTICS] Registering diagnostic routes');
  
  // All routes require admin role - diagnostic endpoints only (no manual controls)
  app.get('/api/admin/storage/diagnostics', requireRole('admin'), getStorageDiagnostics);
  app.get('/api/admin/storage/environment', requireRole('admin'), validateEnvironmentVariables);
  app.get('/api/admin/storage/config', requireRole('admin'), getStorageConfig);
  
  console.log('[STORAGE-DIAGNOSTICS] ✓ Diagnostic routes registered (read-only monitoring)');
  console.log('[STORAGE-DIAGNOSTICS]   GET  /api/admin/storage/diagnostics');
  console.log('[STORAGE-DIAGNOSTICS]   GET  /api/admin/storage/environment');
  console.log('[STORAGE-DIAGNOSTICS]   GET  /api/admin/storage/config');
}
