import { db } from "./db";
import { vendors, orders, orderItems } from "@shared/schema";
import { eq, sum, count, and } from "drizzle-orm";

export type BadgeLevel = "new_vendor" | "level_2_vendor" | "top_vendor" | "infinity_vendor";

export interface BadgeCriteria {
  level: BadgeLevel;
  name: string;
  minSales: number; // in GBP
  minTransactions: number;
}

export const BADGE_CRITERIA: BadgeCriteria[] = [
  {
    level: "new_vendor",
    name: "New Vendor",
    minSales: 0,
    minTransactions: 0
  },
  {
    level: "level_2_vendor", 
    name: "Verified Vendor",
    minSales: 100,
    minTransactions: 25
  },
  {
    level: "top_vendor",
    name: "Top Vendor",
    minSales: 1000,
    minTransactions: 250
  },
  {
    level: "infinity_vendor",
    name: "Infinity Vendor",
    minSales: 10000,
    minTransactions: 2500
  }
];

export function calculateBadgeLevel(totalSales: number, totalTransactions: number): BadgeLevel {
  // Check from highest to lowest level
  for (let i = BADGE_CRITERIA.length - 1; i >= 0; i--) {
    const criteria = BADGE_CRITERIA[i];
    if (totalSales >= criteria.minSales && totalTransactions >= criteria.minTransactions) {
      return criteria.level;
    }
  }
  return "new_vendor";
}

export async function updateVendorBadge(vendorId: number): Promise<BadgeLevel> {
  try {
    // Calculate total sales and transactions for this vendor through orderItems
    const salesData = await db
      .select({
        totalSales: sum(orderItems.totalPrice),
        totalTransactions: count(orderItems.id)
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.vendorId, vendorId),
          eq(orders.status, "completed")
        )
      );

    const totalSales = Number(salesData[0]?.totalSales || 0);
    const totalTransactions = Number(salesData[0]?.totalTransactions || 0);
    
    // Calculate new badge level
    const newBadgeLevel = calculateBadgeLevel(totalSales, totalTransactions);
    
    // Update vendor record
    await db
      .update(vendors)
      .set({
        totalSalesAmount: totalSales,
        totalTransactions: totalTransactions,
        badgeLevel: newBadgeLevel,
        lastBadgeUpdate: new Date()
      })
      .where(eq(vendors.id, vendorId));
    
    return newBadgeLevel;
  } catch (error) {
    console.error("Error updating vendor badge:", error);
    throw error;
  }
}

export async function updateAllVendorBadges(): Promise<void> {
  try {
    // Get all active vendors
    const allVendors = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(eq(vendors.isActive, true));

    // Update badges for all vendors
    for (const vendor of allVendors) {
      try {
        await updateVendorBadge(vendor.id);
      } catch (error) {
        console.error(`Failed to update badge for vendor ${vendor.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error updating all vendor badges:", error);
    throw error;
  }
}

export async function getVendorBadgeStats(vendorId: number) {
  try {
    const vendor = await db
      .select({
        badgeLevel: vendors.badgeLevel,
        totalSalesAmount: vendors.totalSalesAmount,
        totalTransactions: vendors.totalTransactions,
        lastBadgeUpdate: vendors.lastBadgeUpdate
      })
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    if (!vendor[0]) {
      throw new Error("Vendor not found");
    }

    const currentLevel = vendor[0].badgeLevel || "new_vendor";
    const totalSales = Number(vendor[0].totalSalesAmount || 0);
    const totalTransactions = Number(vendor[0].totalTransactions || 0);

    // Find next badge level
    const currentIndex = BADGE_CRITERIA.findIndex(badge => badge.level === currentLevel);
    const nextBadge = currentIndex < BADGE_CRITERIA.length - 1 ? BADGE_CRITERIA[currentIndex + 1] : null;

    return {
      currentLevel,
      totalSales,
      totalTransactions,
      lastBadgeUpdate: vendor[0].lastBadgeUpdate,
      nextBadge,
      progress: nextBadge ? {
        salesProgress: Math.min((totalSales / nextBadge.minSales) * 100, 100),
        transactionProgress: Math.min((totalTransactions / nextBadge.minTransactions) * 100, 100),
        salesNeeded: Math.max(nextBadge.minSales - totalSales, 0),
        transactionsNeeded: Math.max(nextBadge.minTransactions - totalTransactions, 0)
      } : null
    };
  } catch (error) {
    console.error("Error getting vendor badge stats:", error);
    throw error;
  }
}