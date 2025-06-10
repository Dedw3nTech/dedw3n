import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";
import * as fraudSchema from "@shared/fraud-schema";

// Global database connection state
let dbConnected = false;
let dbConnectionError: string | null = null;

// Force HTTP-only mode to completely avoid WebSocket issues
console.log('Configuring database for HTTP-only mode');

// Configure Neon for HTTP-only connections
neonConfig.fetchConnectionCache = true;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineConnect = false;
neonConfig.pipelineTLS = false;

// Completely disable WebSocket constructor
try {
  neonConfig.webSocketConstructor = undefined;
  console.log('WebSocket constructor disabled for database connections');
} catch (error) {
  console.warn('Database configuration warning:', error);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create HTTP-only database connection
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { 
  schema: {
    ...schema,
    ...fraudSchema
  }
});

// No pool events needed for HTTP-only connections
console.log('Database configured for HTTP-only connections');

// Export connection status checker
export const isDatabaseConnected = () => dbConnected;

// Test HTTP connection with simple query
async function testConnection() {
  try {
    await sql`SELECT 1 as test`;
    console.log('✓ Database HTTP connection successful');
    dbConnected = true;
  } catch (err: any) {
    console.warn('⚠ Database connection failed, continuing with limited functionality:', err.message);
    dbConnected = false;
    dbConnectionError = err.message;
    // Don't throw - allow app to start
  }
}

// Initialize database connection safely
async function initializeDatabase() {
  console.log('Initializing HTTP database connection...');
  
  try {
    // Test with simple query
    await sql`SELECT 1 as test`;
    console.log('✓ Database HTTP connection established');
    dbConnected = true;
  } catch (err: any) {
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
