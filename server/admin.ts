import { Express, Request, Response, NextFunction } from "express";
import { storage } from './storage';
import { userRoleEnum, posts, users, postReviewStatusEnum } from "@shared/schema";
import { eq, and, or, like, desc } from "drizzle-orm";

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
      
      // Count flagged and pending review posts
      const flaggedPostCount = await storage.countPosts({ isFlagged: true });
      const pendingReviewPostCount = await storage.countPosts({ reviewStatus: 'pending' });
      
      res.json({
        userCount,
        productCount,
        orderCount,
        communityCount,
        flaggedPostCount,
        pendingReviewPostCount,
        // Add more statistics as needed
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin stats' });
    }
  });

  // Post moderation endpoints
  
  // Get all posts with filtering and pagination
  app.get('/api/admin/posts', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Apply filters based on query parameters
      const options: any = {
        limit,
        offset,
        withUserDetails: true,
      };
      
      if (status) {
        if (status === 'flagged') {
          options.isFlagged = true;
        } else if (['pending', 'approved', 'rejected'].includes(status)) {
          options.reviewStatus = status;
        }
      }
      
      if (search) {
        options.search = search;
      }
      
      const posts = await storage.listPosts(options);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  });
  
  // Get single post details
  app.get('/api/admin/posts/:id', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Get post author details
      const author = await storage.getUser(post.userId);
      
      // Return post with author info
      res.json({
        ...post,
        user: author ? {
          id: author.id,
          username: author.username,
          name: author.name,
        } : undefined
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ message: 'Error fetching post' });
    }
  });
  
  // Update post content
  app.patch('/api/admin/posts/:id', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const { content, title, moderationNote } = req.body;
      const updates: any = {};
      
      if (content !== undefined) updates.content = content;
      if (title !== undefined) updates.title = title;
      if (moderationNote !== undefined) updates.moderationNote = moderationNote;
      
      // Update updatedAt timestamp
      updates.updatedAt = new Date();
      
      // Record the admin who made this change
      if (req.user) {
        updates.reviewedBy = req.user.id;
      }
      
      const updatedPost = await storage.updatePost(postId, updates);
      
      res.json(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ message: 'Error updating post' });
    }
  });
  
  // Moderate post (approve/reject/flag)
  app.patch('/api/admin/posts/:id/moderate', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const { status, moderationNote } = req.body;
      
      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected' });
      }
      
      const updates: any = {
        reviewStatus: status,
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      };
      
      if (moderationNote) {
        updates.moderationNote = moderationNote;
      }
      
      // If a post is rejected, it should not be published
      if (status === 'rejected') {
        updates.isPublished = false;
      }
      
      // If a post is approved, it should be published
      if (status === 'approved') {
        updates.isPublished = true;
        // If it was flagged before, unflag it
        updates.isFlagged = false;
        updates.flagReason = null;
      }
      
      const updatedPost = await storage.updatePost(postId, updates);
      
      res.json(updatedPost);
    } catch (error) {
      console.error('Error moderating post:', error);
      res.status(500).json({ message: 'Error moderating post' });
    }
  });
  
  // Flag/unflag post
  app.patch('/api/admin/posts/:id/flag', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const { isFlagged, flagReason } = req.body;
      
      if (typeof isFlagged !== 'boolean') {
        return res.status(400).json({ message: 'isFlagged must be a boolean' });
      }
      
      const updates: any = {
        isFlagged,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      };
      
      if (isFlagged) {
        updates.flagReason = flagReason || 'Flagged for review';
        // When flagging, set status to pending review
        updates.reviewStatus = 'pending';
      } else {
        updates.flagReason = null;
      }
      
      const updatedPost = await storage.updatePost(postId, updates);
      
      res.json(updatedPost);
    } catch (error) {
      console.error('Error flagging post:', error);
      res.status(500).json({ message: 'Error flagging post' });
    }
  });
  
  // Delete post
  app.delete('/api/admin/posts/:id', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Record deletion attempt in logs first
      console.log(`Admin ${req.user.id} (${req.user.username}) deleted post ${postId}`);
      if (req.body.reason) {
        console.log(`Deletion reason: ${req.body.reason}`);
      }
      
      // Perform deletion
      await storage.deletePost(postId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Error deleting post' });
    }
  });
}