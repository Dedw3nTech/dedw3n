/**
 * Persistent Upload Handler - Uses Object Storage
 * 
 * This module provides file upload handlers that store files in Replit Object Storage
 * instead of ephemeral local filesystem, preventing data loss after deployment.
 * 
 * All uploaded files (profile pictures, post images, product images, etc.) are
 * automatically stored in persistent object storage.
 */

import { Request, Response, NextFunction } from 'express';
import { objectStorageClient } from './objectStorage';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

// Environment variables for object storage paths
const getPublicBucket = (): string => {
  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
  const firstPath = publicPaths.split(',')[0].trim();
  if (!firstPath || !firstPath.startsWith('/')) {
    throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not properly configured');
  }
  // Extract bucket name from path like '/bucket-name/public'
  const bucketName = firstPath.split('/')[1];
  return bucketName;
};

const getPrivateBucket = (): string => {
  const privatePath = process.env.PRIVATE_OBJECT_DIR || '';
  if (!privatePath || !privatePath.startsWith('/')) {
    throw new Error('PRIVATE_OBJECT_DIR not properly configured');
  }
  // Extract bucket name from path like '/bucket-name/.private'
  const bucketName = privatePath.split('/')[1];
  return bucketName;
};

/**
 * Upload file to object storage
 */
export async function uploadToObjectStorage(
  file: Express.Multer.File,
  directory: 'public' | 'private',
  subdirectory?: string
): Promise<string> {
  try {
    const bucketName = directory === 'public' ? getPublicBucket() : getPrivateBucket();
    const bucket = objectStorageClient.bucket(bucketName);

    // Generate secure filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${ext}`;

    // Determine object path
    // Note: Don't add 'public' or '.private' prefix as PUBLIC_OBJECT_SEARCH_PATHS and PRIVATE_OBJECT_DIR already include these
    const objectPath = subdirectory 
      ? `${subdirectory}/${filename}`
      : filename;

    // Upload to object storage
    const blob = bucket.file(objectPath);
    await blob.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000', // 1 year cache for immutable files
      },
    });

    // Note: Files are served through routes, not directly from object storage (public access prevention is enabled)

    // Return the URL path for the file
    // Public files: /public-objects/subdirectory/filename
    // Private files: /private-objects/subdirectory/filename (requires authentication)
    const routePrefix = directory === 'public' ? '/public-objects' : '/private-objects';
    const urlPath = subdirectory 
      ? `${routePrefix}/${subdirectory}/${filename}`
      : `${routePrefix}/${filename}`;

    return urlPath;
  } catch (error) {
    console.error('[PERSISTENT-UPLOAD] Failed to upload file to object storage:', error);
    throw new Error('Failed to upload file to persistent storage');
  }
}

/**
 * Multer configuration for in-memory storage (temporary)
 * Files are held in memory then uploaded to object storage
 */
const memoryStorage = multer.memoryStorage();

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`));
  }
};

// Create multer upload middleware
export const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

/**
 * Middleware to upload file to object storage after multer processing
 */
export function uploadToObjectStorageMiddleware(
  directory: 'public' | 'private',
  subdirectory?: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next();
      }

      // Upload to object storage
      const fileUrl = await uploadToObjectStorage(req.file, directory, subdirectory);

      // Attach the URL to the request for use in route handlers
      (req as any).fileUrl = fileUrl;

      next();
    } catch (error) {
      console.error('[PERSISTENT-UPLOAD] Upload middleware error:', error);
      return res.status(500).json({
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

/**
 * Upload profile picture (avatar) to object storage
 */
export async function uploadProfilePicture(file: Express.Multer.File): Promise<string> {
  return uploadToObjectStorage(file, 'public', 'avatars');
}

/**
 * Upload post image to object storage
 */
export async function uploadPostImage(file: Express.Multer.File): Promise<string> {
  return uploadToObjectStorage(file, 'public', 'images');
}

/**
 * Upload post video to object storage
 */
export async function uploadPostVideo(file: Express.Multer.File): Promise<string> {
  return uploadToObjectStorage(file, 'public', 'videos');
}

/**
 * Upload product image to object storage
 */
export async function uploadProductImage(file: Express.Multer.File): Promise<string> {
  return uploadToObjectStorage(file, 'public', 'product');
}

/**
 * Upload event cover image to object storage
 */
export async function uploadEventCover(file: Express.Multer.File): Promise<string> {
  return uploadToObjectStorage(file, 'public', 'events');
}

/**
 * Upload message attachment to object storage (private)
 */
export async function uploadMessageAttachment(file: Express.Multer.File): Promise<string> {
  return uploadToObjectStorage(file, 'private', 'messages');
}

/**
 * Upload document to private storage
 */
export async function uploadDocument(file: Express.Multer.File): Promise<string> {
  return uploadToObjectStorage(file, 'private', 'documents');
}

/**
 * Helper to get content type from file extension
 */
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Migrate existing file from local filesystem to object storage
 */
export async function migrateExistingFile(
  localFilePath: string,
  directory: 'public' | 'private',
  subdirectory?: string
): Promise<string> {
  try {
    const fs = await import('fs');
    
    // Check if file exists before attempting migration
    if (!fs.existsSync(localFilePath)) {
      throw new Error('File not found');
    }

    const bucketName = directory === 'public' ? getPublicBucket() : getPrivateBucket();
    const bucket = objectStorageClient.bucket(bucketName);

    // Read the file
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(localFilePath);
    } catch (fsError: any) {
      // Sanitize filesystem errors - don't expose full paths
      throw new Error('Unable to read file from storage');
    }
    
    const filename = path.basename(localFilePath);

    // Determine object path
    // Note: Don't add 'public' or '.private' prefix as PUBLIC_OBJECT_SEARCH_PATHS and PRIVATE_OBJECT_DIR already include these
    const objectPath = subdirectory
      ? `${subdirectory}/${filename}`
      : filename;

    // Upload to object storage
    const blob = bucket.file(objectPath);
    try {
      await blob.save(fileBuffer, {
        metadata: {
          contentType: getContentType(filename),
          cacheControl: 'public, max-age=31536000',
        },
      });
    } catch (uploadError: any) {
      // Sanitize upload errors - don't expose bucket names or paths
      throw new Error('Failed to upload to object storage');
    }

    // Note: Files are served through routes, not directly from object storage (public access prevention is enabled)

    // Return the URL path for the file
    // Public files: /public-objects/subdirectory/filename
    // Private files: /private-objects/subdirectory/filename (requires authentication)
    const routePrefix = directory === 'public' ? '/public-objects' : '/private-objects';
    const urlPath = subdirectory
      ? `${routePrefix}/${subdirectory}/${filename}`
      : `${routePrefix}/${filename}`;

    console.log(`[MIGRATION] Migrated ${localFilePath} → ${urlPath}`);
    return urlPath;
  } catch (error: any) {
    // Log detailed error internally but throw sanitized error
    console.error(`[MIGRATION] Failed to migrate file:`, {
      filename: path.basename(localFilePath),
      error: error?.message || 'Unknown error'
    });
    
    // Return user-friendly error without exposing paths or internal details
    throw new Error(error?.message || 'Migration failed');
  }
}
