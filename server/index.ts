import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import passport from "passport";
import { verifyToken } from "./jwt-auth";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerImageRoutes } from "./image-handler";
import { registerMediaRoutes } from "./media-handler";
import { registerMulterRoutes } from "./multer-media-handler";
import { gpcMiddleware, applyGPCHeaders } from "./gpc-middleware";

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      _handledByApi?: boolean;
    }
  }
}

const app = express();

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

// Add GPC middleware early in the chain
app.use(gpcMiddleware);
app.use(applyGPCHeaders);

// Increase JSON body size limit to 50MB for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Get current file directory (ES modules replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../public/uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log(`Created avatars directory: ${avatarsDir}`);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
console.log(`Serving uploads from: ${path.join(__dirname, '../public/uploads')}`);

// Serve static files from attached_assets directory  
app.use('/attached_assets', express.static(path.join(__dirname, '../attached_assets'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', path.endsWith('.png') ? 'image/png' : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));
console.log(`Serving attached_assets from: ${path.join(__dirname, '../attached_assets')}`);

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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Flag all API requests
  app.use('/api', (req, res, next) => {
    console.log(`[DEBUG] Flagging API request: ${req.method} ${req.path}`);
    req._handledByApi = true;
    next();
  });
  
  // Add critical API endpoints that need to be guaranteed to work
  app.post('/api/posts/ping', (req, res) => {
    console.log('[DEBUG] Direct API ping endpoint called');
    req._handledByApi = true;
    // Set content type to JSON for all responses from this endpoint
    res.setHeader('Content-Type', 'application/json');
    // Return a simple JSON response to confirm the API is working correctly
    return res.json({ success: true, message: "API connection test successful", contentType: "json" });
  });

  // Trending products endpoint - critical for marketplace functionality
  app.get('/api/products/trending', async (req, res) => {
    console.log('[DEBUG] Trending products endpoint called');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const { storage } = await import('./storage.js');
      const trendingProducts = await storage.getTopSellingProducts(limit);
      
      console.log(`[DEBUG] Found ${trendingProducts.length} trending products`);
      return res.json(trendingProducts);
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return res.status(500).json({ message: 'Failed to fetch trending products' });
    }
  });

  // Post creation endpoint - must be before catch-all middleware
  app.post('/api/posts', async (req, res) => {
    console.log('[DEBUG] Post creation endpoint called');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Import storage first for authentication
      const { storage } = await import('./storage.js');
      
      // Enhanced authentication for post creation - mirror messaging authentication pattern
      let userId = req.body.userId;
      
      // Try authentication using the same pattern as messaging
      if (!userId) {
        // First check client headers (enhanced auth pattern)
        const clientUserId = req.headers['x-client-user-id'];
        if (clientUserId && typeof clientUserId === 'string') {
          try {
            const testUserId = parseInt(clientUserId);
            const user = await storage.getUser(testUserId);
            if (user) {
              userId = user.id;
              console.log(`[DEBUG] Client user authenticated for posts: ${user.username} (ID: ${user.id})`);
            }
          } catch (error) {
            console.error('[DEBUG] Error with client user authentication:', error);
          }
        }
      }
      
      // Check session passport data
      if (!userId && req.session?.passport?.user) {
        try {
          const sessionUserId = req.session.passport.user;
          const user = await storage.getUser(sessionUserId);
          if (user) {
            userId = user.id;
            console.log(`[DEBUG] Session user authenticated for posts: ${user.username} (ID: ${user.id})`);
          }
        } catch (error) {
          console.error('[DEBUG] Error with session authentication:', error);
        }
      }
      
      // Check authenticated session from req.user
      if (!userId && req.user) {
        userId = (req.user as any).id;
        console.log(`[DEBUG] Request user authenticated for posts: ${userId}`);
      }
      
      if (!userId) {
        console.log('[DEBUG] No valid authentication found for post creation');
        return res.status(401).json({ message: "User authentication required" });
      }

      console.log('[DEBUG] Creating post for user:', userId);
      console.log('[DEBUG] Post data received:', req.body);
      
      const postData = {
        userId: parseInt(userId),
        content: req.body.content || "",
        title: req.body.title || null,
        contentType: req.body.contentType || "text",
        imageUrl: req.body.imageUrl !== "none" ? req.body.imageUrl : null,
        videoUrl: req.body.videoUrl || null,
        productId: req.body.productId ? parseInt(req.body.productId) : null,
        eventId: req.body.eventId ? parseInt(req.body.eventId) : null,
        tags: req.body.tags || null,
        isPublished: true,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      };
      
      console.log('[DEBUG] Final postData to be saved:', postData);

      const newPost = await storage.createPost(postData);
      console.log('[DEBUG] Post created successfully:', newPost.id);
      
      return res.status(201).json({
        success: true,
        message: "Post created successfully",
        post: newPost
      });
    } catch (error) {
      console.error('[DEBUG] Post creation error:', error);
      return res.status(500).json({ 
        message: "Failed to create post", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Feed endpoints - must be before catch-all middleware
  app.get('/api/feed/personal', async (req, res) => {
    console.log('[DEBUG] Personal feed endpoint called');
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
      
      console.log('[DEBUG] Retrieved', posts.length, 'posts for personal feed');
      
      return res.status(200).json(posts);
    } catch (error) {
      console.error('[DEBUG] Feed error:', error);
      return res.status(500).json({ 
        message: "Failed to get feed", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/feed/communities', async (req, res) => {
    console.log('[DEBUG] Communities feed endpoint called');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json([]);
  });

  app.get('/api/feed/recommended', async (req, res) => {
    console.log('[DEBUG] Recommended feed endpoint called');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json([]);
  });

  // Community feed endpoint - shows ALL posts from ALL users with pagination
  app.get('/api/feed/community', async (req, res) => {
    console.log('[DEBUG] Community feed endpoint called');
    req._handledByApi = true;
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { storage } = await import('./storage.js');
      
      // Get pagination parameters
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const sortBy = req.query.sortBy as string || 'popular';
      
      console.log(`[DEBUG] Community feed request: limit=${limit}, offset=${offset}, sortBy=${sortBy}`);
      
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
      
      console.log(`[DEBUG] Retrieved ${posts.length} posts for community feed (${offset}-${offset + posts.length} of ${totalPosts})`);
      
      return res.status(200).json({
        posts,
        hasMore,
        totalCount: totalPosts,
        currentOffset: offset,
        nextOffset: hasMore ? offset + limit : null
      });
    } catch (error) {
      console.error('[DEBUG] Community feed error:', error);
      return res.status(500).json({ 
        message: "Failed to get community feed", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  

  
  // Register media handling routes
  registerImageRoutes(app);
  registerMediaRoutes(app);
  registerMulterRoutes(app);
  
  // Register Pawapay callback routes
  const { registerPawapayRoutes } = await import('./pawapay.js');
  registerPawapayRoutes(app);
  
  // Create HTTP server first
  const httpServer = createServer(app);
  
  // Register all API routes with the HTTP server
  const server = await registerRoutes(app, httpServer);
  
  // Handler that terminates API requests already handled by our route handlers
  app.use('/api', (req, res, next) => {
    // If this middleware is reached for an API request, it means no route handler matched
    if (!res.headersSent) {
      console.log(`[DEBUG] API route not found: ${req.method} ${req.path}`);
      return res.status(404).json({ message: "API endpoint not found" });
    }
    next();
  });
  
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(status).json({ message });
    throw err;
  });

  // CRITICAL: Add 404 detection before Vite to fix soft 404 errors in Search Console
  app.use((req, res, next) => {
    // Skip API routes - handle them separately
    if (req.path.startsWith('/api/') || req._handledByApi) {
      // Respond with 404 if not already handled - this prevents Vite from handling API routes
      if (!res.headersSent) {
        console.log(`[DEBUG] Intercepted API route by catch-all middleware: ${req.method} ${req.path}`);
        return res.status(404).json({ message: "API endpoint not found" });
      }
      return next();
    }

    // Skip Vite development assets and tooling routes
    if (req.path.startsWith('/@') || 
        req.path.startsWith('/src/') || 
        req.path.startsWith('/node_modules/') ||
        req.path.endsWith('.js') || 
        req.path.endsWith('.css') || 
        req.path.endsWith('.ts') || 
        req.path.endsWith('.tsx') ||
        req.path === '/sw.js' ||
        req.path.includes('vite') ||
        req.path.includes('hot-update')) {
      return next();
    }

    // Define known valid routes that should return 200
    const validRoutes = [
      '/', '/login', '/register', '/products', '/wall', '/dating', 
      '/about', '/contact', '/faq', '/catalogue-rules', '/tips-tricks', '/business', '/network-partnerships', '/network-partnership-resources', '/affiliate-partnerships', '/resources', '/privacy', '/terms', '/business-terms', '/cookies', '/community-guidelines',
      '/profile', '/settings', '/messages', '/notifications', '/cart', '/shipping-calculator',
      '/checkout', '/orders', '/dashboard', '/admin', '/moderator',
      '/feed', '/explore', '/search', '/favorites', '/liked-products',
      '/subscriptions', '/verify', '/reset-password', '/help', '/logout-success',
      '/add-product', '/upload-product', '/vendor-dashboard', '/become-vendor'
    ];
    
    // Check for dynamic routes patterns that are valid
    const dynamicPatterns = [
      /^\/user\/[^/]+$/, // /user/username
      /^\/profile\/[^/]+$/, // /profile/username
      /^\/category\/[^/]+$/, // /category/electronics
      /^\/search\/[^/]+$/, // /search/query
      /^\/business\/[^/]+$/, // /business/category
      /^\/wall\/[^/]+$/, // /wall/category
      /^\/dating\/[^/]+$/, // /dating/category
    ];
    
    // Remove query parameters and hash for route checking
    const cleanPath = req.path;
    
    // Special handling for product routes - validate they exist
    const productMatch = cleanPath.match(/^\/products\/(\d+)$/);
    if (productMatch) {
      // For now, allow all product routes to pass through
      // The React app will handle showing 404 if product doesn't exist
      // This prevents blocking valid product URLs that might exist
      return next();
    }
    
    // Check if it's a valid route
    const isValidRoute = validRoutes.includes(cleanPath) || 
                        dynamicPatterns.some(pattern => pattern.test(cleanPath));
    
    // If route is not valid, return proper 404 BEFORE Vite processes it
    if (!isValidRoute) {
      console.log(`[SEO] Returning 404 for invalid route: ${cleanPath}`);
      return res.status(404)
        .set({ 
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Robots-Tag": "noindex, nofollow"
        })
        .send(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>404 - Page Not Found | Dedw3n</title>
  <meta name="robots" content="noindex, nofollow">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      text-align: center; 
      padding: 50px 20px; 
      background: #f8fafc;
      color: #334155;
      margin: 0;
    }
    .error { 
      max-width: 500px; 
      margin: 0 auto; 
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    h1 { 
      color: #1e293b; 
      font-size: 2.5rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }
    p { 
      color: #64748b; 
      margin: 20px 0; 
      font-size: 1.1rem;
      line-height: 1.6;
    }
    a { 
      color: #1F2937; 
      text-decoration: none; 
      background: #1F2937;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      display: inline-block;
      margin-top: 20px;
      font-weight: 500;
      transition: background 0.2s;
    }
    a:hover { background: #374151; }
  </style>
</head>
<body>
  <div class="error">
    <h1>404</h1>
    <p>The page you're looking for doesn't exist.</p>
    <p>It may have been moved, deleted, or you entered the wrong URL.</p>
    <a href="/">Return to Homepage</a>
  </div>
</body>
</html>`);
    }

    // Continue to Vite middleware for valid routes
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
