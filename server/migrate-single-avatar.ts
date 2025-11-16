/**
 * One-time migration: Copy avatar file from duplicate public path to correct path
 */

import { S3Client, CopyObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = "987df99e227c1b3cd8bbc12db0692cdf";
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || '').split('/')[1] || 'dedw3n';
const SOURCE_KEY = 'public/public/avatars/0-999/user-4.webp';
const TARGET_KEY = 'public/avatars/0-999/user-4.webp';

async function migrateFile() {
  try {
    console.log(`\n🔄 Avatar File Migration`);
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Source: ${SOURCE_KEY}`);
    console.log(`Target: ${TARGET_KEY}\n`);
    
    // Check if source exists
    console.log('Checking source file...');
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: SOURCE_KEY,
      }));
      console.log('✓ Source file exists');
    } catch (e: any) {
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
        console.error('✗ Source file not found - it may have already been migrated');
        console.log('\nChecking if target already exists...');
        try {
          await s3Client.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: TARGET_KEY,
          }));
          console.log('✓ Target file already exists - migration not needed!');
          process.exit(0);
        } catch {
          console.error('✗ Neither source nor target exists - file may need to be re-uploaded');
          process.exit(1);
        }
      }
      throw e;
    }
    
    // Check if target already exists
    console.log('Checking target location...');
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: TARGET_KEY,
      }));
      console.log('⚠ Target file already exists - deleting source duplicate');
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: SOURCE_KEY,
      }));
      console.log('✓ Cleanup complete!');
      process.exit(0);
    } catch (e: any) {
      if (e.name !== 'NotFound' && e.$metadata?.httpStatusCode !== 404) {
        throw e;
      }
      console.log('✓ Target location is empty');
    }
    
    // Copy to target
    console.log('\nCopying file...');
    const encodedSource = `${encodeURIComponent(BUCKET_NAME)}/${encodeURIComponent(SOURCE_KEY)}`;
    await s3Client.send(new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TARGET_KEY,
      CopySource: encodedSource,
    }));
    console.log('✓ File copied successfully!');
    
    // Delete source
    console.log('Cleaning up source file...');
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: SOURCE_KEY,
    }));
    console.log('✓ Source file deleted');
    
    console.log('\n✅ Migration complete!');
    console.log(`Avatar is now at: ${TARGET_KEY}\n`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateFile();
