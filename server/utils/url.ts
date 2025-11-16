/**
 * URL utility functions for generating correct application URLs
 * Prioritizes production URLs over development URLs
 */

/**
 * Get the base URL for the application
 * Priority order:
 * 1. BASE_URL environment variable (for production)
 * 2. CUSTOM_DOMAINS environment variable (for production)
 * 3. REPLIT_DOMAINS environment variable (for development)
 * 4. Request protocol + host (fallback)
 * 
 * @param req - Express request object (optional, used as fallback)
 * @returns The base URL for the application
 */
export function getBaseUrl(req?: any): string {
  // 1. Check for explicit BASE_URL environment variable
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  // 2. Check for custom production domains
  if (process.env.CUSTOM_DOMAINS) {
    const customDomains = process.env.CUSTOM_DOMAINS.split(',')
      .map(d => d.trim())
      .filter(d => d.startsWith('https://'));
    
    if (customDomains.length > 0) {
      return customDomains[0].replace(/\/$/, '');
    }
  }

  // 3. Use hardcoded production domain if available
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    // Dedw3n production domain
    return 'https://dedw3n.com';
  }

  // 4. Check for REPLIT_DOMAINS (development)
  if (process.env.REPLIT_DOMAINS) {
    const replitDomain = process.env.REPLIT_DOMAINS.split(',')[0].trim();
    return `https://${replitDomain}`;
  }

  // 5. Fallback to request protocol + host (if request is provided)
  if (req) {
    return `${req.protocol}://${req.get('host')}`;
  }

  // 6. Final fallback
  return 'http://localhost:5000';
}

/**
 * Generate a full URL from a path
 * @param path - The path to append to the base URL
 * @param req - Express request object (optional)
 * @returns The full URL
 */
export function generateFullUrl(path: string, req?: any): string {
  const baseUrl = getBaseUrl(req);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
