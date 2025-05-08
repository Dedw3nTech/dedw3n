/**
 * Instagram-like API Setup
 * 
 * This module handles:
 * 1. Creation of database tables for the Instagram-like API
 * 2. Registration of API routes
 */

import express, { Express, Router } from 'express';
import { db } from '../db';
import { registerInstagramApiRoutes } from './index';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup Instagram-like API by creating necessary database tables
 * and registering the API routes
 */
export async function setupInstagramApi(app: Express): Promise<void> {
  try {
    console.log('[INSTAGRAM API] Setting up Instagram-like API...');
    
    // Create database tables
    await createDatabaseTables();
    
    // Register API routes
    console.log('[INSTAGRAM API] Registering API routes...');
    
    // Create a router for Instagram-like API
    const instagramRouter = express.Router();
    
    // Add logging middleware to the router
    instagramRouter.use((req, res, next) => {
      console.log(`[INSTAGRAM API] Request: ${req.method} ${req.path}`);
      next();
    });
    
    // Register the API routes on the router
    registerInstagramApiRoutes(instagramRouter);
    
    // Mount the router on the /api/instagram path
    app.use('/api/instagram', instagramRouter);
    
    console.log('[INSTAGRAM API] Setup complete.');
  } catch (error) {
    console.error('[INSTAGRAM API] Setup failed:', error);
    throw error;
  }
}

/**
 * Create database tables for the Instagram-like API
 */
async function createDatabaseTables(): Promise<void> {
  try {
    console.log('[INSTAGRAM API] Creating database tables...');
    
    // Read the SQL file using relative path
    const sqlFilePath = path.join(process.cwd(), 'server', 'instagram-api', 'migrations', 'create-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await db.execute(sql);
    
    console.log('[INSTAGRAM API] Database tables created successfully.');
  } catch (error) {
    console.error('[INSTAGRAM API] Error creating database tables:', error);
    throw error;
  }
}