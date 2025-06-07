import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as fraudSchema from "@shared/fraud-schema";

// Global database connection state
let dbConnected = false;
let dbConnectionError: string | null = null;

// Safer WebSocket implementation that prevents the ErrorEvent modification issue
const createSafeWebSocket = () => {
  // Patch the WebSocket constructor to handle errors more gracefully
  const OriginalWebSocket = ws;
  
  return class extends OriginalWebSocket {
    constructor(url: string, protocols?: string | string[]) {
      super(url, protocols);
      
      // Intercept and handle errors without modifying the ErrorEvent
      const originalEmit = this.emit.bind(this);
      this.emit = function(event: string, ...args: any[]) {
        if (event === 'error') {
          const error = args[0];
          // Log the error but don't modify the original event
          console.warn('Database WebSocket error:', error?.message || 'Unknown error');
          return true; // Indicate the event was handled
        }
        return originalEmit(event, ...args);
      };
    }
  };
};

// Configure Neon with error-safe settings
let configurationSuccessful = false;
try {
  // Only configure if we haven't already done so
  if (!configurationSuccessful) {
    neonConfig.webSocketConstructor = createSafeWebSocket() as any;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineConnect = false;
    neonConfig.pipelineTLS = false;
    configurationSuccessful = true;
    console.log('Neon database configuration applied successfully');
  }
} catch (error) {
  console.warn('Failed to configure neonConfig, using fallback:', error.message);
  dbConnectionError = `Configuration failed: ${error.message}`;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with more conservative settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 60000,
  max: 5,
  maxUses: 1000,
  allowExitOnIdle: false
});

export const db = drizzle({ 
  client: pool, 
  schema: {
    ...schema,
    ...fraudSchema
  }
});

// Add comprehensive error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  dbConnected = false;
});

pool.on('connect', () => {
  console.log('Database client connected');
  dbConnected = true;
});

// Export connection status checker
export const isDatabaseConnected = () => dbConnected;

// Graceful connection test that doesn't block startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully');
    dbConnected = true;
    client.release();
  } catch (err) {
    console.warn('⚠ Database connection failed, continuing with limited functionality:', err.message);
    dbConnected = false;
    // Don't throw - allow app to start
  }
}

// Test connection with retry logic
async function initializeDatabase() {
  let retries = 3;
  while (retries > 0 && !dbConnected) {
    await testConnection();
    if (!dbConnected) {
      retries--;
      if (retries > 0) {
        console.log(`Retrying database connection in 2 seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

// Initialize database connection
initializeDatabase().catch(err => {
  console.warn('Database initialization failed, but app will continue:', err.message);
});
