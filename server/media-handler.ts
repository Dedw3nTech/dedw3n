import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { logger } from './logger';

// Make sure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    './public/uploads', 
    './public/uploads/images', 
    './public/uploads/videos',
    './public/uploads/temp'
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
};

/**
 * Generate a unique filename for uploaded media
 */
const generateFilename = (prefix: string = 'media', extension: string = '.jpg'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}${extension}`;
};

/**
 * Handle media upload (images and videos) from base64 data
 */
export const handleMediaUpload = (req: Request, res: Response) => {
  logger.debug('Media upload requested', { type: req.body.type }, 'api');
  
  // Ensure upload directories exist
  ensureUploadDirs();
  
  // Set up response as JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Extract data from request body
  const { file, type } = req.body;
  
  if (!file) {
    logger.debug('No file data provided in media upload', undefined, 'api');
    return res.status(400).json({
      success: false,
      message: 'No file data provided'
    });
  }
  
  if (!type || !['image', 'video'].includes(type)) {
    logger.debug('Invalid media type provided', { type }, 'api');
    return res.status(400).json({
      success: false,
      message: 'Invalid media type. Must be "image" or "video".'
    });
  }
  
  try {
    // Validate file data format
    if (typeof file !== 'string' || 
        (type === 'image' && !file.startsWith('data:image/')) || 
        (type === 'video' && !file.startsWith('data:video/'))) {
      logger.debug('Invalid file data format in media upload', { type }, 'api');
      return res.status(400).json({
        success: false,
        message: 'Invalid file data format. Must be a data URI matching the specified type.'
      });
    }
    
    // Extract base64 data and file type
    const matches = file.match(/^data:(image|video)\/([a-zA-Z0-9]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 4) {
      logger.debug('Could not extract MIME type from media upload', undefined, 'api');
      return res.status(400).json({
        success: false,
        message: 'Invalid file data format. Could not extract MIME type.'
      });
    }
    
    const mediaType = matches[1]; // image or video
    const fileExtension = matches[2].toLowerCase();
    const base64Data = matches[3];
    
    // Validate file type
    const allowedImageTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    const allowedVideoTypes = ['mp4', 'webm', 'quicktime', 'x-msvideo', 'x-ms-wmv'];
    
    if ((mediaType === 'image' && !allowedImageTypes.includes(fileExtension)) ||
        (mediaType === 'video' && !allowedVideoTypes.includes(fileExtension))) {
      logger.debug('Unsupported media format', { mediaType, fileExtension }, 'api');
      return res.status(400).json({
        success: false,
        message: `Unsupported ${mediaType} format. Allowed formats: ${mediaType === 'image' ? allowedImageTypes.join(', ') : allowedVideoTypes.join(', ')}.`
      });
    }
    
    // Generate filename and set up paths
    const finalExt = fileExtension === 'jpeg' ? 'jpg' : fileExtension;
    const finalFilename = generateFilename(mediaType, `.${finalExt}`);
    const uploadDir = mediaType === 'image' ? 'images' : 'videos';
    const filePath = path.join('./public/uploads', uploadDir, finalFilename);
    
    // Write the file
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    logger.debug('Media upload successful', { mediaType, filename: finalFilename }, 'api');
    
    // Return success response with file path
    return res.status(200).json({
      success: true,
      message: `${mediaType} uploaded successfully`,
      mediaUrl: `/uploads/${uploadDir}/${finalFilename}`,
      mediaType: mediaType,
      mimeType: `${mediaType}/${fileExtension}`,
      timestamp: Date.now(),
      filename: finalFilename,
      fullUrl: `${req.protocol}://${req.get('host')}/uploads/${uploadDir}/${finalFilename}`
    });
  } catch (error) {
    logger.error('Failed to process media upload', { type: req.body.type }, error as Error, 'api');
    return res.status(500).json({
      success: false,
      message: 'Error processing media upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Register the media upload routes
export function registerMediaRoutes(app: any) {
  logger.debug('Registering media upload routes', undefined, 'server');
  
  // Create upload directories on startup
  ensureUploadDirs();
  
  // Media upload endpoint for both images and videos
  app.post('/api/media/upload', handleMediaUpload);
}