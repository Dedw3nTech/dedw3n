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

  // DISABLED: All simple auth routes disabled to prevent conflicts with session-based auth  
  console.log('[SIMPLE-AUTH] Simple authentication system disabled - using session-based authentication instead');
}