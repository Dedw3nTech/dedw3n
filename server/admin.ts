import { Express, Request, Response, NextFunction } from "express";
import { storage } from './storage';
import { 
  userRoleEnum, 
  posts, 
  users, 
  vendors,
  products,
  orders,
  postReviewStatusEnum,
  flaggedContentStatusEnum,
  moderationMatchTypeEnum,
  moderationSeverityEnum,
  flaggedContentTypeEnum
} from "@shared/schema";
import { eq, and, or, like, desc, count, sql } from "drizzle-orm";
import { db } from './db';

// Import unified authentication middleware
import { isAuthenticated } from './unified-auth';

// Middleware to check if user is admin using unified auth
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // First check unified authentication
  isAuthenticated(req, res, (authError?: any) => {
    if (authError || !req.user) {
      console.log('[ADMIN] Authentication failed:', authError?.message || 'No user found');
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    if (!user || user.role !== 'admin') {
      console.log(`[ADMIN] Access denied for user ${user.username || 'unknown'} with role ${user.role || 'none'}`);
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    console.log(`[ADMIN] Admin access granted to user ${user.username} (ID: ${user.id})`);
    next();
  });
};

// Register admin-specific routes
export function registerAdminRoutes(app: Express) {
  // Get admin statistics
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      // Get user count
      const userCountResult = await db.select({ count: count() }).from(users);
      const totalUsers = userCountResult[0]?.count || 0;

      // Get vendor count
      const vendorCountResult = await db.select({ count: count() }).from(vendors);
      const totalVendors = vendorCountResult[0]?.count || 0;

      // Get product count
      const productCountResult = await db.select({ count: count() }).from(products);
      const totalProducts = productCountResult[0]?.count || 0;

      // Get order count
      const orderCountResult = await db.select({ count: count() }).from(orders);
      const totalOrders = orderCountResult[0]?.count || 0;

      // Get active users in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.lastLogin} >= ${twentyFourHoursAgo}`);
      const activeUsers24h = activeUsersResult[0]?.count || 0;

      // Mock data for other statistics (can be implemented later)
      const pendingReports = 0;
      const pendingVendorRequests = 0;
      const totalRevenue = 0;

      const stats = {
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        pendingReports,
        pendingVendorRequests,
        activeUsers24h,
        totalRevenue
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin statistics' });
    }
  });

  // Get all reports (placeholder for future implementation)
  app.get('/api/admin/reports', isAdmin, async (req, res) => {
    try {
      // For now, return empty array since we don't have a reports table yet
      // This can be implemented when the reports/moderation system is built
      res.json([]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Error fetching reports' });
    }
  });

  // Update report status (placeholder)
  app.patch('/api/admin/reports/:id', isAdmin, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // For now, just return success since we don't have reports table
      res.json({ message: 'Report status updated successfully' });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ message: 'Error updating report' });
    }
  });

  // Get vendor requests
  app.get('/api/admin/vendor-requests', isAdmin, async (req, res) => {
    try {
      // Get all vendors with user information
      const vendorRequests = await db
        .select({
          id: vendors.id,
          userId: vendors.userId,
          vendorType: vendors.vendorType,
          businessName: vendors.businessName,
          businessAddress: vendors.businessAddress,
          businessPhone: vendors.businessPhone,
          businessEmail: vendors.businessEmail,
          description: vendors.description,
          status: vendors.accountStatus,
          createdAt: vendors.createdAt,
          // User details
          userName: users.name,
          userUsername: users.username,
          userEmail: users.email,
          userAvatar: users.avatar
        })
        .from(vendors)
        .leftJoin(users, eq(vendors.userId, users.id))
        .orderBy(desc(vendors.createdAt));

      // Transform the data to match the expected format
      const formattedRequests = vendorRequests.map(request => ({
        id: request.id,
        userId: request.userId,
        vendorType: request.vendorType,
        businessName: request.businessName,
        businessAddress: request.businessAddress,
        businessPhone: request.businessPhone,
        businessEmail: request.businessEmail,
        description: request.description,
        status: request.status || 'pending',
        createdAt: request.createdAt,
        user: {
          name: request.userName,
          username: request.userUsername,
          email: request.userEmail,
          avatar: request.userAvatar
        }
      }));

      res.json(formattedRequests);
    } catch (error) {
      console.error('Error fetching vendor requests:', error);
      res.status(500).json({ message: 'Error fetching vendor requests' });
    }
  });

  // Update vendor request status
  app.patch('/api/admin/vendor-requests/:id', isAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Update the vendor account status
      const updatedVendor = await db
        .update(vendors)
        .set({ 
          accountStatus: status === 'approved' ? 'active' : 
                        status === 'rejected' ? 'suspended' : 'on_hold',
          updatedAt: new Date()
        })
        .where(eq(vendors.id, requestId))
        .returning();

      if (!updatedVendor.length) {
        return res.status(404).json({ message: 'Vendor request not found' });
      }

      // If approved, update the user's isVendor flag
      if (status === 'approved') {
        await db
          .update(users)
          .set({ isVendor: true })
          .where(eq(users.id, updatedVendor[0].userId));
      }

      res.json({ message: 'Vendor request status updated successfully' });
    } catch (error) {
      console.error('Error updating vendor request:', error);
      res.status(500).json({ message: 'Error updating vendor request' });
    }
  });
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
      if (role && !['user', 'admin', 'moderator', 'vendor', 'business'].includes(role)) {
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
      if (role && !['user', 'admin', 'moderator', 'vendor', 'business'].includes(role)) {
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
      
      const { content, title, moderationNote, reviewStatus } = req.body;
      const updates: any = {};
      
      if (content !== undefined) updates.content = content;
      if (title !== undefined) updates.title = title;
      if (moderationNote !== undefined) updates.moderationNote = moderationNote;
      if (reviewStatus !== undefined) {
        // Validate review status
        if (!['approved', 'rejected', 'pending'].includes(reviewStatus)) {
          return res.status(400).json({ 
            message: 'Invalid review status. Must be one of: approved, rejected, pending'
          });
        }
        updates.reviewStatus = reviewStatus;
        
        // If approving a post, automatically unflag it
        if (reviewStatus === 'approved') {
          updates.isFlagged = false;
          updates.flagReason = null;
        }
        
        // If rejecting a post, also unpublish it
        if (reviewStatus === 'rejected') {
          updates.isPublished = false;
        }
      }
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
      };
      
      if (req.user) {
        updates.reviewedBy = req.user.id;
      }
      
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
        reviewedAt: new Date(),
      };
      
      if (req.user) {
        updates.reviewedBy = req.user.id;
      }
      
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
      if (req.user) {
        console.log(`Admin ${req.user.id} (${req.user.username}) deleted post ${postId}`);
      } else {
        console.log(`Admin deleted post ${postId}`);
      }
      
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
  
  // Order Management Endpoints
  
  // Get all orders
  app.get('/api/admin/orders', isAdmin, async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filterStatus = req.query.status as string;
      
      // Get all orders
      let orders = await storage.getAllOrders();
      
      // Apply filters if needed
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        orders = orders.filter(order => 
          order.id.toString().includes(search) ||
          order.userId.toString().includes(search)
        );
      }
      
      if (filterStatus && filterStatus !== 'all') {
        orders = orders.filter(order => 
          order.status.toLowerCase() === filterStatus.toLowerCase()
        );
      }
      
      // Enhance orders with customer details
      const enhancedOrders = await Promise.all(
        orders.map(async (order) => {
          const user = await storage.getUser(order.userId);
          const orderItems = await storage.getOrderItems(order.id);
          
          return {
            ...order,
            customerName: user?.name || 'Unknown',
            customerEmail: user?.email || 'Unknown',
            items: orderItems,
            itemCount: orderItems.length
          };
        })
      );
      
      res.json(enhancedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders' });
    }
  });
  
  // Get a specific order
  app.get('/api/admin/orders/:id', isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const user = await storage.getUser(order.userId);
      const orderItems = await storage.getOrderItems(orderId);
      
      // Get product details for each item
      const itemsWithDetails = await Promise.all(
        orderItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          const vendor = await storage.getVendor(item.vendorId);
          
          return {
            ...item,
            productName: product?.name || 'Unknown Product',
            vendorName: vendor?.storeName || 'Unknown Vendor'
          };
        })
      );
      
      const enhancedOrder = {
        ...order,
        customer: user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : { id: 0, name: 'Unknown', email: 'Unknown' },
        items: itemsWithDetails
      };
      
      res.json(enhancedOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ message: 'Error fetching order details' });
    }
  });
  
  // Update order status
  app.patch('/api/admin/orders/:id', isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const { status, paymentStatus, notes } = req.body;
      const updates: any = {};
      
      if (status) {
        if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }
        updates.status = status;
      }
      
      if (paymentStatus) {
        if (!['pending', 'completed', 'failed', 'refunded'].includes(paymentStatus)) {
          return res.status(400).json({ message: 'Invalid payment status value' });
        }
        updates.paymentStatus = paymentStatus;
      }
      
      if (notes !== undefined) {
        updates.notes = notes;
      }
      
      // Add timestamp
      updates.updatedAt = new Date();
      
      const updatedOrder = await storage.updateOrder(orderId, updates);
      
      if (status === 'shipped' || status === 'delivered') {
        // Update order items status as well
        await storage.updateOrderItemsStatus(orderId, status);
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: 'Error updating order' });
    }
  });
  
  // Get order analytics
  app.get('/api/admin/orders/analytics', isAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'week';
      
      // Get total counts
      const pendingOrders = await storage.countOrders({ status: 'pending' });
      const processingOrders = await storage.countOrders({ status: 'processing' });
      const shippedOrders = await storage.countOrders({ status: 'shipped' });
      const deliveredOrders = await storage.countOrders({ status: 'delivered' });
      const cancelledOrders = await storage.countOrders({ status: 'cancelled' });
      
      const totalRevenue = await storage.calculateTotalRevenue();
      const averageOrderValue = await storage.calculateAverageOrderValue();
      
      res.json({
        counts: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          total: pendingOrders + processingOrders + shippedOrders + deliveredOrders + cancelledOrders
        },
        revenue: {
          total: totalRevenue,
          averageOrderValue
        }
      });
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      res.status(500).json({ message: 'Error fetching order analytics' });
    }
  });
  
  // Get product analytics for product managers
  app.get('/api/admin/analytics/products', isAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange as string || '30days';
      
      // Get product performance metrics
      const topSellingProducts = await storage.getTopSellingProducts(5); // Top 5 products
      const productPerformance = await storage.getProductPerformanceMetrics(timeRange);
      const categoryTrends = await storage.getCategoryTrendsData();
      const revenueByCategory = await storage.getRevenueByCategory(timeRange);
      const inventoryAlerts = await storage.getInventoryAlerts();
      
      res.json({
        topSellingProducts,
        productPerformance,
        categoryTrends,
        revenueByCategory,
        inventoryAlerts
      });
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      res.status(500).json({ message: 'Error fetching product analytics' });
    }
  });
  
  // Get overall admin analytics
  app.get('/api/admin/analytics', isAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange as string || '30days';
      
      // User data
      const userRegistrations = await storage.getUserRegistrationTrends(timeRange);
      const activeUsers = await storage.getActiveUserStats(timeRange);
      
      // Sales data
      const salesData = await storage.getSalesData(timeRange);
      
      // Product data
      const productCategories = await storage.getProductCategoryDistribution();
      
      // Traffic sources
      const trafficSources = await storage.getTrafficSourcesData(timeRange);
      
      res.json({
        userRegistrations,
        activeUsers,
        sales: salesData,
        productCategories,
        traffic: trafficSources,
      });
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      res.status(500).json({ message: 'Error fetching admin analytics' });
    }
  });
  
  // Fix blob URLs in user avatars (maintenance utility)
  app.post('/api/users/fix-blob-avatars', isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      
      // Filter users with blob: URLs
      const usersWithBlobUrls = users.filter(user => 
        user.avatar && user.avatar.startsWith('blob:')
      );
      
      // Update each user with a blob URL, setting avatar to null
      for (const user of usersWithBlobUrls) {
        await storage.updateUser(user.id, { avatar: null });
      }
      
      res.json({ 
        success: true, 
        users: usersWithBlobUrls.map(u => ({ id: u.id, username: u.username }))
      });
    } catch (error) {
      console.error('Error fixing blob avatars:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fix blob avatars' 
      });
    }
  });

  // ========== CONTENT MODERATION ENDPOINTS ==========

  // Get moderation stats for the dashboard
  app.get('/api/admin/moderation/stats', isAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange as string || 'week';
      
      // Get flagged content count
      const flaggedContentCount = (await storage.getFlaggedContent({ status: 'pending' })).length;
      const flaggedImagesCount = (await storage.getFlaggedImages({ status: 'pending' })).length;
      const moderationReportsCount = (await storage.getModerationReports({ status: 'pending' })).length;
      
      // Get total flagged items count
      const totalFlagged = flaggedContentCount + flaggedImagesCount + moderationReportsCount;
      
      // Get resolved today count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const resolvedToday = [
        ...(await storage.getFlaggedContent({ 
          status: 'approved',
        })),
        ...(await storage.getFlaggedContent({ 
          status: 'rejected',
        })),
        ...(await storage.getFlaggedImages({ 
          status: 'approved',
        })),
        ...(await storage.getFlaggedImages({ 
          status: 'rejected',
        })),
        ...(await storage.getModerationReports({ 
          status: 'approved',
        })),
        ...(await storage.getModerationReports({ 
          status: 'rejected',
        }))
      ].filter(item => {
        if (!item.reviewedAt) return false;
        const reviewDate = new Date(item.reviewedAt);
        return reviewDate >= today;
      }).length;
      
      // Get content type data
      const contentTypeCounts = {
        post: (await storage.getFlaggedContent({ contentType: 'post' })).length,
        comment: (await storage.getFlaggedContent({ contentType: 'comment' })).length,
        message: (await storage.getFlaggedContent({ contentType: 'message' })).length,
        product: (await storage.getFlaggedContent({ contentType: 'product' })).length,
        profile: (await storage.getFlaggedContent({ contentType: 'profile' })).length,
        community: (await storage.getFlaggedContent({ contentType: 'community' })).length,
      };
      
      // Return formatted statistics for the dashboard
      res.json({
        totalFlagged,
        pendingReview: totalFlagged, // Same as total flagged for now
        resolvedToday,
        // For now, we don't have real AI moderation, so setting this to 0
        autoModerated: 0,
        contentTypeData: Object.entries(contentTypeCounts).map(([key, value]) => ({
          name: key,
          value
        })),
        // Other details we'd include in a real implementation:
        aiAssistAccuracy: 0, // Not implemented yet
        averageResponseTime: 0, // Not tracked yet
      });
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      res.status(500).json({ message: 'Error fetching moderation stats' });
    }
  });

  // Get moderation logs
  app.get('/api/admin/moderation/logs', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const action = req.query.action as string;
      const contentType = req.query.contentType as string;
      const moderator = req.query.moderator as string;
      const date = req.query.date as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Get all reports that have been reviewed
      const reportOptions: any = {
        status: 'approved' // Actually want all reviewed items, but this is a placeholder
      };
      
      if (search) {
        reportOptions.search = search;
      }
      
      if (action) {
        // In a real implementation, we'd filter by action type
      }
      
      if (contentType) {
        reportOptions.contentType = contentType;
      }
      
      if (moderator) {
        // In a real implementation, we'd filter by moderator
      }
      
      if (date) {
        // In a real implementation, we'd filter by date
      }
      
      reportOptions.limit = limit;
      reportOptions.offset = offset;
      
      // Get moderation reports
      const reports = await storage.getModerationReports(reportOptions);
      
      // Format reports as logs
      const logs = await Promise.all(reports.map(async (report) => {
        // Get user who reported
        const reportedByUser = await storage.getUser(report.reportedBy);
        
        // Get user who reviewed (if any)
        const reviewedByUser = report.reviewedBy ? await storage.getUser(report.reviewedBy) : null;
        
        return {
          id: report.id,
          action: report.status === 'approved' ? 'approve' : 'reject',
          contentType: report.contentType,
          content: report.details.substring(0, 100) + (report.details.length > 100 ? '...' : ''),
          reportedBy: reportedByUser ? reportedByUser.username : 'Unknown',
          moderator: reviewedByUser ? reviewedByUser.username : 'System',
          timestamp: report.reviewedAt || report.createdAt,
          reason: report.reviewNote || 'No reason provided'
        };
      }));
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching moderation logs:', error);
      res.status(500).json({ message: 'Error fetching moderation logs' });
    }
  });

  // ===== ALLOW LIST ENDPOINTS =====
  
  // Get all allow list items
  app.get('/api/admin/moderation/allow-list', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const items = await storage.getAllowList(search);
      res.json(items);
    } catch (error) {
      console.error('Error fetching allow list:', error);
      res.status(500).json({ message: 'Error fetching allow list' });
    }
  });
  
  // Get a single allow list item
  app.get('/api/admin/moderation/allow-list/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getAllowListItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Allow list item not found' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Error fetching allow list item:', error);
      res.status(500).json({ message: 'Error fetching allow list item' });
    }
  });
  
  // Create a new allow list item
  app.post('/api/admin/moderation/allow-list', isAdmin, async (req, res) => {
    try {
      const { term, context, notes } = req.body;
      
      if (!term) {
        return res.status(400).json({ message: 'Term is required' });
      }
      
      const newItem = await storage.createAllowListItem({
        term,
        context,
        notes
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating allow list item:', error);
      res.status(500).json({ message: 'Error creating allow list item' });
    }
  });
  
  // Update an allow list item
  app.patch('/api/admin/moderation/allow-list/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { term, context, notes } = req.body;
      
      const item = await storage.getAllowListItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Allow list item not found' });
      }
      
      const updates: any = {};
      if (term !== undefined) updates.term = term;
      if (context !== undefined) updates.context = context;
      if (notes !== undefined) updates.notes = notes;
      
      const updatedItem = await storage.updateAllowListItem(id, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating allow list item:', error);
      res.status(500).json({ message: 'Error updating allow list item' });
    }
  });
  
  // Delete an allow list item
  app.delete('/api/admin/moderation/allow-list/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const item = await storage.getAllowListItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Allow list item not found' });
      }
      
      await storage.deleteAllowListItem(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting allow list item:', error);
      res.status(500).json({ message: 'Error deleting allow list item' });
    }
  });
  
  // ===== BLOCK LIST ENDPOINTS =====
  
  // Get all block list items
  app.get('/api/admin/moderation/block-list', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const items = await storage.getBlockList(search);
      res.json(items);
    } catch (error) {
      console.error('Error fetching block list:', error);
      res.status(500).json({ message: 'Error fetching block list' });
    }
  });
  
  // Get a single block list item
  app.get('/api/admin/moderation/block-list/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getBlockListItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Block list item not found' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Error fetching block list item:', error);
      res.status(500).json({ message: 'Error fetching block list item' });
    }
  });
  
  // Create a new block list item
  app.post('/api/admin/moderation/block-list', isAdmin, async (req, res) => {
    try {
      const { term, matchType, severity, context, notes } = req.body;
      
      if (!term) {
        return res.status(400).json({ message: 'Term is required' });
      }
      
      if (!matchType || !['exact', 'partial', 'regex'].includes(matchType)) {
        return res.status(400).json({ 
          message: 'Invalid match type. Must be one of: exact, partial, regex' 
        });
      }
      
      if (!severity || !['low', 'medium', 'high'].includes(severity)) {
        return res.status(400).json({ 
          message: 'Invalid severity. Must be one of: low, medium, high' 
        });
      }
      
      const newItem = await storage.createBlockListItem({
        term,
        matchType,
        severity,
        context,
        notes
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating block list item:', error);
      res.status(500).json({ message: 'Error creating block list item' });
    }
  });
  
  // Update a block list item
  app.patch('/api/admin/moderation/block-list/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { term, matchType, severity, context, notes } = req.body;
      
      const item = await storage.getBlockListItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Block list item not found' });
      }
      
      const updates: any = {};
      if (term !== undefined) updates.term = term;
      
      if (matchType !== undefined) {
        if (!['exact', 'partial', 'regex'].includes(matchType)) {
          return res.status(400).json({ 
            message: 'Invalid match type. Must be one of: exact, partial, regex' 
          });
        }
        updates.matchType = matchType;
      }
      
      if (severity !== undefined) {
        if (!['low', 'medium', 'high'].includes(severity)) {
          return res.status(400).json({ 
            message: 'Invalid severity. Must be one of: low, medium, high' 
          });
        }
        updates.severity = severity;
      }
      
      if (context !== undefined) updates.context = context;
      if (notes !== undefined) updates.notes = notes;
      
      const updatedItem = await storage.updateBlockListItem(id, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating block list item:', error);
      res.status(500).json({ message: 'Error updating block list item' });
    }
  });
  
  // Delete a block list item
  app.delete('/api/admin/moderation/block-list/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const item = await storage.getBlockListItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Block list item not found' });
      }
      
      await storage.deleteBlockListItem(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting block list item:', error);
      res.status(500).json({ message: 'Error deleting block list item' });
    }
  });
  
  // ===== FLAGGED CONTENT ENDPOINTS =====
  
  // Get all flagged content items with pagination and filtering
  app.get('/api/admin/moderation/flagged-content', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const contentType = req.query.contentType as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const options: any = { 
        limit, 
        offset 
      };
      
      if (search) options.search = search;
      if (status) options.status = status;
      if (contentType) options.contentType = contentType;
      
      const items = await storage.getFlaggedContent(options);
      
      // Return with additional count for pagination
      res.json({
        items,
        total: items.length + offset, // This is a simplification, in a real implementation we would need a separate count query
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      res.status(500).json({ message: 'Error fetching flagged content' });
    }
  });
  
  // Get a single flagged content item
  app.get('/api/admin/moderation/flagged-content/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getFlaggedContentItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Flagged content item not found' });
      }
      
      // Get the reporter user details
      const reporter = await storage.getUser(item.reportedBy);
      
      // Format response with reporter details
      res.json({
        ...item,
        reporter: reporter ? {
          id: reporter.id,
          username: reporter.username,
          name: reporter.name,
        } : undefined
      });
    } catch (error) {
      console.error('Error fetching flagged content item:', error);
      res.status(500).json({ message: 'Error fetching flagged content item' });
    }
  });
  
  // Create a new flagged content item
  app.post('/api/admin/moderation/flagged-content', async (req, res) => {
    try {
      // This endpoint can be accessed by regular users, but we need to be authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { contentType, contentId, content, reason } = req.body;
      const userId = req.user?.id;
      
      if (!contentType || !contentId || !content || !reason) {
        return res.status(400).json({ 
          message: 'Content type, content ID, content, and reason are required' 
        });
      }
      
      // Validate content type
      if (!['post', 'comment', 'message', 'product', 'profile', 'community'].includes(contentType)) {
        return res.status(400).json({ 
          message: 'Invalid content type. Must be one of: post, comment, message, product, profile, community' 
        });
      }
      
      const newItem = await storage.createFlaggedContentItem({
        contentType,
        contentId: parseInt(contentId),
        content,
        reason,
        reportedBy: userId!,
        status: 'pending',
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating flagged content item:', error);
      res.status(500).json({ message: 'Error creating flagged content item' });
    }
  });
  
  // Update a flagged content item (review it)
  app.patch('/api/admin/moderation/flagged-content/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewNote } = req.body;
      
      const item = await storage.getFlaggedContentItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Flagged content item not found' });
      }
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be one of: approved, rejected, pending' 
        });
      }
      
      const updates: any = {
        status,
        reviewedBy: req.user?.id,
      };
      
      if (reviewNote) updates.reviewNote = reviewNote;
      
      const updatedItem = await storage.updateFlaggedContentItem(id, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating flagged content item:', error);
      res.status(500).json({ message: 'Error updating flagged content item' });
    }
  });
  
  // Delete a flagged content item
  app.delete('/api/admin/moderation/flagged-content/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const item = await storage.getFlaggedContentItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Flagged content item not found' });
      }
      
      await storage.deleteFlaggedContentItem(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting flagged content item:', error);
      res.status(500).json({ message: 'Error deleting flagged content item' });
    }
  });
  
  // ===== FLAGGED IMAGES ENDPOINTS =====
  
  // Get all flagged images with pagination and filtering
  app.get('/api/admin/moderation/flagged-images', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const contentType = req.query.contentType as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const options: any = { 
        limit, 
        offset 
      };
      
      if (search) options.search = search;
      if (status) options.status = status;
      if (contentType) options.contentType = contentType;
      
      const items = await storage.getFlaggedImages(options);
      
      // Return with additional count for pagination
      res.json({
        items,
        total: items.length + offset, // This is a simplification, in a real implementation we would need a separate count query
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching flagged images:', error);
      res.status(500).json({ message: 'Error fetching flagged images' });
    }
  });
  
  // Get a single flagged image
  app.get('/api/admin/moderation/flagged-images/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getFlaggedImage(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Flagged image not found' });
      }
      
      // Get the reporter user details
      const reporter = await storage.getUser(item.reportedBy);
      
      // Format response with reporter details
      res.json({
        ...item,
        reporter: reporter ? {
          id: reporter.id,
          username: reporter.username,
          name: reporter.name,
        } : undefined
      });
    } catch (error) {
      console.error('Error fetching flagged image:', error);
      res.status(500).json({ message: 'Error fetching flagged image' });
    }
  });
  
  // Create a new flagged image
  app.post('/api/admin/moderation/flagged-images', async (req, res) => {
    try {
      // This endpoint can be accessed by regular users, but we need to be authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { imageUrl, contentType, contentId, reason } = req.body;
      const userId = req.user?.id;
      
      if (!imageUrl || !contentType || !contentId || !reason) {
        return res.status(400).json({ 
          message: 'Image URL, content type, content ID, and reason are required' 
        });
      }
      
      // Validate content type (same as for flagged content)
      if (!['post', 'comment', 'message', 'product', 'profile', 'community'].includes(contentType)) {
        return res.status(400).json({ 
          message: 'Invalid content type. Must be one of: post, comment, message, product, profile, community' 
        });
      }
      
      const newItem = await storage.createFlaggedImage({
        imageUrl,
        contentType,
        contentId: parseInt(contentId),
        reason,
        reportedBy: userId!,
        status: 'pending',
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating flagged image:', error);
      res.status(500).json({ message: 'Error creating flagged image' });
    }
  });
  
  // Update a flagged image (review it)
  app.patch('/api/admin/moderation/flagged-images/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewNote } = req.body;
      
      const item = await storage.getFlaggedImage(id);
      if (!item) {
        return res.status(404).json({ message: 'Flagged image not found' });
      }
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be one of: approved, rejected, pending' 
        });
      }
      
      const updates: any = {
        status,
        reviewedBy: req.user?.id,
      };
      
      if (reviewNote) updates.reviewNote = reviewNote;
      
      const updatedItem = await storage.updateFlaggedImage(id, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating flagged image:', error);
      res.status(500).json({ message: 'Error updating flagged image' });
    }
  });
  
  // Delete a flagged image
  app.delete('/api/admin/moderation/flagged-images/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const item = await storage.getFlaggedImage(id);
      if (!item) {
        return res.status(404).json({ message: 'Flagged image not found' });
      }
      
      await storage.deleteFlaggedImage(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting flagged image:', error);
      res.status(500).json({ message: 'Error deleting flagged image' });
    }
  });
  
  // ===== AI CONTENT ANALYSIS ENDPOINTS =====
  
  // Analyze content
  app.post('/api/admin/moderation/analyze-content', isAdmin, async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }
      
      const analysis = await storage.analyzeContent(content);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing content:', error);
      res.status(500).json({ message: 'Error analyzing content' });
    }
  });
  
  // Analyze image
  app.post('/api/admin/moderation/analyze-image', isAdmin, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required' });
      }
      
      const analysis = await storage.analyzeImage(imageUrl);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ message: 'Error analyzing image' });
    }
  });
  
  // Analyze user behavior
  app.get('/api/admin/moderation/analyze-user/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const analysis = await storage.analyzeUserBehavior(userId);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      res.status(500).json({ message: 'Error analyzing user behavior' });
    }
  });

  // ===== MODERATION REPORTS ENDPOINTS =====
  
  // Get all moderation reports with pagination and filtering
  app.get('/api/admin/moderation/reports', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const reportType = req.query.reportType as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const options: any = { 
        limit, 
        offset 
      };
      
      if (search) options.search = search;
      if (status) options.status = status;
      if (reportType) options.reportType = reportType;
      
      const reports = await storage.getModerationReports(options);
      
      // Return with additional count for pagination
      res.json({
        reports,
        total: reports.length + offset, // This is a simplification, in a real implementation we would need a separate count query
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching moderation reports:', error);
      res.status(500).json({ message: 'Error fetching moderation reports' });
    }
  });
  
  // Get a single moderation report
  app.get('/api/admin/moderation/reports/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getModerationReport(id);
      
      if (!report) {
        return res.status(404).json({ message: 'Moderation report not found' });
      }
      
      // Get the reporter user details
      const reporter = await storage.getUser(report.reportedBy);
      
      // Format response with reporter details
      res.json({
        ...report,
        reporter: reporter ? {
          id: reporter.id,
          username: reporter.username,
          name: reporter.name,
        } : undefined
      });
    } catch (error) {
      console.error('Error fetching moderation report:', error);
      res.status(500).json({ message: 'Error fetching moderation report' });
    }
  });
  
  // Create a new moderation report
  app.post('/api/admin/moderation/reports', async (req, res) => {
    try {
      // This endpoint can be accessed by regular users, but we need to be authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { reportType, details, contentId, contentType } = req.body;
      const userId = req.user?.id;
      
      if (!reportType || !details || !contentId || !contentType) {
        return res.status(400).json({ 
          message: 'Report type, details, content ID, and content type are required' 
        });
      }
      
      // Validate content type (same as for flagged content)
      if (!['post', 'comment', 'message', 'product', 'profile', 'community'].includes(contentType)) {
        return res.status(400).json({ 
          message: 'Invalid content type. Must be one of: post, comment, message, product, profile, community' 
        });
      }
      
      const newReport = await storage.createModerationReport({
        reportType,
        details,
        contentId: parseInt(contentId),
        contentType,
        reportedBy: userId!,
        status: 'pending',
      });
      
      res.status(201).json(newReport);
    } catch (error) {
      console.error('Error creating moderation report:', error);
      res.status(500).json({ message: 'Error creating moderation report' });
    }
  });
  
  // Update a moderation report (review it)
  app.patch('/api/admin/moderation/reports/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reviewNote } = req.body;
      
      const report = await storage.getModerationReport(id);
      if (!report) {
        return res.status(404).json({ message: 'Moderation report not found' });
      }
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be one of: approved, rejected, pending' 
        });
      }
      
      const updates: any = {
        status,
        reviewedBy: req.user?.id,
      };
      
      if (reviewNote) updates.reviewNote = reviewNote;
      
      const updatedReport = await storage.updateModerationReport(id, updates);
      res.json(updatedReport);
    } catch (error) {
      console.error('Error updating moderation report:', error);
      res.status(500).json({ message: 'Error updating moderation report' });
    }
  });
  
  // Delete a moderation report
  app.delete('/api/admin/moderation/reports/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const report = await storage.getModerationReport(id);
      if (!report) {
        return res.status(404).json({ message: 'Moderation report not found' });
      }
      
      await storage.deleteModerationReport(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting moderation report:', error);
      res.status(500).json({ message: 'Error deleting moderation report' });
    }
  });
}