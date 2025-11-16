/**
 * Storage Environment Variable Validator
 * 
 * Validates that all required environment variables for object storage
 * are properly set in both development and production environments.
 * 
 * CLEAN CODING: Focused validation only - no side effects
 */

interface EnvironmentValidationResult {
  isValid: boolean;
  environment: 'development' | 'production';
  variables: {
    name: string;
    value: string | null;
    isSet: boolean;
    isValid: boolean;
    issues: string[];
  }[];
  summary: {
    total: number;
    set: number;
    valid: number;
    missing: number;
  };
  criticalIssues: string[];
  warnings: string[];
}

export class StorageEnvironmentValidator {
  
  /**
   * Required environment variables for object storage
   */
  private requiredVars = [
    'PUBLIC_OBJECT_SEARCH_PATHS',
    'PRIVATE_OBJECT_DIR'
  ];
  
  /**
   * Validate a single environment variable
   */
  private validateVariable(name: string): {
    name: string;
    value: string | null;
    isSet: boolean;
    isValid: boolean;
    issues: string[];
  } {
    const value = process.env[name] || null;
    const issues: string[] = [];
    let isValid = true;
    
    if (!value) {
      issues.push(`${name} is not set`);
      isValid = false;
    } else {
      switch (name) {
        case 'PUBLIC_OBJECT_SEARCH_PATHS':
          if (!value.includes('/')) {
            issues.push('Must contain bucket path (e.g., /bucket-name/public)');
            isValid = false;
          }
          if (value.includes(',')) {
            const paths = value.split(',').map(p => p.trim());
            if (paths.some(p => !p.includes('/'))) {
              issues.push('All comma-separated paths must contain bucket path');
              isValid = false;
            }
          }
          break;
          
        case 'PRIVATE_OBJECT_DIR':
          if (!value.includes('/')) {
            issues.push('Must contain bucket path (e.g., /bucket-name/.private)');
            isValid = false;
          }
          break;
      }
    }
    
    return {
      name,
      value,
      isSet: !!value,
      isValid,
      issues
    };
  }
  
  /**
   * Detect current environment
   */
  private detectEnvironment(): 'development' | 'production' {
    if (process.env.NODE_ENV === 'production' || process.env.REPL_DEPLOYMENT === 'true') {
      return 'production';
    }
    return 'development';
  }
  
  /**
   * Validate all required environment variables
   */
  validateEnvironment(): EnvironmentValidationResult {
    const environment = this.detectEnvironment();
    const variables = this.requiredVars.map(name => this.validateVariable(name));
    
    const summary = {
      total: variables.length,
      set: variables.filter(v => v.isSet).length,
      valid: variables.filter(v => v.isValid).length,
      missing: variables.filter(v => !v.isSet).length
    };
    
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    
    variables.forEach(variable => {
      if (!variable.isSet) {
        criticalIssues.push(`CRITICAL: ${variable.name} is not set in ${environment}`);
      } else if (!variable.isValid) {
        criticalIssues.push(...variable.issues.map(i => `${variable.name}: ${i}`));
      }
    });
    
    if (environment === 'production' && summary.missing > 0) {
      criticalIssues.push(
        'Production deployments require all storage environment variables to be set'
      );
    }
    
    if (summary.set > 0 && summary.valid < summary.set) {
      warnings.push('Some environment variables are set but have invalid values');
    }
    
    return {
      isValid: summary.valid === summary.total,
      environment,
      variables,
      summary,
      criticalIssues,
      warnings
    };
  }
  
  /**
   * Print validation results to console
   */
  printValidationResults(result: EnvironmentValidationResult): void {
    console.log('\n=== Storage Environment Validation ===');
    console.log(`Environment: ${result.environment}`);
    console.log(`Status: ${result.isValid ? '✓ VALID' : '✗ INVALID'}`);
    console.log(`\nVariables: ${result.summary.valid}/${result.summary.total} valid`);
    
    result.variables.forEach(variable => {
      const status = variable.isValid ? '✓' : '✗';
      const valueDisplay = variable.value 
        ? (variable.value.length > 50 ? variable.value.substring(0, 47) + '...' : variable.value)
        : '(not set)';
      
      console.log(`  ${status} ${variable.name}: ${valueDisplay}`);
      
      if (variable.issues.length > 0) {
        variable.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    });
    
    if (result.criticalIssues.length > 0) {
      console.log('\nCritical Issues:');
      result.criticalIssues.forEach(issue => {
        console.log(`  ✗ ${issue}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => {
        console.log(`  ⚠ ${warning}`);
      });
    }
    
    console.log('=== Validation Complete ===\n');
  }
  
  /**
   * Validate on startup and throw if critical issues in production
   */
  validateOnStartupOrThrow(): void {
    const result = this.validateEnvironment();
    this.printValidationResults(result);
    
    if (!result.isValid && result.environment === 'production') {
      throw new Error(
        'Production deployment cannot start with invalid storage configuration. ' +
        'Please set all required environment variables.'
      );
    }
    
    if (!result.isValid && result.environment === 'development') {
      console.warn('⚠ Development environment has invalid storage configuration');
      console.warn('⚠ Some features may not work correctly');
    }
  }
  
  /**
   * Get environment variable setup instructions
   */
  getSetupInstructions(): string {
    const bucketId = process.env.REPL_ID 
      ? `replit-objstore-${process.env.REPL_ID}` 
      : 'your-bucket-id';
    
    return `
Storage Environment Setup Instructions:
========================================

Required Environment Variables:

1. PUBLIC_OBJECT_SEARCH_PATHS
   Description: Comma-separated list of public storage paths
   Format: /bucket-name/public
   Example: /${bucketId}/public
   
2. PRIVATE_OBJECT_DIR  
   Description: Directory for private storage
   Format: /bucket-name/.private
   Example: /${bucketId}/.private

Production Setup:
-----------------
1. Go to your Replit deployment settings
2. Add the environment variables above
3. Redeploy the application

Development Setup:
------------------
Environment variables should be automatically set by Replit
when you create an object storage bucket.

If not set, add them to your .env file or Secrets.
`;
  }
}

export const storageEnvironmentValidator = new StorageEnvironmentValidator();
