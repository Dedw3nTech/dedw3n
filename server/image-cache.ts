import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fsp from 'fs/promises';
import * as fs from 'fs';

/**
 * Image serving middleware with aggressive caching
 * Provides near-instant image loading through proper cache headers
 */

interface CacheOptions {
  maxAge: number; // in seconds
  immutable: boolean;
  staleWhileRevalidate?: number;
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  maxAge: 365 * 24 * 60 * 60, // 1 year
  immutable: true,
  staleWhileRevalidate: 7 * 24 * 60 * 60 // 1 week
};

/**
 * Middleware to add aggressive caching headers to image responses
 */
export function imageCacheMiddleware(options: Partial<CacheOptions> = {}) {
  const cacheOptions = { ...DEFAULT_CACHE_OPTIONS, ...options };
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to image requests
    const ext = path.extname(req.path).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
    
    if (!imageExtensions.includes(ext)) {
      return next();
    }
    
    // Generate ETag based on file path and stats
    // Strip leading slash from req.path to avoid path resolution issues
    const requestPath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
    const filePath = path.join(process.cwd(), 'public', requestPath);
    
    try {
      const stats = fs.statSync(filePath);
      const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
      
      // Build cache control header
      let cacheControl = `public, max-age=${cacheOptions.maxAge}`;
      
      if (cacheOptions.immutable) {
        cacheControl += ', immutable';
      }
      
      if (cacheOptions.staleWhileRevalidate) {
        cacheControl += `, stale-while-revalidate=${cacheOptions.staleWhileRevalidate}`;
      }
      
      // Set cache headers BEFORE checking for 304
      // This ensures browsers receive headers even on 304 responses
      res.set({
        'Cache-Control': cacheControl,
        'ETag': etag,
        'Expires': new Date(Date.now() + cacheOptions.maxAge * 1000).toUTCString(),
        'Vary': 'Accept-Encoding',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'same-origin' // Prevent third-party embedding
      });
      
      // Check if client has fresh version AFTER setting headers
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag === etag) {
        res.status(304).end();
        return;
      }
      
    } catch (error) {
      // File doesn't exist or can't be accessed, let next middleware handle it
    }
    
    next();
  };
}

/**
 * Serve optimized image with proper caching
 * Note: For authenticated/private images, add authentication check before serving
 */
export async function serveOptimizedImage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Optional: Add authentication for private image types
    // For now, product/profile/post images are public
    // Add auth check here if needed:
    // if (imageType === 'private' && !req.isAuthenticated()) { ... }
    
    const { imageType, filename } = req.params;
    
    // Validate image type
    if (!['product', 'profile', 'post'].includes(imageType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid image type'
      });
      return;
    }
    
    // Construct file path
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      imageType,
      filename
    );
    
    // Check if file exists
    try {
      await fsp.access(filePath);
    } catch {
      res.status(404).json({
        success: false,
        message: 'Image not found'
      });
      return;
    }
    
    // Get file stats for ETag
    const stats = await fsp.stat(filePath);
    const etag = `"${stats.mtime.getTime()}-${stats.size}"`;
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Set aggressive caching headers BEFORE checking for 304
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': etag,
      'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString(),
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin' // Prevent third-party embedding
    });
    
    // Check if client has cached version AFTER setting headers
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      res.status(304).end();
      return;
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('[IMAGE-CACHE] Error serving image:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving image'
    });
  }
}

/**
 * Register image caching routes
 */
export function registerImageCacheRoutes(app: any) {
  console.log('[IMAGE-CACHE] Registering image cache routes');
  
  // Serve images with aggressive caching
  app.get('/api/image/:imageType/:filename', serveOptimizedImage);
}
