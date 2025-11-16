/**
 * Migration Script: Fix Avatar Path Mismatch
 * 
 * This script fixes path mismatches in object storage:
 * - Handles both 'avatars/' and 'public/avatars/' variants
 * - Standardizes all paths to use 'avatars/' prefix (corrected from public/avatars/)
 * - Preserves sharded folder structure
 * 
 * OPTIONS:
 * 1. Move files to correct locations (preserves existing images)
 * 2. Clear invalid URLs (users will need to re-upload)
 * 
 * Run with: npx tsx server/fix-avatar-paths.ts [--move-files|--clear-urls]
 */

import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { users } from '../shared/schema';
import { eq, and, like, isNotNull, or } from 'drizzle-orm';
import { AVATAR_PATHS, objectPathToPublicUrl } from './avatar-paths';

const BUCKET_NAME = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 
                    (process.env.PUBLIC_OBJECT_SEARCH_PATHS || '').split('/')[1];

interface MigrationStats {
  totalUsers: number;
  affectedUsers: number;
  filesMoved: number;
  filesNotFound: number;
  urlsCleared: number;
  errors: string[];
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const bucket = objectStorageClient.bucket(BUCKET_NAME);
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error(`Error checking file ${filePath}:`, error);
    return false;
  }
}

async function moveFile(oldPath: string, newPath: string): Promise<boolean> {
  try {
    const bucket = objectStorageClient.bucket(BUCKET_NAME);
    const sourceFile = bucket.file(oldPath);
    const destFile = bucket.file(newPath);
    
    const [exists] = await sourceFile.exists();
    if (!exists) {
      console.warn(`Source file not found: ${oldPath}`);
      return false;
    }
    
    await sourceFile.copy(destFile);
    console.log(`✓ Moved: ${oldPath} → ${newPath}`);
    
    await sourceFile.delete();
    
    return true;
  } catch (error) {
    console.error(`Error moving ${oldPath} to ${newPath}:`, error);
    return false;
  }
}

async function migrateAvatarPaths(mode: 'move' | 'clear'): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalUsers: 0,
    affectedUsers: 0,
    filesMoved: 0,
    filesNotFound: 0,
    urlsCleared: 0,
    errors: []
  };

  try {
    console.log(`\n🔍 Starting avatar path migration (mode: ${mode})...\n`);
    console.log(`  Target prefix: ${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR}\n`);

    // Find users with avatar URLs using ANY path variant
    const affectedUsers = await db
      .select()
      .from(users)
      .where(
        and(
          isNotNull(users.avatar),
          or(
            like(users.avatar, '/public-objects/avatars/%'),      // Correct format
            like(users.avatar, '/public-objects/public/avatars/%'), // Wrong: has duplicate 'public/'
            like(users.avatar, '/public-objects/profile/%')       // Legacy: old folder name
          )
        )
      );

    stats.totalUsers = affectedUsers.length;
    console.log(`Found ${stats.totalUsers} users with avatar URLs\n`);

    for (const user of affectedUsers) {
      if (!user.avatar) continue;

      console.log(`Processing user ${user.id} (${user.username})...`);
      console.log(`  Current URL: ${user.avatar}`);

      // Extract the object path (remove /public-objects/ prefix)
      const currentObjectPath = user.avatar.replace('/public-objects/', '');
      
      // Determine the correct target path based on current location
      let targetObjectPath: string;
      
      // Check if already in correct format first
      if (currentObjectPath.startsWith(AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR + '/')) {
        // Already correct - no migration needed
        console.log(`  ✓ Already in correct format (${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR})`);
        continue;
      } else if (currentObjectPath.startsWith('public/avatars/')) {
        // Has duplicate 'public/' prefix - remove it
        targetObjectPath = currentObjectPath.replace(
          'public/avatars/',
          AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR + '/'
        );
      } else if (currentObjectPath.startsWith('public/profile/')) {
        // Legacy with public prefix - replace with correct path
        targetObjectPath = currentObjectPath.replace('public/profile/', `${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR}/`);
      } else if (currentObjectPath.startsWith('profile/')) {
        // Legacy 'profile' folder - replace with 'avatars'
        targetObjectPath = currentObjectPath.replace('profile/', `${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR}/`);
      } else {
        console.log(`  ⚠ Unknown path format: ${currentObjectPath}`);
        stats.errors.push(`Unknown path format for user ${user.id}: ${currentObjectPath}`);
        continue;
      }

      console.log(`  Source path: ${currentObjectPath}`);
      console.log(`  Target path: ${targetObjectPath}`);

      const sourceExists = await checkFileExists(currentObjectPath);
      const targetExists = await checkFileExists(targetObjectPath);

      console.log(`  Source exists: ${sourceExists}`);
      console.log(`  Target exists: ${targetExists}`);

      if (mode === 'move') {
        if (targetExists) {
          // File already in target location - just update URL
          const newUrl = objectPathToPublicUrl(targetObjectPath);
          await db.update(users)
            .set({ avatar: newUrl })
            .where(eq(users.id, user.id));
          console.log(`  ✓ URL updated to: ${newUrl}`);
          stats.affectedUsers++;
        } else if (sourceExists) {
          // Move file from source to target
          const moved = await moveFile(currentObjectPath, targetObjectPath);
          if (moved) {
            const newUrl = objectPathToPublicUrl(targetObjectPath);
            await db.update(users)
              .set({ avatar: newUrl })
              .where(eq(users.id, user.id));
            console.log(`  ✓ File moved and URL updated to: ${newUrl}`);
            stats.filesMoved++;
            stats.affectedUsers++;
          } else {
            console.log(`  ✗ Failed to move file - clearing URL`);
            stats.errors.push(`Failed to move file for user ${user.id}`);
            
            await db.update(users)
              .set({ avatar: null })
              .where(eq(users.id, user.id));
            stats.urlsCleared++;
          }
        } else {
          console.log(`  ✗ File not found - clearing URL`);
          await db.update(users)
            .set({ avatar: null })
            .where(eq(users.id, user.id));
          stats.filesNotFound++;
          stats.urlsCleared++;
        }
      } else if (mode === 'clear') {
        await db.update(users)
          .set({ avatar: null })
          .where(eq(users.id, user.id));
        console.log(`  ✓ URL cleared`);
        stats.urlsCleared++;
        stats.affectedUsers++;
      }

      console.log('');
    }

    console.log('\n📊 Migration Complete!\n');
    console.log('Statistics:');
    console.log(`  Total users checked: ${stats.totalUsers}`);
    console.log(`  Affected users: ${stats.affectedUsers}`);
    if (mode === 'move') {
      console.log(`  Files moved: ${stats.filesMoved}`);
      console.log(`  Files not found: ${stats.filesNotFound}`);
    }
    console.log(`  URLs cleared: ${stats.urlsCleared}`);
    console.log(`  Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\nErrors:');
      stats.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--move-files') ? 'move' : 
               args.includes('--clear-urls') ? 'clear' : null;

  if (!mode) {
    console.log(`
Avatar Path Migration Script

Usage:
  npx tsx server/fix-avatar-paths.ts [--move-files|--clear-urls]

Options:
  --move-files  Migrate files from any variant to public/avatars/ (preserves images)
  --clear-urls  Clear all avatar URLs (users must re-upload)

Recommendation:
  Use --move-files to preserve existing profile pictures and fix paths.
  Use --clear-urls only if you want a clean slate for all users.

Environment:
  Bucket: ${BUCKET_NAME || 'NOT CONFIGURED'}
    `);
    process.exit(1);
  }

  if (!BUCKET_NAME) {
    console.error('❌ Error: Object storage bucket not configured');
    console.error('   Set PUBLIC_OBJECT_SEARCH_PATHS or DEFAULT_OBJECT_STORAGE_BUCKET_ID');
    process.exit(1);
  }

  console.log(`\n⚠️  WARNING: This will modify user avatar data in the database.`);
  console.log(`Mode: ${mode === 'move' ? 'MOVE FILES' : 'CLEAR URLS'}`);
  console.log(`Bucket: ${BUCKET_NAME}\n`);
  console.log(`Press Ctrl+C to cancel, or wait 5 seconds to continue...`);
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  const stats = await migrateAvatarPaths(mode);

  console.log('\n✅ Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Restart the application to apply the fix');
  console.log('2. Test profile picture upload functionality');
  console.log('3. Verify existing avatars display correctly');

  process.exit(0);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { migrateAvatarPaths };
