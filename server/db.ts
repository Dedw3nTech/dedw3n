import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import * as fraudSchema from "@shared/fraud-schema";

// Global database connection state
let dbConnected = false;
let dbConnectionError: string | null = null;

// Completely disable WebSocket to prevent the ErrorEvent modification crash
console.log('Setting up database with HTTP-only mode to avoid WebSocket issues');

try {
  // Patch neonConfig to force HTTP mode and disable all WebSocket features
  Object.defineProperty(neonConfig, 'webSocketConstructor', {
    value: undefined,
    writable: false,
    configurable: false
  });
  
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
  neonConfig.pipelineTLS = false;
  
  // Force HTTP-only mode
  neonConfig.fetchConnectionCache = true;
  neonConfig.fetchFunction = fetch;
  
  console.log('Database configured for HTTP-only mode');
} catch (error) {
  console.warn('Database configuration warning:', error.message);
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

// Safe connection test with graceful degradation
async function initializeDatabase() {
  console.log('Initializing database connection...');
  
  try {
    // Simple connection test that won't crash the app
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    dbConnected = true;
    client.release();
  } catch (err) {
    console.warn('⚠ Database connection failed, continuing with limited functionality');
    console.warn('Error details:', err.message);
    dbConnected = false;
    dbConnectionError = err.message;
    // Don't throw - let the app continue
  }
}

// Initialize database connection without blocking startup
setTimeout(async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.warn('Database initialization deferred:', error.message);
  }
}, 100);
