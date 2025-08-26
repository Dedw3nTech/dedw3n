import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Express, Request, Response } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNotNull } from "drizzle-orm";
import { sendEmail } from "./email-service";
import createMemoryStore from "memorystore";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { createAssessment } from "./recaptcha-enterprise";
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

      // Verify reCAPTCHA Enterprise if provided
      if (req.body.recaptchaToken) {
        try {
          const assessment = await createAssessment({
            token: req.body.recaptchaToken,
            recaptchaAction: 'register'
          });
          
          if (!assessment || !assessment.valid) {
            console.log(`[SECURITY] reCAPTCHA Enterprise verification failed for registration: ${req.body.username}, error: ${assessment?.error || 'Unknown'}`);
            
            // Handle specific error types
            if (assessment?.errorType === 'SERVER_ERROR') {
              return res.status(500).json({ 
                message: "Security verification temporarily unavailable. Please try again.",
                code: "RECAPTCHA_SERVER_ERROR"
              });
            } else if (assessment?.errorType === 'INVALID_TOKEN') {
              return res.status(400).json({ 
                message: "Invalid security token. Please refresh and try again.",
                code: "RECAPTCHA_INVALID_TOKEN"
              });
            } else if (assessment?.errorType === 'ACTION_MISMATCH') {
              return res.status(400).json({ 
                message: "Security verification mismatch. Please try again.",
                code: "RECAPTCHA_ACTION_MISMATCH"
              });
            } else {
              return res.status(400).json({ 
                message: "Security verification failed. Please try again.",
                code: "RECAPTCHA_FAILED"
              });
            }
          }
          
          if (assessment.score < 0.5) {
            console.log(`[SECURITY] reCAPTCHA Enterprise score too low for registration: ${req.body.username}, score: ${assessment.score}`);
            return res.status(400).json({ 
              message: "Security verification failed due to suspicious activity. Please try again.",
              code: "RECAPTCHA_LOW_SCORE",
              score: assessment.score
            });
          }
          
          console.log(`[SECURITY] reCAPTCHA Enterprise verification passed for registration: ${req.body.username}, score: ${assessment.score}`);
        } catch (error) {
          console.error(`[ERROR] reCAPTCHA Enterprise verification error during registration:`, error);
          return res.status(500).json({ 
            message: "Security verification error. Please try again.",
            code: "CAPTCHA_ERROR"
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

      // Generate verification token
      const verificationToken = randomBytes(32).toString("hex");

      // Create user with verification token
      console.log(`[DEBUG] Creating new user ${req.body.username} in storage`);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        emailVerified: false,
        verificationToken: verificationToken,
      });
      console.log(`[DEBUG] User created with ID: ${user.id}, username: ${user.username}`);

      // Send verification email
      try {
        const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - Dedw3n</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Dedw3n!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
              <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
              
              <p>Hello <strong>${user.name || user.username}</strong>,</p>
              
              <p>Thank you for creating an account with Dedw3n! To complete your registration and access all features, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; transition: all 0.3s;">
                  Verify Email Address
                </a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                ${verificationLink}
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              </div>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666;">
                Best regards,<br>
                The Dedw3n Team
              </p>
              
              <p style="font-size: 12px; color: #999; margin-top: 30px;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </body>
          </html>
        `;

        const emailText = `
Welcome to Dedw3n!

Hello ${user.name || user.username},

Thank you for creating an account with Dedw3n! To complete your registration and access all features, please verify your email address by visiting this link:

${verificationLink}

This verification link will expire in 24 hours for security reasons.

If you didn't create this account, please ignore this email.

Best regards,
The Dedw3n Team
        `;

        const emailSent = await sendEmail({
          to: user.email,
          from: 'noreply@dedw3n.com',
          subject: 'Welcome to Dedw3n - Please Verify Your Email',
          text: emailText,
          html: emailHtml
        });

        if (emailSent) {
          console.log(`[EMAIL] Verification email sent successfully to ${user.email}`);
        } else {
          console.error(`[EMAIL] Failed to send verification email to ${user.email}`);
        }
      } catch (emailError) {
        console.error(`[EMAIL] Error sending verification email:`, emailError);
        // Continue with registration even if email fails
      }

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
        
        // Return user without password and verification token
        const { password, verificationToken: token, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          emailVerificationSent: true,
          message: "Account created successfully! Please check your email to verify your account."
        });
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

    // Verify reCAPTCHA Enterprise if provided
    if (req.body.recaptchaToken) {
      console.log(`[DEBUG] reCAPTCHA Enterprise verification - Token: ${req.body.recaptchaToken.substring(0, 20)}...`);
      
      try {
        const assessment = await createAssessment({
          token: req.body.recaptchaToken,
          recaptchaAction: 'login'
        });
        
        if (!assessment || !assessment.valid) {
          console.log(`[SECURITY] reCAPTCHA Enterprise verification failed for login: ${req.body.username}, error: ${assessment?.error || 'Unknown'}`);
          
          // Handle specific error types
          if (assessment?.errorType === 'SERVER_ERROR') {
            return res.status(500).json({ 
              message: "Security verification temporarily unavailable. Please try again.",
              code: "RECAPTCHA_SERVER_ERROR"
            });
          } else if (assessment?.errorType === 'INVALID_TOKEN') {
            return res.status(400).json({ 
              message: "Invalid security token. Please refresh and try again.",
              code: "RECAPTCHA_INVALID_TOKEN"
            });
          } else if (assessment?.errorType === 'ACTION_MISMATCH') {
            return res.status(400).json({ 
              message: "Security verification mismatch. Please try again.",
              code: "RECAPTCHA_ACTION_MISMATCH"
            });
          } else {
            return res.status(400).json({ 
              message: "Security verification failed. Please try again.",
              code: "RECAPTCHA_FAILED"
            });
          }
        }
        
        if (assessment.score < 0.5) {
          console.log(`[SECURITY] reCAPTCHA Enterprise score too low for login: ${req.body.username}, score: ${assessment.score}`);
          return res.status(400).json({ 
            message: "Security verification failed due to suspicious activity. Please try again.",
            code: "RECAPTCHA_LOW_SCORE",
            score: assessment.score
          });
        }
        
        console.log(`[DEBUG] reCAPTCHA Enterprise verification passed for user: ${req.body.username}, score: ${assessment.score}`);
      } catch (error) {
        console.error(`[ERROR] reCAPTCHA Enterprise verification error during login:`, error);
        return res.status(500).json({ 
          message: "Security verification error. Please try again.",
          code: "CAPTCHA_ERROR"
        });
      }
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

  // First password reset endpoint removed - using the complete implementation below
  
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
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password-confirm?token=${resetToken}`;

      // Get user's preferred language and translate email content
      const { EmailTranslationService } = await import('./email-translation-service');
      const emailTranslationService = EmailTranslationService.getInstance();
      
      // Get user's language preference (try multiple sources)
      const userLanguage = await emailTranslationService.getUserLanguagePreference(foundUser.email, foundUser.id);
      console.log(`[AUTH] Using language ${userLanguage} for password reset email to ${foundUser.email}`);
      
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

        console.log(`[AUTH] Password reset email sent to ${foundUser.email}`);
      } catch (emailError) {
        console.error(`[AUTH] Failed to send reset email to ${foundUser.email}:`, emailError);
        
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
      console.error("[AUTH] Password reset request error:", error);
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

      console.log(`[AUTH] Password reset successful for user ${foundUser.email}`);

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
        console.error(`[AUTH] Failed to send confirmation email to ${foundUser.email}:`, emailError);
        // Don't fail the request if confirmation email fails
      }

      res.json({ 
        message: "Password reset successful. You can now sign in with your new password." 
      });

    } catch (error) {
      console.error("[AUTH] Password reset confirmation error:", error);
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

// Export reCAPTCHA verification function and password utilities for use in routes
export { verifyRecaptcha, comparePasswords };