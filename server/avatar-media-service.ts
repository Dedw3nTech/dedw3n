/**
 * Avatar Media Service
 * 
 * Production-ready avatar upload service with:
 * - Multi-size thumbnail generation (128x128, 256x256, 512x512)
 * - Sharded folder structure for scalability
 * - Object storage integration (R2/Cloudflare)
 * - Automatic backup and retry logic
 * - Graceful degradation if sharp unavailable
 */

import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { 
  getShardedPath, 
  getAvatarObjectPath, 
  getAvatarBackupPath,
  objectPathToPublicUrl,
  AVATAR_PATHS
} from './avatar-paths';

// Type-only import to avoid errors if sharp not installed
type Sharp = any;

interface AvatarVariant {
  size: number;
  url: string;
  width: number;
  height: number;
}

interface AvatarUploadResult {
  success: boolean;
  urls: {
    original: string;
    variants?: {
      thumbnail: string;  // 128x128
      small: string;      // 256x256
      medium: string;     // 512x512
    };
  } | null;
  backupUrl?: string | null;
  error?: string;
  degraded?: boolean; // True if thumbnails couldn't be generated
}

interface UploadOptions {
  createBackup?: boolean;
  generateThumbnails?: boolean;
  maxRetries?: number;
}

export class AvatarMediaService {
  private bucketName: string;
  private sharp: any = null;
  private sharpAvailable: boolean = false;
  private sharpLoadAttempted: boolean = false;

  // Metrics
  private metrics = {
    totalUploads: 0,
    successfulUploads: 0,
    thumbnailsGenerated: 0,
    degradedUploads: 0, // Uploads without thumbnails
  };

  constructor() {
    // Extract bucket name from environment
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    const firstPath = publicPaths.split(',')[0].trim();
    const bucketMatch = firstPath.match(/\/([^\/,]+)/);
    this.bucketName = bucketMatch ? bucketMatch[1].replace(/,+$/, '') : '';
  }


  /**
   * Lazy-load sharp with defensive error handling
   */
  private async loadSharp(): Promise<boolean> {
    if (this.sharpLoadAttempted) {
      return this.sharpAvailable;
    }

    this.sharpLoadAttempted = true;

    try {
      // Dynamic import to handle missing dependency gracefully
      // @ts-ignore - Sharp is optionally loaded at runtime
      this.sharp = (await import('sharp')).default;
      this.sharpAvailable = true;
      console.log('[AVATAR-SERVICE] ✓ Sharp library loaded successfully');
      return true;
    } catch (error) {
      console.warn('[AVATAR-SERVICE] ⚠️  Sharp library not available - thumbnails disabled');
      console.warn('[AVATAR-SERVICE] Uploads will continue with original images only');
      this.sharpAvailable = false;
      return false;
    }
  }

  /**
   * Get object key for avatar storage (relative path within bucket)
   * Note: uploadFile will prepend /public-objects/ prefix automatically
   */
  private getAvatarPath(userId: number, variant?: string, extension: string = 'webp'): string {
    return getAvatarObjectPath(userId, variant, extension, true);
  }

  /**
   * Detect image format from buffer magic bytes
   */
  private detectImageFormat(buffer: Buffer): { ext: string; mimeType: string } {
    // Check magic bytes to determine format
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return { ext: 'jpg', mimeType: 'image/jpeg' };
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return { ext: 'png', mimeType: 'image/png' };
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return { ext: 'webp', mimeType: 'image/webp' };
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return { ext: 'gif', mimeType: 'image/gif' };
    }
    // Default to JPEG
    return { ext: 'jpg', mimeType: 'image/jpeg' };
  }

  /**
   * Get object key for avatar backup (relative path within bucket)
   * Note: uploadFile will prepend /public-objects/ prefix automatically
   */
  private getBackupPath(userId: number, timestamp: number): string {
    return getAvatarBackupPath(userId, timestamp, true);
  }

  /**
   * Generate thumbnails using sharp
   */
  private async generateThumbnails(buffer: Buffer): Promise<{
    thumbnail: Buffer;  // 128x128
    small: Buffer;      // 256x256
    medium: Buffer;     // 512x512
  } | null> {
    if (!this.sharpAvailable) {
      return null;
    }

    try {
      // Use sharp pipeline for efficient processing
      const sharpInstance = this.sharp(buffer);

      const [thumbnail, small, medium] = await Promise.all([
        sharpInstance.clone().resize(128, 128, { fit: 'cover' }).webp({ quality: 85 }).toBuffer(),
        sharpInstance.clone().resize(256, 256, { fit: 'cover' }).webp({ quality: 85 }).toBuffer(),
        sharpInstance.clone().resize(512, 512, { fit: 'cover' }).webp({ quality: 90 }).toBuffer(),
      ]);

      return { thumbnail, small, medium };
    } catch (error) {
      console.error('[AVATAR-SERVICE] Thumbnail generation failed:', error);
      return null;
    }
  }

  /**
   * Upload a single file to object storage with retry
   */
  private async uploadFile(
    buffer: Buffer,
    path: string,
    contentType: string,
    maxRetries: number = 3
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const bucket = objectStorageClient.bucket(this.bucketName);
        const file = bucket.file(path);

        await file.save(buffer, {
          metadata: {
            contentType,
            cacheControl: 'public, max-age=31536000, immutable',
            metadata: {
              uploadedAt: new Date().toISOString(),
            }
          },
          resumable: true,
          timeout: 30000
        });

        const url = objectPathToPublicUrl(path);
        return { success: true, url };

      } catch (error: any) {
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error?.message || 'Upload failed after retries'
          };
        }

        // Exponential backoff
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: 'Upload failed' };
  }

  /**
   * Create backup of existing avatar
   */
  private async createBackup(userId: number, currentAvatarUrl: string | null): Promise<string | null> {
    if (!currentAvatarUrl || !currentAvatarUrl.startsWith('/public-objects/')) {
      return null;
    }

    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      const currentPath = currentAvatarUrl.replace('/public-objects/', '');
      
      const sourceFile = bucket.file(currentPath);
      const [exists] = await sourceFile.exists();
      
      if (!exists) {
        return null;
      }

      const timestamp = Date.now();
      const backupPath = this.getBackupPath(userId, timestamp);
      const destFile = bucket.file(backupPath);
      
      await sourceFile.copy(destFile);
      return objectPathToPublicUrl(backupPath);

    } catch (error) {
      console.error('[AVATAR-SERVICE] Backup creation failed:', error);
      return null;
    }
  }

  /**
   * Main upload method
   */
  async uploadAvatar(
    userId: number,
    imageBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<AvatarUploadResult> {
    const {
      createBackup = true,
      generateThumbnails = true,
      maxRetries = 3
    } = options;

    this.metrics.totalUploads++;

    try {
      // Step 1: Load sharp if thumbnails requested
      if (generateThumbnails) {
        await this.loadSharp();
      }

      // Step 2: Get current user
      const [currentUser] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!currentUser) {
        return {
          success: false,
          urls: null,
          error: 'User not found'
        };
      }

      // Step 3: Create backup if requested
      let backupUrl: string | null = null;
      if (createBackup && currentUser.avatar) {
        backupUrl = await this.createBackup(userId, currentUser.avatar);
      }

      // Step 4: Generate thumbnails if sharp available
      let thumbnails = null;
      if (generateThumbnails && this.sharpAvailable) {
        thumbnails = await this.generateThumbnails(imageBuffer);
      }

      // Step 5: Convert original to WebP if sharp available, otherwise detect format
      let processedBuffer = imageBuffer;
      let fileExtension = 'webp';
      let contentType = 'image/webp';

      if (this.sharpAvailable) {
        try {
          // Convert original to WebP for consistency
          processedBuffer = await this.sharp(imageBuffer)
            .webp({ quality: 90 })
            .toBuffer();
        } catch (error) {
          console.warn('[AVATAR-SERVICE] Failed to convert original to WebP, detecting original format');
          const format = this.detectImageFormat(imageBuffer);
          fileExtension = format.ext;
          contentType = format.mimeType;
        }
      } else {
        // Graceful degradation: use original format
        const format = this.detectImageFormat(imageBuffer);
        fileExtension = format.ext;
        contentType = format.mimeType;
        console.log(`[AVATAR-SERVICE] Sharp unavailable - using original format: ${contentType}`);
      }

      // Step 6: Upload processed original
      const originalPath = this.getAvatarPath(userId, undefined, fileExtension);
      const originalUpload = await this.uploadFile(processedBuffer, originalPath, contentType, maxRetries);

      if (!originalUpload.success || !originalUpload.url) {
        return {
          success: false,
          urls: null,
          error: originalUpload.error || 'Failed to upload avatar'
        };
      }

      // Step 7: Upload thumbnails if available (always WebP)
      let variantUrls = undefined;
      if (thumbnails) {
        const [thumbnailUpload, smallUpload, mediumUpload] = await Promise.all([
          this.uploadFile(thumbnails.thumbnail, this.getAvatarPath(userId, 'thumb', 'webp'), 'image/webp', maxRetries),
          this.uploadFile(thumbnails.small, this.getAvatarPath(userId, 'small', 'webp'), 'image/webp', maxRetries),
          this.uploadFile(thumbnails.medium, this.getAvatarPath(userId, 'medium', 'webp'), 'image/webp', maxRetries),
        ]);

        if (thumbnailUpload.success && smallUpload.success && mediumUpload.success) {
          variantUrls = {
            thumbnail: thumbnailUpload.url!,
            small: smallUpload.url!,
            medium: mediumUpload.url!,
          };
          this.metrics.thumbnailsGenerated++;
        }
      }

      // Step 8: Update database with original URL and timestamp for cache-busting
      await db.update(users)
        .set({ 
          avatar: originalUpload.url,
          avatarUpdatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Step 9: Delete old avatar files (async, non-blocking)
      if (currentUser.avatar && currentUser.avatar !== originalUpload.url) {
        this.deleteOldAvatar(currentUser.avatar).catch(() => {});
      }

      // Update metrics
      this.metrics.successfulUploads++;
      if (!variantUrls && generateThumbnails) {
        this.metrics.degradedUploads++;
      }

      return {
        success: true,
        urls: {
          original: originalUpload.url,
          variants: variantUrls
        },
        backupUrl,
        degraded: generateThumbnails && !variantUrls
      };

    } catch (error) {
      console.error('[AVATAR-SERVICE] Upload failed:', error);
      return {
        success: false,
        urls: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete old avatar and its variants
   */
  private async deleteOldAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl.startsWith('/public-objects/')) {
      return;
    }

    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      const basePath = avatarUrl.replace('/public-objects/', '');
      
      // Delete original and variants
      const paths = [
        basePath,
        basePath.replace('.webp', '-thumb.webp'),
        basePath.replace('.webp', '-small.webp'),
        basePath.replace('.webp', '-medium.webp'),
      ];

      await Promise.all(
        paths.map(async (path) => {
          try {
            const file = bucket.file(path);
            await file.delete();
          } catch {
            // Ignore errors for individual deletions
          }
        })
      );

    } catch (error) {
      console.error('[AVATAR-SERVICE] Cleanup failed:', error);
    }
  }

  /**
   * List all backups for a user (supports both sharded and legacy flat paths)
   */
  async listUserBackups(userId: number): Promise<string[]> {
    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      
      // Check both sharded and legacy backup locations
      const shard = getShardedPath(userId);
      const locations = [
        `public/backups/avatars/${shard}/`,  // New sharded location
        `public/backups/avatars/`,            // Legacy flat location
        `backups/avatars/`                     // Very old location
      ];

      const allBackups: string[] = [];

      for (const prefix of locations) {
        try {
          const [files] = await bucket.getFiles({
            prefix: prefix,
            delimiter: '/'
          });

          const userPattern = new RegExp(`user-${userId}[-_.]`);
          const backups = files
            .filter((file: any) => userPattern.test(file.name))
            .map((file: any) => `/public-objects/${file.name}`);

          allBackups.push(...backups);
        } catch (error) {
          // Location might not exist, continue
        }
      }

      // Remove duplicates and sort by most recent first
      return [...new Set(allBackups)].sort().reverse();

    } catch (error) {
      console.error('[AVATAR-SERVICE] Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore profile picture from backup (supports both formats)
   */
  async restoreFromBackup(userId: number, backupUrl: string): Promise<{
    success: boolean;
    url: string | null;
    error?: string;
  }> {
    try {
      console.log(`[AVATAR-SERVICE] Restoring backup for user ${userId}: ${backupUrl}`);

      if (!backupUrl.startsWith('/public-objects/')) {
        return {
          success: false,
          url: null,
          error: 'Invalid backup URL'
        };
      }

      const bucket = objectStorageClient.bucket(this.bucketName);
      const backupPath = backupUrl.replace('/public-objects/', '');
      const backupFile = bucket.file(backupPath);

      // Verify backup exists
      const [exists] = await backupFile.exists();
      if (!exists) {
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

      console.log(`[AVATAR-SERVICE] Backup restored successfully for user ${userId}`);

      return {
        success: true,
        url: backupUrl
      };

    } catch (error) {
      console.error('[AVATAR-SERVICE] Restore from backup failed:', error);
      return {
        success: false,
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get service health metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      sharpAvailable: this.sharpAvailable,
      degradationRate: this.metrics.totalUploads > 0
        ? this.metrics.degradedUploads / this.metrics.totalUploads
        : 0,
      storageAvailable: !!this.bucketName
    };
  }

  /**
   * Get comprehensive health metrics (compatible with old API)
   */
  getHealthMetrics() {
    return {
      totalUploads: this.metrics.totalUploads,
      successfulUploads: this.metrics.successfulUploads,
      failedUploads: this.metrics.totalUploads - this.metrics.successfulUploads,
      averageRetries: 0, // Not tracked in new service
      lastUploadTime: null, // Not tracked in new service
      storageAvailable: !!this.bucketName,
      sharpAvailable: this.sharpAvailable,
      thumbnailsGenerated: this.metrics.thumbnailsGenerated,
      degradedUploads: this.metrics.degradedUploads
    };
  }
}

// Singleton instance
export const avatarMediaService = new AvatarMediaService();
