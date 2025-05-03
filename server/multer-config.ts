import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Define upload directories
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const imageUploadDir = path.join(uploadDir, 'images');
const videoUploadDir = path.join(uploadDir, 'videos');

// Ensure upload directories exist
[uploadDir, imageUploadDir, videoUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    // Choose destination folder based on mimetype
    const dest = file.mimetype.startsWith('image/') ? imageUploadDir : videoUploadDir;
    cb(null, dest);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1000);
    const ext = path.extname(file.originalname);
    
    cb(null, `${file.fieldname}_${timestamp}_${randomNum}${ext}`);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file types
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only images and videos are allowed'));
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
  // Build the full URL for the uploaded file
  const relativePath = path.relative(process.cwd() + '/public', file.path);
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  
  // Return URL with or without host depending on context
  return `/${relativePath}`.replace(/\\/g, '/');
}

// Get the full URL including host
export function getFullFileUrl(req: Request, file: Express.Multer.File): string {
  const relativeUrl = getFileUrl(req, file);
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  
  return `${protocol}://${host}${relativeUrl}`;
}