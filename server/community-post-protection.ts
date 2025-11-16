/**
 * Community Post Media Protection Service
 * 
 * Provides robust protection for community post images and videos using Object Storage.
 * Prevents data loss through persistent storage, automatic backups, retry logic, and validation.
 * 
 * Features:
 * - Object Storage integration (persistent, survives deployments)
 * - Automatic backups before media replacement/deletion
 * - Retry logic with exponential backoff (3 attempts)
 * - Upload validation and verification
 * - Support for images (PNG, JPEG, GIF, WebP, SVG, BMP) and videos (MP4, WebM, MOV, AVI, WMV)
 * - Health monitoring and metrics tracking
 * - Admin recovery utilities
 */

import { objectStorageClient } from './objectStorage';
import * as crypto from 'crypto';

interface UploadResult {
  url: string;
  filename: string;
  publicUrl: string;
  timestamp: number;
}

interface BackupInfo {
  filename: string;
  timestamp: number;
  url: string;
}

interface HealthMetrics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  totalBackups: number;
  storageAvailable: boolean;
  lastUploadTimestamp: number | null;
}

export class CommunityPostProtectionService {
  private bucketName: string;
  private publicPath: string;
  private backupPath: string;
  private metrics: HealthMetrics;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor() {
    // Extract bucket name from PUBLIC_OBJECT_SEARCH_PATHS environment variable
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    // Split by comma and take the first path, then extract bucket name (exclude trailing commas)
    const firstPath = publicPaths.split(',')[0].trim();
    const bucketMatch = firstPath.match(/\/([^\/,]+)/);
    this.bucketName = bucketMatch ? bucketMatch[1].replace(/,+$/, '') : '';
    
    // PUBLIC_OBJECT_SEARCH_PATHS already includes /public, so don't duplicate it
    this.publicPath = 'community-posts';
    this.backupPath = '.private/community-post-backups';
    
    this.metrics = {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      totalBackups: 0,
      storageAvailable: true,
      lastUploadTimestamp: null
    };
  }

  /**
   * Check if Object Storage is properly configured and accessible
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      if (!this.bucketName) {
        console.error('[POST-PROTECTION] Bucket name not configured');
        this.metrics.storageAvailable = false;
        return false;
      }

      // Check if environment variables are properly configured
      const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
      const privateDir = process.env.PRIVATE_OBJECT_DIR;
      
      if (!publicPaths || !privateDir) {
        console.error('[POST-PROTECTION] Object Storage environment variables not set');
        this.metrics.storageAvailable = false;
        return false;
      }

      // Perform lightweight availability test
      const bucket = objectStorageClient.bucket(this.bucketName);
      const testPath = `${this.publicPath}/.health-check-${Date.now()}`;
      const testFile = bucket.file(testPath);
      
      // Try to check if the test file exists (lightweight operation)
      await testFile.exists();
      
      // If we get here without error, storage is accessible - update metrics
      this.metrics.storageAvailable = true;
      return true;
    } catch (error) {
      console.error('[POST-PROTECTION] Storage availability test failed:', error);
      this.metrics.storageAvailable = false;
      return false;
    }
  }

  /**
   * Generate a unique, secure filename for the media file
   */
  private generateFilename(postId: number, mediaType: 'image' | 'video', extension: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `post-${postId}-${mediaType}-${timestamp}-${randomBytes}.${extension}`;
  }

  /**
   * Extract file extension and media type from base64 data
   */
  private getMediaInfo(base64Data: string): { extension: string; mediaType: 'image' | 'video'; mimeType: string } {
    // Extract MIME type from data URL
    const match = base64Data.match(/^data:(image|video)\/([a-zA-Z0-9+\-]+);base64,/);
    
    if (!match || match.length < 3) {
      throw new Error('Invalid media data format');
    }
    
    const mediaType = match[1] as 'image' | 'video';
    const mimeSubtype = match[2].toLowerCase();
    
    let extension = mimeSubtype;
    
    // Handle complex MIME subtypes and mappings
    if (mediaType === 'image') {
      if (mimeSubtype === 'svg+xml' || mimeSubtype === 'svg') {
        extension = 'svg';
      } else if (mimeSubtype === 'jpeg') {
        extension = 'jpg';
      }
    } else if (mediaType === 'video') {
      if (mimeSubtype === 'quicktime') {
        extension = 'mov';
      } else if (mimeSubtype === 'x-msvideo') {
        extension = 'avi';
      } else if (mimeSubtype === 'x-ms-wmv') {
        extension = 'wmv';
      }
    }
    
    const mimeType = `${mediaType}/${mimeSubtype}`;
    
    return { extension, mediaType, mimeType };
  }

  /**
   * Get content type from file extension and media type
   */
  private getContentType(extension: string, mediaType: 'image' | 'video'): string {
    if (mediaType === 'image') {
      const imageTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp'
      };
      return imageTypes[extension.toLowerCase()] || 'image/jpeg';
    } else {
      const videoTypes: { [key: string]: string } = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'wmv': 'video/x-ms-wmv'
      };
      return videoTypes[extension.toLowerCase()] || 'video/mp4';
    }
  }

  /**
   * Convert base64 to buffer
   */
  private base64ToBuffer(base64Data: string): Buffer {
    // Remove data URL prefix - supports all MIME subtypes including svg+xml, quicktime, etc.
    const base64String = base64Data.replace(/^data:(image|video)\/[a-zA-Z0-9+\-]+;base64,/, '');
    return Buffer.from(base64String, 'base64');
  }

  /**
   * Upload file to Object Storage with retry logic
   */
  private async uploadWithRetry(
    buffer: Buffer,
    filename: string,
    extension: string,
    mediaType: 'image' | 'video',
    attempt: number = 0
  ): Promise<string> {
    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      const filePath = `${this.publicPath}/${filename}`;
      const file = bucket.file(filePath);
      
      // Determine content type based on extension and media type
      const contentType = this.getContentType(extension, mediaType);
      
      console.log(`[POST-PROTECTION] Uploading ${mediaType} to Object Storage: ${filePath} (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
      
      // Upload the buffer to Object Storage
      await file.save(buffer, {
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000' // Cache for 1 year
        }
      });
      
      console.log(`[POST-PROTECTION] Successfully uploaded ${mediaType} to Object Storage`);
      
      // Return application URL that will be served through /public-objects route
      // Files are served through this route instead of direct GCS URLs (public access is disabled)
      return `/public-objects/${filePath}`;
    } catch (error) {
      console.error(`[POST-PROTECTION] Upload attempt ${attempt + 1} failed:`, error);
      
      if (attempt < this.MAX_RETRIES - 1) {
        // Calculate exponential backoff delay
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[POST-PROTECTION] Retrying in ${delay}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the upload
        return this.uploadWithRetry(buffer, filename, extension, mediaType, attempt + 1);
      } else {
        throw new Error(`Failed to upload ${mediaType} after ${this.MAX_RETRIES} attempts: ${error}`);
      }
    }
  }

  /**
   * Validate that the uploaded file is accessible
   */
  private async validateUpload(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('[POST-PROTECTION] Upload validation failed:', error);
      return false;
    }
  }

  /**
   * Create a backup of existing media before replacement
   */
  async createBackup(postId: number, existingUrl: string): Promise<BackupInfo | null> {
    try {
      // Accept both /public-objects/ URLs and legacy GCS URLs
      const isObjectStorageUrl = existingUrl.startsWith('/public-objects/') || existingUrl.startsWith('https://storage.googleapis.com/');
      if (!existingUrl || !isObjectStorageUrl) {
        console.log('[POST-PROTECTION] Skipping backup - not an Object Storage URL');
        return null;
      }

      // Extract the file path from the existing URL
      const urlParts = existingUrl.split('/');
      const originalFilename = urlParts[urlParts.length - 1];
      
      // Create backup filename
      const timestamp = Date.now();
      const backupFilename = `post-${postId}-backup-${timestamp}-${originalFilename}`;
      const backupFilePath = `${this.backupPath}/${backupFilename}`;
      
      const bucket = objectStorageClient.bucket(this.bucketName);
      const sourceFile = bucket.file(`${this.publicPath}/${originalFilename}`);
      const backupFile = bucket.file(backupFilePath);
      
      console.log(`[POST-PROTECTION] Creating backup: ${backupFilePath}`);
      
      // Copy the file to backup location
      await sourceFile.copy(backupFile);
      
      this.metrics.totalBackups++;
      
      console.log('[POST-PROTECTION] Backup created successfully');
      
      return {
        filename: backupFilename,
        timestamp,
        url: `/private-objects/${backupFilePath}`
      };
    } catch (error) {
      console.error('[POST-PROTECTION] Backup creation failed:', error);
      // Don't fail the upload if backup fails
      return null;
    }
  }

  /**
   * Upload media (image or video) to Object Storage
   */
  async uploadMedia(postId: number, base64Data: string): Promise<UploadResult> {
    this.metrics.totalUploads++;
    
    try {
      // Check if storage is available
      const available = await this.isStorageAvailable();
      if (!available) {
        throw new Error('Object Storage is not available');
      }

      // Extract media info from base64 data
      const { extension, mediaType, mimeType } = this.getMediaInfo(base64Data);
      
      // Convert base64 to buffer
      const buffer = this.base64ToBuffer(base64Data);
      
      // Validate buffer size
      if (buffer.length === 0) {
        throw new Error('Invalid media data - empty buffer');
      }
      
      console.log(`[POST-PROTECTION] Processing ${mediaType} upload (${buffer.length} bytes, type: ${mimeType})`);
      
      // Generate unique filename
      const filename = this.generateFilename(postId, mediaType, extension);
      
      // Upload with retry logic
      const url = await this.uploadWithRetry(buffer, filename, extension, mediaType);
      
      // Validate the upload
      const isValid = await this.validateUpload(url);
      if (!isValid) {
        throw new Error('Upload validation failed - file is not accessible');
      }
      
      this.metrics.successfulUploads++;
      this.metrics.lastUploadTimestamp = Date.now();
      
      console.log(`[POST-PROTECTION] Media upload completed successfully: ${url}`);
      
      return {
        url,
        filename,
        publicUrl: url,
        timestamp: Date.now()
      };
    } catch (error) {
      this.metrics.failedUploads++;
      console.error('[POST-PROTECTION] Media upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete media from Object Storage
   */
  async deleteMedia(mediaUrl: string, createBackup: boolean = true): Promise<boolean> {
    try {
      // Accept both /public-objects/ URLs and legacy GCS URLs
      const isObjectStorageUrl = mediaUrl.startsWith('/public-objects/') || mediaUrl.startsWith('https://storage.googleapis.com/');
      if (!mediaUrl || !isObjectStorageUrl) {
        console.log('[POST-PROTECTION] Skipping deletion - not an Object Storage URL');
        return false;
      }

      // Create backup before deletion if requested
      if (createBackup) {
        const postId = this.extractPostIdFromUrl(mediaUrl);
        if (postId) {
          await this.createBackup(postId, mediaUrl);
        }
      }

      // Extract the file path from the URL
      const urlParts = mediaUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const filePath = `${this.publicPath}/${filename}`;
      
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(filePath);
      
      console.log(`[POST-PROTECTION] Deleting media: ${filePath}`);
      
      await file.delete();
      
      console.log('[POST-PROTECTION] Media deleted successfully');
      
      return true;
    } catch (error) {
      console.error('[POST-PROTECTION] Media deletion failed:', error);
      return false;
    }
  }

  /**
   * Extract post ID from media URL
   */
  private extractPostIdFromUrl(url: string): number | null {
    const match = url.match(/post-(\d+)-/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * List all backups for a specific post
   */
  async listBackups(postId: number): Promise<BackupInfo[]> {
    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix: `${this.backupPath}/post-${postId}-backup-`
      });
      
      return files.map(file => {
        const filename = file.name.split('/').pop() || '';
        const timestampMatch = filename.match(/backup-(\d+)-/);
        const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;
        
        return {
          filename,
          timestamp,
          url: `/private-objects/${file.name}`
        };
      }).sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    } catch (error) {
      console.error('[POST-PROTECTION] Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore media from a backup
   */
  async restoreFromBackup(postId: number, backupFilename: string): Promise<string | null> {
    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      const backupPath = `${this.backupPath}/${backupFilename}`;
      const backupFile = bucket.file(backupPath);
      
      // Extract original filename from backup filename
      const originalFilename = backupFilename.replace(/post-\d+-backup-\d+-/, '');
      const restorePath = `${this.publicPath}/${originalFilename}`;
      const restoreFile = bucket.file(restorePath);
      
      console.log(`[POST-PROTECTION] Restoring from backup: ${backupFilename}`);
      
      // Copy backup to public location
      await backupFile.copy(restoreFile);
      
      const restoredUrl = `/public-objects/${restorePath}`;
      
      console.log(`[POST-PROTECTION] Media restored successfully: ${restoredUrl}`);
      
      return restoredUrl;
    } catch (error) {
      console.error('[POST-PROTECTION] Restore from backup failed:', error);
      return null;
    }
  }

  /**
   * Get health metrics for monitoring
   */
  getHealthMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Print health status to console
   */
  async printHealthStatus(): Promise<void> {
    const isAvailable = await this.isStorageAvailable();
    const metrics = this.getHealthMetrics();
    
    console.log('\n=== COMMUNITY POST MEDIA PROTECTION STATUS ===');
    console.log(`Object Storage Available: ${isAvailable ? '✓ YES' : '✗ NO'}`);
    console.log(`Storage Status: ${metrics.storageAvailable ? 'HEALTHY' : 'UNAVAILABLE'}`);
    
    if (isAvailable) {
      console.log('✅ Community Post Media Protection is ACTIVE');
      console.log('   - Images/Videos use Object Storage (persistent)');
      console.log('   - Automatic backups enabled');
      console.log('   - Retry logic with exponential backoff');
      console.log('   - Upload validation active');
      console.log(`   - Total uploads: ${metrics.totalUploads}`);
      console.log(`   - Successful: ${metrics.successfulUploads}`);
      console.log(`   - Failed: ${metrics.failedUploads}`);
      console.log(`   - Total backups: ${metrics.totalBackups}`);
    } else {
      console.log('⚠️  Community Post Media Protection is UNAVAILABLE');
      console.log('   - Object Storage not configured');
      console.log('   - Media uploads will fail');
    }
    
    console.log('=== END PROTECTION STATUS ===\n');
  }
}

// Export singleton instance
export const communityPostProtection = new CommunityPostProtectionService();
