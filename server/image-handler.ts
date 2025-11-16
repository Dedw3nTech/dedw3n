import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { Request, Response } from 'express';

// Make sure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    './public/uploads', 
    './public/uploads/product', 
    './public/uploads/avatars',
    './public/uploads/post'
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
};

/**
 * Generate a unique filename for uploaded images
 */
const generateFilename = (prefix: string = 'img'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}.png`;
};

/**
 * Handle image upload from a JSON request with base64 encoded image data
 * Now uses async operations for non-blocking performance
 */
export const handleImageUpload = async (req: Request, res: Response) => {
  console.log('[IMAGE] Image upload requested');
  
  // Ensure upload directories exist
  ensureUploadDirs();
  
  // Set up response as JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Extract image data from request body
  const { imageData, imageType = 'product' } = req.body;
  
  if (!imageData) {
    console.log('[IMAGE] No image data provided');
    return res.status(400).json({
      success: false,
      message: 'No image data provided'
    });
  }
  
  try {
    // Validate image data format
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      console.log('[IMAGE] Invalid image data format');
      return res.status(400).json({
        success: false,
        message: 'Invalid image data format. Must be a data URI.'
      });
    }
    
    // Select upload directory based on image type
    // Map 'profile' to 'avatars' for consistency
    let uploadDir = 'product';
    if (imageType === 'profile') {
      uploadDir = 'avatars';
    } else if (['product', 'post'].includes(imageType)) {
      uploadDir = imageType;
    }
    
    // Extract base64 data and file type
    const matches = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      console.log('[IMAGE] Invalid image data format - could not extract MIME type');
      return res.status(400).json({
        success: false,
        message: 'Invalid image data format. Could not extract MIME type.'
      });
    }
    
    const imageExtension = matches[1].toLowerCase();
    const base64Data = matches[2];
    
    // Validate file type
    if (!['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(imageExtension)) {
      console.log('[IMAGE] Unsupported image format:', imageExtension);
      return res.status(400).json({
        success: false,
        message: 'Unsupported image format. Allowed: JPEG, PNG, GIF, WebP.'
      });
    }
    
    // Generate filename and set up paths
    const filename = generateFilename(uploadDir);
    const fileExtension = imageExtension === 'jpeg' ? 'jpg' : imageExtension;
    const finalFilename = filename.replace(/\.png$/, '.' + fileExtension);
    const filePath = path.join('./public/uploads', uploadDir, finalFilename);
    
    // Write the file asynchronously (non-blocking)
    await fsp.writeFile(filePath, base64Data, 'base64');
    
    console.log(`[IMAGE] Successfully saved image to ${filePath}`);
    
    // Set aggressive caching headers for instant subsequent loads
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': `"${Date.now()}-${finalFilename}"`,
    });
    
    // Return success response with file path
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: `/uploads/${uploadDir}/${finalFilename}`,
      imageType: uploadDir,
      mimeType: `image/${imageExtension}`,
      timestamp: Date.now(),
      filename: finalFilename
    });
  } catch (error) {
    console.error('[IMAGE] Error processing image upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing image upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle small chunked uploads for larger images
 * Now uses async operations for better performance
 */
export const handleChunkedUpload = async (req: Request, res: Response) => {
  console.log('[IMAGE] Chunked upload requested');
  
  // Ensure upload directories exist
  ensureUploadDirs();
  
  // Extract chunk information
  const { chunkIndex, totalChunks, fileId, chunk, imageType = 'product' } = req.body;
  
  if (!chunkIndex || !totalChunks || !fileId || !chunk) {
    console.log('[IMAGE] Missing chunk information');
    return res.status(400).json({
      success: false,
      message: 'Missing required chunk information'
    });
  }
  
  try {
    // Prepare temporary directory for chunks
    const tempDir = path.join('./public/uploads/temp', fileId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Save this chunk
    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    
    // Extract base64 data if needed
    let chunkData = chunk;
    if (typeof chunk === 'string' && chunk.startsWith('data:')) {
      chunkData = chunk.split(',')[1];
    }
    
    // Write the chunk asynchronously
    await fsp.writeFile(chunkPath, chunkData, 'base64');
    
    // Check if this is the final chunk
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      // All chunks received, combine them
      
      // Select upload directory based on image type
      // Map 'profile' to 'avatars' for consistency
      let uploadDir = 'product';
      if (imageType === 'profile') {
        uploadDir = 'avatars';
      } else if (['product', 'post'].includes(imageType)) {
        uploadDir = imageType;
      }
      
      // Generate final filename
      const filename = generateFilename(uploadDir);
      const filePath = path.join('./public/uploads', uploadDir, filename);
      
      // Combine all chunks
      const writeStream = fs.createWriteStream(filePath);
      
      // Process all chunks in order
      for (let i = 0; i < parseInt(totalChunks); i++) {
        const currentChunkPath = path.join(tempDir, `chunk_${i}`);
        if (fs.existsSync(currentChunkPath)) {
          const chunkData = fs.readFileSync(currentChunkPath);
          writeStream.write(chunkData);
          
          // Clean up chunk file
          fs.unlinkSync(currentChunkPath);
        } else {
          // Missing chunk
          console.error(`[IMAGE] Missing chunk ${i} for file ${fileId}`);
          
          // Clean up any remaining chunks
          fs.rmSync(tempDir, { recursive: true, force: true });
          
          return res.status(400).json({
            success: false,
            message: `Missing chunk ${i}`
          });
        }
      }
      
      // Finalize write and close stream
      writeStream.end();
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      console.log(`[IMAGE] Successfully combined chunked upload to ${filePath}`);
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Chunked upload completed successfully',
        imageUrl: `/uploads/${uploadDir}/${filename}`,
        imageType: uploadDir,
        timestamp: Date.now(),
        filename: filename
      });
    } else {
      // Not the final chunk, acknowledge receipt
      return res.status(200).json({
        success: true,
        message: `Chunk ${chunkIndex} of ${totalChunks} received`,
        progress: ((parseInt(chunkIndex) + 1) / parseInt(totalChunks)) * 100,
        remainingChunks: parseInt(totalChunks) - parseInt(chunkIndex) - 1
      });
    }
  } catch (error) {
    console.error('[IMAGE] Error processing chunked upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing chunked upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// No test image generator in production

// Register the image upload routes
export function registerImageRoutes(app: any) {
  console.log('[IMAGE] Registering image upload routes');
  
  // Create upload directories on startup
  ensureUploadDirs();
  
  // Standard image upload endpoint - production ready
  app.post('/api/image/upload', handleImageUpload);
  
  // Chunked upload endpoint for larger images - production ready
  app.post('/api/image/chunked-upload', handleChunkedUpload);
}