import { Express, Request, Response, NextFunction } from "express";
import { storage } from './storage';
import { userRoleEnum } from "@shared/schema";

// Middleware to check if user is admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }

  next();
};

// Register admin-specific routes
export function registerAdminRoutes(app: Express) {
  // Get all users
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  // Search users
  app.get('/api/admin/users/search', isAdmin, async (req, res) => {
    try {
      const searchTerm = req.query.term as string;
      const users = await storage.searchUsers(searchTerm);
      res.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Error searching users' });
    }
  });

  // Get user by ID
  app.get('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Error fetching user' });
    }
  });

  // Create new user
  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const { username, password, email, name, role } = req.body;
      
      // Validate required fields
      if (!username || !password || !email || !name) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      
      // Validate role
      if (role && !['user', 'admin', 'moderator', 'vendor'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      // Create the user
      const user = await storage.createUser({
        username,
        password, // This will be hashed in the createUser method in storage.ts
        email,
        name,
        role: role || 'user',
        isVendor: role === 'vendor',
      });
      
      // Return user without sensitive data
      const userWithoutPassword = { 
        ...user,
        password: undefined 
      };
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  });

  // Update user
  app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { username, email, name, role, isLocked, failedLoginAttempts } = req.body;
      
      // Check if changing username and it already exists
      if (username && username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: 'Username already exists' });
        }
      }
      
      // Check if changing email and it already exists
      if (email && email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: 'Email already exists' });
        }
      }
      
      // Validate role
      if (role && !['user', 'admin', 'moderator', 'vendor'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      // Prepare updates
      const updates: any = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (name) updates.name = name;
      if (role) {
        updates.role = role;
        // If changing to vendor role, update isVendor
        if (role === 'vendor') {
          updates.isVendor = true;
        } else if (user.isVendor && role !== 'vendor') {
          // If removing vendor role, update isVendor
          updates.isVendor = false;
        }
      }
      if (typeof isLocked === 'boolean') updates.isLocked = isLocked;
      if (typeof failedLoginAttempts === 'number') updates.failedLoginAttempts = failedLoginAttempts;
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updates);
      
      // Return user without sensitive data
      if (updatedUser) {
        const userWithoutPassword = { 
          ...updatedUser,
          password: undefined 
        };
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: 'User not found or update failed' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  });

  // Delete user
  app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow admin users to be deleted (safety measure)
      if (user.role === 'admin' && user.id !== req.user?.id) {
        return res.status(403).json({ message: 'Cannot delete admin users' });
      }
      
      // Don't allow deleting yourself
      if (user.id === req.user?.id) {
        return res.status(403).json({ message: 'Cannot delete your own account' });
      }
      
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  });

  // Reset user password
  app.post('/api/admin/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await storage.resetUserPassword(userId, newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  });

  // Get admin dashboard stats
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      // Get counts for dashboard
      const userCount = await storage.getUserCount();
      const productCount = await storage.getProductCount();
      const orderCount = await storage.getOrderCount();
      const communityCount = await storage.getCommunityCount();
      
      res.json({
        userCount,
        productCount,
        orderCount,
        communityCount,
        // Add more statistics as needed
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin stats' });
    }
  });
}