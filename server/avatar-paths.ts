/**
 * Avatar Path Constants & Helpers
 * 
 * Single source of truth for avatar file paths across local uploads
 * and object storage. This ensures consistency across all services.
 */

/**
 * Local filesystem paths (relative to project root)
 */
export const AVATAR_PATHS = {
  // Local uploads directory
  LOCAL_DIR: 'public/uploads/avatars',
  
  // Object storage paths (without /public-objects prefix)
  OBJECT_STORAGE_DIR: 'avatars',
  OBJECT_STORAGE_BACKUPS_DIR: 'backups/avatars',
  
  // Sharded storage (for scalability)
  OBJECT_STORAGE_PUBLIC_DIR: 'public/avatars',
  OBJECT_STORAGE_PUBLIC_BACKUPS_DIR: 'public/backups/avatars',
} as const;

/**
 * Generate sharded folder path based on user ID
 * Example: userId 1234 -> "1000-1999"
 * 
 * @param userId - The user ID to shard
 * @returns Sharded folder name
 */
export function getShardedPath(userId: number): string {
  const bucketStart = Math.floor(userId / 1000) * 1000;
  const bucketEnd = bucketStart + 999;
  return `${bucketStart}-${bucketEnd}`;
}

/**
 * Get avatar path for object storage (without /public-objects prefix)
 * 
 * @param userId - User ID
 * @param variant - Optional variant (e.g., 'thumb', 'small', 'medium')
 * @param extension - File extension (default: 'webp')
 * @param useSharding - Whether to use sharded storage (default: true)
 * @returns Object storage key path
 */
export function getAvatarObjectPath(
  userId: number,
  variant?: string,
  extension: string = 'webp',
  useSharding: boolean = true
): string {
  const variantSuffix = variant ? `-${variant}` : '';
  
  if (useSharding) {
    const shard = getShardedPath(userId);
    return `${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR}/${shard}/user-${userId}${variantSuffix}.${extension}`;
  }
  
  return `${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_DIR}/user-${userId}${variantSuffix}.${extension}`;
}

/**
 * Get backup path for object storage (without /public-objects prefix)
 * 
 * @param userId - User ID
 * @param timestamp - Backup timestamp
 * @param useSharding - Whether to use sharded storage (default: true)
 * @returns Backup path
 */
export function getAvatarBackupPath(
  userId: number,
  timestamp: number,
  useSharding: boolean = true
): string {
  if (useSharding) {
    const shard = getShardedPath(userId);
    return `${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_BACKUPS_DIR}/${shard}/backup-${timestamp}-user-${userId}.webp`;
  }
  
  return `${AVATAR_PATHS.OBJECT_STORAGE_PUBLIC_BACKUPS_DIR}/backup-${timestamp}-user-${userId}.webp`;
}

/**
 * Get local avatar filename for temporary uploads
 * 
 * @param userId - User ID
 * @param timestamp - Upload timestamp
 * @param extension - File extension
 * @returns Local filename
 */
export function getLocalAvatarFilename(
  userId: number,
  timestamp: number,
  extension: string = 'png'
): string {
  return `avatar_${userId}_${timestamp}.${extension}`;
}

/**
 * Get local avatar path (relative to project root)
 * 
 * @param userId - User ID
 * @param timestamp - Upload timestamp
 * @param extension - File extension
 * @returns Local file path
 */
export function getLocalAvatarPath(
  userId: number,
  timestamp: number,
  extension: string = 'png'
): string {
  const filename = getLocalAvatarFilename(userId, timestamp, extension);
  return `${AVATAR_PATHS.LOCAL_DIR}/${filename}`;
}

/**
 * Convert object storage path to public URL
 * 
 * @param objectPath - Object storage path (without prefix)
 * @returns Public URL path
 */
export function objectPathToPublicUrl(objectPath: string): string {
  return `/public-objects/${objectPath}`;
}

/**
 * Extract object path from public URL
 * 
 * @param publicUrl - Public URL (e.g., /public-objects/avatars/user-1.webp)
 * @returns Object storage path without prefix
 */
export function publicUrlToObjectPath(publicUrl: string): string | null {
  if (publicUrl.startsWith('/public-objects/')) {
    return publicUrl.replace('/public-objects/', '');
  }
  return null;
}

/**
 * Check if URL is an object storage URL
 * 
 * @param url - URL to check
 * @returns True if URL is from object storage
 */
export function isObjectStorageUrl(url: string): boolean {
  return url.startsWith('/public-objects/') || url.includes('storage.googleapis.com') || url.includes('r2.cloudflarestorage.com');
}

/**
 * Legacy path patterns to scan during migration
 */
export const LEGACY_AVATAR_PATTERNS = [
  '/public-objects/avatars/%',
  '/public-objects/public/avatars/%',
  '/uploads/avatars/%',
  '/uploads/profile/%',
] as const;
