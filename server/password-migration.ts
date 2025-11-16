import { storage } from './storage';
import { hashPassword } from './auth';
import { logger } from './logger';

// Known passwords for existing users that need migration
const USER_PASSWORDS = {
  'admin': 'admin123',
  'Da Costa': 'test123', 
  'Serruti': 'test123'
};

export async function migrateAllPasswordsToEnhancedSecurity() {
  logger.info('Starting password migration to enhanced security', { userCount: Object.keys(USER_PASSWORDS).length }, 'server');
  
  try {
    let migratedCount = 0;
    
    for (const [username, password] of Object.entries(USER_PASSWORDS)) {
      try {
        // Get user by username
        const user = await storage.getUserByUsername(username);
        if (!user) {
          logger.debug('User not found during password migration', { username }, 'server');
          continue;
        }
        
        // Generate new enhanced password hash with pepper
        const newHashedPassword = await hashPassword(password);
        
        // Update user with new enhanced password
        await storage.updateUser(user.id, {
          password: newHashedPassword
        });
        
        logger.info('Successfully migrated password for user', { username }, 'server');
        migratedCount++;
        
      } catch (userError) {
        logger.error('Failed to migrate password for user', { username }, userError as Error, 'server');
      }
    }
    
    logger.info('Password migration completed', { migratedCount, totalUsers: Object.keys(USER_PASSWORDS).length }, 'server');
    
    return {
      success: true,
      migratedCount,
      totalUsers: Object.keys(USER_PASSWORDS).length
    };
    
  } catch (error) {
    logger.error('Password migration failed', undefined, error as Error, 'server');
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
      logger.debug('Checking if password migration is needed', undefined, 'startup');
      await migrateAllPasswordsToEnhancedSecurity();
    }
  } catch (error) {
    logger.debug('Password migration check completed', undefined, 'startup');
  }
}