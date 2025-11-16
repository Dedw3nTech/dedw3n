import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

// Define upload directories
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const imageUploadDir = path.join(uploadDir, 'images');
const videoUploadDir = path.join(uploadDir, 'videos');
// Private directory for sensitive documents (not web accessible)
const privateUploadDir = path.join(process.cwd(), 'private', 'uploads');
const documentUploadDir = path.join(privateUploadDir, 'documents');

// Ensure upload directories exist
[uploadDir, imageUploadDir, videoUploadDir, privateUploadDir, documentUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    // Choose destination folder based on mimetype
    let dest = documentUploadDir; // Default to documents
    
    if (file.mimetype.startsWith('image/')) {
      dest = imageUploadDir;
    } else if (file.mimetype.startsWith('video/')) {
      dest = videoUploadDir;
    }
    // Documents (PDF, DOC, DOCX, TXT) go to documentUploadDir
    
    cb(null, dest);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Create cryptographically secure unique filename for document uploads
    const timestamp = Date.now();
    const secureRandom = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    
    // For documents (private), use crypto-secure naming to prevent guessing
    const isDocument = !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/');
    if (isDocument) {
      cb(null, `contact_${timestamp}_${secureRandom}${ext}`);
    } else {
      // For public files, still use some randomness for basic security
      const publicRandom = crypto.randomBytes(8).toString('hex');
      cb(null, `${file.fieldname}_${timestamp}_${publicRandom}${ext}`);
    }
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file types - allow images, videos, documents, and text files
  const allowedTypes = [
    'image/', 'video/', // Images and videos
    'application/pdf', // PDF files
    'application/msword', // DOC files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX files
    'text/plain' // Text files
  ];
  
  const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type);
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only images, videos, PDFs, Word documents, and text files are allowed'));
  }
};

// Create multer upload middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Helper function to get the URL for the uploaded file
export function getFileUrl(req: Request, file: Express.Multer.File): string {
  // Check if file is in private directory (documents)
  if (file.path.includes(privateUploadDir)) {
    // Private files should not have direct URLs - they need authorization
    return `/api/secure-file/${path.basename(file.path)}`;
  }
  
  // Build the URL for public files (images/videos)
  const relativePath = path.relative(process.cwd() + '/public', file.path);
  return `/${relativePath}`.replace(/\\/g, '/');
}

// Get the full URL including host
export function getFullFileUrl(req: Request, file: Express.Multer.File): string {
  const relativeUrl = getFileUrl(req, file);
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  
  return `${protocol}://${host}${relativeUrl}`;
}