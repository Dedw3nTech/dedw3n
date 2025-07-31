import { Express } from 'express';
import { db } from './db.js';
import { users, vendors, products, orders, posts, vendorCommissionPeriods, vendorCommissionPayments, affiliatePartners, vendorAffiliatePartners } from '../shared/schema.js';
import { eq, desc, count, sql, and, sum } from 'drizzle-orm';

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
      const dbUsers = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
      user = dbUsers[0];
    }
    // Fourth priority: Check for client user ID header
    else if (req.headers['x-client-user-id']) {
      const clientUserId = req.headers['x-client-user-id'];
      if (typeof clientUserId === 'string') {
        userId = parseInt(clientUserId);
        if (!isNaN(userId)) {
          const dbUsers = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
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

  // Deactivate vendor account (force reapplication)
  app.patch('/api/admin/vendors/:id/deactivate', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: 'Deactivation reason is required' });
      }

      // Get vendor and user information
      const vendorResult = await db.select({
        vendorId: vendors.id,
        userId: vendors.userId,
        storeName: vendors.storeName,
        businessName: vendors.businessName,
        userName: users.name,
        userEmail: users.email
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.id, vendorId))
      .limit(1);

      if (vendorResult.length === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const vendor = vendorResult[0];

      // Deactivate vendor account and force reapplication
      await db
        .update(vendors)
        .set({ 
          isActive: false,
          isApproved: false,
          accountStatus: 'suspended',
          accountSuspendedAt: new Date(),
          accountSuspensionReason: reason,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, vendorId));

      // Update user's isVendor status to false
      await db
        .update(users)
        .set({ 
          isVendor: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, vendor.userId));

      console.log(`[ADMIN] Vendor account deactivated - User: ${vendor.userName} (ID: ${vendor.userId}), Vendor: ${vendor.storeName} (ID: ${vendorId}), Reason: ${reason}`);

      res.json({ 
        message: 'Vendor account deactivated successfully. User must reapply for vendor status.',
        deactivatedVendor: {
          vendorId: vendorId,
          userId: vendor.userId,
          storeName: vendor.storeName,
          businessName: vendor.businessName,
          reason: reason
        }
      });
    } catch (error) {
      console.error('Error deactivating vendor account:', error);
      res.status(500).json({ message: 'Error deactivating vendor account' });
    }
  });

  // Reactivate vendor account
  app.patch('/api/admin/vendors/:id/reactivate', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      // Get vendor and user information
      const vendorResult = await db.select({
        vendorId: vendors.id,
        userId: vendors.userId,
        storeName: vendors.storeName,
        businessName: vendors.businessName,
        userName: users.name
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.id, vendorId))
      .limit(1);

      if (vendorResult.length === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const vendor = vendorResult[0];

      // Reactivate vendor account
      await db
        .update(vendors)
        .set({ 
          isActive: true,
          isApproved: true,
          accountStatus: 'active',
          accountSuspendedAt: null,
          accountSuspensionReason: null,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, vendorId));

      // Update user's isVendor status to true
      await db
        .update(users)
        .set({ 
          isVendor: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, vendor.userId));

      console.log(`[ADMIN] Vendor account reactivated - User: ${vendor.userName} (ID: ${vendor.userId}), Vendor: ${vendor.storeName} (ID: ${vendorId})`);

      res.json({ 
        message: 'Vendor account reactivated successfully.',
        reactivatedVendor: {
          vendorId: vendorId,
          userId: vendor.userId,
          storeName: vendor.storeName,
          businessName: vendor.businessName
        }
      });
    } catch (error) {
      console.error('Error reactivating vendor account:', error);
      res.status(500).json({ message: 'Error reactivating vendor account' });
    }
  });

  // Delete vendor account (PERMANENT DELETION)
  app.delete('/api/admin/vendors/:id', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      // Get vendor and user information before deletion
      const vendorResult = await db.select({
        vendorId: vendors.id,
        userId: vendors.userId,
        storeName: vendors.storeName,
        businessName: vendors.businessName,
        userName: users.name,
        userEmail: users.email
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.id, vendorId))
      .limit(1);

      if (vendorResult.length === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const vendor = vendorResult[0];

      // Delete all products associated with this vendor
      const deletedProducts = await db.delete(products).where(eq(products.vendorId, vendorId));

      // Delete vendor account
      await db.delete(vendors).where(eq(vendors.id, vendorId));

      // Update user's isVendor status to false
      await db
        .update(users)
        .set({ 
          isVendor: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, vendor.userId));

      console.log(`[ADMIN] PERMANENT VENDOR DELETION - User: ${vendor.userName} (ID: ${vendor.userId}), Vendor: ${vendor.storeName} (ID: ${vendorId}), Products deleted: ${deletedProducts.rowCount || 0}`);

      res.json({ 
        message: 'Vendor account and all associated products permanently deleted.',
        deletedVendor: {
          vendorId: vendorId,
          userId: vendor.userId,
          storeName: vendor.storeName,
          businessName: vendor.businessName,
          productsDeleted: deletedProducts.rowCount || 0
        }
      });
    } catch (error) {
      console.error('Error deleting vendor account:', error);
      res.status(500).json({ message: 'Error deleting vendor account' });
    }
  });

  // Delete product (PERMANENT DELETION)
  app.delete('/api/admin/products/:id', isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);

      // Get product information before deletion
      const productResult = await db.select({
        productId: products.id,
        productName: products.name,
        productCode: products.code,
        vendorId: products.vendorId,
        storeName: vendors.storeName,
        userName: users.name
      })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(products.id, productId))
      .limit(1);

      if (productResult.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const product = productResult[0];

      // Delete the product
      const deletedProduct = await db.delete(products).where(eq(products.id, productId));

      console.log(`[ADMIN] PERMANENT PRODUCT DELETION - Product: ${product.productName} (ID: ${productId}, Code: ${product.productCode}), Vendor: ${product.storeName}, User: ${product.userName}`);

      res.json({ 
        message: 'Product permanently deleted.',
        deletedProduct: {
          productId: productId,
          productName: product.productName,
          productCode: product.productCode,
          vendorId: product.vendorId,
          storeName: product.storeName,
          userName: product.userName
        }
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Error deleting product' });
    }
  });

  // Get all vendors
  app.get('/api/admin/vendors', isAdmin, async (req, res) => {
    try {
      const searchTerm = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      let allVendors;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allVendors = await db.select({
          id: vendors.id,
          userId: vendors.userId,
          vendorType: vendors.vendorType,
          businessName: vendors.businessName,
          storeName: vendors.storeName,
          address: vendors.address,
          phone: vendors.phone,
          email: vendors.email,
          description: vendors.description,
          website: vendors.website,
          logo: vendors.logo,
          rating: vendors.rating,
          ratingCount: vendors.ratingCount,
          badgeLevel: vendors.badgeLevel,
          totalSalesAmount: vendors.totalSalesAmount,
          totalTransactions: vendors.totalTransactions,
          accountStatus: vendors.accountStatus,
          isActive: vendors.isActive,
          isApproved: vendors.isApproved,
          createdAt: vendors.createdAt,
          updatedAt: vendors.updatedAt,
          userName: users.name,
          userUsername: users.username,
          userEmail: users.email,
          userAvatar: users.avatar,
          userRole: users.role,
          userLastLogin: users.lastLogin,
          userCreatedAt: users.createdAt
        })
        .from(vendors)
        .leftJoin(users, eq(vendors.userId, users.id))
        .where(
          sql`LOWER(${vendors.businessName}) LIKE ${`%${searchLower}%`} OR 
              LOWER(${vendors.storeName}) LIKE ${`%${searchLower}%`} OR 
              LOWER(${users.name}) LIKE ${`%${searchLower}%`} OR 
              LOWER(${users.username}) LIKE ${`%${searchLower}%`}`
        )
        .orderBy(desc(vendors.createdAt))
        .limit(limit)
        .offset(offset);
      } else {
        allVendors = await db.select({
          id: vendors.id,
          userId: vendors.userId,
          vendorType: vendors.vendorType,
          businessName: vendors.businessName,
          storeName: vendors.storeName,
          address: vendors.address,
          phone: vendors.phone,
          email: vendors.email,
          description: vendors.description,
          website: vendors.website,
          logo: vendors.logo,
          rating: vendors.rating,
          ratingCount: vendors.ratingCount,
          badgeLevel: vendors.badgeLevel,
          totalSalesAmount: vendors.totalSalesAmount,
          totalTransactions: vendors.totalTransactions,
          accountStatus: vendors.accountStatus,
          isActive: vendors.isActive,
          isApproved: vendors.isApproved,
          createdAt: vendors.createdAt,
          updatedAt: vendors.updatedAt,
          userName: users.name,
          userUsername: users.username,
          userEmail: users.email,
          userAvatar: users.avatar,
          userRole: users.role,
          userLastLogin: users.lastLogin,
          userCreatedAt: users.createdAt
        })
        .from(vendors)
        .leftJoin(users, eq(vendors.userId, users.id))
        .orderBy(desc(vendors.createdAt))
        .limit(limit)
        .offset(offset);
      }

      // Transform the data to match the expected format
      const formattedVendors = allVendors.map(vendor => ({
        id: vendor.id,
        userId: vendor.userId,
        vendorType: vendor.vendorType,
        businessName: vendor.businessName,
        storeName: vendor.storeName,
        address: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        description: vendor.description,
        website: vendor.website,
        logo: vendor.logo,
        rating: vendor.rating,
        ratingCount: vendor.ratingCount,
        badgeLevel: vendor.badgeLevel,
        totalSalesAmount: vendor.totalSalesAmount,
        totalTransactions: vendor.totalTransactions,
        accountStatus: vendor.accountStatus,
        isActive: vendor.isActive,
        isApproved: vendor.isApproved,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        user: {
          id: vendor.userId,
          name: vendor.userName,
          username: vendor.userUsername,
          email: vendor.userEmail,
          avatar: vendor.userAvatar,
          role: vendor.userRole,
          lastLogin: vendor.userLastLogin,
          createdAt: vendor.userCreatedAt
        }
      }));

      // Get total count for pagination
      const totalCountResult = await db.select({ count: count() }).from(vendors);
      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        vendors: formattedVendors,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ message: 'Error fetching vendors' });
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

  // ===== COMMISSION MANAGEMENT API ENDPOINTS =====

  // Get vendor commission summary
  app.get('/api/admin/vendors/:id/commission', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      // Get vendor basic info
      const vendorResult = await db.select({
        id: vendors.id,
        storeName: vendors.storeName,
        businessName: vendors.businessName,
        accountStatus: vendors.accountStatus,
        isActive: vendors.isActive,
        totalSalesAmount: vendors.totalSalesAmount,
        totalTransactions: vendors.totalTransactions,
        userId: vendors.userId,
        userName: users.name,
        userEmail: users.email
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.id, vendorId))
      .limit(1);

      if (vendorResult.length === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const vendor = vendorResult[0];

      // Get commission periods for this vendor
      const commissionPeriods = await db.select()
        .from(vendorCommissionPeriods)
        .where(eq(vendorCommissionPeriods.vendorId, vendorId))
        .orderBy(desc(vendorCommissionPeriods.year), desc(vendorCommissionPeriods.month));

      // Calculate totals
      const totalCommissionOwed = commissionPeriods
        .filter(p => p.status === 'pending' || p.status === 'overdue')
        .reduce((sum, p) => sum + Number(p.commissionAmount || 0), 0);

      const totalCommissionPaid = commissionPeriods
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.commissionAmount || 0), 0);

      const pendingPayments = commissionPeriods.filter(p => p.status === 'pending' || p.status === 'overdue').length;

      // Get recent commission payments
      const recentPayments = await db.select()
        .from(vendorCommissionPayments)
        .where(eq(vendorCommissionPayments.vendorId, vendorId))
        .orderBy(desc(vendorCommissionPayments.createdAt))
        .limit(10);

      res.json({
        vendor: {
          id: vendor.id,
          storeName: vendor.storeName,
          businessName: vendor.businessName,
          accountStatus: vendor.accountStatus,
          isActive: vendor.isActive,
          totalSalesAmount: vendor.totalSalesAmount,
          totalTransactions: vendor.totalTransactions,
          user: {
            id: vendor.userId,
            name: vendor.userName,
            email: vendor.userEmail
          }
        },
        commission: {
          totalCommissionOwed,
          totalCommissionPaid,
          pendingPayments,
          commissionPeriods,
          recentPayments
        }
      });
    } catch (error) {
      console.error('Error fetching vendor commission:', error);
      res.status(500).json({ message: 'Error fetching vendor commission' });
    }
  });

  // Freeze vendor account (commission-related)
  app.patch('/api/admin/vendors/:id/freeze', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: 'Freeze reason is required' });
      }

      // Get vendor information
      const vendorResult = await db.select({
        vendorId: vendors.id,
        userId: vendors.userId,
        storeName: vendors.storeName,
        businessName: vendors.businessName,
        accountStatus: vendors.accountStatus,
        userName: users.name,
        userEmail: users.email
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.id, vendorId))
      .limit(1);

      if (vendorResult.length === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const vendor = vendorResult[0];

      // Freeze vendor account
      await db
        .update(vendors)
        .set({ 
          accountStatus: 'frozen',
          isActive: false,
          accountSuspendedAt: new Date(),
          accountSuspensionReason: reason,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, vendorId));

      console.log(`[ADMIN] Vendor account FROZEN - User: ${vendor.userName} (ID: ${vendor.userId}), Vendor: ${vendor.storeName} (ID: ${vendorId}), Reason: ${reason}`);

      res.json({ 
        message: 'Vendor account frozen successfully',
        frozenVendor: {
          vendorId: vendorId,
          userId: vendor.userId,
          storeName: vendor.storeName,
          businessName: vendor.businessName,
          reason: reason,
          previousStatus: vendor.accountStatus
        }
      });
    } catch (error) {
      console.error('Error freezing vendor account:', error);
      res.status(500).json({ message: 'Error freezing vendor account' });
    }
  });

  // Unfreeze vendor account
  app.patch('/api/admin/vendors/:id/unfreeze', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      // Get vendor information
      const vendorResult = await db.select({
        vendorId: vendors.id,
        userId: vendors.userId,
        storeName: vendors.storeName,
        businessName: vendors.businessName,
        accountStatus: vendors.accountStatus,
        userName: users.name
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.id, vendorId))
      .limit(1);

      if (vendorResult.length === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const vendor = vendorResult[0];

      // Unfreeze vendor account
      await db
        .update(vendors)
        .set({ 
          accountStatus: 'active',
          isActive: true,
          accountSuspendedAt: null,
          accountSuspensionReason: null,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, vendorId));

      console.log(`[ADMIN] Vendor account UNFROZEN - User: ${vendor.userName} (ID: ${vendor.userId}), Vendor: ${vendor.storeName} (ID: ${vendorId})`);

      res.json({ 
        message: 'Vendor account unfrozen successfully',
        unfrozenVendor: {
          vendorId: vendorId,
          userId: vendor.userId,
          storeName: vendor.storeName,
          businessName: vendor.businessName,
          previousStatus: vendor.accountStatus
        }
      });
    } catch (error) {
      console.error('Error unfreezing vendor account:', error);
      res.status(500).json({ message: 'Error unfreezing vendor account' });
    }
  });

  // Mark commission as paid
  app.patch('/api/admin/commission-periods/:id/mark-paid', isAdmin, async (req, res) => {
    try {
      const periodId = parseInt(req.params.id);
      const { paymentMethod, paymentReference } = req.body;

      if (isNaN(periodId)) {
        return res.status(400).json({ message: 'Invalid commission period ID' });
      }

      // Get commission period
      const periodResult = await db.select()
        .from(vendorCommissionPeriods)
        .where(eq(vendorCommissionPeriods.id, periodId))
        .limit(1);

      if (periodResult.length === 0) {
        return res.status(404).json({ message: 'Commission period not found' });
      }

      // Mark as paid
      await db
        .update(vendorCommissionPeriods)
        .set({
          status: 'paid',
          paidDate: new Date(),
          paymentMethod: paymentMethod || 'manual',
          paymentReference: paymentReference,
          updatedAt: new Date()
        })
        .where(eq(vendorCommissionPeriods.id, periodId));

      console.log(`[ADMIN] Commission period ${periodId} marked as PAID by admin ${req.user?.id}`);

      res.json({ 
        message: 'Commission marked as paid successfully',
        periodId,
        paymentMethod: paymentMethod || 'manual',
        paymentReference
      });
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      res.status(500).json({ message: 'Error marking commission as paid' });
    }
  });

  // Get all vendor commissions summary (for admin overview)
  app.get('/api/admin/commissions/summary', isAdmin, async (req, res) => {
    try {
      // Get all vendors with commission data
      const vendorsWithCommission = await db.select({
        vendorId: vendors.id,
        storeName: vendors.storeName,
        businessName: vendors.businessName,
        accountStatus: vendors.accountStatus,
        isActive: vendors.isActive,
        userId: vendors.userId,
        userName: users.name,
        userEmail: users.email,
        totalSalesAmount: vendors.totalSalesAmount,
        totalTransactions: vendors.totalTransactions
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .orderBy(desc(vendors.totalSalesAmount));

      // Get commission totals for each vendor
      const vendorCommissions = await Promise.all(
        vendorsWithCommission.map(async (vendor) => {
          const commissionPeriods = await db.select()
            .from(vendorCommissionPeriods)
            .where(eq(vendorCommissionPeriods.vendorId, vendor.vendorId));

          const totalOwed = commissionPeriods
            .filter(p => p.status === 'pending' || p.status === 'overdue')
            .reduce((sum, p) => sum + Number(p.commissionAmount || 0), 0);

          const totalPaid = commissionPeriods
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + Number(p.commissionAmount || 0), 0);

          const pendingCount = commissionPeriods.filter(p => p.status === 'pending' || p.status === 'overdue').length;

          return {
            ...vendor,
            commission: {
              totalOwed,
              totalPaid,
              pendingCount,
              totalPeriods: commissionPeriods.length
            }
          };
        })
      );

      // Calculate overall totals
      const overallTotals = vendorCommissions.reduce((acc, vendor) => ({
        totalCommissionOwed: acc.totalCommissionOwed + vendor.commission.totalOwed,
        totalCommissionPaid: acc.totalCommissionPaid + vendor.commission.totalPaid,
        totalPendingPayments: acc.totalPendingPayments + vendor.commission.pendingCount,
        totalVendorsWithCommission: acc.totalVendorsWithCommission + (vendor.commission.totalPeriods > 0 ? 1 : 0)
      }), {
        totalCommissionOwed: 0,
        totalCommissionPaid: 0,
        totalPendingPayments: 0,
        totalVendorsWithCommission: 0
      });

      res.json({
        vendors: vendorCommissions,
        totals: overallTotals
      });
    } catch (error) {
      console.error('Error fetching commissions summary:', error);
      res.status(500).json({ message: 'Error fetching commissions summary' });
    }
  });

  // ===== AFFILIATE PARTNER MANAGEMENT API ENDPOINTS =====

  // Get all affiliate partners (for search/linking functionality)
  app.get('/api/admin/affiliate-partners', isAdmin, async (req, res) => {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select({
        id: affiliatePartners.id,
        name: affiliatePartners.name,
        email: affiliatePartners.email,
        phone: affiliatePartners.phone,
        dateOfBirth: sql`date_of_birth`.as('dateOfBirth'),
        country: sql`country`,
        company: affiliatePartners.company,
        partnerCode: affiliatePartners.partnerCode,
        specialization: affiliatePartners.specialization,
        region: affiliatePartners.region,
        status: affiliatePartners.status,
        isVerified: affiliatePartners.isVerified,
        totalReferrals: affiliatePartners.totalReferrals,
        totalCommissionEarned: affiliatePartners.totalCommissionEarned,
        commissionRate: affiliatePartners.commissionRate,
        notes: affiliatePartners.notes,
        createdAt: affiliatePartners.createdAt
      }).from(affiliatePartners);

      // Add search functionality
      if (search && typeof search === 'string') {
        query = query.where(
          sql`LOWER(${affiliatePartners.name}) LIKE LOWER(${'%' + search + '%'}) 
              OR LOWER(${affiliatePartners.email}) LIKE LOWER(${'%' + search + '%'}) 
              OR LOWER(${affiliatePartners.company}) LIKE LOWER(${'%' + search + '%'})
              OR LOWER(${affiliatePartners.partnerCode}) LIKE LOWER(${'%' + search + '%'})`
        );
      }

      // Get total count
      const countQuery = db.select({ count: count() }).from(affiliatePartners);
      if (search && typeof search === 'string') {
        countQuery.where(
          sql`LOWER(${affiliatePartners.name}) LIKE LOWER(${'%' + search + '%'}) 
              OR LOWER(${affiliatePartners.email}) LIKE LOWER(${'%' + search + '%'}) 
              OR LOWER(${affiliatePartners.company}) LIKE LOWER(${'%' + search + '%'})
              OR LOWER(${affiliatePartners.partnerCode}) LIKE LOWER(${'%' + search + '%'})`
        );
      }

      const [allPartners, totalResult] = await Promise.all([
        query.orderBy(desc(affiliatePartners.createdAt)).limit(Number(limit)).offset(offset),
        countQuery
      ]);

      const totalCount = totalResult[0]?.count || 0;

      res.json({
        data: allPartners,
        totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit))
      });
    } catch (error) {
      console.error('Error fetching affiliate partners:', error);
      res.status(500).json({ message: 'Error fetching affiliate partners' });
    }
  });

  // Create new affiliate partner
  app.post('/api/admin/affiliate-partners', isAdmin, async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        dateOfBirth,
        country,
        company,
        partnerCode,
        specialization,
        region,
        status = 'active',
        isVerified = false,
        totalReferrals = 0,
        totalCommissionEarned = 0.00,
        commissionRate = 0.30,
        notes
      } = req.body;

      const newPartner = await db.insert(affiliatePartners).values({
        name,
        email,
        phone,
        company,
        partnerCode,
        specialization,
        region,
        status,
        isVerified,
        totalReferrals,
        totalCommissionEarned,
        commissionRate,
        notes
      }).returning();

      // Add the additional fields using raw SQL since Drizzle doesn't recognize the new columns yet
      if (dateOfBirth || country) {
        await db.execute(sql`
          UPDATE affiliate_partners 
          SET date_of_birth = ${dateOfBirth || null}, 
              country = ${country || null}
          WHERE id = ${newPartner[0].id}
        `);
      }

      res.status(201).json({
        message: 'Affiliate partner created successfully',
        partner: newPartner[0]
      });
    } catch (error) {
      console.error('Error creating affiliate partner:', error);
      res.status(500).json({ message: 'Error creating affiliate partner' });
    }
  });

  // Update affiliate partner
  app.patch('/api/admin/affiliate-partners/:id', isAdmin, async (req, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      const updates = req.body;

      // Extract date_of_birth and country for separate handling
      const { dateOfBirth, country, ...standardUpdates } = updates;

      // Update standard fields
      if (Object.keys(standardUpdates).length > 0) {
        await db.update(affiliatePartners)
          .set(standardUpdates)
          .where(eq(affiliatePartners.id, partnerId));
      }

      // Update additional fields using raw SQL
      if (dateOfBirth !== undefined || country !== undefined) {
        await db.execute(sql`
          UPDATE affiliate_partners 
          SET date_of_birth = ${dateOfBirth || null}, 
              country = ${country || null}
          WHERE id = ${partnerId}
        `);
      }

      res.json({ message: 'Affiliate partner updated successfully' });
    } catch (error) {
      console.error('Error updating affiliate partner:', error);
      res.status(500).json({ message: 'Error updating affiliate partner' });
    }
  });

  // Delete affiliate partner
  app.delete('/api/admin/affiliate-partners/:id', isAdmin, async (req, res) => {
    try {
      const partnerId = parseInt(req.params.id);

      // First remove any vendor linkages
      await db.execute(sql`
        DELETE FROM vendor_affiliate_partners 
        WHERE affiliate_partner_id = ${partnerId}
      `);

      // Then delete the partner
      await db.delete(affiliatePartners).where(eq(affiliatePartners.id, partnerId));

      res.json({ message: 'Affiliate partner deleted successfully' });
    } catch (error) {
      console.error('Error deleting affiliate partner:', error);
      res.status(500).json({ message: 'Error deleting affiliate partner' });
    }
  });

  // Link affiliate partner to vendor
  app.post('/api/admin/vendors/:vendorId/affiliate-partner', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const { affiliatePartnerId, notes } = req.body;

      if (isNaN(vendorId) || !affiliatePartnerId) {
        return res.status(400).json({ message: 'Invalid vendor ID or affiliate partner ID' });
      }

      // Check if vendor exists
      const vendorResult = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
      if (vendorResult.length === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Check if affiliate partner exists
      const partnerResult = await db.select().from(affiliatePartners).where(eq(affiliatePartners.id, affiliatePartnerId)).limit(1);
      if (partnerResult.length === 0) {
        return res.status(404).json({ message: 'Affiliate partner not found' });
      }

      // Check if relationship already exists
      const existingRelationship = await db.select()
        .from(vendorAffiliatePartners)
        .where(and(
          eq(vendorAffiliatePartners.vendorId, vendorId),
          eq(vendorAffiliatePartners.affiliatePartnerId, affiliatePartnerId)
        ))
        .limit(1);

      if (existingRelationship.length > 0) {
        return res.status(400).json({ message: 'Affiliate partner already linked to this vendor' });
      }

      // Create the relationship
      await db.insert(vendorAffiliatePartners).values({
        vendorId,
        affiliatePartnerId,
        assignedBy: req.user?.id,
        notes: notes || null,
        status: 'active'
      });

      console.log(`[ADMIN] Linked affiliate partner ${affiliatePartnerId} to vendor ${vendorId} by admin ${req.user?.id}`);

      res.json({ 
        message: 'Affiliate partner linked to vendor successfully',
        vendorId,
        affiliatePartnerId
      });
    } catch (error) {
      console.error('Error linking affiliate partner to vendor:', error);
      res.status(500).json({ message: 'Error linking affiliate partner to vendor' });
    }
  });

  // Get affiliate partner for a specific vendor
  app.get('/api/admin/vendors/:vendorId/affiliate-partner', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);

      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      // Get the affiliate partner relationship for this vendor
      const partnerRelationship = await db.select({
        partnerId: affiliatePartners.id,
        partnerName: affiliatePartners.name,
        partnerEmail: affiliatePartners.email,
        partnerCompany: affiliatePartners.company,
        partnerCode: affiliatePartners.partnerCode,
        specialization: affiliatePartners.specialization,
        relationshipStatus: vendorAffiliatePartners.status,
        assignedAt: vendorAffiliatePartners.assignedAt,
        notes: vendorAffiliatePartners.notes
      })
      .from(vendorAffiliatePartners)
      .leftJoin(affiliatePartners, eq(vendorAffiliatePartners.affiliatePartnerId, affiliatePartners.id))
      .where(eq(vendorAffiliatePartners.vendorId, vendorId))
      .limit(1);

      if (partnerRelationship.length === 0) {
        return res.json({ affiliatePartner: null });
      }

      res.json({ affiliatePartner: partnerRelationship[0] });
    } catch (error) {
      console.error('Error fetching vendor affiliate partner:', error);
      res.status(500).json({ message: 'Error fetching vendor affiliate partner' });
    }
  });

  // Remove affiliate partner from vendor
  app.delete('/api/admin/vendors/:vendorId/affiliate-partner/:partnerId', isAdmin, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const partnerId = parseInt(req.params.partnerId);

      if (isNaN(vendorId) || isNaN(partnerId)) {
        return res.status(400).json({ message: 'Invalid vendor ID or partner ID' });
      }

      // Remove the relationship
      const result = await db.delete(vendorAffiliatePartners)
        .where(and(
          eq(vendorAffiliatePartners.vendorId, vendorId),
          eq(vendorAffiliatePartners.affiliatePartnerId, partnerId)
        ));

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Affiliate partner relationship not found' });
      }

      console.log(`[ADMIN] Removed affiliate partner ${partnerId} from vendor ${vendorId} by admin ${req.user?.id}`);

      res.json({ 
        message: 'Affiliate partner removed from vendor successfully',
        vendorId,
        partnerId
      });
    } catch (error) {
      console.error('Error removing affiliate partner from vendor:', error);
      res.status(500).json({ message: 'Error removing affiliate partner from vendor' });
    }
  });
}