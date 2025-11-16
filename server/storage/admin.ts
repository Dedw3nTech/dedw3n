import { eq, desc, and, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { 
  users, 
  products, 
  orders, 
  moderationReports,
  vendors
} from '../../shared/schema';

export interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingReports: number;
  pendingVendorRequests: number;
  activeUsers24h: number;
  totalRevenue: number;
}

export class AdminStorage {
  async getAdminStats(): Promise<AdminStats> {
    try {
      const [
        totalUsersResult,
        totalVendorsResult,
        totalProductsResult,
        totalOrdersResult,
        pendingReportsResult,
        pendingVendorRequestsResult,
        activeUsers24hResult,
        totalRevenueResult
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users).where(eq(users.isVendor, true)),
        db.select({ count: count() }).from(products),
        db.select({ count: count() }).from(orders),
        db.select({ count: count() }).from(moderationReports).where(eq(moderationReports.status, 'pending')),
        Promise.resolve([{ count: 0 }]),
        db.select({ count: count() }).from(users).where(
          sql`${users.lastLogin} >= NOW() - INTERVAL '24 hours'`
        ),
        db.select({ total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)` }).from(orders)
      ]);

      return {
        totalUsers: totalUsersResult[0]?.count || 0,
        totalVendors: totalVendorsResult[0]?.count || 0,
        totalProducts: totalProductsResult[0]?.count || 0,
        totalOrders: totalOrdersResult[0]?.count || 0,
        pendingReports: pendingReportsResult[0]?.count || 0,
        pendingVendorRequests: pendingVendorRequestsResult[0]?.count || 0,
        activeUsers24h: activeUsers24hResult[0]?.count || 0,
        totalRevenue: Number(totalRevenueResult[0]?.total || 0)
      };
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error getting admin stats:', error);
      return {
        totalUsers: 0,
        totalVendors: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingReports: 0,
        pendingVendorRequests: 0,
        activeUsers24h: 0,
        totalRevenue: 0
      };
    }
  }

  async getAllUsersForAdmin() {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        isVendor: users.isVendor,
        isLocked: users.isLocked,
        failedLoginAttempts: users.failedLoginAttempts,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        avatar: users.avatar,
        region: users.region,
        country: users.country
      })
        .from(users)
        .orderBy(desc(users.createdAt));

      return allUsers;
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error getting all users:', error);
      return [];
    }
  }

  async updateUserByAdmin(userId: number, updates: any) {
    try {
      await db.update(users)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return { success: true };
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUserByAdmin(userId: number) {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return { success: true };
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getAllReports() {
    try {
      const allReports = await db.select({
        id: moderationReports.id,
        reporterUserId: moderationReports.reporterId,
        reportedUserId: moderationReports.subjectId,
        contentType: moderationReports.subjectType,
        contentId: moderationReports.subjectId,
        reason: moderationReports.reason,
        description: moderationReports.description,
        status: moderationReports.status,
        createdAt: moderationReports.createdAt
      })
        .from(moderationReports)
        .orderBy(desc(moderationReports.createdAt));

      const reportsWithUsers = await Promise.all(
        allReports.map(async (report) => {
          let reporterUser = null;
          let reportedUser = null;

          if (report.reporterUserId) {
            const reporter = await db.select({
              id: users.id,
              username: users.username,
              name: users.name,
              email: users.email,
              role: users.role
            })
              .from(users)
              .where(eq(users.id, report.reporterUserId))
              .limit(1);
            reporterUser = reporter[0] || null;
          }

          if (report.reportedUserId && report.contentType === 'user') {
            const reported = await db.select({
              id: users.id,
              username: users.username,
              name: users.name,
              email: users.email,
              role: users.role
            })
              .from(users)
              .where(eq(users.id, report.reportedUserId))
              .limit(1);
            reportedUser = reported[0] || null;
          }

          return {
            ...report,
            reporterUser,
            reportedUser
          };
        })
      );

      return reportsWithUsers;
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error getting all reports:', error);
      return [];
    }
  }

  async updateReportStatus(reportId: number, status: string) {
    try {
      await db.update(moderationReports)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(moderationReports.id, reportId));
      
      return { success: true };
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error updating report:', error);
      throw new Error('Failed to update report');
    }
  }

  async getAllVendorRequests() {
    try {
      return [];
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error getting vendor requests:', error);
      return [];
    }
  }

  async updateVendorRequestStatus(requestId: number, status: string) {
    try {
      console.log('[ADMIN-STORAGE] Vendor request updates not yet implemented');
      return { success: true };
    } catch (error) {
      console.error('[ADMIN-STORAGE] Error updating vendor request:', error);
      throw new Error('Failed to update vendor request');
    }
  }
}

export const adminStorage = new AdminStorage();
