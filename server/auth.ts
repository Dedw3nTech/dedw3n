import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
// SVG CAPTCHA removed - using math CAPTCHA only

// Google reCAPTCHA v3 verification
async function verifyRecaptcha(token: string, action: string): Promise<boolean> {
  try {
    // Use environment variable for secret key
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    // Check if secret key is configured
    if (!secretKey) {
      console.error('[RECAPTCHA] Secret key not configured');
      if (process.env.NODE_ENV === 'development') {
        console.log('[RECAPTCHA] Development bypass: Missing secret key');
        return true;
      }
      return false;
    }
    
    // Handle development bypass tokens
    if (token === 'development-bypass-token' || token === 'dev_bypass_token') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RECAPTCHA] Development environment detected, allowing bypass token');
        return true;
      } else {
        console.warn('[RECAPTCHA] Bypass token rejected in production environment');
        return false;
      }
    }
    
    // Validate token format
    if (!token || token.length < 20) {
      console.error('[RECAPTCHA] Invalid token format');
      return false;
    }

    console.log(`[RECAPTCHA] Verifying Google reCAPTCHA v3 token for action ${action}...`);
    console.log(`[RECAPTCHA] Token length: ${token.length}`);
    console.log(`[RECAPTCHA] Token preview: ${token.substring(0, 20)}...`);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    console.log(`[RECAPTCHA] Google verification response:`, data);
    
    // Handle reCAPTCHA errors gracefully
    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.warn(`[RECAPTCHA] Verification failed with errors:`, errorCodes);
      
      // Allow bypass in development for configuration issues
      if (process.env.NODE_ENV === 'development') {
        if (errorCodes.includes('invalid-input-secret') || 
            errorCodes.includes('invalid-input-response') ||
            errorCodes.includes('hostname-not-allowed')) {
          console.log('[RECAPTCHA] Development bypass: Configuration issue detected');
          return true;
        }
      }
    }
    
    // reCAPTCHA v3 validation with score checking
    if (data.success && data.score >= 0.5) {
      console.log(`[RECAPTCHA] Verification successful for action ${action}: score ${data.score}`);
      return true;
    } else {
      console.warn(`[RECAPTCHA] Verification failed for action ${action}:`, {
        success: data.success,
        score: data.score,
        'error-codes': data['error-codes']
      });
      
      // In development, allow bypass if it's a domain configuration issue
      if (process.env.NODE_ENV === 'development' && 
          data['error-codes'] && 
          (data['error-codes'].includes('invalid-input-secret') || 
           data['error-codes'].includes('hostname-not-allowed'))) {
        console.log('[RECAPTCHA] Development bypass: Domain configuration issue detected');
        return true;
      }
      
      return false; // Fail secure
    }
  } catch (error) {
    console.error('[RECAPTCHA] Verification error:', error);
    
    // In development, allow bypass for network errors
    if (process.env.NODE_ENV === 'development') {
      console.log('[RECAPTCHA] Development bypass: Network error detected');
      return true;
    }
    
    return false; // Fail secure
  }
}

// Simple in-memory rate limiter for authentication endpoints
const authAttempts = new Map<string, { count: number; resetTime: number }>();

// CAPTCHA store for verification
// Old CAPTCHA store removed - using math CAPTCHA only

// Account lockout settings
const ACCOUNT_LOCKOUT_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// Simplified password security settings for better user experience
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'DedW3nSecurePepper2025!@#';

// Simplified password validation for easier account creation
function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Minimum length requirement
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  // Must contain at least one number or special character
  if (!/[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Helper function to calculate password entropy for strength measurement
function calculatePasswordEntropy(password: string): number {
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26; // lowercase letters
  if (/[A-Z]/.test(password)) charset += 26; // uppercase letters  
  if (/\d/.test(password)) charset += 10; // numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) charset += 32; // special characters
  
  return password.length * Math.log2(charset);
}

function rateLimitAuth(ip: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const attempt = authAttempts.get(ip);
  
  if (!attempt || now > attempt.resetTime) {
    authAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (attempt.count >= maxAttempts) {
    console.log(`[SECURITY] Rate limit exceeded for IP ${ip}: ${attempt.count} attempts`);
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
// All verification is handled by verifyRecaptcha function above

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
  
  console.log(`[SECURITY] Failed login attempt ${newAttempts}/${ACCOUNT_LOCKOUT_ATTEMPTS} for user ${user.username}${shouldLock ? ' - Account locked' : ''}`);
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

const scryptAsync = promisify(scrypt);

// Enhanced password hashing with salt and pepper
export async function hashPassword(password: string) {
  // Add pepper to password before hashing for additional security layer
  const pepperedPassword = password + PASSWORD_PEPPER;
  
  // Generate cryptographically secure salt
  const salt = randomBytes(16).toString("hex");
  const keylen = 32; // 256-bit output key
  
  try {
    const buf = (await scryptAsync(pepperedPassword, salt, keylen)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    return hashedPassword;
  } catch (error) {
    console.error('[ERROR] Password hashing failed:', error);
    throw new Error('Password hashing failed');
  }
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !supplied) {
    console.error('[ERROR] Missing password for comparison');
    return false;
  }
  
  try {
    const [hashed, salt] = stored.split(".");
    
    if (!hashed || !salt) {
      console.error('[ERROR] Invalid stored password format');
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const keylen = hashedBuf.length; // Use the actual length of the stored hash
    
    // Try with pepper first (new password format)
    try {
      const pepperedSupplied = supplied + PASSWORD_PEPPER;
      const suppliedBufWithPepper = (await scryptAsync(pepperedSupplied, salt, keylen)) as Buffer;
      
      if (timingSafeEqual(hashedBuf, suppliedBufWithPepper)) {
        return true;
      }
    } catch (pepperError) {
      console.log('[AUTH] Pepper-based verification failed, trying legacy format');
    }
    
    // Fallback to legacy format without pepper (for existing users)
    // Try different key lengths that might have been used originally
    const commonKeyLengths = [keylen, 32, 64]; // Current, standard scrypt, extended
    
    for (const tryKeylen of commonKeyLengths) {
      try {
        const suppliedBufLegacy = (await scryptAsync(supplied, salt, tryKeylen)) as Buffer;
        
        // Handle different buffer lengths for comparison
        if (tryKeylen !== keylen) {
          // If trying different key length, create a buffer of the right size
          const adjustedBuf = Buffer.alloc(keylen);
          suppliedBufLegacy.copy(adjustedBuf, 0, 0, Math.min(suppliedBufLegacy.length, keylen));
          
          if (timingSafeEqual(hashedBuf, adjustedBuf)) {
            return true;
          }
        } else {
          if (timingSafeEqual(hashedBuf, suppliedBufLegacy)) {
            return true;
          }
        }
      } catch (legacyError) {
        // Continue trying other key lengths
      }
    }
    
    return false;
  } catch (error) {
    console.error('[ERROR] Password comparison failed:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Generate cryptographically secure session secret if not provided
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(64).toString('hex');
  
  // Enhanced session configuration with cross-domain support
  const getCookieDomain = (req: Request): string | undefined => {
    const host = req.get('host') || '';
    
    // In development, don't set domain to allow localhost
    if (process.env.NODE_ENV === 'development') {
      return undefined;
    }
    
    // For Replit domains, extract the base domain
    if (host.includes('.replit.dev')) {
      const replitMatch = host.match(/([^.]+\.replit\.dev)$/);
      if (replitMatch) {
        return `.${replitMatch[1]}`;
      }
    }
    
    return undefined;
  };
  
  // Dynamic session configuration middleware with cross-domain support
  app.use((req, res, next) => {
    const cookieDomain = getCookieDomain(req);
    
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
        maxAge: 1000 * 60 * 15, // 15 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        domain: cookieDomain,
        path: '/'
      },
      rolling: true,
    };
    
    // Apply session only if not already configured for this request
    if (!req.session) {
      session(sessionSettings)(req, res, next);
    } else {
      next();
    }
  });

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
      console.log('[CROSS-DOMAIN] Logout state detected for authenticated user, clearing session');
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

  // Session activity tracking middleware for security monitoring
  app.use((req, res, next) => {
    if (req.session && req.isAuthenticated()) {
      const now = new Date();
      
      // Check for session timeout (idle sessions)
      if (req.session.lastActivity) {
        const timeSinceLastActivity = now.getTime() - new Date(req.session.lastActivity).getTime();
        const timeoutMinutes = 15; // 15 minutes idle timeout
        
        if (timeSinceLastActivity > timeoutMinutes * 60 * 1000) {
          console.log(`[SECURITY] Session timeout for user ${req.user?.id} after ${Math.round(timeSinceLastActivity / 60000)} minutes`);
          
          // Destroy expired session
          req.session.destroy((err) => {
            if (err) {
              console.error(`[ERROR] Failed to destroy expired session:`, err);
            }
          });
          
          return res.status(401).json({ 
            message: "Session expired due to inactivity",
            code: "SESSION_TIMEOUT"
          });
        }
      }
      
      // Update last activity timestamp
      req.session.lastActivity = now.toISOString();
    }
    
    next();
  });

  // Configure passport to use local strategy with enhanced security
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[DEBUG] LocalStrategy: authenticating user ${username}`);
        
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`[DEBUG] LocalStrategy: user ${username} not found`);
          return done(null, false, { message: "Incorrect username" });
        }
        
        // Check if account is locked
        if (user.isLocked) {
          console.log(`[DEBUG] LocalStrategy: account for ${username} is locked`);
          return done(null, false, { message: "Account is locked. Please reset your password or contact support." });
        }
        
        const isValid = await comparePasswords(password, user.password);
        
        if (!isValid) {
          console.log(`[DEBUG] LocalStrategy: incorrect password for ${username}`);
          
          // Track failed login attempts
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          const updates: any = { failedLoginAttempts: failedAttempts };
          
          // Lock account after 5 failed attempts
          if (failedAttempts >= 5) {
            console.log(`[DEBUG] LocalStrategy: locking account for ${username} after ${failedAttempts} failed attempts`);
            updates.isLocked = true;
          }
          
          await storage.updateUser(user.id, updates);
          
          return done(null, false, { message: "Incorrect password" });
        }
        
        // Reset failed attempts and update last login on successful login
        await storage.updateUser(user.id, { 
          failedLoginAttempts: 0,
          lastLogin: new Date()
        });
        
        console.log(`[DEBUG] LocalStrategy: authentication successful for ${username}`);
        return done(null, user);
      } catch (err) {
        console.error(`[ERROR] LocalStrategy authentication error:`, err);
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
        console.log(`[AUTH] User ID ${id} no longer exists, clearing session`);
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error(`[AUTH] Error deserializing user ID ${id}:`, err);
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

  // Authentication routes
  app.post("/api/auth/register", async (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      console.log(`[DEBUG] Registration attempt for username: ${req.body.username} from IP: ${clientIp}`);
      console.log(`[DEBUG] Registration: request body:`, req.body);
      console.log(`[DEBUG] Registration: session ID before:`, req.sessionID);
      
      // Rate limiting for registration attempts (more restrictive than login)
      if (!rateLimitAuth(clientIp, 3, 30 * 60 * 1000)) { // 3 attempts per 30 minutes
        console.log(`[SECURITY] Registration rate limit exceeded for IP: ${clientIp}`);
        return res.status(429).json({ 
          message: "Too many registration attempts. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        });
      }

      // Verify reCAPTCHA if provided
      if (req.body.recaptchaToken) {
        if (!await verifyRecaptcha(req.body.recaptchaToken, "register")) {
          console.log(`[SECURITY] Invalid reCAPTCHA for registration attempt: ${req.body.username}`);
          return res.status(400).json({ 
            message: "Invalid reCAPTCHA. Please try again.",
            code: "INVALID_CAPTCHA"
          });
        }
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log(`[DEBUG] Registration failed: Username ${req.body.username} already exists`);
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log(`[DEBUG] Registration failed: Email ${req.body.email} already exists`);
        return res.status(400).json({ message: "Email already exists" });
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(req.body.password);
      if (!passwordValidation.isValid) {
        console.log(`[SECURITY] Weak password attempt for user: ${req.body.username}`);
        return res.status(400).json({ 
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Create user
      console.log(`[DEBUG] Creating new user ${req.body.username} in storage`);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      console.log(`[DEBUG] User created with ID: ${user.id}, username: ${user.username}`);

      // Log in the user
      console.log(`[DEBUG] Calling req.login for newly created user ${user.username}`);
      // Login the user directly without session regeneration to avoid conflicts
      req.login(user, (err) => {
        if (err) {
          console.error(`[ERROR] Login after registration failed:`, err);
          return next(err);
        }
        
        console.log(`[DEBUG] User ${user.username} logged in after registration`);
        console.log(`[DEBUG] Session ID after login:`, req.sessionID);
        
        // Double-check authentication status
        console.log(`[DEBUG] Authentication status after login: ${req.isAuthenticated()}`);
        console.log(`[DEBUG] User in session:`, req.user);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error(`[ERROR] Registration failed:`, error);
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    console.log(`[DEBUG] Login attempt for username: ${req.body.username} from IP: ${clientIp}`);
    
    // Rate limiting for authentication attempts
    if (!rateLimitAuth(clientIp)) {
      console.log(`[SECURITY] Login rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({ 
        message: "Too many login attempts. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED"
      });
    }

    // Verify reCAPTCHA if provided
    if (req.body.recaptchaToken) {
      console.log(`[DEBUG] reCAPTCHA verification - Token: ${req.body.recaptchaToken.substring(0, 20)}...`);
      const captchaResult = await verifyRecaptcha(req.body.recaptchaToken, "login");
      console.log(`[DEBUG] reCAPTCHA verification result: ${captchaResult}`);
      
      if (!captchaResult) {
        console.log(`[SECURITY] Invalid reCAPTCHA for login attempt: ${req.body.username}`);
        return res.status(400).json({ 
          message: "Invalid reCAPTCHA. Please try again.",
          code: "INVALID_CAPTCHA"
        });
      }
      console.log(`[DEBUG] reCAPTCHA verification passed for user: ${req.body.username}`);
    }

    // Check for account lockout first
    try {
      const userForLockoutCheck = await storage.getUserByUsername(req.body.username);
      if (userForLockoutCheck) {
        const lockoutStatus = await checkAccountLockout(userForLockoutCheck);
        if (lockoutStatus.isLocked) {
          console.log(`[SECURITY] Account locked for user: ${req.body.username}`);
          return res.status(423).json({ 
            message: `Account is locked due to multiple failed login attempts. Please try again later.`,
            code: "ACCOUNT_LOCKED",
            lockoutExpires: lockoutStatus.lockoutExpires
          });
        }
      }
    } catch (error) {
      console.error(`[ERROR] Error checking account lockout:`, error);
    }
    
    passport.authenticate("local", async (err: Error | null, user: any, info: { message: string } | undefined) => {
      if (err) {
        console.error(`[ERROR] Login authentication error:`, err);
        return next(err);
      }
      
      if (!user) {
        console.log(`[DEBUG] Login failed: ${info?.message || "Authentication failed"}`);
        
        // Handle failed login attempt for account lockout
        try {
          const userForFailedAttempt = await storage.getUserByUsername(req.body.username);
          if (userForFailedAttempt) {
            await handleFailedLogin(userForFailedAttempt);
          }
        } catch (error) {
          console.error(`[ERROR] Error handling failed login:`, error);
        }
        
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      console.log(`[DEBUG] User ${user.username} authenticated, logging in`);
      
      // Login user directly without session regeneration to avoid conflicts
      req.login(user, async (err: Error | null) => {
        if (err) {
          console.error(`[ERROR] req.login error:`, err);
          return next(err);
        }
        
        console.log(`[DEBUG] req.login successful for ${user.username}`);
        console.log(`[DEBUG] Session ID: ${req.sessionID}`);
        console.log(`[DEBUG] isAuthenticated: ${req.isAuthenticated()}`);
        
        // Reset auth attempts on successful login
        resetAuthAttempts(clientIp);
        
        // Handle successful login tracking
        try {
          await handleSuccessfulLogin(user);
        } catch (error) {
          console.error(`[ERROR] Error handling successful login:`, error);
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint - DISABLED to prevent conflicts with fast logout system
  // Use /api/logout instead (handled by fast-logout.ts)
  /*
  app.post("/api/auth/logout", (req, res) => {
    console.log(`[DEBUG] Logout request for session: ${req.sessionID}`);
    
    try {
      // Clear user first to prevent session regeneration issues
      req.user = undefined;
      
      // If session exists, destroy it safely
      if (req.session) {
        req.session.destroy((destroyErr) => {
          if (destroyErr) {
            console.error(`[ERROR] Session destruction failed:`, destroyErr);
          } else {
            console.log(`[DEBUG] Session destroyed successfully`);
          }
        });
      }
      
      // Clear all authentication cookies
      res.clearCookie('sessionId');
      res.clearCookie('connect.sid');
      res.clearCookie('token');
      res.clearCookie('auth');
      
      console.log(`[DEBUG] Logout completed successfully`);
      res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
      console.error(`[ERROR] Logout error:`, error);
      res.status(200).json({ message: "Logged out" });
    }
  });
  */

  // Password reset request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      console.log(`[DEBUG] Password reset request for email: ${email}`);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal that the email doesn't exist for security reasons
        return res.status(200).json({ message: "If your email exists in our system, you will receive a password reset link shortly." });
      }
      
      // Generate token
      const resetToken = randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Save token to user
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      });
      
      // In a real app, we would send an email here with the reset link
      console.log(`[DEBUG] Password reset token for ${email}: ${resetToken}`);
      
      res.status(200).json({
        message: "If your email exists in our system, you will receive a password reset link shortly.",
        // Include token in response for easy testing (remove in production)
        token: resetToken
      });
    } catch (error) {
      console.error(`[ERROR] Password reset request failed:`, error);
      res.status(500).json({ message: "Password reset request failed" });
    }
  });
  
  // Password reset confirmation
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      console.log(`[DEBUG] Password reset confirmation with token: ${token}`);
      
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
      
      console.log(`[DEBUG] Password reset successful for user ID: ${user.id}`);
      
      res.status(200).json({ message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      console.error(`[ERROR] Password reset confirmation failed:`, error);
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
      console.log(`[DEBUG] Email verification token for ${user.email}: ${verificationToken}`);
      
      res.status(200).json({
        message: "Verification email has been sent. Please check your inbox.",
        // Include token in response for easy testing (remove in production)
        token: verificationToken
      });
    } catch (error) {
      console.error(`[ERROR] Email verification request failed:`, error);
      res.status(500).json({ message: "Email verification request failed" });
    }
  });
  
  // Email verification confirmation
  app.post("/api/auth/verify-email/confirm", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      console.log(`[DEBUG] Email verification with token: ${token}`);
      
      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      // Update user
      await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null
      });
      
      console.log(`[DEBUG] Email verification successful for user ID: ${user.id}`);
      
      res.status(200).json({ message: "Email has been verified successfully." });
    } catch (error) {
      console.error(`[ERROR] Email verification failed:`, error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });
  
  // Get current user - COMMENTED OUT as this is now handled by unified auth in routes.ts
  /*
  app.get("/api/auth/me", (req, res) => {
    console.log(`[DEBUG] /api/auth/me - isAuthenticated: ${req.isAuthenticated()}`);
    
    if (!req.isAuthenticated()) {
      console.log(`[DEBUG] /api/auth/me - Session ID: ${req.sessionID}`);
      console.log(`[DEBUG] /api/auth/me - Session:`, req.session);
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log(`[DEBUG] /api/auth/me - User in session:`, req.user);
    
    // Return user without sensitive data
    const { password, passwordResetToken, passwordResetExpires, verificationToken, ...safeUserData } = req.user as SelectUser;
    res.json(safeUserData);
  });
  */
  
  // Debug endpoint to check user credentials - FOR DEVELOPMENT ONLY
  app.get("/api/auth/test-login", async (req, res) => {
    try {
      console.log("[DEBUG] Testing login credentials");
      const { username, password } = req.query;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required as query parameters" });
      }
      
      // Get user from database
      const user = await storage.getUserByUsername(username as string);
      console.log(`[DEBUG] Test login - User lookup for "${username}": ${user ? "Found" : "Not found"}`);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check password
      const isValid = await comparePasswords(password as string, user.password);
      console.log(`[DEBUG] Test login - Password check: ${isValid ? "Valid" : "Invalid"}`);
      
      // Return result
      if (isValid) {
        return res.json({ success: true, message: "Login credentials are valid" });
      } else {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      console.error("[ERROR] Test login failed:", error);
      res.status(500).json({ message: "Test login failed", error: String(error) });
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

// Export reCAPTCHA verification function and password utilities for use in routes
export { verifyRecaptcha, comparePasswords };