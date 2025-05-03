import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directories exist
const imageUploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
const videoUploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');

// Create directories if they don't exist
[imageUploadDir, videoUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    // Determine destination based on file mimetype
    if (file.mimetype.startsWith('image/')) {
      cb(null, imageUploadDir);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videoUploadDir);
    } else {
      cb(new Error('Invalid file type'), '');
    }
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1000);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}_${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image or video
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'));
  }
};

// Define limits for file uploads
const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB general limit
  files: 1 // Max 1 file per upload
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits
});

// Create specialized upload functions
export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
    files: 1 // Max 1 file per upload
  }
});

export const uploadVideo = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only videos are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    files: 1 // Max 1 file per upload
  }
});

// Helper function to get file URL from the uploaded file
export const getFileUrl = (file: Express.Multer.File): string => {
  // Create URL relative to server root
  const relativePath = path.relative(process.cwd(), file.path);
  // Convert Windows backslashes to forward slashes for URLs
  return '/' + relativePath.replace(/\\/g, '/').replace(/^public\//, '');
};