/**
 * Production Configuration Validator
 * 
 * Validates that all required environment variables and configurations are properly set
 * for production deployment. Run this before deploying to catch configuration issues early.
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Validate all required environment variables
 */
function validateEnvironmentVariables(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  // Critical environment variables (deployment will fail without these)
  const criticalVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'PUBLIC_OBJECT_SEARCH_PATHS',
    'PRIVATE_OBJECT_DIR',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'BREVO_API_KEY'
  ];

  // Optional but recommended for production
  const recommendedVars = [
    'COINGECKO_API_KEY',
    'NODE_OPTIONS'
  ];

  // Check critical variables
  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      result.valid = false;
      result.errors.push(`❌ CRITICAL: ${varName} is not set`);
    } else {
      result.info.push(`✅ ${varName} is configured`);
    }
  }

  // Check recommended variables
  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      result.warnings.push(`💡 ${varName} is not set - recommended for production`);
    } else {
      result.info.push(`✅ ${varName} is configured`);
    }
  }

  return result;
}

/**
 * Validate database configuration
 */
async function validateDatabaseConfiguration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      result.valid = false;
      result.errors.push('❌ DATABASE_URL is not configured');
      return result;
    }

    // Check if DATABASE_URL uses SSL (required for Neon)
    if (!databaseUrl.includes('sslmode=require') && !databaseUrl.includes('ssl=true')) {
      result.warnings.push('⚠️  DATABASE_URL may not have SSL enabled');
    } else {
      result.info.push('✅ Database SSL appears to be configured');
    }

    // Check if it's a Neon URL
    if (databaseUrl.includes('neon.tech')) {
      result.info.push('✅ Using Neon serverless PostgreSQL');
      result.info.push('💡 Remember: Neon charges for idle time - keep connections short');
    }

    result.info.push('✅ Database configuration appears valid');

  } catch (error) {
    result.valid = false;
    result.errors.push(`❌ Error validating database: ${error}`);
  }

  return result;
}

/**
 * Validate object storage configuration
 */
function validateObjectStorageConfiguration(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
  const privateDir = process.env.PRIVATE_OBJECT_DIR;

  if (!publicPaths) {
    result.valid = false;
    result.errors.push('❌ PUBLIC_OBJECT_SEARCH_PATHS is not set');
  } else {
    const paths = publicPaths.split(',').filter(p => p.trim());
    result.info.push(`✅ ${paths.length} public path(s) configured`);
    
    // Validate paths format
    paths.forEach(path => {
      if (!path.startsWith('/')) {
        result.warnings.push(`⚠️  Public path should start with /: ${path}`);
      }
    });
  }

  if (!privateDir) {
    result.valid = false;
    result.errors.push('❌ PRIVATE_OBJECT_DIR is not set');
  } else {
    result.info.push('✅ Private object directory configured');
    
    if (!privateDir.startsWith('/')) {
      result.warnings.push('⚠️  Private directory should start with /');
    }
  }

  return result;
}

/**
 * Validate session configuration
 */
function validateSessionConfiguration(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    result.valid = false;
    result.errors.push('❌ SESSION_SECRET is not set');
    return result;
  }

  // Check session secret strength
  if (sessionSecret.length < 32) {
    result.warnings.push('⚠️  SESSION_SECRET should be at least 32 characters for production');
  } else {
    result.info.push('✅ SESSION_SECRET meets minimum length requirement');
  }

  // Check for obvious weak secrets
  const weakSecrets = ['secret', 'password', '12345', 'test', 'development'];
  if (weakSecrets.some(weak => sessionSecret.toLowerCase().includes(weak))) {
    result.errors.push('❌ SESSION_SECRET appears to be a weak/default value');
    result.valid = false;
  }

  return result;
}

/**
 * Validate payment configuration
 */
function validatePaymentConfiguration(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripePublishable = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!stripeSecret || !stripePublishable) {
    result.warnings.push('⚠️  Stripe keys not configured - payment features will not work');
    result.info.push('💡 Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to enable payments');
  } else {
    // Check if using test keys in production
    if (stripeSecret.startsWith('sk_test_') || stripePublishable.startsWith('pk_test_')) {
      result.errors.push('❌ Using Stripe TEST keys - switch to LIVE keys for production');
      result.valid = false;
    } else if (stripeSecret.startsWith('sk_live_') && stripePublishable.startsWith('pk_live_')) {
      result.info.push('✅ Stripe configured with LIVE keys');
    }
  }

  // Check for CoinGecko API key
  const coinGeckoKey = process.env.COINGECKO_API_KEY;
  if (!coinGeckoKey) {
    result.warnings.push('⚠️  COINGECKO_API_KEY not set - may hit rate limits on crypto prices');
    result.info.push('💡 Consider getting a paid CoinGecko API key for production');
  } else {
    result.info.push('✅ CoinGecko API key configured');
  }

  return result;
}

/**
 * Validate email configuration
 */
function validateEmailConfiguration(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  const brevoKey = process.env.BREVO_API_KEY;

  if (!brevoKey) {
    result.warnings.push('⚠️  BREVO_API_KEY not set - email features will not work');
    result.info.push('💡 Set BREVO_API_KEY to enable email notifications');
  } else {
    result.info.push('✅ Brevo email service configured');
  }

  return result;
}

/**
 * Run all validations and print results
 */
export async function validateProductionConfiguration(): Promise<boolean> {
  console.log('\n🔍 Production Configuration Validator');
  console.log('=====================================\n');

  let allValid = true;
  const allResults: Array<{ name: string; result: ValidationResult }> = [];

  // Run all validations
  const validations = [
    { name: 'Environment Variables', fn: () => Promise.resolve(validateEnvironmentVariables()) },
    { name: 'Database Configuration', fn: validateDatabaseConfiguration },
    { name: 'Object Storage', fn: () => Promise.resolve(validateObjectStorageConfiguration()) },
    { name: 'Session Configuration', fn: () => Promise.resolve(validateSessionConfiguration()) },
    { name: 'Payment Configuration', fn: () => Promise.resolve(validatePaymentConfiguration()) },
    { name: 'Email Configuration', fn: () => Promise.resolve(validateEmailConfiguration()) }
  ];

  for (const validation of validations) {
    const result = await validation.fn();
    allResults.push({ name: validation.name, result });
    
    if (!result.valid) {
      allValid = false;
    }
  }

  // Print results
  for (const { name, result } of allResults) {
    console.log(`\n📋 ${name}`);
    console.log('─'.repeat(50));

    // Print errors
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`  ${error}`));
    }

    // Print warnings
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    // Print info (only if no errors)
    if (result.errors.length === 0 && result.info.length > 0) {
      console.log('\nStatus:');
      result.info.forEach(info => console.log(`  ${info}`));
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ All critical validations passed!');
    console.log('💡 Review warnings above before deploying to production');
  } else {
    console.log('❌ Configuration validation FAILED');
    console.log('⚠️  Fix all errors before deploying to production');
  }
  console.log('='.repeat(50) + '\n');

  return allValid;
}

/**
 * Quick validation check for startup
 */
export function quickValidation(): boolean {
  const critical = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = critical.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  return true;
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateProductionConfiguration()
    .then(valid => {
      process.exit(valid ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error during validation:', error);
      process.exit(1);
    });
}
