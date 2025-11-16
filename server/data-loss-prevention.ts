/**
 * Data Loss Prevention System
 * 
 * This module provides utilities to prevent user data loss during code updates
 * by detecting ephemeral file storage usage and warning about risks.
 * 
 * Critical: Files in public/uploads/ and private/uploads/ are EPHEMERAL
 * and will be deleted on every deployment. Use Replit Object Storage instead.
 */

import fs from 'fs';
import path from 'path';
import { db } from './db';
import { users, posts, events, messages, products } from '../shared/schema';
import { eq, sql, or, like } from 'drizzle-orm';

interface DataLossAssessment {
  atRisk: boolean;
  ephemeralFileCount: number;
  affectedUsers: number;
  affectedPosts: number;
  affectedProducts: number;
  affectedEvents: number;
  affectedMessages: number;
  objectStorageConfigured: boolean;
  recommendations: string[];
}

/**
 * Check if Object Storage is properly configured
 */
export function isObjectStorageConfigured(): boolean {
  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
  const privateDir = process.env.PRIVATE_OBJECT_DIR;
  
  return !!(publicPaths && privateDir);
}

/**
 * Count files in ephemeral storage directories
 */
export function countEphemeralFiles(): number {
  const uploadDirs = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), 'private', 'uploads')
  ];
  
  let totalFiles = 0;
  
  for (const dir of uploadDirs) {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      totalFiles += files.length;
    }
  }
  
  return totalFiles;
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });
    
    return arrayOfFiles;
  } catch (error) {
    console.error(`[DATA-LOSS-PREVENTION] Error reading directory ${dirPath}:`, error);
    return arrayOfFiles;
  }
}

/**
 * Assess current data loss risk by checking database for ephemeral file URLs
 */
export async function assessDataLossRisk(): Promise<DataLossAssessment> {
  const assessment: DataLossAssessment = {
    atRisk: false,
    ephemeralFileCount: 0,
    affectedUsers: 0,
    affectedPosts: 0,
    affectedProducts: 0,
    affectedEvents: 0,
    affectedMessages: 0,
    objectStorageConfigured: isObjectStorageConfigured(),
    recommendations: []
  };
  
  try {
    // Count ephemeral files on disk
    assessment.ephemeralFileCount = countEphemeralFiles();
    
    // Check database for ephemeral file URLs
    // Comprehensive pattern matching for all upload directory variations
    
    // Users with avatars in ephemeral storage
    const usersAtRisk = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        or(
          like(users.avatar, '/uploads/%'),
          like(users.avatar, '%/uploads/%'),
          like(users.avatar, '%/public/uploads/%'),
          like(users.avatar, '%/private/uploads/%')
        )
      );
    assessment.affectedUsers = usersAtRisk[0]?.count || 0;
    
    // Posts with media in ephemeral storage
    const postsAtRisk = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(
        or(
          like(posts.imageUrl, '/uploads/%'),
          like(posts.imageUrl, '%/uploads/%'),
          like(posts.imageUrl, '%/public/uploads/%'),
          like(posts.imageUrl, '%/private/uploads/%'),
          like(posts.videoUrl, '/uploads/%'),
          like(posts.videoUrl, '%/uploads/%'),
          like(posts.videoUrl, '%/public/uploads/%'),
          like(posts.videoUrl, '%/private/uploads/%')
        )
      );
    assessment.affectedPosts = postsAtRisk[0]?.count || 0;
    
    // Products with images in ephemeral storage
    const productsAtRisk = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        or(
          like(products.imageUrl, '/uploads/%'),
          like(products.imageUrl, '%/uploads/%'),
          like(products.imageUrl, '%/public/uploads/%'),
          like(products.imageUrl, '%/private/uploads/%')
        )
      );
    assessment.affectedProducts = productsAtRisk[0]?.count || 0;
    
    // Events with cover images in ephemeral storage
    const eventsAtRisk = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(
        or(
          like(events.coverImage, '/uploads/%'),
          like(events.coverImage, '%/uploads/%'),
          like(events.coverImage, '%/public/uploads/%'),
          like(events.coverImage, '%/private/uploads/%')
        )
      );
    assessment.affectedEvents = eventsAtRisk[0]?.count || 0;
    
    // Messages with attachments in ephemeral storage
    const messagesAtRisk = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        or(
          like(messages.attachmentUrl, '/uploads/%'),
          like(messages.attachmentUrl, '%/uploads/%'),
          like(messages.attachmentUrl, '%/public/uploads/%'),
          like(messages.attachmentUrl, '%/private/uploads/%')
        )
      );
    assessment.affectedMessages = messagesAtRisk[0]?.count || 0;
    
    // Determine if data is at risk
    const hasEphemeralFiles = assessment.ephemeralFileCount > 0;
    const hasEphemeralDbReferences = 
      assessment.affectedUsers > 0 ||
      assessment.affectedPosts > 0 ||
      assessment.affectedProducts > 0 ||
      assessment.affectedEvents > 0 ||
      assessment.affectedMessages > 0;
    
    // Data is at risk if ephemeral files or DB references exist
    assessment.atRisk = hasEphemeralFiles || hasEphemeralDbReferences;
    
    // Generate recommendations based on configuration and risk level
    if (!assessment.objectStorageConfigured && assessment.atRisk) {
      // CRITICAL: No object storage AND ephemeral files exist
      assessment.recommendations.push(
        '🚨 CRITICAL: User data is stored in ephemeral directories and will be LOST on deployment!'
      );
      assessment.recommendations.push(
        '→ Configure Replit Object Storage immediately:'
      );
      assessment.recommendations.push(
        '  1. Open Replit Object Storage tool'
      );
      assessment.recommendations.push(
        '  2. Create buckets: dedw3n-public-files, dedw3n-private-files'
      );
      assessment.recommendations.push(
        '  3. Set environment variables:'
      );
      assessment.recommendations.push(
        '     PUBLIC_OBJECT_SEARCH_PATHS=/dedw3n-public-files'
      );
      assessment.recommendations.push(
        '     PRIVATE_OBJECT_DIR=/dedw3n-private-files'
      );
      assessment.recommendations.push(
        '  4. Run file migration utility to move existing files'
      );
      assessment.recommendations.push(
        '  5. See replit.md "User Data Loss Prevention" section for details'
      );
    } else if (assessment.objectStorageConfigured && assessment.atRisk) {
      // WARNING: Object storage configured BUT ephemeral files still exist
      assessment.recommendations.push(
        '⚠️  WARNING: Ephemeral files detected - migration incomplete!'
      );
      assessment.recommendations.push(
        `→ Found ${assessment.ephemeralFileCount} files in ephemeral storage that need migration`
      );
      if (hasEphemeralDbReferences) {
        assessment.recommendations.push(
          `→ Database references: ${assessment.affectedUsers} users, ${assessment.affectedPosts} posts, ${assessment.affectedProducts} products, ${assessment.affectedEvents} events, ${assessment.affectedMessages} messages`
        );
      }
      assessment.recommendations.push(
        '→ Action required: Run file migration utility to move files to Object Storage'
      );
      assessment.recommendations.push(
        '→ Until migration is complete, these files will be LOST on deployment'
      );
      assessment.recommendations.push(
        '→ See replit.md "User Data Loss Prevention" section for migration steps'
      );
    } else if (!assessment.objectStorageConfigured && !assessment.atRisk) {
      // Object storage not configured but no files at risk (acceptable for new projects)
      assessment.recommendations.push(
        'ℹ️  Object Storage not configured - set up before accepting user uploads'
      );
      assessment.recommendations.push(
        '→ See replit.md "User Data Loss Prevention" section for setup instructions'
      );
    } else {
      // All good: Object storage configured and no ephemeral files
      assessment.recommendations.push(
        '✅ All user data is protected in Object Storage'
      );
    }
    
  } catch (error) {
    console.error('[DATA-LOSS-PREVENTION] Error assessing data loss risk:', error);
    assessment.recommendations.push(
      '⚠️  ERROR: Unable to assess data loss risk - check database connection'
    );
  }
  
  return assessment;
}

/**
 * Log data loss prevention warnings at application startup
 */
export async function logDataLossWarnings(autoMigrateEnabled: boolean = false): Promise<void> {
  console.log('\n=== DATA LOSS PREVENTION CHECK ===');
  
  const assessment = await assessDataLossRisk();
  const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.REPL_DEPLOYMENT !== 'true';
  
  // Only suppress warnings if BOTH auto-migration is enabled AND object storage is configured AND in dev
  const autoMigrationWillHandle = autoMigrateEnabled && assessment.objectStorageConfigured && isDevelopment;
  
  // Show critical warning if at risk and auto-migration won't handle it
  if (assessment.atRisk && !autoMigrationWillHandle) {
    console.log('\n🚨 CRITICAL DATA LOSS RISK DETECTED 🚨\n');
  } else if (assessment.atRisk && autoMigrationWillHandle) {
    // Only show friendly message when auto-migration is truly configured and will run
    console.log('\nℹ️  Ephemeral files detected - Auto-migration will handle this\n');
  }
  
  console.log(`Object Storage Configured: ${assessment.objectStorageConfigured ? '✓ YES' : '✗ NO'}`);
  
  // Show detailed file counts if there's a real issue (not being auto-migrated)
  if (!autoMigrationWillHandle) {
    console.log(`Files in Ephemeral Storage: ${assessment.ephemeralFileCount}`);
    console.log(`Users with Ephemeral Avatars: ${assessment.affectedUsers}`);
    console.log(`Posts with Ephemeral Media: ${assessment.affectedPosts}`);
    console.log(`Products with Ephemeral Images: ${assessment.affectedProducts}`);
    console.log(`Events with Ephemeral Covers: ${assessment.affectedEvents}`);
    console.log(`Messages with Ephemeral Attachments: ${assessment.affectedMessages}`);
  }
  
  // Show recommendations if there's a real issue
  if (assessment.recommendations.length > 0 && !autoMigrationWillHandle) {
    console.log('\n📋 RECOMMENDATIONS:\n');
    assessment.recommendations.forEach(rec => console.log(rec));
  }
  
  console.log('\n=== END DATA LOSS PREVENTION CHECK ===\n');
}

/**
 * Get detailed report of files at risk
 */
export async function getDetailedRiskReport(): Promise<{
  users: Array<{ id: number; username: string; avatar: string | null }>;
  posts: Array<{ id: number; userId: number; imageUrl: string | null; videoUrl: string | null }>;
  products: Array<{ id: number; name: string; imageUrl: string }>;
  events: Array<{ id: number; title: string; coverImage: string | null }>;
  messages: Array<{ id: number; senderId: number; attachmentUrl: string | null }>;
}> {
  try {
    // Get users with ephemeral avatars - comprehensive pattern matching
    const usersAtRisk = await db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar
      })
      .from(users)
      .where(
        or(
          like(users.avatar, '/uploads/%'),
          like(users.avatar, '%/uploads/%'),
          like(users.avatar, '%/public/uploads/%'),
          like(users.avatar, '%/private/uploads/%')
        )
      )
      .limit(100);
    
    // Get posts with ephemeral media - comprehensive pattern matching
    const postsAtRisk = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl
      })
      .from(posts)
      .where(
        or(
          like(posts.imageUrl, '/uploads/%'),
          like(posts.imageUrl, '%/uploads/%'),
          like(posts.imageUrl, '%/public/uploads/%'),
          like(posts.imageUrl, '%/private/uploads/%'),
          like(posts.videoUrl, '/uploads/%'),
          like(posts.videoUrl, '%/uploads/%'),
          like(posts.videoUrl, '%/public/uploads/%'),
          like(posts.videoUrl, '%/private/uploads/%')
        )
      )
      .limit(100);
    
    // Get products with ephemeral images - comprehensive pattern matching
    const productsAtRisk = await db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl
      })
      .from(products)
      .where(
        or(
          like(products.imageUrl, '/uploads/%'),
          like(products.imageUrl, '%/uploads/%'),
          like(products.imageUrl, '%/public/uploads/%'),
          like(products.imageUrl, '%/private/uploads/%')
        )
      )
      .limit(100);
    
    // Get events with ephemeral covers - comprehensive pattern matching
    const eventsAtRisk = await db
      .select({
        id: events.id,
        title: events.title,
        coverImage: events.coverImage
      })
      .from(events)
      .where(
        or(
          like(events.coverImage, '/uploads/%'),
          like(events.coverImage, '%/uploads/%'),
          like(events.coverImage, '%/public/uploads/%'),
          like(events.coverImage, '%/private/uploads/%')
        )
      )
      .limit(100);
    
    // Get messages with ephemeral attachments - comprehensive pattern matching
    const messagesAtRisk = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        attachmentUrl: messages.attachmentUrl
      })
      .from(messages)
      .where(
        or(
          like(messages.attachmentUrl, '/uploads/%'),
          like(messages.attachmentUrl, '%/uploads/%'),
          like(messages.attachmentUrl, '%/public/uploads/%'),
          like(messages.attachmentUrl, '%/private/uploads/%')
        )
      )
      .limit(100);
    
    return {
      users: usersAtRisk,
      posts: postsAtRisk,
      products: productsAtRisk,
      events: eventsAtRisk,
      messages: messagesAtRisk
    };
  } catch (error) {
    console.error('[DATA-LOSS-PREVENTION] Error generating detailed risk report:', error);
    return {
      users: [],
      posts: [],
      products: [],
      events: [],
      messages: []
    };
  }
}
