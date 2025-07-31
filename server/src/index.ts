import { createApp, config } from './app';
import { dbConfig } from './config/database.config';

async function startServer() {
  try {
    // Create Express app with new modular architecture
    const app = createApp();

    // Test database connection
    console.log('[DATABASE] Testing connection...');
    await dbConfig.testConnection();
    console.log('[DATABASE] Connection successful');

    // Start server
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`[SERVER] Modular architecture server running on port ${config.port}`);
      console.log(`[SERVER] Environment: ${config.nodeEnv}`);
      console.log(`[SERVER] Health check: http://localhost:${config.port}/health`);
      console.log(`[SERVER] API v2 endpoints: http://localhost:${config.port}/api/v2/*`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[SERVER] SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        console.log('[SERVER] HTTP server closed');
        await dbConfig.close();
        console.log('[DATABASE] Connection closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('[SERVER] SIGINT received, shutting down gracefully...');
      server.close(async () => {
        console.log('[SERVER] HTTP server closed');
        await dbConfig.close();
        console.log('[DATABASE] Connection closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('[SERVER] Failed to start:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('[SERVER] Unhandled startup error:', error);
  process.exit(1);
});