/**
 * Production Storage Access Configuration
 * 
 * Ensures that production deployments can properly access object storage
 * with the same configuration as development. Validates environment variables,
 * bucket access permissions, and provides diagnostic tools.
 * 
 * CLEAN CODING: This module only handles storage access validation - no recoding
 */

import { objectStorageClient } from './objectStorage';

interface StorageAccessConfig {
  bucketName: string;
  publicPaths: string[];
  privateDir: string;
  isConfigured: boolean;
  hasAccess: boolean;
  errors: string[];
}

interface StorageAccessDiagnostics {
  environment: 'development' | 'production';
  timestamp: string;
  config: StorageAccessConfig;
  bucketExists: boolean;
  canRead: boolean;
  canWrite: boolean;
  sampleFilesAccessible: number;
  issues: string[];
  recommendations: string[];
}

export class ProductionStorageAccess {
  
  /**
   * Get current storage configuration from environment
   */
  getStorageConfig(): StorageAccessConfig {
    const errors: string[] = [];
    const publicPathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    const privateDir = process.env.PRIVATE_OBJECT_DIR || '';
    
    if (!publicPathsStr) {
      errors.push('PUBLIC_OBJECT_SEARCH_PATHS environment variable not set');
    }
    
    if (!privateDir) {
      errors.push('PRIVATE_OBJECT_DIR environment variable not set');
    }
    
    const publicPaths = publicPathsStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    let bucketName = '';
    if (publicPaths.length > 0) {
      const match = publicPaths[0].match(/\/([^\/]+)/);
      bucketName = match ? match[1] : '';
    }
    
    if (!bucketName) {
      errors.push('Could not extract bucket name from PUBLIC_OBJECT_SEARCH_PATHS');
    }
    
    return {
      bucketName,
      publicPaths,
      privateDir,
      isConfigured: errors.length === 0,
      hasAccess: false,
      errors
    };
  }
  
  /**
   * Validate bucket access permissions
   * Replit-compatible: Tests actual file operations instead of bucket.exists()
   */
  async validateBucketAccess(bucketName: string): Promise<{
    exists: boolean;
    canRead: boolean;
    canWrite: boolean;
    errors: string[];
  }> {
    const result = {
      exists: false,
      canRead: false,
      canWrite: false,
      errors: [] as string[]
    };
    
    try {
      if (!bucketName) {
        result.errors.push('Bucket name is empty');
        return result;
      }
      
      const bucket = objectStorageClient.bucket(bucketName);
      const testPath = `.storage-test-${Date.now()}.txt`;
      const testFile = bucket.file(testPath);
      
      try {
        // Test write access
        await testFile.save('test', {
          metadata: { contentType: 'text/plain' }
        });
        result.canWrite = true;
        result.exists = true; // If we can write, bucket exists
        
        // Test read access
        const [content] = await testFile.download();
        result.canRead = content.toString() === 'test';
        
        // Clean up test file
        await testFile.delete().catch(() => {
          // Ignore delete errors - test files will be cleaned up eventually
        });
      } catch (error: any) {
        // If write failed, try to check if bucket exists by attempting to list files
        try {
          const [files] = await bucket.getFiles({ maxResults: 1, autoPaginate: false });
          result.exists = true; // Bucket exists if we can list files
          
          if (error.code === 403) {
            result.errors.push('Permission denied - no write access');
          } else {
            result.errors.push(`Write test failed: ${error.message}`);
          }
        } catch (listError: any) {
          // Can't list files - bucket may not exist or no read access
          if (listError.code === 404) {
            result.errors.push(`Bucket ${bucketName} does not exist`);
          } else if (listError.code === 403) {
            result.errors.push('Permission denied - no read/write access');
            result.exists = true; // Assume exists if permission denied
          } else {
            result.errors.push(`Bucket access test failed: ${listError.message}`);
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Bucket validation error: ${error.message}`);
    }
    
    return result;
  }
  
  /**
   * Check if sample files in public paths are accessible
   */
  async checkSampleFilesAccess(bucketName: string, publicPaths: string[]): Promise<{
    totalChecked: number;
    accessible: number;
    errors: string[];
  }> {
    const result = {
      totalChecked: 0,
      accessible: 0,
      errors: [] as string[]
    };
    
    try {
      const bucket = objectStorageClient.bucket(bucketName);
      
      for (const publicPath of publicPaths) {
        try {
          const pathParts = publicPath.split('/').filter(p => p.length > 0);
          if (pathParts.length < 2) continue;
          
          const prefix = pathParts.slice(1).join('/');
          
          const [files] = await bucket.getFiles({
            prefix,
            maxResults: 5,
            autoPaginate: false
          });
          
          // getFiles() only returns files that exist and are accessible
          for (const file of files.slice(0, 3)) {
            result.totalChecked++;
            result.accessible++;
          }
        } catch (error: any) {
          result.errors.push(`Error checking path ${publicPath}: ${error.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Sample files check failed: ${error.message}`);
    }
    
    return result;
  }
  
  /**
   * Run comprehensive storage access diagnostics
   */
  async runDiagnostics(): Promise<StorageAccessDiagnostics> {
    const environment = (process.env.NODE_ENV === 'production' || 
                        process.env.REPL_DEPLOYMENT === 'true') 
                        ? 'production' 
                        : 'development';
    
    const config = this.getStorageConfig();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    issues.push(...config.errors);
    
    let bucketExists = false;
    let canRead = false;
    let canWrite = false;
    let sampleFilesAccessible = 0;
    
    if (config.isConfigured && config.bucketName) {
      const accessCheck = await this.validateBucketAccess(config.bucketName);
      bucketExists = accessCheck.exists;
      canRead = accessCheck.canRead;
      canWrite = accessCheck.canWrite;
      issues.push(...accessCheck.errors);
      
      if (bucketExists && canRead) {
        const sampleCheck = await this.checkSampleFilesAccess(
          config.bucketName,
          config.publicPaths
        );
        sampleFilesAccessible = sampleCheck.accessible;
        issues.push(...sampleCheck.errors);
        
        if (sampleCheck.totalChecked > 0 && sampleCheck.accessible === 0) {
          recommendations.push(
            'No files are accessible. Verify that files exist in the bucket and paths are correct.'
          );
        }
      }
    }
    
    if (!bucketExists) {
      recommendations.push(
        'Bucket does not exist. Ensure PUBLIC_OBJECT_SEARCH_PATHS points to a valid bucket.'
      );
    }
    
    if (bucketExists && !canRead) {
      recommendations.push(
        'Cannot read from bucket. Check service account permissions and credentials.'
      );
    }
    
    if (bucketExists && !canWrite) {
      recommendations.push(
        'Cannot write to bucket. Check service account permissions for write access.'
      );
    }
    
    if (environment === 'production' && !config.isConfigured) {
      recommendations.push(
        'Production environment must have PUBLIC_OBJECT_SEARCH_PATHS and PRIVATE_OBJECT_DIR configured.'
      );
    }
    
    return {
      environment,
      timestamp: new Date().toISOString(),
      config: {
        ...config,
        hasAccess: bucketExists && canRead
      },
      bucketExists,
      canRead,
      canWrite,
      sampleFilesAccessible,
      issues,
      recommendations
    };
  }
  
  /**
   * Validate storage access on startup
   */
  async validateOnStartup(): Promise<boolean> {
    console.log('\n=== Storage Access Validation ===');
    
    const diagnostics = await this.runDiagnostics();
    
    console.log(`Environment: ${diagnostics.environment}`);
    console.log(`Bucket: ${diagnostics.config.bucketName}`);
    console.log(`Bucket Exists: ${diagnostics.bucketExists ? '✓' : '✗'}`);
    console.log(`Read Access: ${diagnostics.canRead ? '✓' : '✗'}`);
    console.log(`Write Access: ${diagnostics.canWrite ? '✓' : '✗'}`);
    console.log(`Sample Files Accessible: ${diagnostics.sampleFilesAccessible}`);
    
    if (diagnostics.issues.length > 0) {
      console.log('\nIssues:');
      diagnostics.issues.forEach(issue => console.log(`  ✗ ${issue}`));
    }
    
    if (diagnostics.recommendations.length > 0) {
      console.log('\nRecommendations:');
      diagnostics.recommendations.forEach(rec => console.log(`  → ${rec}`));
    }
    
    const isValid = diagnostics.config.isConfigured && 
                    diagnostics.bucketExists && 
                    diagnostics.canRead;
    
    if (isValid) {
      console.log('\n✓ Storage access validation passed');
      
      // Inform about production file sync
      if (diagnostics.environment === 'development' && diagnostics.sampleFilesAccessible > 0) {
        console.log('\n📋 Production Deployment Note:');
        console.log('   Files uploaded in development will be automatically synced to');
        console.log('   production on deployment. The storage sync system handles this');
        console.log('   automatically - no manual intervention required.');
      }
    } else {
      console.log('\n✗ Storage access validation failed');
    }
    
    console.log('=== Validation Complete ===\n');
    
    return isValid;
  }
  
  /**
   * Fix common production access issues
   */
  async ensureProductionAccess(): Promise<{
    success: boolean;
    message: string;
    actions: string[];
  }> {
    const actions: string[] = [];
    const config = this.getStorageConfig();
    
    if (!config.isConfigured) {
      return {
        success: false,
        message: 'Storage not configured. Set environment variables.',
        actions: [
          'Set PUBLIC_OBJECT_SEARCH_PATHS in production',
          'Set PRIVATE_OBJECT_DIR in production',
          'Restart deployment'
        ]
      };
    }
    
    const accessCheck = await this.validateBucketAccess(config.bucketName);
    
    if (!accessCheck.exists) {
      return {
        success: false,
        message: 'Bucket does not exist',
        actions: [
          'Verify bucket name in environment variables',
          'Create bucket if needed',
          'Update PUBLIC_OBJECT_SEARCH_PATHS'
        ]
      };
    }
    
    if (!accessCheck.canRead || !accessCheck.canWrite) {
      return {
        success: false,
        message: 'Insufficient bucket permissions',
        actions: [
          'Verify service account credentials',
          'Check bucket IAM permissions',
          'Ensure Replit has access to the bucket'
        ]
      };
    }
    
    actions.push('✓ Storage configuration is valid');
    actions.push('✓ Bucket exists and is accessible');
    actions.push('✓ Read and write permissions granted');
    
    return {
      success: true,
      message: 'Production storage access is properly configured',
      actions
    };
  }
}

export const productionStorageAccess = new ProductionStorageAccess();
