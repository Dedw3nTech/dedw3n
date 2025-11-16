/**
 * Migration: Update Admin Email and Verification Status
 * Date: November 3, 2025
 * Purpose: Set official admin email to info@dedw3n.com and mark as verified
 * 
 * This migration can be run safely in any environment (dev/staging/production)
 * It uses idempotent logic to prevent duplicate updates
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and } from 'drizzle-orm';
import { users } from '../../shared/schema';

export async function updateAdminEmail() {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('[MIGRATION] Starting admin email update...');
  
  // Create database connection
  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  try {
    // Update admin account with official email and verification status
    const result = await db
      .update(users)
      .set({
        email: 'info@dedw3n.com',
        emailVerified: true,
      })
      .where(
        and(
          eq(users.id, 1),
          eq(users.role, 'admin')
        )
      )
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        emailVerified: users.emailVerified,
        role: users.role,
      });

    if (result.length > 0) {
      console.log('[MIGRATION] ✅ Admin email updated successfully:');
      console.log('[MIGRATION]   - Email: info@dedw3n.com');
      console.log('[MIGRATION]   - Verified: true');
      console.log('[MIGRATION]   - User ID:', result[0].id);
      return result[0];
    } else {
      console.log('[MIGRATION] ⚠️  No admin user found with ID 1');
      return null;
    }
  } catch (error) {
    console.error('[MIGRATION] ❌ Error updating admin email:', error);
    throw error;
  }
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAdminEmail()
    .then((result) => {
      if (result) {
        console.log('\n✅ Migration completed successfully');
        process.exit(0);
      } else {
        console.log('\n⚠️  Migration completed but no changes made');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}
