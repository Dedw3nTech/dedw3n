import type { Express, Request, Response } from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isAuthenticated as unifiedIsAuthenticated } from './unified-auth';

// Define allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  
  // Videos
  'video/mp4': '.mp4',
  'video/avi': '.avi',
  'video/mov': '.mov',
  'video/wmv': '.wmv',
  'video/flv': '.flv',
  'video/webm': '.webm',
  'video/mkv': '.mkv',
  
  // Audio
  'audio/mp3': '.mp3',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/aac': '.aac',
  'audio/flac': '.flac',
  'audio/m4a': '.m4a',
  
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/rtf': '.rtf',
  
  // Archives
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'application/x-7z-compressed': '.7z',
  
  // Other common files
  'application/json': '.json',
  'application/xml': '.xml',
  'text/xml': '.xml',
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,      // 10MB for images
  video: 100 * 1024 * 1024,     // 100MB for videos  
  audio: 50 * 1024 * 1024,      // 50MB for audio
  document: 25 * 1024 * 1024,   // 25MB for documents
  default: 15 * 1024 * 1024,    // 15MB for other files
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES] || 
                      path.extname(file.originalname);
    
    const filename = `${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file type is allowed
  if (ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`));
  }
};

// Create multer instance with dynamic size limits
const createUpload = (maxSize: number) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  });
};

// Helper function to get file category
function getFileCategory(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document') || 
      mimetype.includes('sheet') || mimetype.includes('presentation') ||
      mimetype.includes('text') || mimetype === 'application/rtf') {
    return 'document';
  }
  return 'file';
}

// Helper function to get appropriate file size limit
function getFileSizeLimit(mimetype: string): number {
  const category = getFileCategory(mimetype);
  return FILE_SIZE_LIMITS[category as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
}

export function registerFileUploadRoutes(app: Express) {
  // File upload endpoint for messages
  app.post('/api/messages/upload', unifiedIsAuthenticated, (req: Request, res: Response) => {
    // Dynamic upload based on expected file type
    const expectedType = req.query.type as string;
    let maxSize = FILE_SIZE_LIMITS.default;
    
    if (expectedType === 'image') maxSize = FILE_SIZE_LIMITS.image;
    else if (expectedType === 'video') maxSize = FILE_SIZE_LIMITS.video;
    else if (expectedType === 'audio') maxSize = FILE_SIZE_LIMITS.audio;
    else if (expectedType === 'document') maxSize = FILE_SIZE_LIMITS.document;
    
    const upload = createUpload(maxSize);
    
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('[File Upload] Error:', err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: `File too large. Maximum size allowed: ${Math.round(maxSize / (1024 * 1024))}MB`,
            error: 'FILE_TOO_LARGE'
          });
        }
        
        if (err.message.includes('not supported')) {
          return res.status(400).json({
            message: 'File type not supported',
            error: 'UNSUPPORTED_FILE_TYPE',
            supportedTypes: Object.keys(ALLOWED_FILE_TYPES)
          });
        }
        
        return res.status(400).json({
          message: err.message,
          error: 'UPLOAD_ERROR'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded',
          error: 'NO_FILE'
        });
      }
      
      // Get file information
      const file = req.file;
      const fileCategory = getFileCategory(file.mimetype);
      const fileUrl = `/uploads/messages/${file.filename}`;
      
      // Return file information
      res.json({
        success: true,
        file: {
          originalName: file.originalname,
          filename: file.filename,
          url: fileUrl,
          mimetype: file.mimetype,
          size: file.size,
          category: fileCategory,
          uploadedAt: new Date().toISOString()
        }
      });
      
      console.log(`[File Upload] Successfully uploaded ${fileCategory}: ${file.originalname} (${Math.round(file.size / 1024)}KB)`);
    });
  });
  
  // Get supported file types endpoint
  app.get('/api/messages/supported-types', (req: Request, res: Response) => {
    const typesByCategory = {
      image: Object.keys(ALLOWED_FILE_TYPES).filter(type => type.startsWith('image/')),
      video: Object.keys(ALLOWED_FILE_TYPES).filter(type => type.startsWith('video/')),
      audio: Object.keys(ALLOWED_FILE_TYPES).filter(type => type.startsWith('audio/')),
      document: Object.keys(ALLOWED_FILE_TYPES).filter(type => 
        type.includes('pdf') || type.includes('document') || 
        type.includes('sheet') || type.includes('presentation') ||
        type.includes('text') || type === 'application/rtf'
      ),
      other: Object.keys(ALLOWED_FILE_TYPES).filter(type => 
        !type.startsWith('image/') && !type.startsWith('video/') && 
        !type.startsWith('audio/') && !type.includes('pdf') && 
        !type.includes('document') && !type.includes('sheet') && 
        !type.includes('presentation') && !type.includes('text') && 
        type !== 'application/rtf'
      )
    };
    
    res.json({
      supportedTypes: typesByCategory,
      fileSizeLimits: FILE_SIZE_LIMITS,
      totalSupportedTypes: Object.keys(ALLOWED_FILE_TYPES).length
    });
  });
  
  // File validation endpoint
  app.post('/api/messages/validate-file', unifiedIsAuthenticated, (req: Request, res: Response) => {
    const { filename, mimetype, size } = req.body;
    
    if (!filename || !mimetype || !size) {
      return res.status(400).json({
        message: 'Missing required fields: filename, mimetype, size',
        error: 'MISSING_FIELDS'
      });
    }
    
    // Check if file type is supported
    if (!ALLOWED_FILE_TYPES[mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
      return res.status(400).json({
        message: 'File type not supported',
        error: 'UNSUPPORTED_FILE_TYPE',
        supportedTypes: Object.keys(ALLOWED_FILE_TYPES)
      });
    }
    
    // Check file size
    const fileCategory = getFileCategory(mimetype);
    const maxSize = FILE_SIZE_LIMITS[fileCategory as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
    
    if (size > maxSize) {
      return res.status(400).json({
        message: `File too large. Maximum size allowed: ${Math.round(maxSize / (1024 * 1024))}MB`,
        error: 'FILE_TOO_LARGE',
        maxSize,
        actualSize: size
      });
    }
    
    res.json({
      valid: true,
      category: fileCategory,
      maxAllowedSize: maxSize,
      message: 'File validation passed'
    });
  });
}