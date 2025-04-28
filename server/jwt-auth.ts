import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { User } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Simple token-based authentication implementation without JWT for now
interface TokenData {
  userId: number;
  token: string;
  expiresAt: Date;
}

// We'll store tokens in memory for simplicity
// In production, these should be stored in the database
const activeTokens: Map<string, TokenData> = new Map();

// Token validity duration in milliseconds (24 hours)
const TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

// Generate a new token for a user
async function generateToken(userId: number): Promise<string> {
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

// Validate a password
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
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

// Register JWT auth routes
export function setupJwtAuth(app: Express) {
  // Register user
  app.post("/api/jwt/register", async (req, res) => {
    try {
      console.log(`[DEBUG] JWT Registration attempt for username: ${req.body.username}`);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log(`[DEBUG] JWT Registration failed: Username ${req.body.username} already exists`);
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log(`[DEBUG] JWT Registration failed: Email ${req.body.email} already exists`);
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Create user
      console.log(`[DEBUG] JWT Creating new user ${req.body.username} in storage`);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      console.log(`[DEBUG] JWT User created with ID: ${user.id}, username: ${user.username}`);

      // Generate token for new user
      const token = await generateToken(user.id);
      
      // Return user data and token
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error(`[ERROR] JWT Registration failed:`, error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login user
  app.post("/api/jwt/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      console.log(`[DEBUG] JWT Login attempt for username: ${username}`);
      
      // Get user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[DEBUG] JWT Login failed: User ${username} not found`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if account is locked
      if (user.isLocked) {
        console.log(`[DEBUG] JWT Login failed: Account for ${username} is locked`);
        return res.status(401).json({ message: "Account is locked. Please reset your password or contact support." });
      }
      
      // Verify password
      const isValid = await comparePasswords(password, user.password);
      
      if (!isValid) {
        console.log(`[DEBUG] JWT Login failed: Incorrect password for ${username}`);
        
        // Track failed login attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updates: any = { failedLoginAttempts: failedAttempts };
        
        // Lock account after 5 failed attempts
        if (failedAttempts >= 5) {
          console.log(`[DEBUG] JWT Login: locking account for ${username} after ${failedAttempts} failed attempts`);
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
      const token = await generateToken(user.id);
      
      // Return user data and token
      const { password: pwd, ...userWithoutPassword } = user;
      res.status(200).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error(`[ERROR] JWT Login failed:`, error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout user (invalidate token)
  app.post("/api/jwt/logout", authenticateToken, (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        // Remove token from active tokens
        activeTokens.delete(token);
      }
      
      res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
      console.error(`[ERROR] JWT Logout failed:`, error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/jwt/me", authenticateToken, (req, res) => {
    try {
      const user = (req as any).user as User;
      
      // Return user without sensitive data
      const { password, passwordResetToken, passwordResetExpires, verificationToken, ...safeUserData } = user;
      res.status(200).json(safeUserData);
    } catch (error) {
      console.error(`[ERROR] JWT Get user failed:`, error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
}