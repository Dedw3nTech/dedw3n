import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { objectStorageClient } from './objectStorage';
import { Readable } from 'stream';
import { AvatarMediaService } from './avatar-media-service';

/**
 * Secure upload proxy with TRUE server-side size enforcement
 * 
 * This approach validates Content-Length header at the server before
 * streaming to storage, providing guaranteed size limits that cannot
 * be bypassed by malicious clients.
 * 
 * SECURITY MODEL:
 * - Requires authentication
 * - Validates Content-Length header (server-enforced)
 * - Validates MIME type
 * - Streams data without storing on disk (memory efficient)
 * - Aborts upload if stream exceeds declared Content-Length
 * 
 * PERFORMANCE:
 * Slightly slower than direct presigned uploads (~100-200ms overhead)
 * but still much faster than base64 uploads.
 */

interface UploadMetadata {
  fileName: string;
  fileType: string;
  imageType: 'product' | 'profile' | 'post';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB hard limit

/**
 * Parse object path into bucket name and object name
 */
function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
  if (!fullPath.startsWith('/')) {
    throw new Error('Object path must start with /');
  }

  const parts = fullPath.slice(1).split('/');
  if (parts.length < 2) {
    throw new Error('Invalid object path format');
  }

  const bucketName = parts[0];
  const objectName = parts.slice(1).join('/');

  return { bucketName, objectName };
}

/**
 * Secure upload endpoint with server-side size enforcement
 */
export async function secureUploadProxy(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Require authentication
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Extract metadata from headers
    const fileName = req.headers['x-file-name'] as string;
    const fileType = req.headers['x-file-type'] as string;
    const imageType = (req.headers['x-image-type'] as string) || 'product';
    const contentLength = req.headers['content-length'];

    if (!fileName || !fileType) {
      res.status(400).json({
        success: false,
        message: 'x-file-name and x-file-type headers are required'
      });
      return;
    }

    // Validate Content-Length header exists
    if (!contentLength) {
      res.status(411).json({
        success: false,
        message: 'Content-Length header is required'
      });
      return;
    }

    const fileSize = parseInt(contentLength, 10);

    // Validate file size
    if (isNaN(fileSize) || fileSize <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid Content-Length header'
      });
      return;
    }

    // HARD LIMIT: Enforce maximum file size (server-side, cannot be bypassed)
    if (fileSize > MAX_FILE_SIZE) {
      res.status(413).json({
        success: false,
        message: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
      return;
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: `Unsupported image type. Allowed: ${allowedTypes.join(', ')}`
      });
      return;
    }

    // Validate image type
    if (!['product', 'profile', 'post'].includes(imageType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid image type'
      });
      return;
    }

    // PROFILE IMAGE PATH: Use AvatarMediaService for thumbnails & sharded storage
    if (imageType === 'profile') {
      // Extra guard: profile images should be <1MB (already compressed to ~512KB client-side)
      if (fileSize > 1024 * 1024) {
        res.status(413).json({
          success: false,
          message: 'Profile images must be under 1MB'
        });
        return;
      }

      // Extract userId from authenticated session
      const userId = (req.user as any)?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID not found in session'
        });
        return;
      }

      // Collect all chunks into buffer for AvatarMediaService
      const chunks: Buffer[] = [];
      let totalSize = 0;
      let responseSent = false;

      const cleanupListeners = () => {
        req.removeAllListeners('data');
        req.removeAllListeners('end');
        req.removeAllListeners('error');
      };

      const sendErrorResponse = (status: number, message: string) => {
        if (responseSent) return;
        responseSent = true;
        cleanupListeners();
        req.destroy();
        res.status(status).json({ success: false, message });
      };

      req.on('data', (chunk: Buffer) => {
        if (responseSent) return;
        
        totalSize += chunk.length;
        
        // Safety: abort if exceeds declared size
        if (totalSize > fileSize) {
          sendErrorResponse(400, 'Upload size exceeded declared Content-Length');
          return;
        }
        
        chunks.push(chunk);
      });

      req.on('end', async () => {
        if (responseSent) return;
        
        try {
          // Verify final size
          if (totalSize !== fileSize) {
            sendErrorResponse(400, `Upload size mismatch: expected ${fileSize}, got ${totalSize}`);
            return;
          }

          const imageBuffer = Buffer.concat(chunks);

          // Use AvatarMediaService for thumbnail generation & sharded storage
          const avatarService = new AvatarMediaService();
          const result = await avatarService.uploadAvatar(userId, imageBuffer, {
            generateThumbnails: true,
            createBackup: true,
            maxRetries: 3
          });

          if (!result.success || !result.urls?.original) {
            sendErrorResponse(500, result.error || 'Failed to upload avatar');
            return;
          }

          // Update user avatar in database
          const { db } = await import('./db');
          const { users } = await import('@shared/schema');
          const { eq } = await import('drizzle-orm');
          
          await db.update(users)
            .set({ avatar: result.urls.original })
            .where(eq(users.id, userId));

          // Mark response as sent and cleanup
          responseSent = true;
          cleanupListeners();

          console.log(`[SECURE-UPLOAD] Profile upload successful for user ${userId}:`, {
            avatarUrl: result.urls.original,
            thumbnails: !!result.urls.variants,
            degraded: result.degraded,
            size: totalSize
          });

          // Return structured response with thumbnails
          res.json({
            success: true,
            publicUrl: result.urls.original,      // Main avatar URL (backward compatible)
            avatarUrl: result.urls.original,      // Main avatar URL
            variantUrls: result.urls.variants,    // Thumbnail URLs (128px, 256px, 512px)
            degraded: result.degraded,            // True if Sharp unavailable
            size: totalSize,
            contentType: fileType
          });

        } catch (error) {
          console.error('[SECURE-UPLOAD] Profile upload error:', error);
          sendErrorResponse(500, error instanceof Error ? error.message : 'Failed to process avatar upload');
        }
      });

      req.on('error', (error) => {
        console.error('[SECURE-UPLOAD] Request error:', error);
        sendErrorResponse(500, 'Upload failed');
      });

      return; // Exit early - profile path complete
    }

    // PRODUCT/POST PATH: Continue with streaming upload (unchanged)
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    const pathArray = publicPaths.split(',').map(p => p.trim()).filter(Boolean);

    if (pathArray.length === 0) {
      res.status(500).json({
        success: false,
        message: 'Object storage not configured'
      });
      return;
    }

    const publicPath = pathArray[0];

    // Generate unique file name
    const timestamp = Date.now();
    const uuid = randomUUID();
    const extension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${imageType}_${timestamp}_${uuid}.${extension}`;

    // Construct full object path
    const fullPath = `${publicPath}/${imageType}/${uniqueFileName}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Get bucket reference
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    // Create write stream to GCS
    const writeStream = file.createWriteStream({
      metadata: {
        contentType: fileType,
        metadata: {
          uploadedBy: 'secure-proxy',
          originalName: fileName
        }
      },
      resumable: false, // Use simple upload for files < 10MB
      validation: 'md5' // Validate integrity
    });

    // Track bytes uploaded for additional validation
    let bytesUploaded = 0;

    // Create transform stream to count bytes
    const countingStream = new Readable({
      read() {
        // Passthrough
      }
    });

    // Pipe request to GCS with size validation
    req.on('data', (chunk: Buffer) => {
      bytesUploaded += chunk.length;

      // Additional safety check: abort if exceeds declared Content-Length
      if (bytesUploaded > fileSize) {
        req.pause();
        writeStream.destroy();
        res.status(400).json({
          success: false,
          message: 'Upload size exceeded declared Content-Length'
        });
        return;
      }

      writeStream.write(chunk);
    });

    req.on('end', () => {
      // Verify final size matches Content-Length
      if (bytesUploaded !== fileSize) {
        writeStream.destroy();
        res.status(400).json({
          success: false,
          message: `Upload size mismatch: expected ${fileSize}, got ${bytesUploaded}`
        });
        return;
      }

      writeStream.end();
    });

    req.on('error', (error) => {
      console.error('[SECURE-UPLOAD] Request error:', error);
      writeStream.destroy();
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Upload failed'
        });
      }
    });

    writeStream.on('error', (error: any) => {
      console.error('[SECURE-UPLOAD] GCS write error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to write to storage'
        });
      }
    });

    writeStream.on('finish', () => {
      // Return application URL that will be served through /public-objects route
      // Files are served through this route instead of direct GCS URLs (public access is disabled)
      const publicUrl = `/public-objects/${imageType}/${uniqueFileName}`;

      res.json({
        success: true,
        publicUrl,
        objectPath: fullPath,
        fileName: uniqueFileName,
        size: bytesUploaded,
        contentType: fileType
      });
    });

  } catch (error) {
    console.error('[SECURE-UPLOAD] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

/**
 * Register secure upload routes
 */
export function registerSecureUploadRoutes(app: any) {
  console.log('[SECURE-UPLOAD] Registering secure upload proxy routes');

  // Secure upload with server-side size enforcement
  app.post('/api/image/secure-upload', secureUploadProxy);
}
