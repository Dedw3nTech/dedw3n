import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { affiliatePartners } from "../../shared/schema";

export interface AffiliatePartnerInfo {
  id: number;
  name: string;
  email: string;
  company?: string;
  partnerCode: string;
  status: string;
  isVerified: boolean;
  commissionRate: string;
}

export class AffiliateVerificationService {
  
  /**
   * Verify if an affiliate partner code exists and is active
   * @param partnerCode - The affiliate partner code to verify
   * @returns Promise<AffiliatePartnerInfo | null>
   */
  async verifyPartnerCode(partnerCode: string): Promise<AffiliatePartnerInfo | null> {
    try {
      if (!partnerCode || partnerCode.trim().length === 0) {
        return null;
      }

      const [partner] = await db
        .select({
          id: affiliatePartners.id,
          name: affiliatePartners.name,
          email: affiliatePartners.email,
          company: affiliatePartners.company,
          partnerCode: affiliatePartners.partnerCode,
          status: affiliatePartners.status,
          isVerified: affiliatePartners.isVerified,
          commissionRate: affiliatePartners.commissionRate,
        })
        .from(affiliatePartners)
        .where(eq(affiliatePartners.partnerCode, partnerCode.trim()))
        .limit(1);

      // Only return active and verified partners
      if (partner && partner.status === 'active' && partner.isVerified) {
        return {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          company: partner.company || undefined,
          partnerCode: partner.partnerCode,
          status: partner.status,
          isVerified: partner.isVerified,
          commissionRate: partner.commissionRate,
        };
      }

      return null;
    } catch (error) {
      console.error('Error verifying affiliate partner code:', error);
      return null;
    }
  }

  /**
   * Increment the referral count for an affiliate partner
   * @param partnerCode - The affiliate partner code
   * @returns Promise<boolean> - Success status
   */
  async incrementReferralCount(partnerCode: string): Promise<boolean> {
    try {
      if (!partnerCode || partnerCode.trim().length === 0) {
        return false;
      }

      const result = await db
        .update(affiliatePartners)
        .set({
          totalReferrals: sql`${affiliatePartners.totalReferrals} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(affiliatePartners.partnerCode, partnerCode.trim()));

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error incrementing affiliate referral count:', error);
      return false;
    }
  }

  /**
   * Get affiliate partner statistics
   * @param partnerCode - The affiliate partner code
   * @returns Promise<object | null> - Partner statistics
   */
  async getPartnerStats(partnerCode: string): Promise<any> {
    try {
      if (!partnerCode || partnerCode.trim().length === 0) {
        return null;
      }

      const [partner] = await db
        .select({
          id: affiliatePartners.id,
          name: affiliatePartners.name,
          totalReferrals: affiliatePartners.totalReferrals,
          totalCommissionEarned: affiliatePartners.totalCommissionEarned,
          commissionRate: affiliatePartners.commissionRate,
          status: affiliatePartners.status,
          isVerified: affiliatePartners.isVerified,
        })
        .from(affiliatePartners)
        .where(eq(affiliatePartners.partnerCode, partnerCode.trim()))
        .limit(1);

      return partner || null;
    } catch (error) {
      console.error('Error getting affiliate partner stats:', error);
      return null;
    }
  }
}

export const affiliateVerificationService = new AffiliateVerificationService();