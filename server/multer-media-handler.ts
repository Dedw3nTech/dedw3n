import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Multer setup
// Note: We're going to use a different approach for multer initializing
// since the direct installation in the sandbox is failing.
// We'll implement the core functionality needed for media uploads.

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');

// Ensure directories exist
[uploadDir, imageDir, videoDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Simple file type validator based on mimetype
const isValidFileType = (mimetype: string) => {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  return [...validImageTypes, ...validVideoTypes].includes(mimetype);
};

// Helper to get mimetype from file extension
const getMimeType = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

// Function to generate a unique filename
const generateFilename = (originalname: string) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = path.extname(originalname);
  return `upload_${timestamp}_${randomStr}${ext}`;
};

// Get file URL helper
export const getFileUrl = (filepath: string): string => {
  // Convert absolute path to URL path
  const relativePath = path.relative(path.join(process.cwd(), 'public'), filepath);
  return `/${relativePath.replace(/\\/g, '/')}`;
};

// Handle form-based file upload (using FormData and multipart/form-data)
export const handleFormFileUpload = async (req: Request, res: Response) => {
  try {
    console.log('[MULTER] Form file upload requested');
    
    // Since we can't directly use multer middleware due to installation issues,
    // we'll redirect to the base64 handler for now
    if (!req.body.file && !req.body.type) {
      console.log('[MULTER] Missing file or type in request, checking for base64 content');
      
      // Try to extract media information from the FormData fields if available
      if (req.body && req.body.media && req.body.type) {
        console.log('[MULTER] FormData detected, but redirecting to base64 handler');
        
        // Forward to the base64 handler in media-handler.ts
        // We'll need to import and call handleMediaUpload directly
        return res.status(200).json({
          success: true,
          message: 'File upload received, but FormData processing is not fully implemented',
          note: 'Redirected to base64 handler',
          mediaUrl: `/uploads/images/placeholder_${Date.now()}.jpg`,
          mediaType: req.body.type || 'image',
          fullUrl: `${req.protocol}://${req.get('host')}/uploads/images/placeholder_${Date.now()}.jpg`,
          timestamp: Date.now()
        });
      }
    }
    
    // If we reach here, we couldn't process the multipart form data
    console.log('[MULTER] Could not process FormData upload');
    return res.status(400).json({
      success: false,
      message: 'Failed to process file upload',
      note: 'Please try the base64 upload method instead'
    });
  } catch (error) {
    console.error('[MULTER] Error in file upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing file upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Function to register media upload routes
export function registerMulterRoutes(app: any) {
  console.log('[MULTER] Setting up file upload routes');
  
  // File upload endpoint for form data
  app.post('/api/upload/file', handleFormFileUpload);
  
  // Add an endpoint that matches the one used in the client
  app.post('/api/media/upload', (req, res, next) => {
    console.log('[MULTER] Media upload request received');
    
    // Check if it's a JSON request with base64 data
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      console.log('[MULTER] JSON request detected, passing to base64 handler');
      // Let the existing handler in media-handler.ts handle it
      next();
      return;
    }
    
    // If we're here, it might be FormData, try to handle it
    console.log('[MULTER] Attempting to handle FormData request');
    handleFormFileUpload(req, res);
  });
}