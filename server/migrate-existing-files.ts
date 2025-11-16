import fs from 'fs';
import path from 'path';
import { db } from './db';
import { users, posts, products, events, messages } from '../shared/schema';
import { eq, like, or } from 'drizzle-orm';
import { migrateExistingFile } from './persistent-upload-handler';

interface MigrationResult {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  updatedDatabaseRecords: number;
  errors: Array<{ file: string; error: string }>;
}

const BATCH_SIZE = 10;

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  try {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
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
  } catch {
    return arrayOfFiles;
  }
}

function getSubdirectory(filePath: string): string {
  if (filePath.includes('/avatars/')) return 'avatars';
  if (filePath.includes('/images/')) return 'images';
  if (filePath.includes('/videos/')) return 'videos';
  if (filePath.includes('/product/')) return 'product';
  if (filePath.includes('/events/')) return 'events';
  if (filePath.includes('/messages/')) return 'messages';
  if (filePath.includes('/documents/')) return 'documents';
  if (filePath.includes('/post/')) return 'post';
  if (filePath.includes('/profile/')) return 'profile';
  return 'uploads';
}

async function migrateFileBatch(
  files: Array<{ path: string; visibility: 'public' | 'private' }>,
  fileUrlMap: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  await Promise.all(
    files.map(async ({ path: filePath, visibility }) => {
      try {
        const subdirectory = getSubdirectory(filePath);
        const newUrl = await migrateExistingFile(filePath, visibility, subdirectory);
        
        if (!newUrl) {
          result.failedFiles++;
          result.errors.push({ file: filePath, error: 'Empty URL' });
          return;
        }
        
        const baseDir = visibility === 'public' ? 'public' : 'private';
        const relativePath = path.relative(path.join(process.cwd(), baseDir), filePath);
        const oldUrl = visibility === 'public' 
          ? `/${relativePath.replace(/\\/g, '/')}`
          : `/private/${relativePath.replace(/\\/g, '/')}`;
        
        fileUrlMap.set(oldUrl, newUrl);
        result.migratedFiles++;
      } catch (error) {
        result.failedFiles++;
        result.errors.push({ 
          file: filePath, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    })
  );
}

export async function migrateAllFiles(): Promise<MigrationResult> {
  const startTime = Date.now();
  console.log('🔄 Starting migration...');

  const result: MigrationResult = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    updatedDatabaseRecords: 0,
    errors: [],
  };

  const fileUrlMap = new Map<string, string>();

  try {
    const publicFiles = getAllFiles(path.join(process.cwd(), 'public', 'uploads'));
    const privateFiles = getAllFiles(path.join(process.cwd(), 'private', 'uploads'));
    
    result.totalFiles = publicFiles.length + privateFiles.length;

    if (result.totalFiles === 0) {
      console.log('✓ No files to migrate\n');
      return result;
    }

    console.log(`📦 ${result.totalFiles} files (${publicFiles.length} public, ${privateFiles.length} private)`);

    const allFiles = [
      ...publicFiles.map(p => ({ path: p, visibility: 'public' as const })),
      ...privateFiles.map(p => ({ path: p, visibility: 'private' as const }))
    ];

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      await migrateFileBatch(batch, fileUrlMap, result);
      const progress = Math.round(((i + batch.length) / allFiles.length) * 100);
      process.stdout.write(`\r⏳ Progress: ${progress}% (${result.migratedFiles}/${result.totalFiles})`);
    }

    console.log('\n📝 Updating database...');
    await updateDatabaseBatch(fileUrlMap, result);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Complete in ${duration}s | Migrated: ${result.migratedFiles} | Failed: ${result.failedFiles} | DB Updates: ${result.updatedDatabaseRecords}\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  return result;
}

async function updateDatabaseBatch(
  fileUrlMap: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  try {
    const tasks = [
      updateUsers(fileUrlMap, result),
      updatePosts(fileUrlMap, result),
      updateProducts(fileUrlMap, result),
      updateEvents(fileUrlMap, result),
      updateMessages(fileUrlMap, result)
    ];
    
    await Promise.all(tasks);
  } catch (error) {
    console.error('DB update error:', error);
    throw error;
  }
}

async function updateUsers(fileUrlMap: Map<string, string>, result: MigrationResult): Promise<void> {
  const records = await db.select().from(users).where(
    or(like(users.avatar, '/uploads/%'), like(users.avatar, '%/uploads/%'))
  );
  
  await Promise.all(records.map(async (user) => {
    if (!user.avatar) return;
    const newUrl = findNewUrl(user.avatar, fileUrlMap);
    if (newUrl) {
      await db.update(users).set({ avatar: newUrl }).where(eq(users.id, user.id));
      result.updatedDatabaseRecords++;
    }
  }));
}

async function updatePosts(fileUrlMap: Map<string, string>, result: MigrationResult): Promise<void> {
  const records = await db.select().from(posts).where(
    or(
      like(posts.imageUrl, '/uploads/%'), 
      like(posts.imageUrl, '%/uploads/%'),
      like(posts.videoUrl, '/uploads/%'), 
      like(posts.videoUrl, '%/uploads/%')
    )
  );
  
  await Promise.all(records.map(async (post) => {
    const updates: any = {};
    if (post.imageUrl) {
      const newUrl = findNewUrl(post.imageUrl, fileUrlMap);
      if (newUrl) updates.imageUrl = newUrl;
    }
    if (post.videoUrl) {
      const newUrl = findNewUrl(post.videoUrl, fileUrlMap);
      if (newUrl) updates.videoUrl = newUrl;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(posts).set(updates).where(eq(posts.id, post.id));
      result.updatedDatabaseRecords++;
    }
  }));
}

async function updateProducts(fileUrlMap: Map<string, string>, result: MigrationResult): Promise<void> {
  const records = await db.select().from(products).where(
    or(like(products.imageUrl, '/uploads/%'), like(products.imageUrl, '%/uploads/%'))
  );
  
  await Promise.all(records.map(async (product) => {
    if (!product.imageUrl) return;
    const newUrl = findNewUrl(product.imageUrl, fileUrlMap);
    if (newUrl) {
      await db.update(products).set({ imageUrl: newUrl }).where(eq(products.id, product.id));
      result.updatedDatabaseRecords++;
    }
  }));
}

async function updateEvents(fileUrlMap: Map<string, string>, result: MigrationResult): Promise<void> {
  const records = await db.select().from(events).where(
    or(like(events.coverImage, '/uploads/%'), like(events.coverImage, '%/uploads/%'))
  );
  
  await Promise.all(records.map(async (event) => {
    if (!event.coverImage) return;
    const newUrl = findNewUrl(event.coverImage, fileUrlMap);
    if (newUrl) {
      await db.update(events).set({ coverImage: newUrl }).where(eq(events.id, event.id));
      result.updatedDatabaseRecords++;
    }
  }));
}

async function updateMessages(fileUrlMap: Map<string, string>, result: MigrationResult): Promise<void> {
  const records = await db.select().from(messages).where(
    or(
      like(messages.attachmentUrl, '/uploads/%'), 
      like(messages.attachmentUrl, '%/uploads/%'),
      like(messages.attachmentUrl, '%/private/uploads/%')
    )
  );
  
  await Promise.all(records.map(async (message) => {
    if (!message.attachmentUrl) return;
    const newUrl = findNewUrl(message.attachmentUrl, fileUrlMap);
    if (newUrl) {
      await db.update(messages).set({ attachmentUrl: newUrl }).where(eq(messages.id, message.id));
      result.updatedDatabaseRecords++;
    }
  }));
}

function findNewUrl(oldUrl: string, fileUrlMap: Map<string, string>): string | null {
  if (fileUrlMap.has(oldUrl)) return fileUrlMap.get(oldUrl)!;
  
  const filename = path.basename(oldUrl);
  const entries = Array.from(fileUrlMap.entries());
  for (const [key, value] of entries) {
    if (path.basename(key) === filename) return value;
  }
  
  return null;
}
