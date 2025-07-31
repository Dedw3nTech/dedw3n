interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  sessionSecret: string;
  corsOrigin: string;
  databaseUrl: string;
  uploadMaxSize: string;
  rateLimitMax: number;
  rateLimitWindow: number;
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = {
      port: parseInt(process.env.PORT || '5000'),
      nodeEnv: process.env.NODE_ENV || 'development',
      jwtSecret: process.env.JWT_SECRET || 'fallback-jwt-secret',
      sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      databaseUrl: process.env.DATABASE_URL || '',
      uploadMaxSize: process.env.UPLOAD_MAX_SIZE || '50mb',
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    };

    this.validateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public get(): AppConfig {
    return this.config;
  }

  private validateConfig(): void {
    const required = ['databaseUrl'];
    const missing = required.filter(key => !this.config[key as keyof AppConfig]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}

export const configManager = ConfigManager.getInstance();
export const config = configManager.get();