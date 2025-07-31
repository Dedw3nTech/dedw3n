import { Express } from 'express';
import { db } from './db.js';
import { users, vendors, products, orders, posts } from '../shared/schema.js';
import { eq, desc, count, sql, and } from 'drizzle-orm';

// Middleware to check if user is admin
export const isAdmin = async (req: any, res: any, next: any) => {
  try {
    let userId: number | undefined;
    let user: any;

    // First priority: Check if already authenticated by upstream middleware
    if (req.user && req.user.id) {
      user = req.user;
      userId = user.id;
    } 
    // Second priority: Check Passport authentication
    else if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      user = req.user;
      userId = user.id;
    }
    // Third priority: Check session passport data directly
    else if (req.session && (req.session as any).passport?.user) {
      userId = (req.session as any).passport.user;
      const dbUsers = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = dbUsers[0];
    }
    // Fourth priority: Check for client user ID header
    else if (req.headers['x-client-user-id']) {
      const clientUserId = req.headers['x-client-user-id'];
      if (typeof clientUserId === 'string') {
        userId = parseInt(clientUserId);
        if (!isNaN(userId)) {
          const dbUsers = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          user = dbUsers[0];
        }
      }
    }

    if (!userId || !user) {
      return res.status(401).json({ message: 'Unauthorized - Authentication required' });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied - Admin role required' });
    }

    // Attach user to request for logging
    req.user = user;
    console.log(`[ADMIN] Admin access granted to user ${user.name} (ID: ${userId})`);
    next();
  } catch (error) {
    console.error('[ADMIN] Error in admin middleware:', error);
    res.status(500).json({ message: 'Error verifying admin access' });
  }
};

// Register admin-specific routes
export function registerAdminRoutes(app: Express) {
  // Get admin statistics
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      // Get user count
      const userCountResult = await db.select({ count: count() }).from(users);
      const totalUsers = userCountResult[0]?.count || 0;

      // Get dating profiles count (users with datingEnabled = true)
      const datingProfilesResult = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.datingEnabled, true));
      const totalDatingProfiles = datingProfilesResult[0]?.count || 0;

      // Get active dating profiles (dating enabled and not locked)
      const activeDatingResult = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.datingEnabled, true), eq(users.isLocked, false)));
      const activeDatingProfiles = activeDatingResult[0]?.count || 0;

      // Get vendor count
      const vendorCountResult = await db.select({ count: count() }).from(vendors);
      const totalVendors = vendorCountResult[0]?.count || 0;

      // Get active vendors (count all vendors as active since we don't have status field)
      const activeVendors = totalVendors;

      // Get product count
      const productCountResult = await db.select({ count: count() }).from(products);
      const totalProducts = productCountResult[0]?.count || 0;

      // Get order count
      const orderCountResult = await db.select({ count: count() }).from(orders);
      const totalOrders = orderCountResult[0]?.count || 0;

      // Get total amount sold (sum of completed orders)
      const totalSoldResult = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)` 
        })
        .from(orders)
        .where(eq(orders.status, 'completed'));
      const totalAmountSold = Number(totalSoldResult[0]?.total || 0);

      // Get total transactions count (completed orders)
      const transactionsResult = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, 'completed'));
      const totalTransactions = transactionsResult[0]?.count || 0;

      // Get total amount shipped (sum of shipped orders)
      const totalShippedResult = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)` 
        })
        .from(orders)
        .where(eq(orders.status, 'shipped'));
      const totalAmountShipped = Number(totalShippedResult[0]?.total || 0);

      // Get shipped orders count
      const shippedOrdersResult = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, 'shipped'));
      const shippedOrders = shippedOrdersResult[0]?.count || 0;

      // Get active users in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.lastLogin} >= ${twentyFourHoursAgo}`);
      const activeUsers24h = activeUsersResult[0]?.count || 0;

      // Get pending reports and vendor requests (placeholder for now)
      const pendingReports = 0;
      const pendingVendorRequests = 0;

      const stats = {
        totalUsers,
        totalDatingProfiles,
        activeDatingProfiles, 
        totalVendors,
        activeVendors,
        totalProducts,
        totalOrders,
        totalAmountSold,
        totalTransactions,
        totalAmountShipped,
        shippedOrders,
        pendingReports,
        pendingVendorRequests,
        activeUsers24h
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin statistics' });
    }
  });

  // Get all users with pagination and search
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      let allUsers;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allUsers = await db.select().from(users)
          .where(
            sql`LOWER(${users.name}) LIKE ${`%${searchLower}%`} OR 
                LOWER(${users.username}) LIKE ${`%${searchLower}%`} OR 
                LOWER(${users.email}) LIKE ${`%${searchLower}%`}`
          )
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset);
      } else {
        allUsers = await db.select().from(users)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset);
      }

      // Get total count for pagination
      const totalCountResult = await db.select({ count: count() }).from(users);
      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        users: allUsers.map(user => ({
          ...user,
          password: undefined // Don't send password to frontend
        })),
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  // Update user role
  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId));

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Error updating user role' });
    }
  });

  // Lock/unlock user account
  app.patch('/api/admin/users/:id/lock', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { locked } = req.body;

      await db
        .update(users)
        .set({ isLocked: locked })
        .where(eq(users.id, userId));

      res.json({ message: `User account ${locked ? 'locked' : 'unlocked'} successfully` });
    } catch (error) {
      console.error('Error updating user lock status:', error);
      res.status(500).json({ message: 'Error updating user lock status' });
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
          address: vendors.address,
          phone: vendors.phone,
          email: vendors.email,
          description: vendors.description,
          isApproved: vendors.isApproved,
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
        businessAddress: request.address,
        businessPhone: request.phone,
        businessEmail: request.email,
        description: request.description,
        status: request.isApproved ? 'approved' : 'pending',
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

  // Approve/reject vendor request
  app.patch('/api/admin/vendor-requests/:id', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const isApproved = status === 'approved';

      await db
        .update(vendors)
        .set({ isApproved })
        .where(eq(vendors.id, vendorId));

      res.json({ message: `Vendor request ${status} successfully` });
    } catch (error) {
      console.error('Error updating vendor request:', error);
      res.status(500).json({ message: 'Error updating vendor request' });
    }
  });

  // Get all products with search and filters
  app.get('/api/admin/products', isAdmin, async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      let allProducts;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allProducts = await db.select().from(products)
          .where(
            sql`LOWER(${products.name}) LIKE ${`%${searchLower}%`} OR 
                LOWER(${products.description}) LIKE ${`%${searchLower}%`}`
          )
          .orderBy(desc(products.createdAt))
          .limit(limit)
          .offset(offset);
      } else {
        allProducts = await db.select().from(products)
          .orderBy(desc(products.createdAt))
          .limit(limit)
          .offset(offset);
      }

      // Get total count for pagination
      const totalCountResult = await db.select({ count: count() }).from(products);
      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        products: allProducts,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  });

  // Delete product
  app.delete('/api/admin/products/:id', isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);

      await db.delete(products).where(eq(products.id, productId));

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Error deleting product' });
    }
  });

  // Get all orders
  app.get('/api/admin/orders', isAdmin, async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const filterStatus = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      let allOrders;

      if (searchTerm && filterStatus && filterStatus !== 'all') {
        const searchLower = searchTerm.toLowerCase();
        allOrders = await db.select().from(orders)
          .where(
            and(
              sql`${orders.id}::text LIKE ${`%${searchLower}%`} OR 
                  ${orders.userId}::text LIKE ${`%${searchLower}%`}`,
              eq(orders.status, filterStatus)
            )
          )
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset);
      } else if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allOrders = await db.select().from(orders)
          .where(
            sql`${orders.id}::text LIKE ${`%${searchLower}%`} OR 
                ${orders.userId}::text LIKE ${`%${searchLower}%`}`
          )
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset);
      } else if (filterStatus && filterStatus !== 'all') {
        allOrders = await db.select().from(orders)
          .where(eq(orders.status, filterStatus))
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset);
      } else {
        allOrders = await db.select().from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset);
      }

      // Get total count for pagination
      const totalCountResult = await db.select({ count: count() }).from(orders);
      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        orders: allOrders,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders' });
    }
  });

  // Update order status
  app.patch('/api/admin/orders/:id/status', isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      res.json({ message: 'Order status updated successfully' });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Error updating order status' });
    }
  });

  // Get all posts (content moderation)
  app.get('/api/admin/posts', isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const allPosts = await db
        .select()
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalCountResult = await db.select({ count: count() }).from(posts);
      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        posts: allPosts,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  });

  // Flag/unflag post
  app.patch('/api/admin/posts/:id/flag', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { flagged, reason } = req.body;

      await db
        .update(posts)
        .set({ 
          isFlagged: flagged,
          flagReason: flagged ? reason : null,
          reviewStatus: flagged ? 'pending' : 'approved',
          reviewedAt: new Date(),
          reviewedBy: req.user?.id
        })
        .where(eq(posts.id, postId));

      res.json({ message: `Post ${flagged ? 'flagged' : 'unflagged'} successfully` });
    } catch (error) {
      console.error('Error flagging post:', error);
      res.status(500).json({ message: 'Error flagging post' });
    }
  });

  // Delete post
  app.delete('/api/admin/posts/:id', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);

      console.log(`Admin ${req.user?.id} deleted post ${postId}`);
      
      await db.delete(posts).where(eq(posts.id, postId));

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Error deleting post' });
    }
  });

  // Placeholder endpoints for reports (no mock data)
  app.get('/api/admin/reports', isAdmin, async (req, res) => {
    try {
      // Return empty array since we don't have reports table yet
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
}