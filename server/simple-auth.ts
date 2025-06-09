import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { randomBytes } from "crypto";
import { User } from "@shared/schema";

// Simple token-based authentication 
interface TokenData {
  userId: number;
  token: string;
  expiresAt: Date;
}

// Store tokens in memory for simplicity
// In production, tokens should be stored in the database
const activeTokens: Map<string, TokenData> = new Map();

// Token validity duration in milliseconds (24 hours)
const TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

// Generate a secure random token for a user
function generateToken(userId: number): string {
  const tokenString = randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_VALIDITY);
  
  // Store token in our active tokens map
  activeTokens.set(tokenString, {
    userId,
    token: tokenString,
    expiresAt
  });
  
  return tokenString;
}

// Middleware to check if request has a valid token
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Get authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided' });
  }
  
  // Check if token exists and is valid
  const tokenData = activeTokens.get(token);
  
  if (!tokenData) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Check if token is expired
  if (new Date() > tokenData.expiresAt) {
    // Remove expired token
    activeTokens.delete(token);
    return res.status(401).json({ message: 'Token expired' });
  }
  
  // Get user from database
  storage.getUser(tokenData.userId)
    .then(user => {
      if (!user) {
        activeTokens.delete(token);
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Attach user to request
      (req as any).user = user;
      next();
    })
    .catch(err => {
      console.error('[ERROR] Error authenticating token:', err);
      return res.status(500).json({ message: 'Authentication error' });
    });
}

// Register the token-based auth routes to Express app
export function setupSimpleAuth(app: Express) {
  // Register user
  app.post("/api/v2/auth/register", async (req, res) => {
    try {
      console.log(`[DEBUG] Token-based registration attempt for username: ${req.body.username}`);
      
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

      // Generate token for new user
      const token = generateToken(user.id);
      
      // Return user data and token (without sensitive info)
      const { password, passwordResetToken, passwordResetExpires, verificationToken, ...safeUserData } = user;
      res.status(201).json({
        user: safeUserData,
        token
      });
    } catch (error) {
      console.error(`[ERROR] Registration failed:`, error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login user
  app.post("/api/v2/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      console.log(`[DEBUG] Login attempt for username: ${username}`);
      
      // Get user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[DEBUG] Login failed: User ${username} not found`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if account is locked
      if (user.isLocked) {
        console.log(`[DEBUG] Login failed: Account for ${username} is locked`);
        return res.status(401).json({ message: "Account is locked. Please reset your password or contact support." });
      }
      
      // Verify password using backward-compatible comparison
      const comparePasswords = async (supplied: string, stored: string) => {
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
          
          const crypto = require('crypto');
          const util = require('util');
          const scryptAsync = util.promisify(crypto.scrypt);
          const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'DedW3nSecurePepper2025!@#';
          
          const hashedBuf = Buffer.from(hashed, "hex");
          const keylen = hashedBuf.length; // Use the actual length of the stored hash
          
          // Try with pepper first (new password format)
          try {
            const pepperedSupplied = supplied + PASSWORD_PEPPER;
            const suppliedBufWithPepper = (await scryptAsync(pepperedSupplied, salt, keylen)) as Buffer;
            
            if (crypto.timingSafeEqual(hashedBuf, suppliedBufWithPepper)) {
              console.log('[AUTH] Password verified with pepper');
              return true;
            }
          } catch (pepperError) {
            console.log('[AUTH] Pepper-based verification failed, trying legacy format');
          }
          
          // Fallback to legacy format without pepper (for existing users)
          try {
            const suppliedBufLegacy = (await scryptAsync(supplied, salt, keylen)) as Buffer;
            
            if (crypto.timingSafeEqual(hashedBuf, suppliedBufLegacy)) {
              console.log('[AUTH] Password verified with legacy format (no pepper)');
              return true;
            }
          } catch (legacyError) {
            console.log('[AUTH] Legacy verification also failed');
          }
          
          return false;
        } catch (error) {
          console.error('[ERROR] Password comparison failed:', error);
          return false;
        }
      };
      
      const isValid = await comparePasswords(password, user.password);
      
      if (!isValid) {
        console.log(`[DEBUG] Login failed: Incorrect password for ${username}`);
        
        // Track failed login attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updates: any = { failedLoginAttempts: failedAttempts };
        
        // Lock account after 5 failed attempts
        if (failedAttempts >= 5) {
          console.log(`[DEBUG] Login: locking account for ${username} after ${failedAttempts} failed attempts`);
          updates.isLocked = true;
        }
        
        await storage.updateUser(user.id, updates);
        
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Reset failed attempts and update last login on successful login
      await storage.updateUser(user.id, { 
        failedLoginAttempts: 0,
        lastLogin: new Date()
      });
      
      // Generate token for user
      const token = generateToken(user.id);
      
      // Return user data and token (without password)
      const { password: pwd, passwordResetToken, passwordResetExpires, verificationToken, ...safeUserData } = user;
      res.status(200).json({
        user: safeUserData,
        token
      });
    } catch (error) {
      console.error(`[ERROR] Login failed:`, error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout user (invalidate token)
  app.post("/api/v2/auth/logout", authenticateToken, (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        // Remove token from active tokens
        activeTokens.delete(token);
      }
      
      res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
      console.error(`[ERROR] Logout failed:`, error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/v2/auth/me", authenticateToken, (req, res) => {
    try {
      const user = (req as any).user as User;
      
      // Return user without sensitive data
      const { password, passwordResetToken, passwordResetExpires, verificationToken, ...safeUserData } = user;
      res.status(200).json(safeUserData);
    } catch (error) {
      console.error(`[ERROR] Get user failed:`, error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  // Password reset request
  app.post("/api/v2/auth/forgot-password", async (req, res) => {
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
        return res.status(200).json({ 
          message: "If your email exists in our system, you will receive a password reset link shortly." 
        });
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
  app.post("/api/v2/auth/reset-password", async (req, res) => {
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
}