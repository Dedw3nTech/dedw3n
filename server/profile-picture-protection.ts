/**
 * Profile Picture Protection Service
 * 
 * A robust, production-grade system to prevent profile picture loss with:
 * - Object Storage integration for persistence
 * - Automatic backup system
 * - Retry logic with exponential backoff
 * - Upload validation and verification
 * - Graceful fallback mechanisms
 * - Recovery utilities
 * - Health monitoring
 */

import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import {
  getAvatarObjectPath,
  getAvatarBackupPath,
  objectPathToPublicUrl,
  publicUrlToObjectPath,
  isObjectStorageUrl,
  AVATAR_PATHS
} from './avatar-paths';

interface UploadOptions {
  maxRetries?: number;
  retryDelay?: number;
  validateAfterUpload?: boolean;
  createBackup?: boolean;
}

interface UploadResult {
  success: boolean;
  url: string | null;
  backupUrl?: string | null;
  error?: string;
  retries?: number;
}

interface HealthMetrics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageRetries: number;
  lastUploadTime: Date | null;
  storageAvailable: boolean;
}

export class ProfilePictureProtectionService {
  private bucketName: string;
  private publicPath: string;
  private backupPath: string;
  private metrics: HealthMetrics;

  constructor() {
    // Get bucket from environment
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    // Split by comma and take the first path, then extract bucket name (exclude trailing commas)
    const firstPath = publicPaths.split(',')[0].trim();
    const bucketMatch = firstPath.match(/\/([^\/,]+)/);
    this.bucketName = bucketMatch ? bucketMatch[1].replace(/,+$/, '') : '';
    
    // Use centralized avatar paths from avatar-paths.ts (with public/ prefix)
    this.publicPath = AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR;
    this.backupPath = AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_BACKUPS_DIR;
    
    // Initialize metrics
    this.metrics = {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      averageRetries: 0,
      lastUploadTime: null,
      storageAvailable: true
    };
  }

  /**
   * Check if Object Storage is properly configured and accessible
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      if (!this.bucketName) {
        console.error('[PROFILE-PROTECTION] Bucket name not configured');
        this.metrics.storageAvailable = false;
        return false;
      }

      // Check if environment variables are properly configured
      const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
      const privateDir = process.env.PRIVATE_OBJECT_DIR;
      
      if (!publicPaths || !privateDir) {
        console.error('[PROFILE-PROTECTION] Object Storage environment variables not set');
        this.metrics.storageAvailable = false;
        return false;
      }

      // Perform lightweight availability test - try to create a test file reference
      // This will fail early if credentials or permissions are wrong
      const bucket = objectStorageClient.bucket(this.bucketName);
      const testPath = `${this.publicPath}/.health-check-${Date.now()}`;
      const testFile = bucket.file(testPath);
      
      // Try to check if the test file exists (lightweight operation)
      // This verifies we have read permissions at minimum
      await testFile.exists();
      
      // If we get here without error, storage is accessible - update metrics
      this.metrics.storageAvailable = true;
      return true;
    } catch (error) {
      console.error('[PROFILE-PROTECTION] Storage availability test failed:', error);
      this.metrics.storageAvailable = false;
      return false;
    }
  }

  /**
   * Generate a unique, secure filename for the profile picture
   */
  private generateSecureFilename(userId: number, extension: string = 'webp'): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `user-${userId}-${timestamp}-${randomBytes}.${extension}`;
  }

  /**
   * Extract file extension from base64 image data
   */
  private getImageExtension(base64Data: string): string {
    // Extract MIME type from data URL
    const match = base64Data.match(/^data:image\/([a-zA-Z0-9+\-]+);base64,/);
    if (match && match[1]) {
      const mimeSubtype = match[1].toLowerCase();
      
      // Handle complex MIME subtypes like svg+xml
      if (mimeSubtype === 'svg+xml' || mimeSubtype === 'svg') {
        return 'svg';
      }
      
      // Convert jpeg to jpg
      if (mimeSubtype === 'jpeg') {
        return 'jpg';
      }
      
      // Return the subtype as-is for other formats (png, gif, webp, etc.)
      return mimeSubtype;
    }
    
    return 'webp'; // Default to webp
  }

  /**
   * Get content type from file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp'
    };
    
    return contentTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Convert base64 to buffer
   */
  private base64ToBuffer(base64Data: string): Buffer {
    // Remove data URL prefix - supports all MIME subtypes including svg+xml
    const base64String = base64Data.replace(/^data:image\/[a-zA-Z0-9+\-]+;base64,/, '');
    return Buffer.from(base64String, 'base64');
  }

  /**
   * Extract file path from URL (handles both app URLs and legacy GCS URLs)
   */
  private extractFilePathFromUrl(url: string): string | null {
    // Use centralized helper
    const objectPath = publicUrlToObjectPath(url);
    if (objectPath) {
      return objectPath;
    }
    
    // Handle legacy GCS URLs: https://storage.googleapis.com/bucket/path
    if (url.includes('storage.googleapis.com')) {
      const urlParts = url.split(`${this.bucketName}/`);
      if (urlParts.length >= 2) {
        return urlParts[1];
      }
    }
    
    return null;
  }

  /**
   * Check if URL is an object storage URL (app or GCS)
   */
  private isObjectStorageUrl(url: string): boolean {
    return isObjectStorageUrl(url);
  }

  /**
   * Classify error to determine if it's retryable
   */
  private isRetryableError(error: any): boolean {
    const errorCode = error?.code;
    const statusCode = error?.response?.status || error?.statusCode;
    
    // Network errors that should be retried
    const retryableNetworkErrors = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'EPIPE'];
    if (retryableNetworkErrors.includes(errorCode)) {
      return true;
    }
    
    // HTTP status codes that should be retried (rate limits and server errors)
    if (statusCode === 429 || statusCode >= 500) {
      return true;
    }
    
    // Fatal client errors that should not be retried
    const fatalStatusCodes = [400, 401, 403, 404, 413, 415, 422];
    if (fatalStatusCodes.includes(statusCode)) {
      return false;
    }
    
    // Default: retry for unknown errors
    return true;
  }

  /**
   * Upload file to Object Storage with retry logic
   */
  private async uploadWithRetry(
    buffer: Buffer,
    filename: string,
    folder: string,
    extension: string,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<{ success: boolean; url?: string; retries: number; error?: string; errorCode?: string }> {
    let lastError: Error | null = null;
    let errorCode: string | undefined;
    let retries = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const bucket = objectStorageClient.bucket(this.bucketName);
        const filePath = `${folder}/${filename}`;
        const file = bucket.file(filePath);

        // Get correct content type based on file extension
        const contentType = this.getContentType(extension);

        // Upload with resumable uploads enabled for better reliability
        // Using resumable uploads allows recovery from network interruptions
        // Note: Not setting public:true due to bucket's public access prevention policy
        await file.save(buffer, {
          metadata: {
            contentType: contentType,
            cacheControl: 'public, max-age=31536000',
            metadata: {
              uploadedAt: new Date().toISOString(),
              protected: 'true',
              originalExtension: extension
            }
          },
          resumable: true,
          timeout: 30000
        });

        // Generate application URL (not direct GCS URL due to public access prevention)
        // Files are served through /public-objects route
        const appUrl = `/public-objects/${filePath}`;
        
        console.log(`[PROFILE-PROTECTION] Upload successful on attempt ${attempt + 1}: ${appUrl}`);
        return { success: true, url: appUrl, retries: attempt };

      } catch (error: any) {
        lastError = error as Error;
        retries = attempt;
        errorCode = error?.code || error?.response?.status?.toString() || 'UNKNOWN';
        
        // Enhanced error logging with structured details
        console.error(`[PROFILE-PROTECTION] Upload attempt ${attempt + 1} failed:`, {
          errorCode,
          message: error?.message,
          statusCode: error?.response?.status,
          details: error?.errors || error?.response?.data
        });

        // Check if error is retryable
        const shouldRetry = this.isRetryableError(error);
        
        if (!shouldRetry) {
          console.error(`[PROFILE-PROTECTION] Fatal error detected, not retrying: ${errorCode}`);
          return { 
            success: false, 
            retries: attempt, 
            error: error?.message || 'Upload failed',
            errorCode 
          };
        }

        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const jitter = Math.random() * 200;
          const delay = retryDelay * Math.pow(2, attempt) + jitter;
          console.log(`[PROFILE-PROTECTION] Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[PROFILE-PROTECTION] All upload attempts exhausted:`, {
      errorCode,
      message: lastError?.message,
      retries
    });
    
    return { 
      success: false, 
      retries,
      error: lastError?.message || 'Upload failed after retries',
      errorCode
    };
  }

  /**
   * Verify that uploaded file exists and is accessible
   * Uses GCS API instead of HTTP to avoid propagation delays
   */
  private async verifyUpload(url: string): Promise<boolean> {
    try {
      // Extract file path from URL (handles both app and GCS URLs)
      const filePath = this.extractFilePathFromUrl(url);
      if (!filePath) {
        console.error('[PROFILE-PROTECTION] Invalid URL format for verification');
        return false;
      }
      
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(filePath);
      
      // Use GCS API to check if file exists (more reliable than HTTP)
      const [exists] = await file.exists();
      
      if (!exists) {
        console.error('[PROFILE-PROTECTION] Upload verification failed: file does not exist');
      }
      
      return exists;
    } catch (error) {
      console.error('[PROFILE-PROTECTION] Upload verification failed:', error);
      return false;
    }
  }

  /**
   * Create backup of existing profile picture before replacement
   */
  private async createBackup(userId: number, currentAvatarUrl: string | null): Promise<string | null> {
    if (!currentAvatarUrl) return null;

    try {
      // Skip if current avatar is not in object storage
      if (!this.isObjectStorageUrl(currentAvatarUrl)) {
        console.log('[PROFILE-PROTECTION] Current avatar not in object storage, skipping backup');
        return null;
      }

      const bucket = objectStorageClient.bucket(this.bucketName);
      
      // Extract current file path
      const currentPath = this.extractFilePathFromUrl(currentAvatarUrl);
      if (!currentPath) {
        console.log('[PROFILE-PROTECTION] Could not extract file path from URL');
        return null;
      }
      
      // Verify source file exists before attempting copy
      const sourceFile = bucket.file(currentPath);
      const [exists] = await sourceFile.exists();
      
      if (!exists) {
        console.log('[PROFILE-PROTECTION] Source file does not exist, skipping backup');
        return null;
      }
      
      const filename = currentPath.split('/').pop() || '';
      
      // Create backup path with timestamp
      const timestamp = Date.now();
      const backupFilename = `backup-${timestamp}-${filename}`;
      const backupFilePath = `${this.backupPath}/${backupFilename}`;
      
      // Use copyTo method which is more reliable than copy
      const destFile = bucket.file(backupFilePath);
      await sourceFile.copy(destFile);

      // Return app URL for backup
      const backupUrl = objectPathToPublicUrl(backupFilePath);
      console.log(`[PROFILE-PROTECTION] Backup created successfully: ${backupUrl}`);
      
      return backupUrl;

    } catch (error) {
      console.error('[PROFILE-PROTECTION] Backup creation failed:', error);
      console.error('[PROFILE-PROTECTION] Error details:', {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack
      });
      // Non-critical error - don't fail the upload
      return null;
    }
  }

  /**
   * Delete old profile picture file (cleanup)
   */
  private async deleteOldFile(avatarUrl: string): Promise<void> {
    try {
      if (!this.isObjectStorageUrl(avatarUrl)) {
        return; // Only delete object storage files
      }

      const bucket = objectStorageClient.bucket(this.bucketName);
      const filePath = this.extractFilePathFromUrl(avatarUrl);
      
      if (!filePath) return;
      
      const file = bucket.file(filePath);
      
      await file.delete();
      console.log(`[PROFILE-PROTECTION] Old file deleted: ${filePath}`);

    } catch (error) {
      console.error('[PROFILE-PROTECTION] Failed to delete old file:', error);
      // Non-critical error - continue
    }
  }

  /**
   * Main upload method with comprehensive protection
   */
  async uploadProfilePicture(
    userId: number,
    imageData: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      validateAfterUpload = true,
      createBackup = true
    } = options;

    this.metrics.totalUploads++;

    try {
      // Step 1: Check storage availability
      const storageAvailable = await this.isStorageAvailable();
      if (!storageAvailable) {
        throw new Error('Object Storage is not available');
      }

      // Step 2: Get current user data
      const [currentUser] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Step 3: Create backup of existing profile picture
      let backupUrl: string | null = null;
      if (createBackup && currentUser.avatar) {
        backupUrl = await this.createBackup(userId, currentUser.avatar);
      }

      // Step 4: Process image data
      const extension = this.getImageExtension(imageData);
      const buffer = this.base64ToBuffer(imageData);
      const filename = this.generateSecureFilename(userId, extension);

      // Step 5: Upload with retry logic
      const uploadResult = await this.uploadWithRetry(
        buffer,
        filename,
        this.publicPath,
        extension,
        maxRetries,
        retryDelay
      );

      if (!uploadResult.success || !uploadResult.url) {
        this.metrics.failedUploads++;
        
        // Use detailed error information from upload result
        const errorMessage = uploadResult.error || 'Failed to upload after retries';
        const errorDetails = uploadResult.errorCode 
          ? `Error code: ${uploadResult.errorCode}` 
          : 'The upload service encountered an error. Please try again.';
        
        return {
          success: false,
          url: null,
          error: `${errorMessage} (${errorDetails})`,
          retries: uploadResult.retries
        };
      }

      // Step 6: Verify upload if enabled
      if (validateAfterUpload) {
        const isValid = await this.verifyUpload(uploadResult.url);
        if (!isValid) {
          this.metrics.failedUploads++;
          return {
            success: false,
            url: null,
            error: 'Upload verification failed',
            retries: uploadResult.retries
          };
        }
      }

      // Step 7: Update database
      await db.update(users)
        .set({ avatar: uploadResult.url })
        .where(eq(users.id, userId));

      // Step 8: Cleanup old file (after successful DB update)
      if (currentUser.avatar && currentUser.avatar !== uploadResult.url) {
        // Delete old file asynchronously - don't wait for it
        this.deleteOldFile(currentUser.avatar).catch(err => 
          console.log('[PROFILE-PROTECTION] Cleanup error (non-critical):', err)
        );
      }

      // Update metrics
      this.metrics.successfulUploads++;
      this.metrics.lastUploadTime = new Date();
      this.metrics.averageRetries = 
        (this.metrics.averageRetries * (this.metrics.successfulUploads - 1) + uploadResult.retries) 
        / this.metrics.successfulUploads;

      console.log(`[PROFILE-PROTECTION] Profile picture uploaded successfully for user ${userId}`);

      return {
        success: true,
        url: uploadResult.url,
        backupUrl,
        retries: uploadResult.retries
      };

    } catch (error) {
      this.metrics.failedUploads++;
      console.error('[PROFILE-PROTECTION] Upload failed:', error);
      
      return {
        success: false,
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Restore profile picture from backup
   */
  async restoreFromBackup(userId: number, backupUrl: string): Promise<UploadResult> {
    try {
      console.log(`[PROFILE-PROTECTION] Restoring backup for user ${userId}: ${backupUrl}`);

      // Verify backup exists
      const backupExists = await this.verifyUpload(backupUrl);
      if (!backupExists) {
        return {
          success: false,
          url: null,
          error: 'Backup file not found or inaccessible'
        };
      }

      // Update database with backup URL
      await db.update(users)
        .set({ avatar: backupUrl })
        .where(eq(users.id, userId));

      console.log(`[PROFILE-PROTECTION] Backup restored successfully for user ${userId}`);

      return {
        success: true,
        url: backupUrl
      };

    } catch (error) {
      console.error('[PROFILE-PROTECTION] Restore from backup failed:', error);
      return {
        success: false,
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all backups for a user
   */
  async listUserBackups(userId: number): Promise<string[]> {
    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix: `${this.backupPath}/backup-`,
        delimiter: '/'
      });

      const userPattern = new RegExp(`user-${userId}-`);
      const backups = files
        .filter((file: { name: string }) => userPattern.test(file.name))
        .map((file: { name: string }) => `/public-objects/${file.name}`);

      return backups.sort().reverse(); // Most recent first

    } catch (error) {
      console.error('[PROFILE-PROTECTION] Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset health metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      averageRetries: 0,
      lastUploadTime: null,
      storageAvailable: true
    };
  }
}

// Singleton instance
export const profilePictureProtection = new ProfilePictureProtectionService();
