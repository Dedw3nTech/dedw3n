/**
 * Production Environment Diagnostic Tool
 * 
 * Clean coding: Single responsibility - diagnose production environment issues
 * Usage: Run this to check if production is properly configured
 */

import { db } from './db';
import { users } from '@shared/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { fileURLToPath } from 'url';

interface DiagnosticResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    value?: string;
  }>;
}

export class ProductionDiagnostic {
  
  /**
   * Check environment variables
   */
  async checkEnvironmentVariables(): Promise<DiagnosticResult> {
    const checks = [];
    
    // Critical environment variables
    const criticalVars = {
      'DATABASE_URL': process.env.DATABASE_URL,
      'SESSION_SECRET': process.env.SESSION_SECRET,
      'PASSWORD_PEPPER': process.env.PASSWORD_PEPPER,
      'PUBLIC_OBJECT_SEARCH_PATHS': process.env.PUBLIC_OBJECT_SEARCH_PATHS,
      'PRIVATE_OBJECT_DIR': process.env.PRIVATE_OBJECT_DIR,
    };
    
    for (const [name, value] of Object.entries(criticalVars)) {
      if (!value) {
        checks.push({
          name,
          status: 'fail' as const,
          message: `${name} is not set - CRITICAL`,
        });
      } else {
        // Mask the actual value for security
        const maskedValue = value.length > 20 
          ? `${value.substring(0, 20)}...` 
          : value.substring(0, 10) + '***';
        
        checks.push({
          name,
          status: 'pass' as const,
          message: `${name} is configured`,
          value: maskedValue,
        });
      }
    }
    
    // Check NODE_ENV
    const nodeEnv = process.env.NODE_ENV || 'development';
    checks.push({
      name: 'NODE_ENV',
      status: nodeEnv === 'production' ? 'pass' as const : 'warning' as const,
      message: `Environment: ${nodeEnv}`,
      value: nodeEnv,
    });
    
    // Check ALLOWED_ORIGINS for CORS
    if (!process.env.ALLOWED_ORIGINS) {
      checks.push({
        name: 'ALLOWED_ORIGINS',
        status: 'warning' as const,
        message: 'ALLOWED_ORIGINS not set - may cause CORS issues',
      });
    } else {
      const origins = process.env.ALLOWED_ORIGINS.split(',').filter(Boolean);
      checks.push({
        name: 'ALLOWED_ORIGINS',
        status: 'pass' as const,
        message: `${origins.length} origin(s) configured`,
        value: origins[0],
      });
    }
    
    return {
      category: 'Environment Variables',
      checks,
    };
  }
  
  /**
   * Check database connectivity and avatar paths
   */
  async checkDatabase(): Promise<DiagnosticResult> {
    const checks = [];
    
    try {
      // Test database connection
      const testQuery = await db.select().from(users).limit(1);
      checks.push({
        name: 'Database Connection',
        status: 'pass' as const,
        message: 'Successfully connected to database',
      });
      
      // Check avatar paths format
      const usersWithAvatars = await db
        .select({
          id: users.id,
          username: users.username,
          avatar: users.avatar,
        })
        .from(users)
        .where(isNotNull(users.avatar))
        .limit(5);
      
      if (usersWithAvatars.length === 0) {
        checks.push({
          name: 'Avatar Paths',
          status: 'warning' as const,
          message: 'No users have avatars set',
        });
      } else {
        // Check if avatars use correct path format
        const correctFormat = usersWithAvatars.every(u => 
          u.avatar?.startsWith('/public-objects/')
        );
        
        if (correctFormat) {
          checks.push({
            name: 'Avatar Paths',
            status: 'pass' as const,
            message: `${usersWithAvatars.length} avatars use correct /public-objects/ format`,
            value: usersWithAvatars[0].avatar || undefined,
          });
        } else {
          const incorrectUsers = usersWithAvatars.filter(u => 
            !u.avatar?.startsWith('/public-objects/')
          );
          
          checks.push({
            name: 'Avatar Paths',
            status: 'fail' as const,
            message: `${incorrectUsers.length} avatars use incorrect path format`,
            value: incorrectUsers[0]?.avatar || undefined,
          });
        }
      }
      
      // Check session store table
      try {
        // Use sql tagged template for raw SQL with Neon
        const { sql: sqlTag } = await import('drizzle-orm');
        const sessionCheck = await db.execute(
          sqlTag`SELECT COUNT(*) as count FROM session_store WHERE expire > NOW()`
        );
        const sessionCount = Number((sessionCheck.rows[0] as any)?.count || 0);
        
        checks.push({
          name: 'Active Sessions',
          status: sessionCount > 0 ? 'pass' as const : 'warning' as const,
          message: `${sessionCount} active session(s) in database`,
          value: String(sessionCount),
        });
      } catch (sessionError) {
        // Session store table might not exist
        checks.push({
          name: 'Active Sessions',
          status: 'warning' as const,
          message: 'Could not check sessions (table may not exist)',
        });
      }
      
    } catch (error: any) {
      checks.push({
        name: 'Database Connection',
        status: 'fail' as const,
        message: `Database error: ${error.message}`,
      });
    }
    
    return {
      category: 'Database',
      checks,
    };
  }
  
  /**
   * Check object storage configuration
   */
  async checkObjectStorage(): Promise<DiagnosticResult> {
    const checks = [];
    
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    
    if (!publicPaths) {
      checks.push({
        name: 'Public Object Paths',
        status: 'fail' as const,
        message: 'PUBLIC_OBJECT_SEARCH_PATHS not set',
      });
    } else {
      const paths = publicPaths.split(',').map(p => p.trim()).filter(Boolean);
      
      // Validate path format
      const validFormat = paths.every(p => p.startsWith('/') && p.split('/').length >= 3);
      
      checks.push({
        name: 'Public Object Paths',
        status: validFormat ? 'pass' as const : 'fail' as const,
        message: validFormat 
          ? `${paths.length} path(s) configured correctly` 
          : 'Invalid path format - should be /bucket-name/public',
        value: paths[0],
      });
      
      // Extract bucket name
      if (paths.length > 0 && validFormat) {
        const bucketName = paths[0].split('/')[1];
        checks.push({
          name: 'Bucket Name',
          status: 'pass' as const,
          message: 'Object storage bucket detected',
          value: bucketName,
        });
      }
    }
    
    if (!privateDir) {
      checks.push({
        name: 'Private Object Directory',
        status: 'fail' as const,
        message: 'PRIVATE_OBJECT_DIR not set',
      });
    } else {
      const validFormat = privateDir.startsWith('/') && privateDir.split('/').length >= 3;
      
      checks.push({
        name: 'Private Object Directory',
        status: validFormat ? 'pass' as const : 'fail' as const,
        message: validFormat 
          ? 'Private directory configured correctly' 
          : 'Invalid format - should be /bucket-name/.private',
        value: privateDir,
      });
    }
    
    return {
      category: 'Object Storage',
      checks,
    };
  }
  
  /**
   * Check session configuration
   */
  async checkSessionConfiguration(): Promise<DiagnosticResult> {
    const checks = [];
    
    const sessionSecret = process.env.SESSION_SECRET;
    const passwordPepper = process.env.PASSWORD_PEPPER;
    
    if (!sessionSecret) {
      checks.push({
        name: 'Session Secret',
        status: 'fail' as const,
        message: 'SESSION_SECRET not set - sessions will fail',
      });
    } else if (sessionSecret.length < 32) {
      checks.push({
        name: 'Session Secret',
        status: 'warning' as const,
        message: 'SESSION_SECRET is too short (< 32 chars)',
        value: `Length: ${sessionSecret.length}`,
      });
    } else {
      checks.push({
        name: 'Session Secret',
        status: 'pass' as const,
        message: 'SESSION_SECRET properly configured',
        value: `Length: ${sessionSecret.length}`,
      });
    }
    
    if (!passwordPepper) {
      checks.push({
        name: 'Password Pepper',
        status: 'fail' as const,
        message: 'PASSWORD_PEPPER not set - authentication will fail',
      });
    } else {
      checks.push({
        name: 'Password Pepper',
        status: 'pass' as const,
        message: 'PASSWORD_PEPPER configured',
        value: `Length: ${passwordPepper.length}`,
      });
    }
    
    // Check cookie configuration
    // Match auth.ts logic: only enable secure cookies for actual HTTPS deployments
    const isHttps = process.env.REPLIT_DEPLOYMENT === '1' || 
                    process.env.NODE_ENV === 'production';
    
    checks.push({
      name: 'Cookie Security',
      status: 'pass' as const,
      message: isHttps ? 'Cookies use secure flag (HTTPS)' : 'Cookies use HTTP (dev mode)',
      value: isHttps ? 'secure=true' : 'secure=false',
    });
    
    return {
      category: 'Session & Authentication',
      checks,
    };
  }
  
  /**
   * Run all diagnostics
   */
  async runAll(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    results.push(await this.checkEnvironmentVariables());
    results.push(await this.checkDatabase());
    results.push(await this.checkObjectStorage());
    results.push(await this.checkSessionConfiguration());
    
    return results;
  }
  
  /**
   * Print results to console
   */
  printResults(results: DiagnosticResult[]): void {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 PRODUCTION ENVIRONMENT DIAGNOSTIC');
    console.log('='.repeat(70) + '\n');
    
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let warningChecks = 0;
    
    for (const result of results) {
      console.log(`\n📋 ${result.category}`);
      console.log('─'.repeat(70));
      
      for (const check of result.checks) {
        totalChecks++;
        
        let icon = '';
        if (check.status === 'pass') {
          icon = '✅';
          passedChecks++;
        } else if (check.status === 'fail') {
          icon = '❌';
          failedChecks++;
        } else {
          icon = '⚠️ ';
          warningChecks++;
        }
        
        console.log(`  ${icon} ${check.name}: ${check.message}`);
        if (check.value) {
          console.log(`     └─ ${check.value}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('─'.repeat(70));
    console.log(`  Total Checks: ${totalChecks}`);
    console.log(`  ✅ Passed: ${passedChecks}`);
    console.log(`  ❌ Failed: ${failedChecks}`);
    console.log(`  ⚠️  Warnings: ${warningChecks}`);
    
    if (failedChecks === 0 && warningChecks === 0) {
      console.log('\n  🎉 All checks passed! Production environment is properly configured.');
    } else if (failedChecks > 0) {
      console.log('\n  ⚠️  CRITICAL: Fix failed checks before deploying to production.');
    } else {
      console.log('\n  💡 Review warnings for optimal configuration.');
    }
    
    console.log('='.repeat(70) + '\n');
  }
  
  /**
   * Generate configuration instructions
   */
  generateInstructions(results: DiagnosticResult[]): string[] {
    const instructions: string[] = [];
    
    for (const result of results) {
      for (const check of result.checks) {
        if (check.status === 'fail') {
          switch (check.name) {
            case 'PUBLIC_OBJECT_SEARCH_PATHS':
              instructions.push(
                '1. Open Replit Object Storage tool\n' +
                '2. Note your bucket name (e.g., replit-objstore-XXXX)\n' +
                '3. Set environment variable:\n' +
                '   PUBLIC_OBJECT_SEARCH_PATHS=/replit-objstore-XXXX/public'
              );
              break;
              
            case 'PRIVATE_OBJECT_DIR':
              instructions.push(
                'Set environment variable:\n' +
                '   PRIVATE_OBJECT_DIR=/replit-objstore-XXXX/.private'
              );
              break;
              
            case 'SESSION_SECRET':
              instructions.push(
                'Generate a secure random string (32+ characters):\n' +
                '   SESSION_SECRET=<secure-random-string>'
              );
              break;
              
            case 'PASSWORD_PEPPER':
              instructions.push(
                'Generate a secure random string (32+ characters):\n' +
                '   PASSWORD_PEPPER=<secure-random-string>\n' +
                '   WARNING: Changing this will invalidate all passwords!'
              );
              break;
              
            case 'Database Connection':
              instructions.push(
                'Set DATABASE_URL environment variable:\n' +
                '   DATABASE_URL=postgresql://...'
              );
              break;
          }
        }
      }
    }
    
    return instructions;
  }
}

/**
 * CLI entry point
 */
export async function runProductionDiagnostic() {
  const diagnostic = new ProductionDiagnostic();
  
  try {
    const results = await diagnostic.runAll();
    diagnostic.printResults(results);
    
    const instructions = diagnostic.generateInstructions(results);
    if (instructions.length > 0) {
      console.log('\n📝 CONFIGURATION INSTRUCTIONS:\n');
      instructions.forEach((instruction, index) => {
        console.log(`${index + 1}. ${instruction}\n`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
    throw error;
  }
}

// Run diagnostic if executed directly
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  runProductionDiagnostic()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
