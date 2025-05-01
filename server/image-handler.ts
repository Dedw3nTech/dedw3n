import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';

// Make sure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    './public/uploads', 
    './public/uploads/product', 
    './public/uploads/profile',
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
 */
export const handleImageUpload = (req: Request, res: Response) => {
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
    let uploadDir = 'product';
    if (['product', 'profile', 'post'].includes(imageType)) {
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
    
    // Write the file
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    console.log(`[IMAGE] Successfully saved image to ${filePath}`);
    
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
 */
export const handleChunkedUpload = (req: Request, res: Response) => {
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
    
    // Write the chunk
    fs.writeFileSync(chunkPath, chunkData, 'base64');
    
    // Check if this is the final chunk
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      // All chunks received, combine them
      
      // Select upload directory based on image type
      let uploadDir = 'product';
      if (['product', 'profile', 'post'].includes(imageType)) {
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

/**
 * Generate a test image (for internal use in the API)
 */
export const generateTestImage = (): { path: string, color: string } => {
  // Generate a test image (colored square)
  const size = 100;
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  
  // Generate filename and path
  const filename = `test_${Date.now()}.png`;
  const filePath = path.join('./public/uploads/test', filename);
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync('./public/uploads/test')) {
    fs.mkdirSync('./public/uploads/test', { recursive: true });
  }
  
  // Create a buffer for the image data (simple RGB colored square)
  const imageData = Buffer.alloc(size * size * 3);
  
  // Fill the buffer with the random color
  for (let i = 0; i < size * size; i++) {
    imageData[i * 3] = r;
    imageData[i * 3 + 1] = g;
    imageData[i * 3 + 2] = b;
  }
  
  // Write the file
  fs.writeFileSync(filePath, imageData);
  
  return {
    path: `/uploads/test/${filename}`,
    color: `rgb(${r},${g},${b})`
  };
};

// Register the image upload routes
export function registerImageRoutes(app: any) {
  console.log('[IMAGE] Registering image upload routes');
  
  // Create upload directories on startup
  ensureUploadDirs();
  
  // API documentation endpoint
  app.get('/api/image', (req: Request, res: Response) => {
    console.log('[IMAGE] Documentation requested');
    
    // Return API documentation as JSON
    return res.status(200).json({
      success: true,
      message: 'Dedw Ltd. Image Upload API',
      version: '1.0.0',
      endpoints: [
        {
          path: '/api/image',
          method: 'GET',
          description: 'Fetch API documentation for image upload endpoints',
          requiresAuth: false,
          parameters: []
        },
        {
          path: '/api/image/upload',
          method: 'POST',
          description: 'Upload a single image using base64 encoding (recommended for images <1MB)',
          requiresAuth: false,
          parameters: [
            {
              name: 'imageData',
              type: 'string',
              format: 'data:image/[format];base64,[data]',
              required: true,
              description: 'Base64-encoded image data with data URI prefix'
            },
            {
              name: 'imageType',
              type: 'string',
              enum: ['product', 'profile', 'post'],
              default: 'product',
              required: false,
              description: 'The category/type of image being uploaded'
            }
          ]
        },
        {
          path: '/api/image/chunked-upload',
          method: 'POST',
          description: 'Upload a large image in chunks (recommended for images >1MB)',
          requiresAuth: false,
          parameters: [
            {
              name: 'fileId',
              type: 'string',
              required: true,
              description: 'A unique ID for the file being uploaded (must be consistent across chunks)'
            },
            {
              name: 'chunkIndex',
              type: 'number',
              required: true,
              description: 'The index of the current chunk (starting from 0)'
            },
            {
              name: 'totalChunks',
              type: 'number',
              required: true,
              description: 'The total number of chunks for this file'
            },
            {
              name: 'chunk',
              type: 'string',
              format: 'base64',
              required: true,
              description: 'Base64-encoded chunk of the image'
            },
            {
              name: 'imageType',
              type: 'string',
              enum: ['product', 'profile', 'post'],
              default: 'product',
              required: false,
              description: 'The category/type of image being uploaded'
            }
          ]
        },
        {
          path: '/api/image/test',
          method: 'POST',
          description: 'Generate a test image for development purposes',
          requiresAuth: false,
          parameters: []
        }
      ],
      examples: {
        singleUpload: {
          request: {
            method: 'POST',
            url: '/api/image/upload',
            body: {
              imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH...',
              imageType: 'product'
            }
          },
          response: {
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: '/uploads/product/product_1734567890_123.png',
            imageType: 'product',
            mimeType: 'image/png',
            timestamp: 1734567890123,
            filename: 'product_1734567890_123.png'
          }
        },
        chunkedUpload: {
          note: 'For chunked uploads, send multiple requests with the same fileId but incrementing chunkIndex',
          firstChunkRequest: {
            method: 'POST',
            url: '/api/image/chunked-upload',
            body: {
              fileId: 'unique-file-id-123',
              chunkIndex: 0,
              totalChunks: 3,
              chunk: 'base64data...',
              imageType: 'product'
            }
          },
          firstChunkResponse: {
            success: true,
            message: 'Chunk 0 of 3 received',
            progress: 33.33,
            remainingChunks: 2
          },
          finalChunkResponse: {
            success: true,
            message: 'Chunked upload completed successfully',
            imageUrl: '/uploads/product/product_1734567890_123.png',
            imageType: 'product',
            timestamp: 1734567890123,
            filename: 'product_1734567890_123.png'
          }
        }
      }
    });
  });
  
  // Standard image upload endpoint
  app.post('/api/image/upload', handleImageUpload);
  
  // Chunked upload endpoint for larger images
  app.post('/api/image/chunked-upload', handleChunkedUpload);
  
  // Simple test endpoint that generates a test image
  app.post('/api/image/test', (req: Request, res: Response) => {
    console.log('[IMAGE] Test image requested');
    
    try {
      // Ensure upload directories exist
      ensureUploadDirs();
      
      // Generate test image
      const testImage = generateTestImage();
      
      console.log(`[IMAGE] Test image created at ${testImage.path}`);
      
      // Return success with image path
      return res.status(200).json({
        success: true,
        message: 'Test image created successfully',
        imageUrl: testImage.path,
        imageType: 'test',
        color: testImage.color,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[IMAGE] Error creating test image:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating test image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}