import type { Request } from "express";

/**
 * Get the User-Agent string from a request, with fallback
 */
export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'Unknown';
}

/**
 * Extract device information from a request
 */
export function getDeviceInfo(req: Request): {
  browserName: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const userAgent = getUserAgent(req);
  
  // Default values
  const result = {
    browserName: 'Unknown',
    browserVersion: 'Unknown',
    os: 'Unknown',
    osVersion: 'Unknown',
    device: 'Unknown',
    isMobile: false,
    isTablet: false,
    isDesktop: true
  };
  
  // Basic parsing of user agent
  // For production use, consider using a library like ua-parser-js
  
  // Detect browser
  if (/firefox/i.test(userAgent)) {
    result.browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    result.browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    result.browserName = 'Safari';
    const match = userAgent.match(/Version\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (/edg/i.test(userAgent)) {
    result.browserName = 'Edge';
    const match = userAgent.match(/Edg\/([\d.]+)/);
    if (match) result.browserVersion = match[1];
  } else if (/msie|trident/i.test(userAgent)) {
    result.browserName = 'Internet Explorer';
    const match = userAgent.match(/(?:MSIE |rv:)([\d.]+)/);
    if (match) result.browserVersion = match[1];
  }
  
  // Detect OS
  if (/windows/i.test(userAgent)) {
    result.os = 'Windows';
    const match = userAgent.match(/Windows NT ([\d.]+)/);
    if (match) {
      const ntVersion = match[1];
      switch (ntVersion) {
        case '10.0': result.osVersion = '10'; break;
        case '6.3': result.osVersion = '8.1'; break;
        case '6.2': result.osVersion = '8'; break;
        case '6.1': result.osVersion = '7'; break;
        default: result.osVersion = ntVersion;
      }
    }
  } else if (/mac os/i.test(userAgent)) {
    result.os = 'macOS';
    const match = userAgent.match(/Mac OS X ([\d_.]+)/);
    if (match) result.osVersion = match[1].replace(/_/g, '.');
  } else if (/android/i.test(userAgent)) {
    result.os = 'Android';
    const match = userAgent.match(/Android ([\d.]+)/);
    if (match) result.osVersion = match[1];
  } else if (/iphone|ipad/i.test(userAgent)) {
    result.os = 'iOS';
    const match = userAgent.match(/OS ([\d_]+)/);
    if (match) result.osVersion = match[1].replace(/_/g, '.');
  } else if (/linux/i.test(userAgent)) {
    result.os = 'Linux';
  }
  
  // Detect device type
  if (/mobile/i.test(userAgent)) {
    result.isMobile = true;
    result.isDesktop = false;
    
    if (/iphone/i.test(userAgent)) {
      result.device = 'iPhone';
    } else if (/android/i.test(userAgent)) {
      if (/SM-[A-Z]\d+/i.test(userAgent)) {
        result.device = 'Samsung Galaxy';
      } else {
        result.device = 'Android Phone';
      }
    }
  } else if (/tablet|ipad/i.test(userAgent)) {
    result.isTablet = true;
    result.isDesktop = false;
    
    if (/ipad/i.test(userAgent)) {
      result.device = 'iPad';
    } else {
      result.device = 'Tablet';
    }
  }
  
  return result;
}

/**
 * Extract IP geolocation data
 * In a real implementation, this would call an IP geolocation service
 */
export function getIpGeolocation(ip: string): {
  country: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isp: string;
  timezone: string;
} {
  // This is a mock implementation - in a real app you would call an IP geolocation API
  // like MaxMind, ipinfo.io, etc.
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    latitude: null,
    longitude: null,
    isp: 'Unknown',
    timezone: 'Unknown'
  };
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency 
  }).format(amount);
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sanitize a URL (basic implementation)
 */
export function sanitizeUrl(url: string): string {
  // Remove potentially harmful protocols
  if (/^(javascript|data|vbscript):/i.test(url)) {
    return '#';
  }
  
  // Ensure http/https protocol
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * Get client info from request
 */
export function getClientInfo(req: Request): {
  ip: string;
  userAgent: string;
  referer: string;
  deviceInfo: ReturnType<typeof getDeviceInfo>;
} {
  return {
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
    referer: req.get('Referer') || '',
    deviceInfo: getDeviceInfo(req)
  };
}

/**
 * Get the client IP address, handling proxies and load balancers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (typeof forwardedFor === 'string') {
    // Get the first IP in the chain (client IP)
    return forwardedFor.split(',')[0].trim();
  }
  
  return req.ip || '0.0.0.0';
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Check if a value is a valid email format
 */
export function isValidEmail(email: string): boolean {
  // Basic email format validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if a value is a valid phone number format
 * This is a very basic check - production systems would use a proper phone validation library
 */
export function isValidPhone(phone: string): boolean {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Check if we have a reasonable number of digits for a phone number
  return digits.length >= 7 && digits.length <= 15;
}