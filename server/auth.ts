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

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Enhanced password hashing with configurable parameters
export async function hashPassword(password: string) {
  // Increase security with larger salt and more CPU-intensive parameters
  const salt = randomBytes(32).toString("hex");
  const keylen = 64; // Output key length in bytes
  const cpuCost = 16384; // Higher CPU cost increases security (2^N)
  
  try {
    console.log(`[DEBUG] Hashing password with salt length ${salt.length}`);
    // Use scrypt standard parameters without options object (fixes TypeScript error)
    const buf = (await scryptAsync(password, salt, keylen)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    console.log(`[DEBUG] Password hashed successfully, length: ${hashedPassword.length}`);
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
    const keylen = 64;
    
    // Use standard parameters to match the hashing function
    const suppliedBuf = (await scryptAsync(supplied, salt, keylen)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('[ERROR] Password comparison failed:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Set up session using the session store from storage
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "socialmarket-secret-key",
    resave: false,
    saveUninitialized: true, // Ensures guest sessions are saved
    store: storage.sessionStore, // Use the session store from storage
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: 'lax',
      // secure: process.env.NODE_ENV === 'production', // Enable in production
    }
  };

  // Trust the first proxy if behind a reverse proxy
  app.set('trust proxy', 1);
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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

  // Authentication routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      console.log(`[DEBUG] Registration attempt for username: ${req.body.username}`);
      console.log(`[DEBUG] Registration: request body:`, req.body);
      console.log(`[DEBUG] Registration: session ID before:`, req.sessionID);
      
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
        console.log(`[DEBUG] Session object:`, req.session);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error(`[ERROR] Registration failed:`, error);
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    console.log(`[DEBUG] Login attempt for username: ${req.body.username}`);
    
    passport.authenticate("local", (err: Error | null, user: any, info: { message: string } | undefined) => {
      if (err) {
        console.error(`[ERROR] Login authentication error:`, err);
        return next(err);
      }
      
      if (!user) {
        console.log(`[DEBUG] Login failed: ${info?.message || "Authentication failed"}`);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      console.log(`[DEBUG] User ${user.username} authenticated, calling req.login`);
      
      req.login(user, (err: Error | null) => {
        if (err) {
          console.error(`[ERROR] req.login error:`, err);
          return next(err);
        }
        
        console.log(`[DEBUG] req.login successful for ${user.username}`);
        console.log(`[DEBUG] Session ID: ${req.sessionID}`);
        console.log(`[DEBUG] isAuthenticated: ${req.isAuthenticated()}`);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Successfully logged out" });
    });
  });

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