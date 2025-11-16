import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { objectStorageClient } from './objectStorage';

/**
 * Generate presigned URLs for direct-to-storage uploads
 * This eliminates the server hop and provides near-instant uploads
 * 
 * SECURITY MODEL:
 * - Requires authentication (req.isAuthenticated)
 * - Validates MIME type against allowlist
 * - Validates client-declared file size (NOTE: can be bypassed by malicious clients)
 * - Does NOT set per-object ACL (controlled by bucket policy)
 * 
 * SIZE ENFORCEMENT LIMITATION:
 * Direct uploads using presigned URLs cannot enforce true server-side size limits
 * because GCS PUT operations don't support Content-Length-Range constraints.
 * For strict size enforcement against malicious clients, consider:
 * 1. Use server-mediated uploads (POST to /api/image/upload) for sensitive operations
 * 2. Implement a Cloud Function webhook to verify uploaded file size post-upload
 * 3. Use GCS lifecycle policies to auto-delete oversized objects
 * 
 * PERFORMANCE TRADEOFF:
 * Direct uploads provide 50-500ms performance vs 2-5s server-mediated uploads.
 * For most use cases, client-side size validation is sufficient.
 */

interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number; // Required for size validation
  imageType?: 'product' | 'profile' | 'post';
}

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  objectPath: string;
  expiresIn: number;
}

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
 * Generate a presigned PUT URL for direct upload
 * Requires authentication and enforces size/type limits
 */
export async function generatePresignedUploadUrl(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Require authentication for security
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { fileName, fileType, fileSize, imageType = 'product' }: PresignedUrlRequest = req.body;

    if (!fileName || !fileType || !fileSize) {
      res.status(400).json({
        success: false,
        message: 'fileName, fileType, and fileSize are required'
      });
      return;
    }

    // Validate fileSize is a positive number
    if (typeof fileSize !== 'number' || fileSize <= 0) {
      res.status(400).json({
        success: false,
        message: 'fileSize must be a positive number'
      });
      return;
    }

    // Validate file type - strict MIME type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: `Unsupported image type. Allowed: ${allowedTypes.join(', ')}`
      });
      return;
    }

    // Enforce maximum file size (10MB limit)
    // NOTE: This validates the client-declared size. For strict enforcement against
    // malicious clients, use server-mediated uploads or implement a verification webhook
    // that checks actual uploaded file size after upload completes.
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      res.status(400).json({
        success: false,
        message: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum limit of ${maxSize / 1024 / 1024}MB`
      });
      return;
    }

    // Get public object storage path
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

    // Generate presigned URL for PUT operation (15 minutes expiry)
    // Note: ACL is controlled by bucket policy, not set per-object for security
    const expiresIn = 15 * 60; // 15 minutes in seconds
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresIn * 1000,
      contentType: fileType
      // Removed x-goog-acl to prevent unauthorized public access
      // Access should be controlled via bucket policies
    });

    // Return application URL that will be served through /public-objects route
    // Files are served through this route instead of direct GCS URLs (public access is disabled)
    const publicUrl = `/public-objects/${imageType}/${uniqueFileName}`;

    res.json({
      success: true,
      uploadUrl: signedUrl,
      publicUrl,
      objectPath: fullPath,
      expiresIn,
      fileName: uniqueFileName
    });

  } catch (error) {
    console.error('[PRESIGNED-URL] Error generating presigned URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate upload URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Register presigned upload routes
 */
export function registerPresignedUploadRoutes(app: any) {
  console.log('[PRESIGNED-URL] Registering presigned upload routes');
  
  // Generate presigned URL for direct upload
  app.post('/api/image/presigned-upload-url', generatePresignedUploadUrl);
}
