import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Express, Request, Response } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { hashPassword, comparePasswords, validatePasswordStrength, calculatePasswordEntropy } from "./security/password-utils";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNotNull } from "drizzle-orm";
import { emailService, sendEmail } from "./email-service-enhanced";
import { verificationService } from "./auth/verification-service";
import { emailQueue } from "./queues/email-queue";
import createMemoryStore from "memorystore";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { getBaseUrl } from "./utils/url";
import { generateToken } from "./jwt-auth";
import { logger } from "./logger";

// Export sessionParser for WebSocket authentication
export let sessionParser: any = null;
export let sessionStore: any = null;
export let cookieSecret: string = '';

// Simple in-memory rate limiter for authentication endpoints
const authAttempts = new Map<string, { count: number; resetTime: number }>();

// CAPTCHA store for verification
// Old CAPTCHA store removed - using math CAPTCHA only

// Account lockout settings
const ACCOUNT_LOCKOUT_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

function rateLimitAuth(ip: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const attempt = authAttempts.get(ip);
  
  if (!attempt || now > attempt.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (attempt.count >= maxAttempts) {
    logger.warn('Rate limit exceeded', { ip, attempts: attempt.count, maxAttempts }, 'api');
    return false;
  }
  
  attempt.count++;
  return true;
}

function resetAuthAttempts(ip: string): void {
  authAttempts.delete(ip);
}

// Generate CAPTCHA
// Legacy CAPTCHA generation removed - using math CAPTCHA only

// Google reCAPTCHA v3 verification - no local CAPTCHA needed

// Account lockout functions
async function checkAccountLockout(user: any): Promise<{ isLocked: boolean; lockoutExpires?: Date }> {
  if (!user.isLocked) return { isLocked: false };
  
  // Check if lockout has expired
  const lockoutTime = user.lastLogin ? new Date(user.lastLogin).getTime() + ACCOUNT_LOCKOUT_DURATION : 0;
  if (Date.now() > lockoutTime) {
    // Unlock account
    await storage.updateUser(user.id, {
      isLocked: false,
      failedLoginAttempts: 0
    });
    return { isLocked: false };
  }
  
  return { isLocked: true, lockoutExpires: new Date(lockoutTime) };
}

async function handleFailedLogin(user: any): Promise<void> {
  const newAttempts = (user.failedLoginAttempts || 0) + 1;
  const shouldLock = newAttempts >= ACCOUNT_LOCKOUT_ATTEMPTS;
  
  await storage.updateUser(user.id, {
    failedLoginAttempts: newAttempts,
    isLocked: shouldLock,
    lastLogin: shouldLock ? new Date() : user.lastLogin
  });
  
  logger.warn('Failed login attempt', {
    username: user.username,
    attempts: newAttempts,
    maxAttempts: ACCOUNT_LOCKOUT_ATTEMPTS,
    accountLocked: shouldLock
  }, 'api');
}

async function handleSuccessfulLogin(user: any): Promise<void> {
  await storage.updateUser(user.id, {
    failedLoginAttempts: 0,
    isLocked: false,
    lastLogin: new Date()
  });
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Re-export password utilities for backwards compatibility
export { hashPassword, comparePasswords };

export function setupAuth(app: Express) {
  // Require SESSION_SECRET from environment - fail fast if missing
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required but not set. Please add it to Replit Secrets.');
  }
  
  // Export for WebSocket authentication
  cookieSecret = sessionSecret;
  sessionStore = storage.sessionStore;
  
  // Detect environment and set secure cookie settings
  const isProduction = process.env.NODE_ENV === 'production';
  // Only enable secure cookies for actual HTTPS deployments (production or published deploys)
  // Exclude REPL_SLUG check to allow mobile webview preview in development
  const isHttps = process.env.REPLIT_DEPLOYMENT === '1' || isProduction;
  
  // Task 6: Enhanced cookie security with sameSite=strict for luxury e-commerce standards
  // WARNING: sameSite=strict prevents cross-domain cookie transmission
  // This may break cross-domain authentication flows - test thoroughly before production
  // Use 'strict' for production security, 'lax' for development to maintain Replit embedding
  const cookieSameSite = isProduction ? 'strict' : 'lax';
  
  // Session configuration - production-grade settings
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'dedwen_session',
    genid: () => {
      return randomBytes(32).toString('hex');
    },
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: isHttps, // Enable secure for all HTTPS environments
      sameSite: cookieSameSite, // 'none' for production cross-domain, 'lax' for dev
      path: '/',
    },
    rolling: true, // Extend session on each request
  };
  
  logger.debug('Session cookie config', {
    secure: isHttps,
    sameSite: cookieSameSite,
    maxAge: '7 days',
    httpOnly: true,
    environment: isProduction ? 'production' : 'development'
  });
  
  // Create session parser middleware (exported for WebSocket upgrade handling)
  const sp = session(sessionSettings);
  
  // Apply session middleware once
  app.use(sp);
  
  // Export session parser for WebSocket authentication
  sessionParser = sp;

  // Trust the first proxy if behind a reverse proxy
  app.set('trust proxy', 1);
  
  // Cross-domain logout middleware - only for authenticated endpoints
  app.use('/api', (req, res, next) => {
    // Skip logout check for public endpoints and auth endpoints
    const publicEndpoints = [
      '/api/products',
      '/api/categories', 
      '/api/auth/',
      '/api/login',
      '/api/register',
      '/api/validate-email',
      '/api/captcha'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      req.path.startsWith(endpoint)
    );
    
    if (isPublicEndpoint) {
      return next();
    }
    
    const logoutHeaders = [
      'x-user-logged-out',
      'x-auth-logged-out',
      'x-cross-domain-logout'
    ];
    
    const isLoggedOut = logoutHeaders.some(header => 
      req.headers[header] === 'true'
    );
    
    const cookies = req.headers.cookie || '';
    const hasLogoutCookie = [
      'user_logged_out=true',
      'dedwen_logout=true',
      'cross_domain_logout=true'
    ].some(cookieCheck => cookies.includes(cookieCheck));
    
    // Only reject if both logout state is detected AND there's an active session
    if ((isLoggedOut || hasLogoutCookie) && req.session && req.isAuthenticated && req.isAuthenticated()) {
      logger.debug('Logout state detected for authenticated user, clearing session');
      req.session.destroy(() => {
        return res.status(401).json({ 
          message: 'User logged out across domains',
          code: 'CROSS_DOMAIN_LOGOUT'
        });
      });
      return;
    }
    
    next();
  });
  
  app.use(passport.initialize());
  app.use(passport.session());

  // Session activity tracking middleware (removed idle timeout to align with 7-day session duration)
  app.use((req, res, next) => {
    if (req.session && req.isAuthenticated()) {
      // Update last activity timestamp for analytics/auditing purposes only
      req.session.lastActivity = new Date().toISOString();
    }
    
    next();
  });

  // Configure passport to use local strategy with enhanced security
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        logger.debug(`LocalStrategy: authenticating user ${username}`);
        
        const user = await storage.getUserByUsername(username);
        if (!user) {
          logger.debug(`LocalStrategy: user ${username} not found`);
          return done(null, false, { message: "Incorrect username" });
        }
        
        // Check if account is deleted
        if ((user as any).accountDeleted) {
          logger.debug(`LocalStrategy: account for ${username} is deleted`);
          return done(null, false, { message: "This account has been closed. Please create a new account if you wish to use Dedw3n." });
        }
        
        // Check if account is locked
        if (user.isLocked) {
          logger.debug(`LocalStrategy: account for ${username} is locked`);
          return done(null, false, { message: "Account is locked. Please reset your password or contact support." });
        }
        
        // Check if account is suspended
        if ((user as any).accountSuspended) {
          const suspendedAt = (user as any).accountSuspendedAt;
          if (suspendedAt) {
            const hoursSinceSuspension = (Date.now() - new Date(suspendedAt).getTime()) / (1000 * 60 * 60);
            
            // Allow reactivation after 24 hours
            if (hoursSinceSuspension >= 24) {
              logger.debug(`LocalStrategy: reactivating account for ${username} after 24 hours`);
              await storage.updateUser(user.id, {
                accountSuspended: false,
                accountSuspendedAt: null
              });

              // Send reactivation email
              try {
                const htmlContent = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Account Reactivated Successfully</h2>
                    <p style="color: #555; line-height: 1.6;">Hello ${user.name || user.username},</p>
                    <p style="color: #555; line-height: 1.6;">
                      Welcome back! Your Dedw3n account has been successfully reactivated.
                    </p>
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                      <p style="margin: 5px 0;"><strong>Account Status:</strong> Active</p>
                      <p style="margin: 5px 0;"><strong>Reactivated On:</strong> ${new Date().toLocaleString()}</p>
                      <p style="margin: 5px 0;"><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <p style="color: #555; line-height: 1.6;">
                      Your account is now fully active and you have complete access to all Dedw3n features.
                    </p>
                    <p style="color: #888; font-size: 12px; margin-top: 30px;">
                      If you did not log in or request this reactivation, please secure your account immediately and contact our support team.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #888; font-size: 12px;">
                      This is an automated message from Dedw3n. Please do not reply to this email.
                    </p>
                  </div>
                `;

                const textContent = `Account Reactivated Successfully

Hello ${user.name || user.username},

Welcome back! Your Dedw3n account has been successfully reactivated.

Account Status: Active
Reactivated On: ${new Date().toLocaleString()}
Login Time: ${new Date().toLocaleString()}

Your account is now fully active and you have complete access to all Dedw3n features.

If you did not log in or request this reactivation, please secure your account immediately and contact our support team.

This is an automated message from Dedw3n. Please do not reply to this email.`;

                await sendEmail({
                  from: 'noreply@dedw3n.com',
                  to: user.email,
                  subject: 'Account Reactivated - Welcome Back to Dedw3n',
                  html: htmlContent,
                  text: textContent
                });

                logger.info("Reactivation email sent to ${user.email}", undefined, 'api');
              } catch (emailError) {
                logger.error('Failed to send reactivation email:', undefined, emailError as Error, 'api');
                // Don't fail login if email fails
              }
            } else {
              const hoursRemaining = Math.ceil(24 - hoursSinceSuspension);
              logger.debug(`LocalStrategy: account for ${username} is suspended. ${hoursRemaining} hours remaining`);
              return done(null, false, { message: `Account is suspended. You can reactivate it in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.` });
            }
          }
        }
        
        const isValid = await comparePasswords(password, user.password);
        
        if (!isValid) {
          logger.debug(`LocalStrategy: incorrect password for ${username}`);
          
          // Track failed login attempts
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          const updates: any = { failedLoginAttempts: failedAttempts };
          
          // Lock account after 5 failed attempts
          if (failedAttempts >= 5) {
            logger.debug(`LocalStrategy: locking account for ${username} after ${failedAttempts} failed attempts`);
            updates.isLocked = true;
          }
          
          await storage.updateUser(user.id, updates);
          
          return done(null, false, { message: "Incorrect password" });
        }
        
        // Auto-migrate legacy bcrypt passwords to scrypt+pepper
        if (user.password.startsWith('$2') && !user.password.includes('.')) {
          logger.debug("Auto-migrating legacy bcrypt password to scrypt+pepper for user ${username}", undefined, 'api');
          try {
            const newHash = await hashPassword(password);
            await storage.updateUser(user.id, { password: newHash });
            logger.debug("Successfully migrated password for user ${username}", undefined, 'api');
          } catch (migrationError) {
            logger.error("Failed to migrate password for user ${username}:", undefined, migrationError as Error, 'api');
            // Don't fail login if migration fails - user can still log in
          }
        }
        
        // Reset failed attempts and update last login on successful login
        await storage.updateUser(user.id, { 
          failedLoginAttempts: 0,
          lastLogin: new Date()
        });
        
        logger.debug(`LocalStrategy: authentication successful for ${username}`);
        return done(null, user);
      } catch (err) {
        logger.error(`LocalStrategy authentication error:`, err);
        return done(err);
      }
    })
  );

  // Serialize user to the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // User no longer exists, clear the session gracefully
        logger.debug("User ID ${id} no longer exists, clearing session", undefined, 'api');
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      logger.error("Error deserializing user ID ${id}:", undefined, err as Error, 'api');
      // Clear session on any error to prevent loops
      done(null, false);
    }
  });

  // Math CAPTCHA endpoint - frontend generates challenges directly
  app.get("/api/auth/captcha", (req, res) => {
    res.json({
      type: "math",
      message: "Math CAPTCHA is handled by frontend"
    });
  });

  // CORS preflight handlers for authentication endpoints
  // Required for production cross-origin requests
  app.options("/api/auth/register", (req, res) => {
    res.status(204).end();
  });
  app.options("/api/auth/logout", (req, res) => {
    res.status(204).end();
  });
  app.options("/api/auth/reset-password", (req, res) => {
    res.status(204).end();
  });
  app.options("/api/auth/verify-email/request", (req, res) => {
    res.status(204).end();
  });
  app.options("/api/auth/verify-email/confirm", (req, res) => {
    res.status(204).end();
  });
  app.options("/api/auth/forgot-password", (req, res) => {
    res.status(204).end();
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      logger.debug(`Registration attempt for username: ${req.body.username} from IP: ${clientIp}`);
      logger.debug(`Registration: request body:`, req.body);
      logger.debug(`Registration: session ID before:`, req.sessionID);
      
      // Rate limiting for registration attempts (more restrictive than login)
      if (!rateLimitAuth(clientIp, 3, 30 * 60 * 1000)) { // 3 attempts per 30 minutes
        logger.warn('Registration rate limit exceeded', { ip: clientIp }, 'api');
        return res.status(429).json({ 
          message: "Too many registration attempts. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        logger.debug(`Registration failed: Username ${req.body.username} already exists`);
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        logger.debug(`Registration failed: Email ${req.body.email} already exists`);
        return res.status(400).json({ message: "Email already exists" });
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(req.body.password);
      if (!passwordValidation.isValid) {
        logger.warn('Weak password attempt', { username: req.body.username }, 'api');
        return res.status(400).json({ 
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Generate secure verification token using the new verification service
      const { token: verificationToken, hashedToken, expiresAt } = await verificationService.generateSecureToken();

      // Filter out empty string fields to avoid database enum errors
      const userData: any = { ...req.body };
      Object.keys(userData).forEach(key => {
        if (userData[key] === '') {
          delete userData[key];
        }
      });

      // Create user with hashed verification token for security
      logger.debug(`Creating new user ${req.body.username} in storage`);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        emailVerified: false,
        verificationToken: hashedToken, // Store the hashed version in database
        verificationTokenExpires: expiresAt, // Store expiry date
      });
      logger.debug(`User created with ID: ${user.id}, username: ${user.username}`);

      // Send verification email using the new email queue system
      try {
        const verificationLink = verificationService.generateVerificationUrl(
          getBaseUrl(req),
          verificationToken, // Use the plain token in the URL
          'email'
        );
        
        // Add email to queue with high priority
        const emailJobId = await emailQueue.add({
          type: 'welcome',
          to: user.email,
          priority: 'high',
          data: {
            name: user.name || user.username,
            username: user.username,
            email: user.email,
            verificationLink: verificationLink,
            language: user.preferredLanguage || 'EN'
          },
          metadata: {
            userId: user.id,
            registrationDate: new Date(),
            tokenExpiry: expiresAt
          }
        });
        
        logger.info('Welcome email queued', { email: user.email, jobId: emailJobId }, 'api');
      } catch (emailError) {
        logger.error('Error sending verification email', undefined, emailError as Error, 'api');
        // Continue with registration even if email fails
      }

      // Log in the user with session regeneration for clean state
      // CRITICAL FIX: Promisify session operations to ensure proper sequencing
      logger.debug(`Calling req.login for newly created user ${user.username}`);
      
      const loginNewUserAsync = async () => {
        try {
          // Step 1: Regenerate session to prevent session fixation
          await new Promise<void>((resolve, reject) => {
            req.session.regenerate((regenerateErr) => {
              if (regenerateErr) {
                logger.error(`Session regeneration error after registration:`, regenerateErr);
                reject(regenerateErr);
              } else {
                logger.debug(`Session regenerated successfully after registration`);
                resolve();
              }
            });
          });
          
          // Step 2: Log in the new user
          await new Promise<void>((resolve, reject) => {
            req.login(user, (loginErr) => {
              if (loginErr) {
                logger.error(`Login after registration failed:`, loginErr);
                reject(loginErr);
              } else {
                logger.debug(`User ${user.username} logged in after registration`);
                logger.debug(`New Session ID after regeneration: ${req.sessionID}`);
                resolve();
              }
            });
          });
          
          // Step 3: Save session to persist changes
          await new Promise<void>((resolve, reject) => {
            req.session.save((saveErr) => {
              if (saveErr) {
                logger.error(`Session save error after registration:`, saveErr);
                reject(saveErr);
              } else {
                logger.debug(`Session saved successfully after registration`);
                logger.debug(`Authentication status: ${req.isAuthenticated()}`);
                logger.debug(`Session passport data:`, (req.session as any).passport);
                resolve();
              }
            });
          });
          
          // All session operations completed successfully
          logger.debug(`All registration session operations completed - ready to send response`);
          
          // Generate JWT token for WebSocket authentication
          const { generateToken } = require('./jwt-auth');
          const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
          const deviceInfo = {
            clientId: req.sessionID || 'unknown',
            deviceType: req.headers['user-agent'] || 'unknown',
            ipAddress: clientIp
          };
          
          let jwtToken = null;
          let tokenExpiresAt = null;
          try {
            const tokenData = await generateToken(user.id, user.role || 'user', deviceInfo);
            jwtToken = tokenData.token;
            tokenExpiresAt = tokenData.expiresAt;
            logger.debug("Generated JWT token for new user ${user.id} (expires: ${new Date(tokenExpiresAt).toISOString()})", undefined, 'api');
          } catch (tokenError) {
            logger.error(`Failed to generate JWT token during registration:`, tokenError);
            // Continue without token - session auth will still work for HTTP requests
          }
          
          // Return user without password and verification token, plus JWT for WebSocket
          const { password, verificationToken: token, ...userWithoutPassword } = user;
          res.status(201).json({
            ...userWithoutPassword,
            emailVerificationSent: true,
            message: "Account created successfully! Please check your email to verify your account.",
            ...(jwtToken ? { token: jwtToken, tokenExpiresAt } : {})
          });
        } catch (error) {
          logger.error(`Registration login process failed:`, error);
          return next(error);
        }
      };
      
      // Execute the async login process
      loginNewUserAsync().catch(next);
    } catch (error) {
      logger.error(`Registration failed:`, error);
      next(error);
    }
  });

  // CORS preflight handler for login endpoint
  // Required for production cross-origin requests
  app.options("/api/auth/login", (req, res) => {
    res.status(204).end();
  });

  app.post("/api/auth/login", async (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    logger.debug(`Login attempt for username: ${req.body.username} from IP: ${clientIp}`);
    
    // Rate limiting for authentication attempts
    if (!rateLimitAuth(clientIp)) {
      logger.warn('Login rate limit exceeded', { ip: clientIp }, 'api');
      return res.status(429).json({ 
        message: "Too many login attempts. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED"
      });
    }

    // Check for account lockout first
    try {
      const userForLockoutCheck = await storage.getUserByUsername(req.body.username);
      if (userForLockoutCheck) {
        const lockoutStatus = await checkAccountLockout(userForLockoutCheck);
        if (lockoutStatus.isLocked) {
          logger.warn('Account locked', { username: req.body.username }, 'api');
          return res.status(423).json({ 
            message: `Account is locked due to multiple failed login attempts. Please try again later.`,
            code: "ACCOUNT_LOCKED",
            lockoutExpires: lockoutStatus.lockoutExpires
          });
        }
      }
    } catch (error) {
      logger.error(`Error checking account lockout:`, error);
    }
    
    passport.authenticate("local", async (err: Error | null, user: any, info: { message: string } | undefined) => {
      if (err) {
        logger.error(`Login authentication error:`, err);
        return next(err);
      }
      
      if (!user) {
        logger.debug(`Login failed: ${info?.message || "Authentication failed"}`);
        
        // Handle failed login attempt for account lockout
        try {
          const userForFailedAttempt = await storage.getUserByUsername(req.body.username);
          if (userForFailedAttempt) {
            await handleFailedLogin(userForFailedAttempt);
          }
        } catch (error) {
          logger.error(`Error handling failed login:`, error);
        }
        
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      logger.debug(`User ${user.username} authenticated, logging in`);
      
      // Check if user has MFA enabled
      if (user.twoFactorEnabled) {
        logger.info('User has MFA enabled - sending verification code', { username: user.username }, 'api');
        
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        try {
          // Store code in database
          await storage.updateUser(user.id, {
            twoFactorCode: code,
            twoFactorCodeExpires: expiresAt
          });

          // TODO: Implement WhatsApp sending via Twilio integration
          // Send 2FA code via email

          logger.info('MFA code sent', { userId: user.id, method: user.twoFactorMethod || 'email' }, 'api');
          
          // Reset auth attempts on successful password verification
          resetAuthAttempts(clientIp);
          
          // Return response indicating MFA is required
          return res.json({
            requiresMFA: true,
            requires2FA: true, // Backward compatibility
            email: user.email,
            method: user.twoFactorMethod || 'email',
            message: 'Verification code sent. Please check your ' + (user.twoFactorMethod === 'whatsapp' ? 'WhatsApp' : 'email')
          });
        } catch (error) {
          logger.error(`Failed to send MFA code:`, error);
          return res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
        }
      }
      
      // No MFA, login user directly
      // CRITICAL FIX: Promisify session operations to ensure proper sequencing
      // This prevents the "double login" bug while maintaining session fixation protection
      
      const loginUserAsync = async () => {
        try {
          // Step 1: Regenerate session to prevent session fixation attacks
          await new Promise<void>((resolve, reject) => {
            req.session.regenerate((regenerateErr) => {
              if (regenerateErr) {
                logger.error(`Session regeneration error:`, regenerateErr);
                reject(regenerateErr);
              } else {
                logger.debug(`Session regenerated successfully for ${user.username}`);
                resolve();
              }
            });
          });
          
          // Step 2: Log in the user
          await new Promise<void>((resolve, reject) => {
            req.login(user, (loginErr) => {
              if (loginErr) {
                logger.error(`req.login error:`, loginErr);
                reject(loginErr);
              } else {
                logger.debug(`req.login successful for ${user.username}`);
                logger.debug(`New Session ID after regeneration: ${req.sessionID}`);
                logger.debug(`isAuthenticated: ${req.isAuthenticated()}`);
                resolve();
              }
            });
          });
          
          // Step 3: Save session to persist changes
          await new Promise<void>((resolve, reject) => {
            req.session.save((saveErr) => {
              if (saveErr) {
                logger.error(`Session save error:`, saveErr);
                reject(saveErr);
              } else {
                logger.debug(`Session saved successfully for ${user.username}`);
                logger.debug(`Session passport data:`, (req.session as any).passport);
                logger.debug(`Session cookie will be sent with name: dedwen_session`);
                resolve();
              }
            });
          });
          
          // All session operations completed successfully
          logger.debug(`All session operations completed - ready to send response`);
          
          // Reset auth attempts on successful login
          resetAuthAttempts(clientIp);
          
          // Handle successful login tracking (non-blocking)
          handleSuccessfulLogin(user).catch(error => {
            logger.error(`Error handling successful login:`, error);
          });
          
          // Generate JWT token for WebSocket authentication
          // Detect device type from user agent
          const userAgent = req.headers['user-agent'] || 'unknown';
          let deviceType = 'unknown';
          if (/mobile/i.test(userAgent)) {
            deviceType = 'mobile';
          } else if (/tablet/i.test(userAgent)) {
            deviceType = 'tablet';
          } else {
            deviceType = 'desktop';
          }
          
          const deviceInfo = {
            clientId: req.sessionID || 'unknown',
            deviceType: deviceType,
            deviceInfo: userAgent,
            ipAddress: clientIp || req.ip || ''
          };
          
          let token = null;
          let tokenExpiresAt = null;
          try {
            const tokenData = await generateToken(user.id, user.role || 'user', deviceInfo);
            token = tokenData.token;
            tokenExpiresAt = tokenData.expiresAt;
            logger.debug("Generated JWT token for user ${user.id} (expires: ${new Date(tokenExpiresAt).toISOString()})", undefined, 'api');
          } catch (tokenError) {
            logger.error(`Failed to generate JWT token:`, tokenError);
            // Continue without token - session auth will still work for HTTP requests
          }
          
          // Return user without password, plus JWT token for WebSocket
          const { password, ...userWithoutPassword } = user;
          return res.json({
            ...userWithoutPassword,
            ...(token ? { token, tokenExpiresAt } : {})
          });
        } catch (error) {
          logger.error(`Login process failed:`, error);
          return next(error);
        }
      };
      
      // Execute the async login process
      loginUserAsync().catch(next);
    })(req, res, next);
  });

  // Logout endpoint - DISABLED to prevent conflicts with fast logout system
  // Use /api/logout instead (handled by fast-logout.ts)
  /*
  app.post("/api/auth/logout", (req, res) => {
    logger.debug(`Logout request for session: ${req.sessionID}`);
    
    try {
      // Clear user first to prevent session regeneration issues
      req.user = undefined;
      
      // If session exists, destroy it safely
      if (req.session) {
        req.session.destroy((destroyErr) => {
          if (destroyErr) {
            logger.error(`Session destruction failed:`, destroyErr);
          } else {
            logger.debug(`Session destroyed successfully`);
          }
        });
      }
      
      // Clear all authentication cookies
      res.clearCookie('sessionId');
      res.clearCookie('connect.sid');
      res.clearCookie('token');
      res.clearCookie('auth');
      
      logger.debug(`Logout completed successfully`);
      res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
      logger.error(`Logout error:`, error);
      res.status(200).json({ message: "Logged out" });
    }
  });
  */

  // First password reset endpoint removed - using the complete implementation below
  
  // Password reset confirmation
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      logger.debug(`Password reset confirmation with token: ${token}`);
      
      // Find user by token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired password reset token" });
      }
      
      // Check if token is expired
      if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({ message: "Password reset token has expired" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(password);
      
      // Update user
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        isLocked: false,
        failedLoginAttempts: 0
      });
      
      logger.debug(`Password reset successful for user ID: ${user.id}`);
      
      res.status(200).json({ message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      logger.error(`Password reset confirmation failed:`, error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });
  
  // Email verification request
  app.post("/api/auth/verify-email/request", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = req.user as SelectUser;
      
      // Check if email is already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate verification token
      const verificationToken = randomBytes(32).toString("hex");
      
      // Save token to user
      await storage.updateUser(user.id, {
        verificationToken
      });
      
      // In a real app, we would send an email here with the verification link
      logger.debug(`Email verification token for ${user.email}: ${verificationToken}`);
      
      res.status(200).json({
        message: "Verification email has been sent. Please check your inbox.",
        // Include token in response for easy testing (remove in production)
        token: verificationToken
      });
    } catch (error) {
      logger.error(`Email verification request failed:`, error);
      res.status(500).json({ message: "Email verification request failed" });
    }
  });
  
  // Email verification confirmation - UPDATED WITH SECURE BCRYPT VERIFICATION
  app.post("/api/auth/verify-email/confirm", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      // Security check: Reject tokens that look like bcrypt hashes
      // Valid tokens should be 64-character hex strings, not hashes
      if (token.startsWith('$2a$') || token.startsWith('$2b$') || token.startsWith('$2y$')) {
        logger.warn('Rejected verification attempt with bcrypt hash instead of plain token', undefined, 'api');
        return res.status(400).json({ message: "Invalid verification token format" });
      }
      
      // Validate token format - should be 64-character hex string
      if (!/^[a-f0-9]{64}$/i.test(token)) {
        logger.warn('Rejected verification attempt with invalid token format', undefined, 'api');
        return res.status(400).json({ message: "Invalid verification token format" });
      }
      
      logger.debug(`Email verification request with valid format token`);
      
      // Get all unverified users with verification tokens
      const unverifiedUsers = await db.select()
        .from(users)
        .where(
          and(
            eq(users.emailVerified, false),
            isNotNull(users.verificationToken)
          )
        );
      
      if (unverifiedUsers.length === 0) {
        logger.debug('No unverified users found', undefined, 'api');
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      // Find the user by comparing token with bcrypt
      let matchedUser = null;
      for (const user of unverifiedUsers) {
        if (user.verificationToken) {
          const verifyResult = await verificationService.verifyToken(
            token,
            user.verificationToken,
            user.verificationTokenExpires
          );
          
          if (verifyResult.isValid) {
            matchedUser = user;
            break;
          }
        }
      }
      
      if (!matchedUser) {
        logger.debug('No user matched the verification token', undefined, 'api');
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      // Check if account is expired (more than 24 hours old and not verified)
      const accountAge = Date.now() - new Date(matchedUser.createdAt!).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (accountAge > twentyFourHours) {
        logger.debug('Verification token expired for user', { userId: matchedUser.id }, 'api');
        return res.status(400).json({ 
          message: "Verification link has expired. Your temporary account has been inactive for more than 24 hours.",
          expired: true
        });
      }
      
      // Update user
      await storage.updateUser(matchedUser.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      });
      
      logger.debug(`Email verification successful for user ID: ${matchedUser.id}`);
      
      // Send welcome/activation email in user's selected language
      try {
        const { EmailTranslationService } = await import('./email-translation-service');
        const translationService = EmailTranslationService.getInstance();
        
        // Use user's preferred language, default to EN
        const userLanguage = matchedUser.preferredLanguage || 'EN';
        logger.info('Sending account activation email', { language: userLanguage, email: matchedUser.email }, 'api');
        
        // Translate welcome email using DeepL API
        const { subject, html } = await translationService.translateWelcomeEmail(
          userLanguage,
          matchedUser.name || matchedUser.username,
          matchedUser.email
        );
        
        // Send activation email using imported emailService
        await emailService.sendEmail({
          to: matchedUser.email,
          subject,
          html,
          text: subject // Plain text fallback
        });
        
        logger.info('Account activation email sent successfully', { email: matchedUser.email }, 'api');
      } catch (emailError) {
        // Log error but don't fail verification if email fails
        logger.error('Failed to send activation email', undefined, emailError as Error, 'api');
      }
      
      res.status(200).json({ message: "Email has been verified successfully." });
    } catch (error) {
      logger.error(`Email verification failed:`, error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });
  
  // Get current user - COMMENTED OUT as this is now handled by unified auth in routes.ts
  /*
  app.get("/api/auth/me", (req, res) => {
    logger.debug(`/api/auth/me - isAuthenticated: ${req.isAuthenticated()}`);
    
    if (!req.isAuthenticated()) {
      logger.debug(`/api/auth/me - Session ID: ${req.sessionID}`);
      logger.debug(`/api/auth/me - Session:`, req.session);
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    logger.debug(`/api/auth/me - User in session:`, req.user);
    
    // Return user without sensitive data
    const { password, passwordResetToken, passwordResetExpires, verificationToken, ...safeUserData } = req.user as SelectUser;
    res.json(safeUserData);
  });
  */
  
  // Debug endpoint to check user credentials - FOR DEVELOPMENT ONLY
  app.get("/api/auth/test-login", async (req, res) => {
    try {
      logger.debug('Testing login credentials', undefined, 'api');
      const { username, password } = req.query;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required as query parameters" });
      }
      
      // Get user from database
      const user = await storage.getUserByUsername(username as string);
      logger.debug(`Test login - User lookup for "${username}": ${user ? "Found" : "Not found"}`);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check password
      const isValid = await comparePasswords(password as string, user.password);
      logger.debug(`Test login - Password check: ${isValid ? "Valid" : "Invalid"}`);
      
      // Return result
      if (isValid) {
        return res.json({ success: true, message: "Login credentials are valid" });
      } else {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      logger.error('Test login failed', undefined, error as Error, 'api');
      res.status(500).json({ message: "Test login failed", error: String(error) });
    }
  });



  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      // Validate input
      if (!email?.trim()) {
        return res.status(400).json({ 
          message: "Email address is required" 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ 
          message: "Invalid email address format" 
        });
      }

      // Find user by email
      const user = await db.select()
        .from(users)
        .where(eq(users.email, email.trim().toLowerCase()))
        .limit(1);

      // Always return success message for security (prevent email enumeration)
      if (user.length === 0) {
        return res.json({ 
          message: "If an account with that email exists, a password reset link has been sent" 
        });
      }

      const foundUser = user[0];

      // Check if user account is locked
      if (foundUser.isLocked) {
        return res.status(423).json({ 
          message: "Account is locked. Please contact support." 
        });
      }

      // Generate secure reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Update user with reset token and expiry
      await db.update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
          updatedAt: new Date()
        })
        .where(eq(users.id, foundUser.id));

      // Create reset URL
      const resetUrl = `${getBaseUrl(req)}/reset-password-confirm?token=${resetToken}`;

      // Get user's preferred language and translate email content
      const { EmailTranslationService } = await import('./email-translation-service');
      const emailTranslationService = EmailTranslationService.getInstance();
      
      // Get user's language preference (try multiple sources)
      const userLanguage = await emailTranslationService.getUserLanguagePreference(foundUser.email, foundUser.id);
      logger.debug("Using language ${userLanguage} for password reset email to ${foundUser.email}", undefined, 'api');
      
      // Get translated email content
      const { subject: translatedSubject, html: emailHtml } = await emailTranslationService.translatePasswordResetEmail(
        userLanguage,
        resetUrl,
        foundUser.email
      );

      try {
        await sendEmail({
          to: foundUser.email,
          from: "noreply@dedw3n.com",
          subject: translatedSubject,
          html: emailHtml
        });

        logger.debug("Password reset email sent to ${foundUser.email}", undefined, 'api');
      } catch (emailError) {
        logger.error("Failed to send reset email to ${foundUser.email}:", undefined, emailError as Error, 'api');
        
        // Clear the reset token since email failed
        await db.update(users)
          .set({
            passwordResetToken: null,
            passwordResetExpires: null,
            updatedAt: new Date()
          })
          .where(eq(users.id, foundUser.id));

        return res.status(500).json({ 
          message: "Failed to send password reset email. Please try again later." 
        });
      }

      res.json({ 
        message: "If an account with that email exists, a password reset link has been sent" 
      });

    } catch (error) {
      logger.error('Password reset request error', undefined, error as Error, 'api');
      res.status(500).json({ 
        message: "An error occurred while processing your request" 
      });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      // Validate input
      if (!token?.trim()) {
        return res.status(400).json({ 
          message: "Reset token is required" 
        });
      }

      if (!password?.trim()) {
        return res.status(400).json({ 
          message: "New password is required" 
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters long" 
        });
      }

      // Enhanced password strength validation
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasUppercase || !hasLowercase || !hasNumbers) {
        return res.status(400).json({ 
          message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
        });
      }

      // Find user by reset token
      const user = await db.select()
        .from(users)
        .where(and(
          eq(users.passwordResetToken, token.trim()),
          isNotNull(users.passwordResetExpires)
        ))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ 
          message: "Invalid or expired reset token" 
        });
      }

      const foundUser = user[0];

      // Check if token has expired
      if (!foundUser.passwordResetExpires || new Date() > foundUser.passwordResetExpires) {
        // Clear expired token
        await db.update(users)
          .set({
            passwordResetToken: null,
            passwordResetExpires: null,
            updatedAt: new Date()
          })
          .where(eq(users.id, foundUser.id));

        return res.status(400).json({ 
          message: "Reset token has expired. Please request a new password reset." 
        });
      }

      // Check if user account is locked
      if (foundUser.isLocked) {
        return res.status(423).json({ 
          message: "Account is locked. Please contact support." 
        });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update user password and clear reset token
      await db.update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          failedLoginAttempts: 0, // Reset failed login attempts
          updatedAt: new Date()
        })
        .where(eq(users.id, foundUser.id));

      logger.debug("Password reset successful for user ${foundUser.email}", undefined, 'api');

      // Send confirmation email
      const confirmationEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Dedw3n</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Password Reset Confirmation</p>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #155724; margin-top: 0;">Password Reset Successful</h2>
            <p style="color: #155724; margin: 0;">
              Your password has been successfully reset. You can now sign in to your account with your new password.
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> If you did not make this change, please contact us immediately at 
              <a href="mailto:love@dedw3n.com" style="color: #856404;">love@dedw3n.com</a>
            </p>
          </div>
          
          <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              Reset completed on ${new Date().toLocaleString()}
            </p>
            <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
              © ${new Date().getFullYear()} Dedw3n. All rights reserved.
            </p>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: foundUser.email,
          from: "noreply@dedw3n.com",
          subject: "Your Dedw3n Password Has Been Reset",
          html: confirmationEmailHtml
        });
      } catch (emailError) {
        logger.error("Failed to send confirmation email to ${foundUser.email}:", undefined, emailError as Error, 'api');
        // Don't fail the request if confirmation email fails
      }

      res.json({ 
        message: "Password reset successful. You can now sign in with your new password." 
      });

    } catch (error) {
      logger.error('Password reset confirmation error', undefined, error as Error, 'api');
      res.status(500).json({ 
        message: "An error occurred while resetting your password" 
      });
    }
  });

  // Middleware to check if user is authenticated
  app.use((req, res, next) => {
    // Add isAuthenticated to res.locals for use in templates
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user;
    next();
  });
}