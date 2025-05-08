/**
 * Instagram-like API Service
 * 
 * This module implements Instagram-like API endpoints for media upload and publishing:
 * - POST /{ig-user-id}/media - for uploading media
 * - POST /{ig-user-id}/media_publish - for publishing media
 * - GET /{ig-container-id}?fields=status_code - for checking media status
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';
import { db } from '../db';
import { post_media, media_containers } from './schema';
import { sql } from 'drizzle-orm';

// Generate a UUID without using the uuid package
function generateUUID(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Ensure uploads directory exists
const ensureUploadDirs = () => {
  const uploadDir = './public/uploads';
  const imageDir = path.join(uploadDir, 'images');
  const videoDir = path.join(uploadDir, 'videos');
  
  [uploadDir, imageDir, videoDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

/**
 * Handler for Instagram-like media upload endpoint
 * POST /{user-id}/media
 */
export const handleMediaUpload = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const { caption, mediaType, mediaUrl, file } = req.body;
    
    if (!mediaType || !['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'].includes(mediaType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid media type. Must be IMAGE, VIDEO, or CAROUSEL_ALBUM.'
      });
    }
    
    // Generate a container ID
    const containerId = generateUUID();
    
    // If we have a base64 file, process it
    let finalMediaUrl = mediaUrl;
    
    if (file && typeof file === 'string' && file.startsWith('data:')) {
      // Process the base64 file
      ensureUploadDirs();
      
      const matches = file.match(/^data:(image|video)\/([a-zA-Z0-9]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 4) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file data format. Could not extract MIME type.'
        });
      }
      
      const mediaFileType = matches[1]; // image or video
      const fileExtension = matches[2].toLowerCase();
      const base64Data = matches[3];
      
      // Validate file type
      const allowedImageTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
      const allowedVideoTypes = ['mp4', 'webm', 'quicktime', 'x-msvideo', 'x-ms-wmv', 'mpeg'];
      
      if ((mediaFileType === 'image' && !allowedImageTypes.includes(fileExtension)) ||
          (mediaFileType === 'video' && !allowedVideoTypes.includes(fileExtension))) {
        return res.status(400).json({
          success: false,
          message: `Unsupported ${mediaFileType} format.`
        });
      }
      
      // Generate filename and set up paths
      const finalExt = fileExtension === 'jpeg' ? 'jpg' : fileExtension;
      const timestamp = Date.now();
      const finalFilename = `${userId}_${timestamp}_${containerId}.${finalExt}`;
      const uploadDir = mediaFileType === 'image' ? 'images' : 'videos';
      const filePath = path.join('./public/uploads', uploadDir, finalFilename);
      
      // Write the file
      fs.writeFileSync(filePath, base64Data, 'base64');
      
      // Set the media URL to the saved file
      finalMediaUrl = `/uploads/${uploadDir}/${finalFilename}`;
    }
    
    if (!finalMediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either mediaUrl or file is required'
      });
    }
    
    // Save the container in the database
    const container = {
      id: containerId,
      userId: Number(userId),
      mediaType: mediaType.toUpperCase(),
      mediaUrl: finalMediaUrl,
      caption: caption || '',
      status: 'CREATED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert media container record into database
    await db.insert(media_containers).values(container);
    
    // Return the container ID
    return res.status(200).json({
      success: true,
      id: containerId,
      status: 'CREATED',
      mediaType,
      mediaUrl: finalMediaUrl
    });
  } catch (error) {
    console.error('[INSTAGRAM API] Error in media upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing media upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handler for Instagram-like media publishing endpoint
 * POST /{user-id}/media_publish
 */
export const handleMediaPublish = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const { containerId } = req.body;
    
    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'Container ID is required'
      });
    }
    
    // Find the container record
    const containerResult = await db.select().from(media_containers)
      .where(sql`${media_containers.id} = ${containerId} AND ${media_containers.userId} = ${Number(userId)}`);
    const [container] = containerResult;
    
    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Media container not found'
      });
    }
    
    // Update the container status to PUBLISHED
    await db
      .update(media_containers)
      .set({ 
        status: 'PUBLISHED',
        updatedAt: new Date()
      })
      .where(sql`${media_containers.id} = ${containerId}`);
    
    // Insert post_media record
    const mediaPost = {
      containerId,
      userId: Number(userId),
      caption: container.caption,
      mediaType: container.mediaType,
      mediaUrl: container.mediaUrl,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [insertedMedia] = await db.insert(post_media).values(mediaPost).returning();
    
    // Return success with media post ID
    return res.status(200).json({
      success: true,
      id: insertedMedia.id,
      status: 'PUBLISHED'
    });
  } catch (error) {
    console.error('[INSTAGRAM API] Error in media publish:', error);
    return res.status(500).json({
      success: false,
      message: 'Error publishing media',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handler for Instagram-like media status endpoint
 * GET /{container-id}?fields=status_code
 */
export const handleMediaStatus = async (req: Request, res: Response) => {
  try {
    const containerId = req.params.containerId;
    
    if (!containerId) {
      return res.status(400).json({
        success: false,
        message: 'Container ID is required'
      });
    }
    
    // Parse fields parameter
    const fields = req.query.fields as string || '';
    const fieldsList = fields.split(',').map(field => field.trim());
    
    // Find the container record
    const [container] = await db
      .select()
      .from(media_containers)
      .where(sql`${media_containers.id} = ${containerId}`);
    
    if (!container) {
      return res.status(404).json({
        success: false,
        message: 'Media container not found'
      });
    }
    
    // Prepare response based on requested fields
    const response: Record<string, any> = {
      id: container.id
    };
    
    if (fieldsList.includes('status_code') || fields === '') {
      response.status_code = container.status;
    }
    
    if (fieldsList.includes('status')) {
      response.status = container.status;
    }
    
    if (fieldsList.includes('media_type')) {
      response.media_type = container.mediaType;
    }
    
    if (fieldsList.includes('media_url')) {
      response.media_url = container.mediaUrl;
    }
    
    if (fieldsList.includes('caption')) {
      response.caption = container.caption;
    }
    
    // Return the container status
    return res.status(200).json(response);
  } catch (error) {
    console.error('[INSTAGRAM API] Error in media status check:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking media status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Register Instagram-like API routes
 */
export function registerInstagramApiRoutes(router: Router) {
  console.log('[INSTAGRAM API] Registering Instagram-like API routes');
  
  // Create upload directories on startup
  ensureUploadDirs();
  
  // Media upload endpoint
  router.post('/:userId/media', handleMediaUpload);
  
  // Media publish endpoint
  router.post('/:userId/media_publish', handleMediaPublish);
  
  // Media status endpoint
  router.get('/:containerId', handleMediaStatus);
}