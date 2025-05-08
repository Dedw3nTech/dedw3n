/**
 * Instagram-like API Setup
 * 
 * This module handles:
 * 1. Creation of database tables for the Instagram-like API
 * 2. Registration of API routes
 */

import express, { Express } from 'express';
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
    
    // Create a router prefix for Instagram-like API
    app.use('/api/instagram', (req, res, next) => {
      console.log(`[INSTAGRAM API] Request: ${req.method} ${req.path}`);
      next();
    });
    
    // Register the routes on the /api/instagram path
    const instagramRouter = express.Router();
    registerInstagramApiRoutes(instagramRouter);
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
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'create-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await db.execute(sql);
    
    console.log('[INSTAGRAM API] Database tables created successfully.');
  } catch (error) {
    console.error('[INSTAGRAM API] Error creating database tables:', error);
    throw error;
  }
}