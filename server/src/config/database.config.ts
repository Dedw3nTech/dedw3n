import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../../../shared/schema';

class DatabaseConfig {
  private static instance: DatabaseConfig;
  private sql: ReturnType<typeof neon>;
  private db: ReturnType<typeof drizzle>;

  private constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('[DATABASE CONFIG] Configuring Neon HTTP connection...');
    
    // Configure for HTTP-only mode (matching existing setup)
    this.sql = neon(process.env.DATABASE_URL, {
      fetchConnectionCache: true,
    });

    this.db = drizzle(this.sql, { schema });
    
    console.log('[DATABASE CONFIG] Database configuration initialized');
  }

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  public getDatabase() {
    return this.db;
  }

  public getSql() {
    return this.sql;
  }

  public async close(): Promise<void> {
    // Neon HTTP connections don't need explicit closing
    console.log('[DATABASE CONFIG] HTTP connections closed');
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.sql('SELECT 1 as test');
      console.log('[DATABASE CONFIG] Connection test successful');
      return result.length > 0;
    } catch (error) {
      console.error('[DATABASE CONFIG] Connection test failed:', error);
      throw error;
    }
  }
}

export const dbConfig = DatabaseConfig.getInstance();
export const db = dbConfig.getDatabase();
export const sql = dbConfig.getSql();