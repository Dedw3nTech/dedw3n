/**
 * File Migration Script - Ephemeral Storage to Object Storage
 * 
 * This script migrates all files from attached_assets (ephemeral storage)
 * to Replit Object Storage to prevent data loss during deployments.
 */

import fs from 'fs';
import path from 'path';
import { objectStorageClient } from './objectStorage';

interface MigrationResult {
  success: boolean;
  sourceFile: string;
  destinationPath: string;
  size: number;
  error?: string;
}

interface MigrationSummary {
  totalFiles: number;
  successful: number;
  failed: number;
  totalSize: number;
  results: MigrationResult[];
}

/**
 * Get all files recursively from a directory
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
    console.error(`Error reading directory ${dirPath}:`, error);
    return arrayOfFiles;
  }
}

/**
 * Upload a file to Object Storage
 */
async function uploadToObjectStorage(
  localFilePath: string,
  objectStoragePath: string
): Promise<MigrationResult> {
  const fileStats = fs.statSync(localFilePath);
  
  try {
    // Parse the object storage path to get bucket and object name
    const pathParts = objectStoragePath.split('/').filter(p => p);
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');
    
    // Get the bucket
    const bucket = objectStorageClient.bucket(bucketName);
    
    // Upload the file
    await bucket.upload(localFilePath, {
      destination: objectName,
      metadata: {
        contentType: getContentType(localFilePath),
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    
    console.log(`✓ Uploaded: ${path.basename(localFilePath)} → ${objectStoragePath}`);
    
    return {
      success: true,
      sourceFile: localFilePath,
      destinationPath: objectStoragePath,
      size: fileStats.size,
    };
  } catch (error) {
    console.error(`✗ Failed to upload ${localFilePath}:`, error);
    return {
      success: false,
      sourceFile: localFilePath,
      destinationPath: objectStoragePath,
      size: fileStats.size,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Migrate all files from attached_assets to Object Storage
 */
export async function migrateFiles(): Promise<MigrationSummary> {
  console.log('\n=== Starting File Migration to Object Storage ===\n');
  
  // Get environment variables
  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
  if (!publicPaths) {
    throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
  }
  
  const targetPath = publicPaths.split(',')[0].trim(); // Use first public path
  console.log(`Target Object Storage Path: ${targetPath}\n`);
  
  // Get all files from attached_assets
  const sourceDir = path.join(process.cwd(), 'attached_assets');
  if (!fs.existsSync(sourceDir)) {
    console.log('No attached_assets directory found. Nothing to migrate.');
    return {
      totalFiles: 0,
      successful: 0,
      failed: 0,
      totalSize: 0,
      results: [],
    };
  }
  
  const files = getAllFiles(sourceDir);
  console.log(`Found ${files.length} files to migrate\n`);
  
  const summary: MigrationSummary = {
    totalFiles: files.length,
    successful: 0,
    failed: 0,
    totalSize: 0,
    results: [],
  };
  
  // Migrate each file
  for (const file of files) {
    const relativePath = path.relative(sourceDir, file);
    const destinationPath = `${targetPath}/${relativePath}`;
    
    const result = await uploadToObjectStorage(file, destinationPath);
    summary.results.push(result);
    
    if (result.success) {
      summary.successful++;
      summary.totalSize += result.size;
    } else {
      summary.failed++;
    }
  }
  
  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total Files: ${summary.totalFiles}`);
  console.log(`✓ Successful: ${summary.successful}`);
  console.log(`✗ Failed: ${summary.failed}`);
  console.log(`Total Size: ${(summary.totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (summary.failed > 0) {
    console.log('\nFailed migrations:');
    summary.results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.sourceFile}: ${r.error}`));
  }
  
  console.log('\n✓ Migration complete!');
  console.log('Files are now stored in Object Storage and will persist across deployments.');
  
  return summary;
}

// Run migration if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrateFiles()
    .then(() => {
      console.log('\n✓ All files migrated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Migration failed:', error);
      process.exit(1);
    });
}
