/**
 * Auto-Configuration for Production Environment
 * 
 * Clean coding: Automatic detection and fixing of production configuration issues
 * Best practices: Validates environment, provides clear instructions, fails safely
 * 
 * Usage: Import and call autoConfigureProduction() on server startup
 */

import crypto from 'crypto';
import { ProductionDiagnostic } from './production-diagnostic';

interface ConfigFix {
  variable: string;
  action: 'set' | 'verify' | 'manual';
  value?: string;
  instructions: string;
  critical: boolean;
}

export class ProductionAutoConfig {
  
  /**
   * Generate a cryptographically secure random string
   */
  private generateSecureSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Detect environment (development vs production)
   */
  private detectEnvironment(): 'development' | 'production' {
    if (process.env.NODE_ENV === 'production' || 
        process.env.REPL_DEPLOYMENT === 'true' ||
        process.env.REPLIT_DEPLOYMENT === '1') {
      return 'production';
    }
    return 'development';
  }
  
  /**
   * Check if running in Replit environment
   */
  private isReplitEnvironment(): boolean {
    return !!(process.env.REPL_ID || process.env.REPLIT_DOMAINS);
  }
  
  /**
   * Get expected bucket path from Repl ID
   */
  private getExpectedBucketPath(): string | null {
    const replId = process.env.REPL_ID;
    if (!replId) return null;
    
    return `/replit-objstore-${replId}`;
  }
  
  /**
   * Validate environment variable and suggest fixes
   */
  private validateEnvironmentVariable(name: string, currentValue: string | undefined): ConfigFix | null {
    const environment = this.detectEnvironment();
    
    switch (name) {
      case 'DATABASE_URL':
        if (!currentValue) {
          return {
            variable: name,
            action: 'manual',
            critical: true,
            instructions: 'DATABASE_URL must be set manually. Use Replit Database tool to provision a PostgreSQL database.'
          };
        }
        // Check if it's a valid PostgreSQL URL
        if (!currentValue.startsWith('postgres://') && !currentValue.startsWith('postgresql://')) {
          return {
            variable: name,
            action: 'verify',
            critical: true,
            instructions: 'DATABASE_URL appears invalid. It should start with postgresql:// or postgres://'
          };
        }
        return null;
      
      case 'SESSION_SECRET':
        if (!currentValue) {
          const generated = this.generateSecureSecret(32);
          return {
            variable: name,
            action: 'set',
            value: generated,
            critical: true,
            instructions: `SESSION_SECRET not set. Generated secure value: ${generated}\nAdd this to your environment secrets.`
          };
        }
        if (currentValue.length < 32) {
          return {
            variable: name,
            action: 'verify',
            critical: false,
            instructions: `SESSION_SECRET is too short (${currentValue.length} chars). Recommended: 32+ characters for security.`
          };
        }
        return null;
      
      case 'PASSWORD_PEPPER':
        if (!currentValue) {
          return {
            variable: name,
            action: 'manual',
            critical: true,
            instructions: 'PASSWORD_PEPPER must match the value from development environment.\nWARNING: Do NOT generate a new value - use the same value from dev!\nChanging this will invalidate all user passwords.'
          };
        }
        return null;
      
      case 'PUBLIC_OBJECT_SEARCH_PATHS':
        if (!currentValue) {
          const expectedPath = this.getExpectedBucketPath();
          if (expectedPath) {
            const suggestedValue = `${expectedPath}/public`;
            return {
              variable: name,
              action: 'set',
              value: suggestedValue,
              critical: true,
              instructions: `PUBLIC_OBJECT_SEARCH_PATHS not set. Suggested value: ${suggestedValue}\nVerify this bucket exists in Replit Object Storage.`
            };
          }
          return {
            variable: name,
            action: 'manual',
            critical: true,
            instructions: 'PUBLIC_OBJECT_SEARCH_PATHS not set. Format: /bucket-name/public\nCheck Replit Object Storage tool for your bucket name.'
          };
        }
        // Validate format
        if (!currentValue.includes('/')) {
          return {
            variable: name,
            action: 'verify',
            critical: true,
            instructions: 'PUBLIC_OBJECT_SEARCH_PATHS has invalid format. Should be: /bucket-name/public'
          };
        }
        return null;
      
      case 'PRIVATE_OBJECT_DIR':
        if (!currentValue) {
          const expectedPath = this.getExpectedBucketPath();
          if (expectedPath) {
            const suggestedValue = `${expectedPath}/.private`;
            return {
              variable: name,
              action: 'set',
              value: suggestedValue,
              critical: true,
              instructions: `PRIVATE_OBJECT_DIR not set. Suggested value: ${suggestedValue}\nVerify this bucket exists in Replit Object Storage.`
            };
          }
          return {
            variable: name,
            action: 'manual',
            critical: true,
            instructions: 'PRIVATE_OBJECT_DIR not set. Format: /bucket-name/.private\nCheck Replit Object Storage tool for your bucket name.'
          };
        }
        return null;
      
      case 'ALLOWED_ORIGINS':
        if (!currentValue && environment === 'production') {
          return {
            variable: name,
            action: 'verify',
            critical: false,
            instructions: 'ALLOWED_ORIGINS not set. This may cause CORS issues.\nRecommended: Set to your production domain(s), e.g., https://dedw3n.com,https://www.dedw3n.com'
          };
        }
        return null;
      
      case 'NODE_ENV':
        if (currentValue !== 'production' && environment === 'production') {
          return {
            variable: name,
            action: 'set',
            value: 'production',
            critical: false,
            instructions: 'NODE_ENV should be set to "production" in production environment.'
          };
        }
        return null;
      
      default:
        return null;
    }
  }
  
  /**
   * Scan all critical environment variables
   */
  async scanConfiguration(): Promise<ConfigFix[]> {
    const criticalVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'PASSWORD_PEPPER',
      'PUBLIC_OBJECT_SEARCH_PATHS',
      'PRIVATE_OBJECT_DIR',
      'ALLOWED_ORIGINS',
      'NODE_ENV'
    ];
    
    const fixes: ConfigFix[] = [];
    
    for (const varName of criticalVars) {
      const currentValue = process.env[varName];
      const fix = this.validateEnvironmentVariable(varName, currentValue);
      
      if (fix) {
        fixes.push(fix);
      }
    }
    
    return fixes;
  }
  
  /**
   * Generate configuration file with all fixes
   */
  generateConfigFile(fixes: ConfigFix[]): string {
    let config = '# Auto-Generated Production Configuration\n';
    config += '# Generated: ' + new Date().toISOString() + '\n\n';
    config += '# Add these to your Replit Secrets (Production Environment)\n\n';
    
    const criticalFixes = fixes.filter(f => f.critical);
    const nonCriticalFixes = fixes.filter(f => !f.critical);
    
    if (criticalFixes.length > 0) {
      config += '# ===== CRITICAL - Required for application to work =====\n\n';
      
      for (const fix of criticalFixes) {
        config += `# ${fix.variable}\n`;
        config += `# ${fix.instructions}\n`;
        
        if (fix.action === 'set' && fix.value) {
          config += `${fix.variable}="${fix.value}"\n`;
        } else {
          config += `# ${fix.variable}=<NEEDS MANUAL SETUP>\n`;
        }
        config += '\n';
      }
    }
    
    if (nonCriticalFixes.length > 0) {
      config += '\n# ===== RECOMMENDED - Improves security/performance =====\n\n';
      
      for (const fix of nonCriticalFixes) {
        config += `# ${fix.variable}\n`;
        config += `# ${fix.instructions}\n`;
        
        if (fix.action === 'set' && fix.value) {
          config += `${fix.variable}="${fix.value}"\n`;
        } else {
          config += `# ${fix.variable}=<RECOMMENDED>\n`;
        }
        config += '\n';
      }
    }
    
    config += '\n# ===== Instructions =====\n';
    config += '# 1. Copy the values above\n';
    config += '# 2. Go to Replit Secrets panel\n';
    config += '# 3. Add each environment variable\n';
    config += '# 4. Restart the application\n';
    
    return config;
  }
  
  /**
   * Print configuration fixes to console
   */
  printConfigurationReport(fixes: ConfigFix[]): void {
    const environment = this.detectEnvironment();
    
    console.log('\n' + '='.repeat(70));
    console.log('🔧 AUTO-CONFIGURATION REPORT');
    console.log('='.repeat(70));
    console.log(`Environment: ${environment.toUpperCase()}`);
    console.log(`Replit Environment: ${this.isReplitEnvironment() ? 'YES' : 'NO'}`);
    console.log('='.repeat(70) + '\n');
    
    if (fixes.length === 0) {
      console.log('✅ All configuration checks passed!');
      console.log('   No fixes needed.\n');
      return;
    }
    
    const criticalCount = fixes.filter(f => f.critical).length;
    const recommendedCount = fixes.filter(f => !f.critical).length;
    
    console.log(`Found ${fixes.length} configuration issue(s):`);
    console.log(`  ❌ Critical: ${criticalCount}`);
    console.log(`  ⚠️  Recommended: ${recommendedCount}\n`);
    
    // Group by action type
    const autoFixes = fixes.filter(f => f.action === 'set');
    const manualFixes = fixes.filter(f => f.action === 'manual');
    const verifyFixes = fixes.filter(f => f.action === 'verify');
    
    if (autoFixes.length > 0) {
      console.log('🔄 AUTO-FIXABLE (Values Generated):');
      console.log('─'.repeat(70));
      
      for (const fix of autoFixes) {
        const icon = fix.critical ? '❌' : '⚠️ ';
        console.log(`${icon} ${fix.variable}`);
        console.log(`   Generated: ${fix.value}`);
        console.log(`   → ${fix.instructions}\n`);
      }
    }
    
    if (manualFixes.length > 0) {
      console.log('🛠️  MANUAL SETUP REQUIRED:');
      console.log('─'.repeat(70));
      
      for (const fix of manualFixes) {
        const icon = fix.critical ? '❌' : '⚠️ ';
        console.log(`${icon} ${fix.variable}`);
        console.log(`   → ${fix.instructions}\n`);
      }
    }
    
    if (verifyFixes.length > 0) {
      console.log('⚠️  VERIFICATION NEEDED:');
      console.log('─'.repeat(70));
      
      for (const fix of verifyFixes) {
        console.log(`⚠️  ${fix.variable}`);
        console.log(`   → ${fix.instructions}\n`);
      }
    }
    
    console.log('='.repeat(70));
    console.log('📝 NEXT STEPS:');
    console.log('─'.repeat(70));
    console.log('1. Review the configuration issues above');
    console.log('2. A configuration file has been generated: production.env.example');
    console.log('3. Add the variables to Replit Secrets');
    console.log('4. Restart the application');
    
    if (criticalCount > 0) {
      console.log('\n⚠️  WARNING: Application may not work correctly until critical issues are fixed!');
    }
    
    console.log('='.repeat(70) + '\n');
  }
  
  /**
   * Main auto-configuration function
   */
  async autoConfigureProduction(): Promise<{
    fixes: ConfigFix[];
    configFile: string;
    hasCriticalIssues: boolean;
  }> {
    console.log('[AUTO-CONFIG] Starting production environment scan...\n');
    
    // Scan configuration
    const fixes = await this.scanConfiguration();
    
    // Generate config file content
    const configFile = this.generateConfigFile(fixes);
    
    // Print report
    this.printConfigurationReport(fixes);
    
    // Check for critical issues
    const hasCriticalIssues = fixes.some(f => f.critical);
    
    return {
      fixes,
      configFile,
      hasCriticalIssues
    };
  }
  
  /**
   * Run both diagnostic and auto-config
   */
  async runCompleteCheck(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 COMPLETE PRODUCTION CHECK');
    console.log('='.repeat(70) + '\n');
    
    // Step 1: Run diagnostic
    console.log('Step 1: Running diagnostic...\n');
    const diagnostic = new ProductionDiagnostic();
    const diagnosticResults = await diagnostic.runAll();
    diagnostic.printResults(diagnosticResults);
    
    // Step 2: Run auto-config
    console.log('\nStep 2: Running auto-configuration...\n');
    const { fixes, configFile, hasCriticalIssues } = await this.autoConfigureProduction();
    
    // Step 3: Write config file
    if (fixes.length > 0) {
      const fs = await import('fs/promises');
      await fs.writeFile('production.env.example', configFile);
      console.log('📄 Configuration file written: production.env.example\n');
    }
    
    // Step 4: Final summary
    console.log('='.repeat(70));
    console.log('✅ COMPLETE CHECK FINISHED');
    console.log('='.repeat(70));
    
    if (hasCriticalIssues) {
      console.log('\n⚠️  Critical configuration issues found!');
      console.log('   Review production.env.example and fix critical issues.');
      console.log('   Application may not function correctly until fixed.\n');
    } else if (fixes.length > 0) {
      console.log('\n✅ No critical issues, but some improvements recommended.');
      console.log('   Review production.env.example for optimization suggestions.\n');
    } else {
      console.log('\n🎉 All checks passed! Production environment is properly configured.\n');
    }
  }
}

/**
 * Quick auto-config function for easy import
 */
export async function autoConfigureProduction() {
  const autoConfig = new ProductionAutoConfig();
  return await autoConfig.autoConfigureProduction();
}

/**
 * CLI entry point
 */
export async function runAutoConfig() {
  const autoConfig = new ProductionAutoConfig();
  
  try {
    await autoConfig.runCompleteCheck();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Auto-configuration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
import { fileURLToPath } from 'url';

if (process.argv[1] === __filename) {
  runAutoConfig();
}
