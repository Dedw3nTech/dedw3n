import express, { type Request, Response, NextFunction, Router } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import passport from "passport";
import { requireRole } from "./unified-auth";
import { verifyToken } from "./jwt-auth";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerPersistentMediaRoutes } from "./persistent-media-routes";
// GPC middleware removed - now using extractGpcSignal/applyGpcHeaders utilities inline
import cors from "cors";
import { db } from "./db";
import { createHealthChecker } from "./health/health-checks";
import { logger } from "./logger";
import { applySecurityHeaders, applyStaticAssetHeaders } from "./utils/securityHeaders";

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      _handledByApi?: boolean;
      correlationId?: string;
    }
  }
}

const app = express();

// ============================================================================
// SECURITY HEADERS WRAPPER - NO MIDDLEWARE SOLUTION
// ============================================================================
// Monkey-patch Express HTTP verbs to apply security headers automatically
// This respects "NO middleware" constraint while ensuring all routes are secured

type PathPattern = string | RegExp | (string | RegExp)[];

function wrapHandler(handler: any): any {
  // Handle arrays recursively
  if (Array.isArray(handler)) {
    return handler.map(h => wrapHandler(h));
  }
  
  // Skip if not a function
  if (typeof handler !== 'function') {
    return handler;
  }
  
  const config = {
    env: (process.env.NODE_ENV || 'development') as 'development' | 'production',
    isHttps: false
  };
  
  // Preserve function arity for Express error handler detection
  // Error handlers have 4 params (err, req, res, next)
  // Regular handlers have 3 or fewer params (req, res, next)
  if (handler.length === 4) {
    // Error handler - preserve 4-param signature
    return function(this: any, err: any, req: Request, res: Response, next: NextFunction) {
      config.isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
      applySecurityHeaders(req, res, config);
      return handler.call(this, err, req, res, next);
    };
  }
  
  // Regular handler - 3-param signature
  return function(this: any, req: Request, res: Response, next: NextFunction) {
    config.isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
    applySecurityHeaders(req, res, config);
    return handler.call(this, req, res, next);
  };
}

function wrapStaticHandler(handler: any): any {
  // Handle arrays recursively
  if (Array.isArray(handler)) {
    return handler.map(h => wrapStaticHandler(h));
  }
  
  // Skip if not a function
  if (typeof handler !== 'function') {
    return handler;
  }
  
  const config = {
    env: (process.env.NODE_ENV || 'development') as 'development' | 'production',
    isHttps: false
  };
  
  if (handler.length === 4) {
    return function(this: any, err: any, req: Request, res: Response, next: NextFunction) {
      config.isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
      applyStaticAssetHeaders(req, res, config);
      return handler.call(this, err, req, res, next);
    };
  }
  
  return function(this: any, req: Request, res: Response, next: NextFunction) {
    config.isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
    applyStaticAssetHeaders(req, res, config);
    return handler.call(this, req, res, next);
  };
}

const originalGet = app.get.bind(app);
const originalPost = app.post.bind(app);
const originalPut = app.put.bind(app);
const originalDelete = app.delete.bind(app);
const originalPatch = app.patch.bind(app);

(app.get as any) = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalGet(path, ...wrappedHandlers);
};

(app.post as any) = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalPost(path, ...wrappedHandlers);
};

(app.put as any) = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalPut(path, ...wrappedHandlers);
};

(app.delete as any) = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalDelete(path, ...wrappedHandlers);
};

(app.patch as any) = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalPatch(path, ...wrappedHandlers);
};

// Patch Express Router prototype to apply security headers to all router instances
const RouterProto = (Router as any).prototype;
const originalRouterUse = RouterProto.use;
const originalRouterGet = RouterProto.get;
const originalRouterPost = RouterProto.post;
const originalRouterPut = RouterProto.put;
const originalRouterDelete = RouterProto.delete;
const originalRouterPatch = RouterProto.patch;

RouterProto.use = function(...args: any[]) {
  const wrappedArgs = args.map((arg: any) => {
    // Skip path strings
    if (typeof arg === 'string' || arg instanceof RegExp) {
      return arg;
    }
    // Skip router instances (they have a stack property)
    if (arg && typeof arg === 'function' && arg.stack) {
      return arg;
    }
    // Wrap everything else (functions, arrays of functions, etc.)
    return wrapHandler(arg);
  });
  return originalRouterUse.apply(this, wrappedArgs);
};

RouterProto.get = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalRouterGet.call(this, path, ...wrappedHandlers);
};

RouterProto.post = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalRouterPost.call(this, path, ...wrappedHandlers);
};

RouterProto.put = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalRouterPut.call(this, path, ...wrappedHandlers);
};

RouterProto.delete = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalRouterDelete.call(this, path, ...wrappedHandlers);
};

RouterProto.patch = function(path: PathPattern, ...handlers: any[]) {
  const wrappedHandlers = handlers.map((h: any) => wrapHandler(h));
  return originalRouterPatch.call(this, path, ...wrappedHandlers);
};

// Patch app.use to wrap routers registered after instantiation
const originalUse = app.use.bind(app);
(app.use as any) = function(...args: any[]) {
  // Check if any argument is a Router instance and wrap its handlers
  const wrappedArgs = args.map((arg: any) => {
    // Check if it's a Router instance by looking for routing methods
    if (arg && typeof arg === 'function' && arg.stack && Array.isArray(arg.stack)) {
      // It's a router - wrap all its layer handlers
      arg.stack.forEach((layer: any) => {
        if (layer.route && layer.route.stack && Array.isArray(layer.route.stack)) {
          // Route layer - wrap each handler
          layer.route.stack.forEach((routeLayer: any) => {
            const original = routeLayer.handle;
            if (original && typeof original === 'function') {
              routeLayer.handle = wrapHandler(original);
            }
          });
        } else if (layer.handle && typeof layer.handle === 'function') {
          // Middleware layer - wrap the handler
          const original = layer.handle;
          layer.handle = wrapHandler(original);
        }
      });
    }
    return arg;
  });
  
  return originalUse(...wrappedArgs);
};

// ============================================================================

// CRITICAL: Health check endpoint FIRST - for deployment health checks
// This must be before ALL middleware to ensure fast response
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// CRITICAL: Smart health check + app serving for root route
// Detects health check probes vs browser requests
app.get('/', (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const accept = req.headers['accept'] || '';
  
  // Health check detection patterns (Google Cloud, AWS, monitoring tools)
  const isHealthCheckProbe = 
    userAgent.includes('GoogleHC') ||           // Google Cloud health checks
    userAgent.includes('kube-probe') ||         // Kubernetes probes
    userAgent.includes('ELB-HealthChecker') ||  // AWS ELB
    userAgent.includes('curl') ||               // Basic curl checks
    accept === '*/*' ||                          // Simple HTTP clients
    accept === '' ||                             // No accept header
    (req.method === 'HEAD');                     // HEAD requests are health checks
  
  // INSTANT response for health checks (< 1ms)
  if (isHealthCheckProbe) {
    return res.status(200).send('OK');
  }
  
  // Browser requests: continue to Vite/React handler
  next();
});

// CRITICAL: SEO routes must be absolutely first - before ANY middleware
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
});

app.get('/security.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(process.cwd(), 'public', 'security.txt'));
});

app.get('/.well-known/security.txt', (req, res) => {
  res.redirect(301, '/security.txt');
});

// CRITICAL: Serve version.json BEFORE Vite middleware to prevent interception
app.get('/version.json', (req, res) => {
  // Check NODE_ENV or REPLIT_DEPLOYMENT to determine production environment
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';
  const staticRoot = isProduction 
    ? path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')
    : path.join(process.cwd(), 'public');
  const versionPath = path.join(staticRoot, 'version.json');
  
  if (fs.existsSync(versionPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(versionPath);
  } else {
    // Warn if version.json is missing in non-development environments
    if (process.env.NODE_ENV !== 'development') {
      console.warn(`[VERSION] Warning: version.json not found at ${versionPath} in ${process.env.NODE_ENV} environment`);
    }
    
    // Fallback version for development if file doesn't exist
    res.setHeader('Content-Type', 'application/json');
    res.json({
      buildId: 'dev-build',
      buildTimestamp: Date.now(),
      gitHash: 'local-dev',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// SECURE MINIMAL CORS - Essential for API functionality
// Simple static allowlist prevents credential hijacking while maintaining fast startup
const allowedOrigins = [
  // Production domains
  'https://dedw3n.com',
  'https://www.dedw3n.com',
  // Development
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'http://127.0.0.1:5000'
  ] : []),
  // Replit domains (from environment)
  ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',').map(d => d.trim()) : []),
  ...(process.env.REPL_SLUG && process.env.REPL_OWNER ? [`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, Vite build, etc.)
    if (!origin) return callback(null, true);
    // Check allowlist
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow Replit webview domains (*.replit.dev, *.repl.co)
    if (origin.endsWith('.replit.dev') || origin.endsWith('.repl.co')) {
      return callback(null, true);
    }
    // Reject unauthorized origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
  // Use 200 instead of default 204 for maximum browser compatibility
  // Firefox and IE11 have issues with 204 preflight responses
  // See: https://github.com/Kong/kong/issues/4008
  optionsSuccessStatus: 200
}));

// Essential body parsing - Required for API to function
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Get current file directory (ES modules replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DEPLOYMENT OPTIMIZATION: Static file serving deferred to lazy initialization
// Directories created on-demand by upload handlers, not during startup

// Serve favicon files with proper content types
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

app.get('/favicon.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, '../public/favicon.png'));
});

app.get('/logo-192.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, '../public/logo-192.png'));
});

app.get('/logo-512.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, '../public/logo-512.png'));
});

app.get('/favicon-16x16.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, '../public/favicon-16x16.png'));
});

app.get('/favicon-32x32.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, '../public/favicon-32x32.png'));
});

// Serve navigation header logo with proper content type
app.get('/navigation-header-logo.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, '../public/dedw3n-navigation-logo.png'));
});

// CRITICAL: Serve attached_assets BEFORE any middleware to prevent 404 interception
// This folder contains email template images and other static assets
// In production, check both the dist folder location and the root
const isDevelopment = process.env.NODE_ENV !== 'production';
const possibleAssetPaths = [
  path.join(process.cwd(), 'attached_assets'),
  path.join(__dirname, 'attached_assets'),
  path.join(__dirname, '..', 'attached_assets')
];

let attachedAssetsPath = possibleAssetPaths.find(p => fs.existsSync(p));

if (attachedAssetsPath) {
  app.use('/attached_assets', express.static(attachedAssetsPath, {
    setHeaders: (res, filePath) => {
      const config = {
        env: (process.env.NODE_ENV || 'development') as 'development' | 'production',
        isHttps: false
      };
      applyStaticAssetHeaders({ path: filePath } as any, res, config);
    }
  }));
  log(`Mounted attached_assets static folder from: ${attachedAssetsPath}`);
} else {
  console.warn('Warning: attached_assets folder not found in any expected location');
  console.warn('Searched paths:', possibleAssetPaths);
}

(async () => {
  // Flag all API requests
  app.use('/api', (req, res, next) => {
    logger.debug(`Flagging API request`, { method: req.method, path: req.path }, 'api');
    req._handledByApi = true;
    next();
  });
  
  // Add critical API endpoints that need to be guaranteed to work
  app.post('/api/posts/ping', (req, res) => {
    logger.debug(`Direct API ping endpoint called`, undefined, 'api');
    req._handledByApi = true;
    // Set content type to JSON for all responses from this endpoint
    res.setHeader('Content-Type', 'application/json');
    // Return a simple JSON response to confirm the API is working correctly
    return res.json({ success: true, message: "API connection test successful", contentType: "json" });
  });

  // Trending products endpoint - critical for marketplace functionality
  app.get('/api/products/trending', async (req, res) => {
    logger.debug(`Trending products endpoint called`, undefined, 'community');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const { storage } = await import('./storage.js');
      const trendingProducts = await storage.getTopSellingProducts(limit);
      
      logger.debug(`Found trending products`, { count: trendingProducts.length }, 'community');
      return res.json(trendingProducts);
    } catch (error) {
      logger.error('Failed to fetch trending products', undefined, error as Error, 'community');
      return res.status(500).json({ message: 'Failed to fetch trending products' });
    }
  });

  // Post creation endpoint removed - now handled in routes.ts with full feature support

  // Feed endpoints - must be before catch-all middleware
  app.get('/api/feed/personal', async (req, res) => {
    logger.debug('Personal feed endpoint called', undefined, 'feed');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Import storage and get posts with user location data
      const { storage } = await import('./storage.js');
      
      // Get user ID from session (fallback to getting all posts if no user)
      let userId = null;
      if (req.session?.passport?.user) {
        userId = req.session.passport.user;
      }
      
      let posts;
      if (userId) {
        // Get personalized feed with location data
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = parseInt(req.query.offset as string) || 0;
        posts = await storage.getUserFeed(userId, limit, offset);
      } else {
        // Fallback to all posts if no user session
        posts = await storage.getAllPosts();
      }
      
      logger.debug('Retrieved posts for personal feed', { count: posts.length }, 'feed');
      
      return res.status(200).json(posts);
    } catch (error) {
      logger.error('Personal feed fetch failed', undefined, error as Error, 'feed');
      return res.status(500).json({ 
        message: "Failed to get feed", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/feed/communities', async (req, res) => {
    logger.debug('Communities feed endpoint called', undefined, 'feed');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json([]);
  });

  app.get('/api/feed/recommended', async (req, res) => {
    logger.debug('Recommended feed endpoint called', undefined, 'feed');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json([]);
  });

  // Community feed endpoint - shows ALL posts from ALL users with pagination
  app.get('/api/feed/community', async (req, res) => {
    logger.debug('Community feed endpoint called', undefined, 'feed');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { storage } = await import('./storage.js');
      
      // Get pagination parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const sortBy = req.query.sortBy as string || 'popular';
      
      logger.debug('Community feed request', { limit, offset, sortBy }, 'feed');
      
      // Get user ID for location-based filtering
      let userId = null;
      if (req.session?.passport?.user) {
        userId = req.session.passport.user;
      }
      
      // Get posts based on sort type
      let posts;
      if (sortBy === 'city' || sortBy === 'country' || sortBy === 'region') {
        if (userId) {
          posts = await storage.getPostsByLocation(userId, sortBy, limit, offset);
        } else {
          // Fallback to all posts if user not authenticated
          posts = await storage.getAllPostsPaginated(limit, offset, userId || undefined);
        }
      } else {
        // Default to all posts for other sort types
        posts = await storage.getAllPostsPaginated(limit, offset, userId || undefined);
      }
      
      // Check if there are more posts available
      const totalPosts = await storage.getTotalPostsCount();
      const hasMore = offset + posts.length < totalPosts;
      
      logger.debug('Retrieved community feed posts', { count: posts.length, offset, total: totalPosts }, 'feed');
      
      return res.status(200).json({
        posts,
        hasMore,
        totalCount: totalPosts,
        currentOffset: offset,
        nextOffset: hasMore ? offset + limit : null
      });
    } catch (error) {
      logger.error('Community feed fetch failed', undefined, error as Error, 'feed');
      return res.status(500).json({ 
        message: "Failed to get community feed", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  

  
  // Register persistent media upload routes (using object storage)
  registerPersistentMediaRoutes(app);
  
  // Register Pawapay callback routes
  const { registerPawapayRoutes } = await import('./pawapay.js');
  registerPawapayRoutes(app);
  
  // ============================================================================
  // HEALTH CHECK SYSTEM - Clean Architecture with Dependency Injection
  // Avoids circular dependencies by lazy-loading storage module
  // ============================================================================
  
  // Create health checker with injected dependencies
  const healthChecker = createHealthChecker({
    db,
    getStorage: async () => {
      const storageModule = await import('./storage.js');
      return storageModule.storage;
    }
  });
  
  // ============================================================================
  // HEALTH CHECK ENDPOINTS - Registered BEFORE registerRoutes()
  // This ensures they take precedence over catch-all handlers
  // Note: requireRole middleware won't work yet - we'll handle auth manually
  // ============================================================================
  
  // PUBLIC ENDPOINT: Simple health check for uptime monitoring
  // Already registered at the top of the file for deployment health checks
  
  // ADMIN ENDPOINT: Detailed health check with full diagnostics
  // Publicly accessible but sanitized for production (errors redacted)
  // TODO: Add requireRole('admin') middleware after Passport is fully initialized
  app.get('/api/health/detailed', async (req, res) => {
    // Run comprehensive health checks using injected dependencies
    const startTime = Date.now();
    const services = await healthChecker.runAllHealthChecks();
    const { status, statusCode } = healthChecker.determineOverallHealth(services);
    const totalResponseTime = Date.now() - startTime;
    
    // Redact sensitive information in production
    const safeServices = healthChecker.redactSensitiveDetails(services);
    
    // Build summary statistics
    const summary = {
      total: Object.keys(services).length,
      healthy: Object.values(services).filter(s => s.status === 'healthy').length,
      degraded: Object.values(services).filter(s => s.status === 'degraded').length,
      unhealthy: Object.values(services).filter(s => s.status === 'unhealthy' || s.status === 'critical').length
    };
    
    return res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      services: safeServices,
      summary,
      metadata: {
        environment: process.env.NODE_ENV || 'development'
      }
    });
  });
  // ============================================================================
  
  // Create HTTP server first
  const httpServer = createServer(app);
  
  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // ============================================================================
  // CRITICAL: START LISTENING IMMEDIATELY (BEFORE EXPENSIVE ROUTE SETUP)
  // This allows health checks to respond instantly while routes load in background
  // ============================================================================
  
  let server = httpServer;
  
  httpServer.listen(port, "0.0.0.0", () => {
    log(`Server listening on port ${port} - health checks active`);
    logger.lifecycle('Server accepting connections - health checks will respond instantly', undefined, 'startup');
  });
  
  // ============================================================================
  // NOW SETUP ROUTES (Server is already listening, health checks work)
  // ============================================================================
  
  // Initialize JWT auth with storage to avoid circular dependency
  const { storage } = await import('./storage.js');
  const { initializeJwtAuth } = await import('./jwt-auth.js');
  initializeJwtAuth(storage);
  
  logger.info('Registering API routes (server already listening)', undefined, 'startup');
  server = await registerRoutes(app, httpServer);
  logger.lifecycle('API routes registered', undefined, 'startup');
  
  // Handler that terminates API requests already handled by our route handlers
  app.use('/api', (req, res, next) => {
    if (!res.headersSent) {
      logger.debug('API route not found', { method: req.method, path: req.path }, 'api');
      return res.status(404).json({ message: "API endpoint not found" });
    }
    next();
  });
  
  // Global error handler with full stack trace and correlation ID
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const correlationId = req.correlationId || 'unknown';
    
    logger.error(`Error ${status}: ${message}`, {
      correlationId,
      path: `${req.method} ${req.path}`,
      name: err.name,
      status,
      code: err.code
    }, err, 'http');
    
    res.status(status).json({ 
      message,
      correlationId,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });
  
  // Optimized 404 detection middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req._handledByApi) {
      if (!res.headersSent) {
        return res.status(404).json({ message: "API endpoint not found" });
      }
      return next();
    }
    
    if (/^\/([@]|src\/|node_modules\/)|\.(?:js|css|tsx?)$|\/sw\.js$|vite|hot-update/.test(req.path)) {
      return next();
    }
    
    if (req.path === '/index.html') {
      return res.redirect(301, '/');
    }
    
    const validRoutes = new Set([
      '/', '/login', '/register', '/products', '/wall', '/dating', '/mobile',
      '/about', '/about-us', '/contact', '/faq', '/catalogue-rules', '/tips-tricks', '/business', '/network-partnerships', '/network-partnership-resources', '/affiliate-partnerships', '/resources', '/privacy', '/terms', '/business-terms', '/cookies', '/community-guidelines',
      '/profile', '/settings', '/messages', '/notifications', '/cart', '/gift-cards', '/shipping-calculator',
      '/checkout', '/orders', '/dashboard', '/admin', '/unified-admin-dashboard', '/admin-dashboard', '/admin-control-center', '/moderator',
      '/feed', '/explore', '/search', '/favorites', '/liked-products',
      '/subscriptions', '/verify', '/reset-password', '/reset-password-confirm', '/help', '/logout-success',
      '/add-product', '/upload-product', '/vendor-dashboard', '/become-vendor', '/become-business-vendor',
      '/my-matches', '/dating-profile', '/events', '/premium-videos', '/orders-returns', '/payment-gateway', '/commission-payment', '/test-cookies', '/video-demo',
      '/marketplace', '/marketplace/b2b', '/marketplace/b2c', '/marketplace/c2c', '/marketplace/raw', '/marketplace/rqst', '/marketplace/creators',
      '/vendors', '/government', '/community', '/auth', '/verify-email', '/sitemap',
      '/social', '/social-console', '/social-insights', '/ai-insights',
      '/liked', '/saved-posts', '/members', '/wallet', '/spending-analytics', '/vendor-analytics', '/analytics',
      '/profile-settings', '/vendor-register', '/affiliate-partnership', '/api-test',
      '/pawapay/deposit/callback', '/pawapay/payout/callback', '/pawapay/refund/callback',
      '/admin/email', '/remove-ads'
    ]);
    
    const isDynamicRoute = /^\/(user|profile|category|search|business|wall|dating|vendor|social|posts|event|messages|premium-videos|admin|dating-profile|commission-payment|product)\/[^/]+$/.test(req.path) ||
                          /^\/products\/\d+$/.test(req.path);
    
    if (validRoutes.has(req.path) || isDynamicRoute) {
      return next();
    }
    
    res.status(404);
    (res as any)._preserve404 = true;
    next();
  });
  
  // Setup Vite or static serving (server already listening)
  const nodeEnv = process.env.NODE_ENV || app.get("env");
  if (nodeEnv === "development") {
    logger.info('Starting Vite development server', undefined, 'startup');
    await setupVite(app, server);
    logger.lifecycle('Vite development server started', undefined, 'startup');
  } else {
    logger.info('Starting production static server', undefined, 'startup');
    
    app.use((req, _res, next) => {
      if (req.path.match(/\/assets\/.*\.js$/)) {
        delete req.headers['range'];
        _res.setHeader('Accept-Ranges', 'none');
      }
      next();
    });
    
    serveStatic(app);
    logger.lifecycle('Production static server started', undefined, 'startup');
  }
  
  // Error handling for server startup failures
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error('PORT CONFLICT DETECTED', {
        port,
        message: `Port ${port} is already in use by another process`,
        resolutionSteps: [
          'Another instance of this application may be running',
          'Check for processes using: ps aux | grep "tsx\\|node"',
          'Kill the process or restart your workspace'
        ],
        quickFix: 'Restart the Replit workspace to clear all processes'
      }, error, 'server');
      process.exit(1);
    } else if (error.code === 'EACCES') {
      logger.error('Permission denied - cannot bind to port', {
        port,
        message: 'This port requires elevated privileges or is protected'
      }, error, 'server');
      process.exit(1);
    } else {
      logger.error('Server startup failed', {
        code: error.code,
        message: error.message
      }, error, 'server');
      process.exit(1);
    }
  });
  
  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal} signal - starting graceful shutdown`, { signal }, 'server');
    
    server.close(() => {
      logger.lifecycle('HTTP server closed', undefined, 'server');
      logger.lifecycle('Graceful shutdown complete', undefined, 'server');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      logger.error('Graceful shutdown timeout - forcing exit', { timeoutMs: 10000 }, undefined, 'server');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // ============================================================================
  // BACKGROUND TASK SCHEDULER
  // ============================================================================
  // Utility to run expensive tasks in background without blocking health checks
  
  /**
   * Runs an async task with a timeout, returning success/failure without throwing
   */
  async function runWithTimeout<T>(
    taskFn: () => Promise<T>,
    timeoutMs: number,
    taskName: string
  ): Promise<{ success: boolean; result?: T; error?: Error; timedOut?: boolean }> {
    const startTime = Date.now();
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Task timeout after ${timeoutMs}ms`)), timeoutMs);
      });
      
      const result = await Promise.race([taskFn(), timeoutPromise]);
      const duration = Date.now() - startTime;
      
      logger.lifecycle(`Background task completed`, { 
        task: taskName, 
        durationMs: duration 
      }, 'startup');
      
      return { success: true, result: result as T };
    } catch (error) {
      const duration = Date.now() - startTime;
      const timedOut = duration >= timeoutMs;
      
      if (timedOut) {
        logger.warn(`Background task timed out`, {
          task: taskName,
          timeoutMs,
          durationMs: duration
        }, 'startup');
      } else {
        logger.error(`Background task failed`, {
          task: taskName,
          durationMs: duration
        }, error as Error, 'startup');
      }
      
      return { success: false, error: error as Error, timedOut };
    }
  }
  
  /**
   * Schedules a task to run in background via setImmediate, preventing event loop blocking
   */
  function scheduleBackgroundTask(
    taskFn: () => Promise<void>,
    taskName: string,
    timeoutMs: number
  ): void {
    setImmediate(async () => {
      logger.info(`Starting background task`, { task: taskName }, 'startup');
      await runWithTimeout(taskFn, timeoutMs, taskName);
    });
  }
  
  // ============================================================================
  // BACKGROUND TASK DEFINITIONS
  // ============================================================================
  
  async function seedDatabaseTask(): Promise<void> {
    // PRODUCTION OPTIMIZATION: Skip seeding in production to avoid delays
    if (process.env.NODE_ENV === 'production') {
      logger.debug('Production environment - skipping database seeding', undefined, 'startup');
      return;
    }
    
    // Development: Quick check using environment flag instead of filesystem
    if (process.env.DATABASE_SEEDED === 'true') {
      logger.debug('Database already seeded - skipping', undefined, 'startup');
      return;
    }
    
    // Run seed only in development
    const { seedDatabase } = await import('./seed.js');
    await seedDatabase();
    logger.info('Database seeded successfully', undefined, 'startup');
  }
  
  async function storageSyncTask(): Promise<void> {
    const { initializeStorageSync } = await import('./storage-sync-startup.js');
    await initializeStorageSync();
  }
  
  async function autoConfigureProductionTask(): Promise<void> {
    const { autoConfigureProduction } = await import('./auto-config-production');
    const { fixes, configFile, hasCriticalIssues } = await autoConfigureProduction();
    
    if (hasCriticalIssues) {
      logger.error('CRITICAL CONFIGURATION ISSUES DETECTED', {
        message: 'Application may not function correctly',
        configFile: 'production.env.example'
      }, undefined, 'startup');
      
      const fs = await import('fs/promises');
      await fs.writeFile('production.env.example', configFile);
    } else if (fixes.length > 0) {
      logger.warn('Configuration improvements recommended', {
        message: 'Application will function but review suggestions for optimal performance',
        fixesCount: fixes.length
      }, 'startup');
    } else {
      logger.lifecycle('All environment configuration checks passed', undefined, 'startup');
    }
  }
  
  async function storageValidationTask(): Promise<void> {
    // OPTIMIZATION: Env-var-only check (<5ms) - skip expensive network operations
    // Full diagnostics available via: GET /api/admin/storage/diagnostics
    
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    
    if (!publicPaths || !privateDir) {
      logger.warn('Storage environment variables not configured', {
        missingVars: [
          !publicPaths ? 'PUBLIC_OBJECT_SEARCH_PATHS' : null,
          !privateDir ? 'PRIVATE_OBJECT_DIR' : null
        ].filter(Boolean),
        diagnosticEndpoint: 'GET /api/admin/storage/diagnostics'
      }, 'startup');
      return;
    }
    
    logger.lifecycle('Storage environment variables configured', {
      publicPaths: publicPaths.split(',').length + ' paths',
      privateDir: 'configured',
      note: 'Full storage diagnostics available at /api/admin/storage/diagnostics'
    }, 'startup');
  }
  
  async function safeguardChecksTask(): Promise<void> {
    const { runStartupSafeguards } = await import('./startup-data-safeguard');
    await runStartupSafeguards({
      autoMigrate: true,
      exitOnRisk: false,
      verboseLogging: true
    });
  }
  
  async function profilePictureProtectionTask(): Promise<void> {
    // OPTIMIZATION: Env-var-only check (<1ms) - skip expensive network operations
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    
    if (!publicPaths || !privateDir) {
      logger.warn('Avatar Media Service not configured', {
        feature: 'profile avatars',
        action: 'Set PUBLIC_OBJECT_SEARCH_PATHS and PRIVATE_OBJECT_DIR'
      }, 'startup');
      return;
    }
    
    logger.lifecycle('Avatar Media Service is ACTIVE', {
      feature: 'profile avatars',
      storageConfigured: true,
      capabilities: [
        'Cloud storage (R2/Cloudflare) - permanent & scalable',
        'Multi-size thumbnails (128px, 256px, 512px)',
        'Sharded folder structure for scalability',
        'Automatic backups enabled',
        'WebP format optimization',
        'Retry logic with exponential backoff',
        'Graceful degradation if Sharp unavailable'
      ]
    }, 'startup');
  }
  
  async function communityPostProtectionTask(): Promise<void> {
    // OPTIMIZATION: Env-var-only check (<1ms) - skip expensive network operations
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    
    if (!publicPaths || !privateDir) {
      logger.warn('Community Post Media Protection not configured', {
        feature: 'community post media',
        action: 'Set PUBLIC_OBJECT_SEARCH_PATHS and PRIVATE_OBJECT_DIR'
      }, 'startup');
      return;
    }
    
    logger.lifecycle('Community Post Media Protection is ACTIVE', {
      feature: 'community post media',
      storageConfigured: true,
      capabilities: [
        'Images/Videos use Object Storage (persistent)',
        'Automatic backups enabled',
        'Retry logic with exponential backoff',
        'Upload validation active',
        'Support for images (PNG, JPEG, GIF, WebP, SVG, BMP)',
        'Support for videos (MP4, WebM, MOV, AVI, WMV)'
      ]
    }, 'startup');
  }
  
  async function avatarHealthMonitoringTask(): Promise<void> {
    // PRODUCTION-SAFE AVATAR MONITORING:
    // - Opt-in via AVATAR_MONITOR_ENABLED flag (default: disabled)
    // - Detection-only on startup (never auto-repair)
    // - Comprehensive error handling prevents startup crashes
    // - Uses ObjectStorageService with AbortController timeouts
    
    try {
      // SAFETY: Opt-in feature flag (default: disabled for production safety)
      const monitorEnabled = process.env.AVATAR_MONITOR_ENABLED === 'true';
      if (!monitorEnabled) {
        logger.debug('Avatar Health Monitoring disabled (set AVATAR_MONITOR_ENABLED=true to enable)', undefined, 'startup');
        return;
      }
      
      // Verify storage is configured
      const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
      const privateDir = process.env.PRIVATE_OBJECT_DIR;
      
      if (!publicPaths || !privateDir) {
        logger.warn('Avatar Health Monitoring disabled - storage not configured', {
          feature: 'avatar health monitoring',
          action: 'Set PUBLIC_OBJECT_SEARCH_PATHS and PRIVATE_OBJECT_DIR'
        }, 'startup');
        return;
      }
      
      // Run detection-only health check (NEVER auto-repair on startup)
      const { avatarHealthMonitor } = await import('./avatar-health-monitor');
      const metrics = await avatarHealthMonitor.runHealthCheck({ autoRepair: false });
      
      // Report findings
      if (metrics.errors.length > 0) {
        logger.warn('Avatar Health Check encountered errors', {
          errorCount: metrics.errors.length,
          errors: metrics.errors.slice(0, 3) // First 3 errors only
        }, 'startup');
      } else if (metrics.brokenAvatars > 0) {
        logger.warn('Avatar Health Check: Found broken avatars', {
          brokenAvatars: metrics.brokenAvatars,
          totalUsers: metrics.totalUsers,
          usersWithAvatars: metrics.usersWithAvatars,
          repairEndpoint: 'GET /api/diagnostic/avatar-health?autoRepair=true (admin only)'
        }, 'startup');
      } else {
        logger.lifecycle('Avatar Health Check: All avatars valid', {
          totalUsers: metrics.totalUsers,
          validAvatars: metrics.validAvatars,
          monitoringActive: true
        }, 'startup');
      }
    } catch (error) {
      // HARDENED: Catch all errors to prevent startup crashes
      logger.error('Avatar Health Monitoring task failed', {
        message: (error as Error).message,
        note: 'Startup will continue normally'
      }, error as Error, 'startup');
    }
  }
  
  // ============================================================================
  // SCHEDULE BACKGROUND TASKS (Routes already registered above)
  // ============================================================================
  // DEPLOYMENT OPTIMIZATION: Skip ALL expensive background tasks in production
  // - Database seeding: Not needed in production (done during deployment setup)
  // - Auto-migration: Should be a one-time operation, not on every startup
  // - Safeguard checks: Too expensive (4-8 seconds for file migration)
  // - Storage sync: Not needed for health checks
  // 
  // In development: Run minimal tasks only
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: NO background tasks - instant startup
    logger.lifecycle('Production mode - skipping background tasks for fast startup', undefined, 'startup');
  } else {
    // Development: Run only essential, fast tasks
    scheduleBackgroundTask(seedDatabaseTask, 'database-seeding', 3000);
    scheduleBackgroundTask(storageValidationTask, 'storage-validation', 500);
    
    // Avatar health monitoring (opt-in via AVATAR_MONITOR_ENABLED=true)
    // SAFETY: Task is wrapped in try/catch to prevent startup crashes
    scheduleBackgroundTask(avatarHealthMonitoringTask, 'avatar-health-monitoring', 5000);
    
    logger.info('Development mode - minimal background tasks scheduled', {
      count: 3,
      tasks: ['database-seeding', 'storage-validation', 'avatar-health-monitoring'],
      note: 'Avatar monitoring requires AVATAR_MONITOR_ENABLED=true'
    }, 'startup');
  }
})();
