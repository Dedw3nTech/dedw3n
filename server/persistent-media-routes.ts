/**
 * Persistent Media Upload Routes - Uses Object Storage
 * 
 * This module replaces ephemeral local file storage with persistent object storage.
 * All uploads are automatically saved to Replit Object Storage to prevent data loss.
 */

import { Request, Response } from 'express';
import { objectStorageClient } from './objectStorage';
import crypto from 'crypto';
import path from 'path';

/**
 * Get object storage configuration
 */
function getObjectStorageConfig() {
  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
  const pathArray = publicPaths.split(',').map(p => p.trim()).filter(Boolean);
  
  if (pathArray.length === 0) {
    throw new Error('Object storage not configured. Please set PUBLIC_OBJECT_SEARCH_PATHS.');
  }
  
  const publicPath = pathArray[0];
  const bucketName = publicPath.split('/')[1];
  
  return { publicPath, bucketName };
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
 * Upload base64 data to object storage
 */
async function uploadBase64ToObjectStorage(
  base64Data: string,
  mimeType: string,
  subdirectory: string,
  originalExtension: string
): Promise<string> {
  const { publicPath, bucketName } = getObjectStorageConfig();
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;
  const filename = `${subdirectory}_${timestamp}_${randomString}${extension}`;
  
  // Construct full object path
  const fullPath = `${publicPath}/${subdirectory}/${filename}`;
  const { objectName } = parseObjectPath(fullPath);
  
  // Get bucket and file reference
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Upload to object storage
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  // Return URL path (served through our /public-objects route)
  return `/public-objects/${subdirectory}/${filename}`;
}

/**
 * Handle media upload (images and videos) from base64 data
 * Replaces media-handler.ts with object storage
 */
export async function handlePersistentMediaUpload(req: Request, res: Response) {
  console.log('[PERSISTENT-MEDIA] Media upload requested');
  
  try {
    const { file, type } = req.body;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file data provided'
      });
    }
    
    if (!type || !['image', 'video'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid media type. Must be "image" or "video".'
      });
    }
    
    // Validate file data format
    if (typeof file !== 'string' || 
        (type === 'image' && !file.startsWith('data:image/')) || 
        (type === 'video' && !file.startsWith('data:video/'))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file data format. Must be a data URI matching the specified type.'
      });
    }
    
    // Extract base64 data and file type
    const matches = file.match(/^data:(image|video)\/([a-zA-Z0-9+-]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file data format. Could not extract MIME type.'
      });
    }
    
    const mediaType = matches[1]; // image or video
    const fileExtension = matches[2].toLowerCase().replace('x-', '');
    const base64Data = matches[3];
    const mimeType = `${mediaType}/${matches[2]}`;
    
    // Validate file type
    const allowedImageTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    const allowedVideoTypes = ['mp4', 'webm', 'quicktime', 'msvideo', 'ms-wmv'];
    
    if ((mediaType === 'image' && !allowedImageTypes.includes(fileExtension)) ||
        (mediaType === 'video' && !allowedVideoTypes.includes(fileExtension))) {
      return res.status(400).json({
        success: false,
        message: `Unsupported ${mediaType} format.`
      });
    }
    
    // Upload to object storage
    const subdirectory = mediaType === 'image' ? 'images' : 'videos';
    const finalExt = fileExtension === 'jpeg' ? 'jpg' : fileExtension;
    const mediaUrl = await uploadBase64ToObjectStorage(base64Data, mimeType, subdirectory, finalExt);
    
    console.log(`[PERSISTENT-MEDIA] Successfully saved ${mediaType} to object storage: ${mediaUrl}`);
    
    return res.status(200).json({
      success: true,
      message: `${mediaType} uploaded successfully`,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      mimeType: mimeType,
      timestamp: Date.now(),
      filename: path.basename(mediaUrl),
      fullUrl: `${req.protocol}://${req.get('host')}${mediaUrl}`
    });
  } catch (error) {
    console.error('[PERSISTENT-MEDIA] Error processing media upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing media upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle image upload from base64 data
 * Replaces image-handler.ts with object storage
 */
export async function handlePersistentImageUpload(req: Request, res: Response) {
  console.log('[PERSISTENT-IMAGE] Image upload requested');
  
  try {
    const { image, imageType = 'product' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }
    
    // Validate imageType
    const validTypes = ['product', 'profile', 'post', 'avatars', 'events'];
    if (!validTypes.includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid image type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Extract base64 data
    const matches = image.match(/^data:image\/([a-zA-Z0-9+-]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Must be a data URI.'
      });
    }
    
    const fileExtension = matches[1].toLowerCase();
    const base64Data = matches[2];
    const mimeType = `image/${matches[1]}`;
    
    // Upload to object storage
    const finalExt = fileExtension === 'jpeg' ? 'jpg' : fileExtension;
    const imageUrl = await uploadBase64ToObjectStorage(base64Data, mimeType, imageType, finalExt);
    
    console.log(`[PERSISTENT-IMAGE] Successfully saved image to object storage: ${imageUrl}`);
    
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      imageType: imageType,
      timestamp: Date.now(),
      filename: path.basename(imageUrl)
    });
  } catch (error) {
    console.error('[PERSISTENT-IMAGE] Error processing image upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing image upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Register persistent media upload routes
 * These routes replace the ephemeral local storage handlers
 */
export function registerPersistentMediaRoutes(app: any) {
  console.log('[PERSISTENT-MEDIA] Registering object storage upload routes');
  
  // Replace /api/media/upload endpoint
  app.post('/api/media/upload', handlePersistentMediaUpload);
  
  // Replace /api/image/upload endpoint
  app.post('/api/image/upload', handlePersistentImageUpload);
  
  // Also handle /api/upload-image for compatibility
  app.post('/api/upload-image', handlePersistentImageUpload);
  
  console.log('[PERSISTENT-MEDIA] ✅ All uploads now use persistent object storage');
}
