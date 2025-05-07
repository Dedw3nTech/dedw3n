/**
 * Server utility functions
 */
import type { Request } from "express";

/**
 * Get the user agent from the request
 */
export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'Unknown';
}

/**
 * Get the client IP address, handling proxies and load balancers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  
  return req.ip || '0.0.0.0';
}

/**
 * Get device info from the request
 */
export function getDeviceInfo(req: Request): any {
  const userAgent = getUserAgent(req);
  
  // Extract browser and OS info from user agent
  let browser = 'Unknown';
  let os = 'Unknown';
  let isMobile = false;
  
  // Basic browser detection
  if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/msie|trident/i.test(userAgent)) browser = 'Internet Explorer';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  
  // Basic OS detection
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/mac os/i.test(userAgent)) os = 'macOS';
  else if (/android/i.test(userAgent)) {
    os = 'Android';
    isMobile = true;
  }
  else if (/iphone|ipad/i.test(userAgent)) {
    os = 'iOS';
    isMobile = true;
  }
  else if (/linux/i.test(userAgent)) os = 'Linux';
  
  // Mobile detection
  if (!isMobile) {
    isMobile = /mobile/i.test(userAgent);
  }
  
  return {
    browser,
    os,
    isMobile,
    userAgent
  };
}

/**
 * Generate a unique ID for tracking requests
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Parse Pagination Parameters from the request
 */
export function parsePaginationParams(req: Request): { 
  limit: number; 
  offset: number;
  page: number;
} {
  // Default values
  const defaultLimit = 10;
  const maxLimit = 100;
  
  // Parse query parameters
  const queryLimit = req.query.limit ? parseInt(req.query.limit as string) : defaultLimit;
  const queryPage = req.query.page ? parseInt(req.query.page as string) : 1;
  const queryOffset = req.query.offset ? parseInt(req.query.offset as string) : (queryPage - 1) * queryLimit;
  
  // Apply constraints
  const limit = Math.min(Math.max(1, queryLimit), maxLimit);
  const page = Math.max(1, queryPage);
  const offset = Math.max(0, queryOffset);
  
  return { limit, offset, page };
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse(jsonString: string, fallback: any = {}): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize a string to prevent injection attacks
 * This is a very basic implementation - in production use a proper library
 */
export function sanitizeString(input: string): string {
  // Remove HTML tags
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}