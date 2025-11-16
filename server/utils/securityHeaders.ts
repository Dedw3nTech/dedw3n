import type { Request, Response } from 'express';

/**
 * Security headers utility for manual inline implementation
 * Per user requirement: NO middleware solutions - manual coding only
 */

interface SecurityHeadersConfig {
  env: 'development' | 'production';
  isHttps: boolean;
  nonce?: string;
}

/**
 * Generate Content Security Policy directives
 * Luxury e-commerce standard: strict CSP with specific trusted sources
 */
export function getCSP(config: SecurityHeadersConfig): string {
  const { env, nonce } = config;
  
  // Disable CSP in development for Replit webview embedding
  if (env === 'development') {
    return '';
  }
  
  // Production CSP - strict security for luxury e-commerce
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${nonce ? `'nonce-${nonce}'` : ''} blob:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https: https://987df99e227c1b3cd8bbc12db0692cdf.r2.cloudflarestorage.com https://dedw3n.com`,
    `font-src 'self' data:`,
    `connect-src 'self' wss: https: https://987df99e227c1b3cd8bbc12db0692cdf.r2.cloudflarestorage.com https://dedw3n.com`,
    `media-src 'self' blob: data: https://987df99e227c1b3cd8bbc12db0692cdf.r2.cloudflarestorage.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self' https://dedw3n.com https://www.dedw3n.com`,
    `upgrade-insecure-requests`
  ];
  
  return directives.filter(Boolean).join('; ');
}

/**
 * Get HSTS header value
 * Luxury e-commerce standard: strict transport security with preload
 */
export function getHSTS(config: SecurityHeadersConfig): string {
  const { env, isHttps } = config;
  
  // Only apply HSTS in production with HTTPS
  if (env !== 'production' || !isHttps) {
    return '';
  }
  
  // 1 year, include subdomains, preload
  return 'max-age=31536000; includeSubDomains; preload';
}

/**
 * Apply comprehensive security headers to response
 * Manual inline implementation per user requirement
 */
export function applySecurityHeaders(req: Request, res: Response, config: SecurityHeadersConfig): void {
  const { env, isHttps } = config;
  
  // Content Security Policy
  const csp = getCSP(config);
  if (csp) {
    res.setHeader('Content-Security-Policy', csp);
  }
  
  // HTTP Strict Transport Security
  const hsts = getHSTS(config);
  if (hsts) {
    res.setHeader('Strict-Transport-Security', hsts);
  }
  
  // X-Frame-Options - prevent clickjacking
  // Allow all in development for Replit webview embedding
  if (env === 'production') {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  
  // X-Content-Type-Options - prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection - legacy XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy - control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy - control browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cross-Origin-Embedder-Policy - isolation
  // Only in production to avoid breaking development embedding
  if (env === 'production') {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  }
  
  // Cross-Origin-Opener-Policy - isolation
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  
  // Cross-Origin-Resource-Policy - prevent cross-origin resource reading
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
}

/**
 * Apply security headers specifically for static assets
 * Luxury e-commerce standard: aggressive caching for immutable assets, moderate for mutable
 */
export function applyStaticAssetHeaders(req: Request, res: Response, config: SecurityHeadersConfig): void {
  // Apply base security headers
  applySecurityHeaders(req, res, config);
  
  // Additional headers for static assets
  const filePath = req.path;
  
  // Immutable assets (hashed filenames in build output) - 1 year aggressive caching
  // Matches Vite patterns: index-Crsh5B1P.js, style-DW0efb4Q.css, chunk-abc12345.css, app.def456.js
  // Vite uses alphanumeric hashes (not just hex), so match [a-zA-Z0-9]
  if (filePath.match(/[-.]([a-zA-Z0-9]{8,})\.(js|css|woff2?|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Regular JS/CSS without hashes - moderate caching
  else if (filePath.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  // Image files - 1 day caching (user-uploaded and mutable images)
  else if (filePath.match(/\.(svg|png|jpg|jpeg|webp|avif|gif|ico)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  // Video files - 1 day caching (user-uploaded content)
  else if (filePath.match(/\.(mp4|webm|mov|avi|wmv)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  
  // X-Content-Type-Options for all static files
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

/**
 * Get secure cookie configuration
 * Task 6 requirement: crossOrigin=strict for security
 * WARNING: crossOrigin=strict may break cross-domain authentication
 */
export function getSecureCookieConfig(config: SecurityHeadersConfig) {
  const { env, isHttps } = config;
  const isProduction = env === 'production';
  
  return {
    httpOnly: true,
    secure: isHttps && isProduction,
    crossOrigin: isProduction ? 'strict' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
}
