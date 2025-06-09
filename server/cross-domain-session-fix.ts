/**
 * Cross-Domain Session and Cookie Management Fix
 * Addresses auto-login issues after logout across different domains
 */
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";

interface CrossDomainConfig {
  domains: string[];
  cookieDomain?: string;
  subdomainCookies?: boolean;
}

/**
 * Enhanced session configuration with cross-domain support
 */
export function configureCrossDomainSession(app: Express, config: CrossDomainConfig = { domains: [] }) {
  // Determine the appropriate cookie domain based on environment and configuration
  const getCookieDomain = (req: Request): string | undefined => {
    const host = req.get('host') || '';
    
    // In development, don't set domain to allow localhost
    if (process.env.NODE_ENV === 'development') {
      return undefined;
    }
    
    // For Replit domains, extract the base domain
    if (host.includes('.replit.dev')) {
      // Extract base replit domain for cookie sharing
      const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
      if (replitMatch) {
        return `.${replitMatch[1]}`;
      }
    }
    
    // For custom domains, use the configured domain
    if (config.cookieDomain) {
      return config.cookieDomain;
    }
    
    // For subdomain cookies, extract the main domain
    if (config.subdomainCookies) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        return `.${parts.slice(-2).join('.')}`;
      }
    }
    
    return undefined;
  };

  return {
    getCookieDomain,
    
    // Enhanced session configuration
    getSessionConfig: (req: Request): session.SessionOptions => {
      const cookieDomain = getCookieDomain(req);
      
      return {
        secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
        resave: false,
        saveUninitialized: false,
        name: 'dedwen_session',
        cookie: {
          maxAge: 1000 * 60 * 15, // 15 minutes
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          domain: cookieDomain,
          path: '/'
        },
        rolling: true
      };
    }
  };
}

/**
 * Middleware to handle cross-domain logout state
 */
export function crossDomainLogoutMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check for cross-domain logout signals
    const logoutHeaders = [
      'x-user-logged-out',
      'x-auth-logged-out',
      'x-cross-domain-logout'
    ];
    
    const isLoggedOut = logoutHeaders.some(header => 
      req.headers[header] === 'true'
    );
    
    // Check for logout cookies across domains
    const cookies = req.headers.cookie || '';
    const hasLogoutCookie = [
      'user_logged_out=true',
      'dedwen_logout=true',
      'cross_domain_logout=true'
    ].some(cookieCheck => cookies.includes(cookieCheck));
    
    // Skip logout check for auth endpoints
    const isAuthEndpoint = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/login',
      '/api/register'
    ].some(endpoint => req.path.includes(endpoint));
    
    if ((isLoggedOut || hasLogoutCookie) && !isAuthEndpoint) {
      console.log('[CROSS-DOMAIN] Logout state detected, rejecting authentication');
      return res.status(401).json({ 
        message: 'User logged out across domains',
        code: 'CROSS_DOMAIN_LOGOUT'
      });
    }
    
    next();
  };
}

/**
 * Enhanced logout handler with cross-domain support
 */
export function createCrossDomainLogout(domains: string[] = []) {
  return async (req: Request, res: Response) => {
    console.log('[CROSS-DOMAIN] Processing cross-domain logout');
    
    try {
      // Destroy the session
      if (req.session) {
        await new Promise<void>((resolve, reject) => {
          req.session.destroy((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      // Clear authentication
      if (req.logout) {
        await new Promise<void>((resolve) => {
          req.logout(() => resolve());
        });
      }
      
      // Set cross-domain logout cookies
      const cookieOptions = {
        httpOnly: false, // Allow JavaScript access for cross-domain cleanup
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 5000, // 5 seconds - short-lived signal
        path: '/'
      };
      
      // Set logout cookies for all configured domains
      res.cookie('dedwen_logout', 'true', cookieOptions);
      res.cookie('user_logged_out', 'true', cookieOptions);
      res.cookie('cross_domain_logout', 'true', cookieOptions);
      
      // Set domain-specific logout cookies if domains are configured
      domains.forEach(domain => {
        res.cookie('dedwen_logout', 'true', { ...cookieOptions, domain });
        res.cookie('user_logged_out', 'true', { ...cookieOptions, domain });
      });
      
      // Clear session cookies across domains
      const clearCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/'
      };
      
      // Clear main session cookies
      res.clearCookie('dedwen_session', clearCookieOptions);
      res.clearCookie('sessionId', clearCookieOptions);
      res.clearCookie('connect.sid', clearCookieOptions);
      
      // Clear domain-specific session cookies
      domains.forEach(domain => {
        res.clearCookie('dedwen_session', { ...clearCookieOptions, domain });
        res.clearCookie('sessionId', { ...clearCookieOptions, domain });
        res.clearCookie('connect.sid', { ...clearCookieOptions, domain });
      });
      
      // Set headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Clear-Site-Data': '"cache", "cookies", "storage"'
      });
      
      console.log('[CROSS-DOMAIN] Logout completed successfully');
      
      res.json({ 
        success: true, 
        message: 'Logged out successfully across all domains',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('[CROSS-DOMAIN] Logout error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Logout failed',
        error: error.message 
      });
    }
  };
}

/**
 * Middleware to detect and handle domain transitions
 */
export function domainTransitionMiddleware(allowedDomains: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('origin');
    const host = req.get('host');
    const referer = req.get('referer');
    
    // Log domain transition for debugging
    if (origin && origin !== `https://${host}` && origin !== `http://${host}`) {
      console.log(`[CROSS-DOMAIN] Domain transition detected: ${origin} -> ${host}`);
      
      // Check if transition is from an allowed domain
      const isAllowedTransition = allowedDomains.some(domain => 
        origin.includes(domain) || referer?.includes(domain)
      );
      
      if (!isAllowedTransition && allowedDomains.length > 0) {
        console.log(`[CROSS-DOMAIN] Blocking unauthorized domain transition`);
        return res.status(403).json({ 
          message: 'Unauthorized domain transition',
          code: 'DOMAIN_TRANSITION_BLOCKED'
        });
      }
    }
    
    next();
  };
}

/**
 * Client-side script injection for cross-domain logout coordination
 */
export function getCrossDomainLogoutScript(domains: string[] = []) {
  return `
    <script>
      (function() {
        // Cross-domain logout coordination
        window.crossDomainLogout = function() {
          // Set logout flags in all available storage
          try {
            localStorage.setItem('dedwen_logged_out', 'true');
            sessionStorage.setItem('dedwen_logged_out', 'true');
            
            // Set logout cookies for current domain
            document.cookie = 'dedwen_logout=true; path=/; max-age=5';
            document.cookie = 'user_logged_out=true; path=/; max-age=5';
            
            console.log('[CROSS-DOMAIN] Logout state synchronized');
          } catch (e) {
            console.error('[CROSS-DOMAIN] Error setting logout state:', e);
          }
        };
        
        // Auto-clear logout flags after timeout
        setTimeout(function() {
          try {
            localStorage.removeItem('dedwen_logged_out');
            sessionStorage.removeItem('dedwen_logged_out');
            document.cookie = 'dedwen_logout=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'user_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            console.log('[CROSS-DOMAIN] Logout flags auto-cleared');
          } catch (e) {
            console.error('[CROSS-DOMAIN] Error clearing logout flags:', e);
          }
        }, 10000); // 10 seconds
        
        // Listen for storage changes from other tabs/domains
        window.addEventListener('storage', function(e) {
          if (e.key === 'dedwen_logged_out' && e.newValue === 'true') {
            console.log('[CROSS-DOMAIN] Logout detected from another tab/domain');
            window.crossDomainLogout();
          }
        });
        
      })();
    </script>
  `;
}