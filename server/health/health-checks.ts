import type { Pool } from 'pg';
import { users, toastReports } from '@shared/schema';

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  responseTime: number;
  message: string;
  error?: string;
  note?: string;
}

interface HealthCheckDependencies {
  db: any;
  getStorage: () => Promise<any>;
}

export function createHealthChecker(deps: HealthCheckDependencies) {
  let cachedStorage: any = null;

  async function getStorageInstance() {
    if (!cachedStorage) {
      const storageModule = await import('../storage.js');
      cachedStorage = storageModule.storage;
    }
    return cachedStorage;
  }

  async function checkDatabaseHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await deps.db.select().from(users).limit(1);
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        message: 'Database operational'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  async function checkSessionStoreHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const storage = await getStorageInstance();
      const isHealthy = storage.sessionStore && typeof storage.sessionStore.get === 'function';
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - start,
        message: isHealthy ? 'Session store operational' : 'Session store unavailable'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Session store check failed',
        error: error.message
      };
    }
  }

  async function checkSmtpHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const isConfigured = !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
      return {
        status: isConfigured ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
        message: isConfigured ? 'Email service operational' : 'Email service not configured',
        note: 'Non-critical service'
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        responseTime: Date.now() - start,
        message: 'Email check failed',
        error: error.message,
        note: 'Non-critical service'
      };
    }
  }

  async function checkObjectStorageHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const isConfigured = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
      return {
        status: isConfigured ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
        message: isConfigured ? 'Object storage operational' : 'Object storage not configured'
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        responseTime: Date.now() - start,
        message: 'Object storage check failed',
        error: error.message
      };
    }
  }

  async function checkAuthenticationHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const hasSessionSecret = !!process.env.SESSION_SECRET;
      const hasPasswordPepper = !!process.env.PASSWORD_PEPPER;
      const isHealthy = hasSessionSecret && hasPasswordPepper;
      
      return {
        status: isHealthy ? 'healthy' : 'critical',
        responseTime: Date.now() - start,
        message: isHealthy ? 'Authentication operational' : 'Authentication misconfigured'
      };
    } catch (error: any) {
      return {
        status: 'critical',
        responseTime: Date.now() - start,
        message: 'Authentication check failed',
        error: error.message
      };
    }
  }

  async function checkErrorReportingHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const isWorking = await deps.db.select().from(toastReports).limit(1)
        .then(() => true)
        .catch(() => false);
      
      return {
        status: isWorking ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
        message: isWorking ? 'Error reporting operational' : 'Error reporting degraded'
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        responseTime: Date.now() - start,
        message: 'Error reporting check failed',
        error: error.message
      };
    }
  }

  async function runAllHealthChecks(): Promise<Record<string, ServiceHealth>> {
    const [database, sessionStore, smtp, objectStorage, authentication, errorReporting] = await Promise.all([
      checkDatabaseHealth(),
      checkSessionStoreHealth(),
      checkSmtpHealth(),
      checkObjectStorageHealth(),
      checkAuthenticationHealth(),
      checkErrorReportingHealth()
    ]);
    
    return {
      database,
      sessionStore,
      smtp,
      objectStorage,
      authentication,
      errorReporting
    };
  }

  function determineOverallHealth(services: Record<string, ServiceHealth>): {
    status: 'healthy' | 'unhealthy';
    statusCode: number;
  } {
    const criticalServices = ['database', 'authentication'];
    const hasCriticalFailure = criticalServices.some(
      name => services[name]?.status === 'critical' || services[name]?.status === 'unhealthy'
    );
    
    return {
      status: hasCriticalFailure ? 'unhealthy' : 'healthy',
      statusCode: hasCriticalFailure ? 503 : 200
    };
  }

  function redactSensitiveDetails(services: Record<string, ServiceHealth>): Record<string, ServiceHealth> {
    const redacted = { ...services };
    
    // Remove error details from production responses
    if (process.env.NODE_ENV === 'production') {
      Object.keys(redacted).forEach(key => {
        if (redacted[key].error) {
          redacted[key] = {
            ...redacted[key],
            error: 'Error details redacted in production'
          };
        }
      });
    }
    
    return redacted;
  }

  return {
    runAllHealthChecks,
    determineOverallHealth,
    redactSensitiveDetails
  };
}
