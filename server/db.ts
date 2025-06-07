import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";
import * as fraudSchema from "@shared/fraud-schema";

// Global database connection state
let dbConnected = false;
let dbConnectionError: string | null = null;

console.log('Setting up database with HTTP-only driver to avoid WebSocket issues');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create HTTP-only connection to avoid WebSocket issues
export const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { 
  schema: {
    ...schema,
    ...fraudSchema
  }
});

// Export connection status checker
export const isDatabaseConnected = () => dbConnected;

// Simple connection test for HTTP driver
async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✓ Database connected successfully');
    dbConnected = true;
  } catch (err) {
    console.warn('⚠ Database connection failed, continuing with limited functionality:', (err as Error).message);
    dbConnected = false;
    // Don't throw - allow app to start
  }
}

// Initialize database connection using HTTP driver
setTimeout(async () => {
  try {
    await testConnection();
  } catch (error) {
    console.warn('Database initialization deferred:', (error as Error).message);
  }
}, 100);
