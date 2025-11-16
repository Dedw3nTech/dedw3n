import { Request, Response, NextFunction } from 'express';
import path from 'path';

/**
 * Modern Cache Header Middleware
 * Implements proper cache headers for different asset types
 */

/**
 * Set cache headers for static assets based on file type and hashing
 */
export function setCacheHeaders(req: Request, res: Response, next: NextFunction) {
  const filePath = req.path;
  const ext = path.extname(filePath).toLowerCase();
  
  // Check if file has hash in filename (content-based versioning)
  const hasHash = /\.[a-f0-9]{8,}\.(js|css|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)$/i.test(filePath);
  
  // HTML files - NEVER cache
  if (ext === '.html' || filePath === '/' || filePath === '') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    console.log(`[CACHE] HTML no-cache: ${filePath}`);
  }
  // Hashed assets - cache forever (1 year)
  else if (hasHash) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    console.log(`[CACHE] Immutable asset: ${filePath}`);
  }
  // Images without hash - cache with revalidation
  else if (/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
    res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
  }
  // Fonts - cache for longer
  else if (/\.(woff|woff2|ttf|eot|otf)$/i.test(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
  }
  // JS/CSS without hash - short cache with revalidation
  else if (/\.(js|css)$/i.test(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.setHeader('ETag', `"${Date.now()}"`);
  }
  // JSON data files - no cache
  else if (ext === '.json') {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  // Default - short cache
  else {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
}

/**
 * Special cache headers for profile pictures
 * Uses ETag and avatarUpdatedAt for proper cache busting
 */
export function setProfilePictureCacheHeaders(
  res: Response,
  userId: number,
  avatarUpdatedAt?: Date | string | null
) {
  const timestamp = avatarUpdatedAt ? new Date(avatarUpdatedAt).getTime() : Date.now();
  const etag = `"avatar-${userId}-${timestamp}"`;
  
  // Set ETag for validation
  res.setHeader('ETag', etag);
  
  // Allow caching but must revalidate
  res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate');
  res.setHeader('Last-Modified', new Date(timestamp).toUTCString());
  
  // Prevent proxies from caching user-specific content
  res.setHeader('Vary', 'Accept-Encoding, Authorization');
  
  console.log(`[CACHE] Profile picture headers set for user ${userId}, ETag: ${etag}`);
}

/**
 * Handle ETag validation for profile pictures
 */
export function validateProfilePictureETag(
  req: Request,
  res: Response,
  userId: number,
  avatarUpdatedAt?: Date | string | null
): boolean {
  const timestamp = avatarUpdatedAt ? new Date(avatarUpdatedAt).getTime() : Date.now();
  const currentEtag = `"avatar-${userId}-${timestamp}"`;
  const clientEtag = req.headers['if-none-match'];
  const ifModifiedSince = req.headers['if-modified-since'];
  
  // Check ETag
  if (clientEtag && clientEtag === currentEtag) {
    console.log(`[CACHE] ETag match for user ${userId}, returning 304`);
    res.status(304).end();
    return true;
  }
  
  // Check Last-Modified
  if (ifModifiedSince) {
    const clientTime = new Date(ifModifiedSince).getTime();
    if (clientTime >= timestamp) {
      console.log(`[CACHE] Not modified since for user ${userId}, returning 304`);
      res.status(304).end();
      return true;
    }
  }
  
  return false;
}

/**
 * Clear CDN cache for specific paths (if using CDN)
 */
export async function purgeCDNCache(paths: string[]) {
  // This would integrate with your CDN API
  // Example for Cloudflare:
  /*
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: paths })
  });
  */
  
  console.log(`[CACHE] Would purge CDN cache for paths:`, paths);
}