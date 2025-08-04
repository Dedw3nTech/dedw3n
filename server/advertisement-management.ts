import { Request, Response } from 'express';
import { db } from './db';
import { advertisements, advertisementClicks, advertisementImpressions, users } from '../shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

// Advertisement validation schemas
const createAdvertisementSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  linkUrl: z.string().url(),
  placement: z.enum(['marketplace', 'community', 'dating', 'all']),
  type: z.enum(['banner', 'sidebar', 'popup', 'native', 'video']),
  advertiserName: z.string().min(1).max(255),
  advertiserEmail: z.string().email(),
  advertiserPhone: z.string().max(50).optional(),
  advertiserCompany: z.string().max(255).optional(),
  advertiserAddress: z.string().optional(),
  budget: z.string().regex(/^\d+(\.\d{1,2})?$/),
  costPerClick: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  costPerImpression: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targetAudience: z.any().optional(),
  keywords: z.any().optional(),
});

const updateAdvertisementSchema = createAdvertisementSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'expired', 'pending', 'rejected']),
});

// Get all advertisements with filtering and pagination
export const getAdvertisements = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status, 
      placement, 
      search 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = db.select({
      id: advertisements.id,
      title: advertisements.title,
      description: advertisements.description,
      imageUrl: advertisements.imageUrl,
      videoUrl: advertisements.videoUrl,
      linkUrl: advertisements.linkUrl,
      placement: advertisements.placement,
      type: advertisements.type,
      status: advertisements.status,
      advertiserName: advertisements.advertiserName,
      advertiserEmail: advertisements.advertiserEmail,
      advertiserPhone: advertisements.advertiserPhone,
      advertiserCompany: advertisements.advertiserCompany,
      advertiserAddress: advertisements.advertiserAddress,
      budget: advertisements.budget,
      spentAmount: advertisements.spentAmount,
      costPerClick: advertisements.costPerClick,
      costPerImpression: advertisements.costPerImpression,
      startDate: advertisements.startDate,
      endDate: advertisements.endDate,
      targetAudience: advertisements.targetAudience,
      keywords: advertisements.keywords,
      impressions: advertisements.impressions,
      clicks: advertisements.clicks,
      conversions: advertisements.conversions,
      createdAt: advertisements.createdAt,
      updatedAt: advertisements.updatedAt,
      createdBy: users.username,
    }).from(advertisements)
      .leftJoin(users, eq(advertisements.createdBy, users.id));

    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(advertisements.status, status as any));
    }
    if (placement) {
      conditions.push(eq(advertisements.placement, placement as any));
    }
    if (search) {
      conditions.push(
        sql`${advertisements.title} ILIKE ${`%${search}%`} OR ${advertisements.advertiserName} ILIKE ${`%${search}%`}`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .orderBy(desc(advertisements.createdAt))
      .limit(limitNum)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db.select({ count: sql`count(*)` })
      .from(advertisements)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const totalCount = Number(totalCountResult[0].count);

    res.json({
      advertisements: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ error: 'Failed to fetch advertisements' });
  }
};

// Get single advertisement by ID
export const getAdvertisementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const advertisement = await db.select({
      id: advertisements.id,
      title: advertisements.title,
      description: advertisements.description,
      imageUrl: advertisements.imageUrl,
      videoUrl: advertisements.videoUrl,
      linkUrl: advertisements.linkUrl,
      placement: advertisements.placement,
      type: advertisements.type,
      status: advertisements.status,
      advertiserName: advertisements.advertiserName,
      advertiserEmail: advertisements.advertiserEmail,
      advertiserPhone: advertisements.advertiserPhone,
      advertiserCompany: advertisements.advertiserCompany,
      advertiserAddress: advertisements.advertiserAddress,
      budget: advertisements.budget,
      spentAmount: advertisements.spentAmount,
      costPerClick: advertisements.costPerClick,
      costPerImpression: advertisements.costPerImpression,
      startDate: advertisements.startDate,
      endDate: advertisements.endDate,
      targetAudience: advertisements.targetAudience,
      keywords: advertisements.keywords,
      impressions: advertisements.impressions,
      clicks: advertisements.clicks,
      conversions: advertisements.conversions,
      createdAt: advertisements.createdAt,
      updatedAt: advertisements.updatedAt,
      createdBy: users.username,
    }).from(advertisements)
      .leftJoin(users, eq(advertisements.createdBy, users.id))
      .where(eq(advertisements.id, parseInt(id)))
      .limit(1);

    if (advertisement.length === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json(advertisement[0]);
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    res.status(500).json({ error: 'Failed to fetch advertisement' });
  }
};

// Create new advertisement
export const createAdvertisement = async (req: Request, res: Response) => {
  try {
    const validatedData = createAdvertisementSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const newAdvertisement = await db.insert(advertisements).values({
      ...validatedData,
      createdBy: userId,
    }).returning();

    res.status(201).json(newAdvertisement[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error creating advertisement:', error);
    res.status(500).json({ error: 'Failed to create advertisement' });
  }
};

// Update advertisement
export const updateAdvertisement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateAdvertisementSchema.parse(req.body);

    const updated = await db.update(advertisements)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(advertisements.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating advertisement:', error);
    res.status(500).json({ error: 'Failed to update advertisement' });
  }
};

// Update advertisement status
export const updateAdvertisementStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    const updated = await db.update(advertisements)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(advertisements.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating advertisement status:', error);
    res.status(500).json({ error: 'Failed to update advertisement status' });
  }
};

// Delete advertisement
export const deleteAdvertisement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await db.delete(advertisements)
      .where(eq(advertisements.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({ error: 'Failed to delete advertisement' });
  }
};

// Get advertisement analytics
export const getAdvertisementAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Build date filter conditions
    const dateConditions = [];
    if (startDate) {
      dateConditions.push(gte(advertisementClicks.clickedAt, new Date(startDate as string)));
    }
    if (endDate) {
      dateConditions.push(lte(advertisementClicks.clickedAt, new Date(endDate as string)));
    }

    // Get click analytics
    const clickAnalytics = await db.select({
      date: sql`DATE(${advertisementClicks.clickedAt})`,
      clicks: sql`COUNT(*)`,
    }).from(advertisementClicks)
      .where(and(
        eq(advertisementClicks.advertisementId, parseInt(id)),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ))
      .groupBy(sql`DATE(${advertisementClicks.clickedAt})`)
      .orderBy(sql`DATE(${advertisementClicks.clickedAt})`);

    // Get impression analytics
    const impressionAnalytics = await db.select({
      date: sql`DATE(${advertisementImpressions.viewedAt})`,
      impressions: sql`COUNT(*)`,
    }).from(advertisementImpressions)
      .where(and(
        eq(advertisementImpressions.advertisementId, parseInt(id)),
        ...(dateConditions.length > 0 ? [
          gte(advertisementImpressions.viewedAt, new Date(startDate as string)),
          lte(advertisementImpressions.viewedAt, new Date(endDate as string))
        ] : [])
      ))
      .groupBy(sql`DATE(${advertisementImpressions.viewedAt})`)
      .orderBy(sql`DATE(${advertisementImpressions.viewedAt})`);

    // Get total stats
    const totalStats = await db.select({
      totalClicks: sql`COUNT(*)`,
    }).from(advertisementClicks)
      .where(eq(advertisementClicks.advertisementId, parseInt(id)));

    const totalImpressions = await db.select({
      totalImpressions: sql`COUNT(*)`,
    }).from(advertisementImpressions)
      .where(eq(advertisementImpressions.advertisementId, parseInt(id)));

    res.json({
      clickAnalytics,
      impressionAnalytics,
      totalStats: {
        clicks: Number(totalStats[0]?.totalClicks || 0),
        impressions: Number(totalImpressions[0]?.totalImpressions || 0),
        ctr: totalImpressions[0]?.totalImpressions 
          ? (Number(totalStats[0]?.totalClicks || 0) / Number(totalImpressions[0]?.totalImpressions) * 100).toFixed(2)
          : '0.00'
      }
    });
  } catch (error) {
    console.error('Error fetching advertisement analytics:', error);
    res.status(500).json({ error: 'Failed to fetch advertisement analytics' });
  }
};

// Get advertisement summary stats
export const getAdvertisementStats = async (req: Request, res: Response) => {
  try {
    const totalAds = await db.select({ count: sql`count(*)` })
      .from(advertisements);

    const activeAds = await db.select({ count: sql`count(*)` })
      .from(advertisements)
      .where(eq(advertisements.status, 'active'));

    const pendingAds = await db.select({ count: sql`count(*)` })
      .from(advertisements)
      .where(eq(advertisements.status, 'pending'));

    const totalBudget = await db.select({ 
      total: sql`COALESCE(SUM(CAST(${advertisements.budget} AS DECIMAL)), 0)` 
    }).from(advertisements);

    const totalSpent = await db.select({ 
      total: sql`COALESCE(SUM(CAST(${advertisements.spentAmount} AS DECIMAL)), 0)` 
    }).from(advertisements);

    res.json({
      total: Number(totalAds[0].count),
      active: Number(activeAds[0].count),
      pending: Number(pendingAds[0].count),
      totalBudget: Number(totalBudget[0].total),
      totalSpent: Number(totalSpent[0].total),
    });
  } catch (error) {
    console.error('Error fetching advertisement stats:', error);
    res.status(500).json({ error: 'Failed to fetch advertisement stats' });
  }
};