import { eq, and, ilike, desc } from 'drizzle-orm';
import { BaseRepository } from '../core/base.repository';
import { db } from '../config/database.config';
import { vendors, users, vendorCommissionPeriods } from '../../../shared/schema';

export interface VendorData {
  userId: number;
  storeName: string;
  businessName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isActive?: boolean;
  marketplaceTypes?: string[];
  businessHours?: object;
  shippingOptions?: object;
  paymentMethods?: string[];
}

export interface VendorProfileData {
  storeName?: string;
  businessName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessHours?: object;
  shippingOptions?: object;
  paymentMethods?: string[];
}

export class VendorRepository extends BaseRepository {

  async createVendor(vendorData: VendorData): Promise<any> {
    try {
      const [vendor] = await db.insert(vendors).values({
        ...vendorData,
        isActive: vendorData.isActive ?? true,
        totalSales: 0,
        totalRevenue: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return vendor;
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor creation error:', error);
      throw new Error('Failed to create vendor');
    }
  }

  async getVendorById(id: number): Promise<any | null> {
    try {
      const result = await db.select({
        vendor: vendors,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          role: users.role
        }
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.id, id))
      .limit(1);

      if (!result.length) {
        return null;
      }

      const { vendor, user } = result[0];
      return {
        ...vendor,
        user
      };
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor retrieval error:', error);
      throw new Error('Failed to retrieve vendor');
    }
  }

  async getVendorByUserId(userId: number): Promise<any | null> {
    try {
      const result = await db.select({
        vendor: vendors,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          role: users.role
        }
      })
      .from(vendors)
      .leftJoin(users, eq(vendors.userId, users.id))
      .where(eq(vendors.userId, userId))
      .limit(1);

      if (!result.length) {
        return null;
      }

      const { vendor, user } = result[0];
      return {
        ...vendor,
        user
      };
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor by user retrieval error:', error);
      throw new Error('Failed to retrieve vendor by user');
    }
  }

  async updateVendor(id: number, updates: VendorProfileData): Promise<any | null> {
    try {
      const [vendor] = await db.update(vendors)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, id))
        .returning();

      return vendor;
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor update error:', error);
      throw new Error('Failed to update vendor');
    }
  }

  async deleteVendor(id: number): Promise<boolean> {
    try {
      const result = await db.delete(vendors)
        .where(eq(vendors.id, id))
        .returning({ id: vendors.id });

      return result.length > 0;
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor deletion error:', error);
      throw new Error('Failed to delete vendor');
    }
  }

  async searchVendors(
    query?: string,
    marketplaceType?: string,
    location?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ vendors: any[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];

      // Text search
      if (query) {
        conditions.push(
          ilike(vendors.storeName, `%${query}%`)
        );
      }

      // Location filter
      if (location) {
        conditions.push(
          ilike(vendors.address, `%${location}%`)
        );
      }

      // Only show active vendors
      conditions.push(eq(vendors.isActive, true));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [vendorsList, totalCount] = await Promise.all([
        db.select({
          vendor: vendors,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            avatar: users.avatar
          }
        })
        .from(vendors)
        .leftJoin(users, eq(vendors.userId, users.id))
        .where(whereClause)
        .orderBy(desc(vendors.createdAt))
        .limit(limit)
        .offset(offset),
        
        db.select({ count: vendors.id })
          .from(vendors)
          .where(whereClause)
      ]);

      const total = totalCount.length;
      const hasMore = offset + vendorsList.length < total;

      const formattedVendors = vendorsList.map(({ vendor, user }) => ({
        ...vendor,
        user
      }));

      return {
        vendors: formattedVendors,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor search error:', error);
      throw new Error('Failed to search vendors');
    }
  }

  async updateVendorStats(vendorId: number, stats: { totalSales?: number; totalRevenue?: number; rating?: number; reviewCount?: number }): Promise<boolean> {
    try {
      const [vendor] = await db.update(vendors)
        .set({
          ...stats,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, vendorId))
        .returning({ id: vendors.id });

      return !!vendor;
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor stats update error:', error);
      throw new Error('Failed to update vendor stats');
    }
  }

  async getVendorCommissions(vendorId: number, page: number = 1, limit: number = 20): Promise<{ commissions: any[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;

      const [commissionsList, totalCount] = await Promise.all([
        db.select()
          .from(vendorCommissionPeriods)
          .where(eq(vendorCommissionPeriods.vendorId, vendorId))
          .orderBy(desc(vendorCommissionPeriods.createdAt))
          .limit(limit)
          .offset(offset),
        
        db.select({ count: vendorCommissionPeriods.id })
          .from(vendorCommissionPeriods)
          .where(eq(vendorCommissionPeriods.vendorId, vendorId))
      ]);

      const total = totalCount.length;
      const hasMore = offset + commissionsList.length < total;

      return {
        commissions: commissionsList,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor commissions retrieval error:', error);
      throw new Error('Failed to retrieve vendor commissions');
    }
  }

  async getVendorDashboardStats(vendorId: number): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
  }> {
    try {
      // TODO: Implement proper aggregation queries when Drizzle supports them
      // For now, return basic structure
      return {
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageRating: 0
      };
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Dashboard stats error:', error);
      throw new Error('Failed to retrieve dashboard stats');
    }
  }

  async activateVendor(id: number): Promise<boolean> {
    try {
      const [vendor] = await db.update(vendors)
        .set({
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, id))
        .returning({ id: vendors.id });

      return !!vendor;
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor activation error:', error);
      throw new Error('Failed to activate vendor');
    }
  }

  async deactivateVendor(id: number): Promise<boolean> {
    try {
      const [vendor] = await db.update(vendors)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, id))
        .returning({ id: vendors.id });

      return !!vendor;
    } catch (error) {
      console.error('[VENDOR_REPOSITORY] Vendor deactivation error:', error);
      throw new Error('Failed to deactivate vendor');
    }
  }
}