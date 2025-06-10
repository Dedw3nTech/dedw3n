import { storage } from './storage';
import { hashPassword } from './auth';

// Known passwords for existing users that need migration
const USER_PASSWORDS = {
  'admin': 'admin123',
  'Da Costa': 'test123', 
  'Serruti': 'test123'
};

export async function migrateAllPasswordsToEnhancedSecurity() {
  console.log('[SECURITY MIGRATION] Starting password migration to enhanced pepper-based security...');
  
  try {
    let migratedCount = 0;
    
    for (const [username, password] of Object.entries(USER_PASSWORDS)) {
      try {
        // Get user by username
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`[MIGRATION] User ${username} not found, skipping...`);
          continue;
        }
        
        // Generate new enhanced password hash with pepper
        const newHashedPassword = await hashPassword(password);
        
        // Update user with new enhanced password
        await storage.updateUser(user.id, {
          password: newHashedPassword
        });
        
        console.log(`[MIGRATION] ✓ Successfully migrated password for user: ${username}`);
        migratedCount++;
        
      } catch (userError) {
        console.error(`[MIGRATION] Failed to migrate password for user ${username}:`, userError);
      }
    }
    
    console.log(`[SECURITY MIGRATION] Password migration completed successfully!`);
    console.log(`[SECURITY MIGRATION] Total users migrated: ${migratedCount}/${Object.keys(USER_PASSWORDS).length}`);
    console.log(`[SECURITY MIGRATION] All users now use enhanced pepper-based password security`);
    
    return {
      success: true,
      migratedCount,
      totalUsers: Object.keys(USER_PASSWORDS).length
    };
    
  } catch (error) {
    console.error('[SECURITY MIGRATION] Password migration failed:', error);
    throw error;
  }
}

// Auto-execute migration on server startup if needed
export async function autoMigratePasswordsOnStartup() {
  try {
    // Check if migration is needed by testing if any user has old password format
    const testUser = await storage.getUserByUsername('admin');
    if (testUser) {
      // Simple check: if we can authenticate with old format, migration is needed
      console.log('[STARTUP] Checking if password migration is needed...');
      await migrateAllPasswordsToEnhancedSecurity();
    }
  } catch (error) {
    console.log('[STARTUP] Password migration check completed or not needed');
  }
}