#!/usr/bin/env tsx

/**
 * Test the new modular architecture by starting a separate server
 * This runs alongside the existing monolithic server for testing
 */

import { createApp, config } from './app';

async function startTestServer() {
  try {
    const app = createApp();
    const testPort = 5001; // Different port to avoid conflicts

    const server = app.listen(testPort, '0.0.0.0', () => {
      console.log('\n🚀 MODULAR ARCHITECTURE TEST SERVER STARTED');
      console.log('=====================================');
      console.log(`📍 Port: ${testPort}`);
      console.log(`🌐 Health: http://localhost:${testPort}/health`);
      console.log(`🔗 API v2: http://localhost:${testPort}/api/v2/users`);
      console.log('=====================================');
      console.log();
      console.log('📋 Available endpoints:');
      console.log('  GET  /health - Health check');
      console.log('  GET  /api/v2/users/search?q=admin - Search users');
      console.log('  GET  /api/v2/users/:id - Get user by ID');
      console.log('  GET  /api/v2/users - Get current user (auth required)');
      console.log('  POST /api/v2/users - Create user');
      console.log('  PUT  /api/v2/users/:id - Update user (auth required)');
      console.log('  DELETE /api/v2/users/:id - Delete user (auth required)');
      console.log();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Test server shutting down...');
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      console.log('Test server shutting down...');
      server.close(() => process.exit(0));
    });

  } catch (error) {
    console.error('Failed to start test server:', error);
    process.exit(1);
  }
}

startTestServer();