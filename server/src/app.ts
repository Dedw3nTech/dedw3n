import express from 'express';
import cors from 'cors';
import { config } from './config/app.config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { securityHeaders, requestLogger, sanitizeRequest } from './middleware/security.middleware';
import { userRoutes } from './routes/user.routes';
import './container.setup'; // Initialize dependency injection container

export function createApp(): express.Application {
  const app = express();

  // Basic middleware
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true
  }));

  // Security middleware
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(sanitizeRequest);

  // Body parsing middleware
  app.use(express.json({ limit: config.uploadMaxSize }));
  app.use(express.urlencoded({ extended: true, limit: config.uploadMaxSize }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // API Routes - New modular structure
  app.use('/api/v2/users', userRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export { config };