import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import passport from "passport";
import { verifyToken } from "./jwt-auth";

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      _handledByApi?: boolean;
    }
  }
}

const app = express();
// Increase JSON body size limit to 50MB for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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
  

  
  // Register all API routes first
  const server = await registerRoutes(app);
  
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

  // Create a middleware to completely prevent Vite from handling any API requests
  app.use((req, res, next) => {
    // Skip Vite middleware for API routes
    if (req.path.startsWith('/api/') || req._handledByApi) {
      // Respond with 404 if not already handled - this prevents Vite from handling API routes
      if (!res.headersSent) {
        console.log(`[DEBUG] Intercepted API route by catch-all middleware: ${req.method} ${req.path}`);
        return res.status(404).json({ message: "API endpoint not found" });
      }
      // If headers already sent, route was handled correctly
      return next();
    }
    // Continue to Vite middleware for non-API routes
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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
