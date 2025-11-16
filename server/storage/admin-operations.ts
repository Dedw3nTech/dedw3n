import { eq, desc, and, count, sql, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { 
  adminNotes,
  creditCollections,
  fraudCases,
  shippingReturns,
  financePayouts,
  users,
  orders,
  type AdminNote,
  type InsertAdminNote,
  type CreditCollection,
  type InsertCreditCollection,
  type FraudCase,
  type InsertFraudCase,
  type ShippingReturn,
  type InsertShippingReturn,
  type FinancePayout,
  type InsertFinancePayout
} from '../../shared/schema';

export class AdminOperationsStorage {
  // Admin Notes
  async createAdminNote(data: InsertAdminNote): Promise<AdminNote> {
    const [note] = await db.insert(adminNotes).values(data).returning();
    return note;
  }

  async getAdminNotesByRelated(relatedType: string, relatedId: number): Promise<AdminNote[]> {
    return await db.select()
      .from(adminNotes)
      .where(and(
        eq(adminNotes.relatedType, relatedType),
        eq(adminNotes.relatedId, relatedId)
      ))
      .orderBy(desc(adminNotes.createdAt));
  }

  async getAllAdminNotes(limit: number = 100): Promise<AdminNote[]> {
    return await db.select()
      .from(adminNotes)
      .orderBy(desc(adminNotes.createdAt))
      .limit(limit);
  }

  // Credit & Collection
  async createCreditCollection(data: InsertCreditCollection): Promise<CreditCollection> {
    const [collection] = await db.insert(creditCollections).values(data).returning();
    return collection;
  }

  async getAllCreditCollections(): Promise<any[]> {
    const collections = await db.select({
      id: creditCollections.id,
      userId: creditCollections.userId,
      orderId: creditCollections.orderId,
      amountDue: creditCollections.amountDue,
      currency: creditCollections.currency,
      dueDate: creditCollections.dueDate,
      status: creditCollections.status,
      paymentPlanActive: creditCollections.paymentPlanActive,
      lastContactDate: creditCollections.lastContactDate,
      nextFollowUpDate: creditCollections.nextFollowUpDate,
      assignedTo: creditCollections.assignedTo,
      createdAt: creditCollections.createdAt,
      userName: users.name,
      userEmail: users.email
    })
      .from(creditCollections)
      .leftJoin(users, eq(creditCollections.userId, users.id))
      .orderBy(desc(creditCollections.createdAt));

    return collections;
  }

  async getCreditCollectionById(id: number): Promise<CreditCollection | undefined> {
    const [collection] = await db.select()
      .from(creditCollections)
      .where(eq(creditCollections.id, id));
    return collection;
  }

  async updateCreditCollection(id: number, data: Partial<InsertCreditCollection>): Promise<void> {
    await db.update(creditCollections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(creditCollections.id, id));
  }

  async getCreditCollectionStats() {
    const [totalOverdueResult, totalPendingResult, totalAmountResult] = await Promise.all([
      db.select({ count: count() }).from(creditCollections).where(eq(creditCollections.status, 'overdue')),
      db.select({ count: count() }).from(creditCollections).where(eq(creditCollections.status, 'pending')),
      db.select({ total: sql<string>`COALESCE(SUM(CAST(${creditCollections.amountDue} AS DECIMAL)), 0)` })
        .from(creditCollections)
        .where(sql`${creditCollections.status} IN ('pending', 'overdue')`)
    ]);

    return {
      totalOverdue: totalOverdueResult[0]?.count || 0,
      totalPending: totalPendingResult[0]?.count || 0,
      totalAmount: Number(totalAmountResult[0]?.total || 0)
    };
  }

  // Fraud Cases
  async createFraudCase(data: InsertFraudCase): Promise<FraudCase> {
    const caseNumber = `FRAUD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [fraudCase] = await db.insert(fraudCases)
      .values({ ...data, caseNumber })
      .returning();
    return fraudCase;
  }

  async getAllFraudCases(): Promise<any[]> {
    const cases = await db.select({
      id: fraudCases.id,
      caseNumber: fraudCases.caseNumber,
      userId: fraudCases.userId,
      orderId: fraudCases.orderId,
      type: fraudCases.type,
      riskLevel: fraudCases.riskLevel,
      status: fraudCases.status,
      description: fraudCases.description,
      assignedTo: fraudCases.assignedTo,
      flaggedBy: fraudCases.flaggedBy,
      createdAt: fraudCases.createdAt,
      userName: users.name,
      userEmail: users.email
    })
      .from(fraudCases)
      .leftJoin(users, eq(fraudCases.userId, users.id))
      .orderBy(desc(fraudCases.createdAt));

    return cases;
  }

  async getFraudCaseById(id: number): Promise<FraudCase | undefined> {
    const [fraudCase] = await db.select()
      .from(fraudCases)
      .where(eq(fraudCases.id, id));
    return fraudCase;
  }

  async updateFraudCase(id: number, data: Partial<InsertFraudCase>): Promise<void> {
    await db.update(fraudCases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(fraudCases.id, id));
  }

  async getFraudCaseStats() {
    const [openCasesResult, criticalCasesResult, resolvedCasesResult] = await Promise.all([
      db.select({ count: count() }).from(fraudCases).where(eq(fraudCases.status, 'open')),
      db.select({ count: count() }).from(fraudCases).where(eq(fraudCases.riskLevel, 'critical')),
      db.select({ count: count() }).from(fraudCases).where(eq(fraudCases.status, 'resolved'))
    ]);

    return {
      openCases: openCasesResult[0]?.count || 0,
      criticalCases: criticalCasesResult[0]?.count || 0,
      resolvedCases: resolvedCasesResult[0]?.count || 0
    };
  }

  // Shipping & Returns
  async createShippingReturn(data: InsertShippingReturn): Promise<ShippingReturn> {
    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [shippingReturn] = await db.insert(shippingReturns)
      .values({ ...data, returnNumber })
      .returning();
    return shippingReturn;
  }

  async getAllShippingReturns(): Promise<any[]> {
    const returns = await db.select({
      id: shippingReturns.id,
      returnNumber: shippingReturns.returnNumber,
      orderId: shippingReturns.orderId,
      userId: shippingReturns.userId,
      reason: shippingReturns.reason,
      status: shippingReturns.status,
      refundAmount: shippingReturns.refundAmount,
      currency: shippingReturns.currency,
      trackingNumber: shippingReturns.trackingNumber,
      carrier: shippingReturns.carrier,
      createdAt: shippingReturns.createdAt,
      userName: users.name,
      userEmail: users.email
    })
      .from(shippingReturns)
      .leftJoin(users, eq(shippingReturns.userId, users.id))
      .orderBy(desc(shippingReturns.createdAt));

    return returns;
  }

  async getShippingReturnById(id: number): Promise<ShippingReturn | undefined> {
    const [shippingReturn] = await db.select()
      .from(shippingReturns)
      .where(eq(shippingReturns.id, id));
    return shippingReturn;
  }

  async updateShippingReturn(id: number, data: Partial<InsertShippingReturn>): Promise<void> {
    await db.update(shippingReturns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shippingReturns.id, id));
  }

  async getShippingReturnStats() {
    const [requestedResult, approvedResult, completedResult] = await Promise.all([
      db.select({ count: count() }).from(shippingReturns).where(eq(shippingReturns.status, 'requested')),
      db.select({ count: count() }).from(shippingReturns).where(eq(shippingReturns.status, 'approved')),
      db.select({ count: count() }).from(shippingReturns).where(eq(shippingReturns.status, 'completed'))
    ]);

    return {
      requested: requestedResult[0]?.count || 0,
      approved: approvedResult[0]?.count || 0,
      completed: completedResult[0]?.count || 0
    };
  }

  // Finance Payouts
  async createFinancePayout(data: InsertFinancePayout): Promise<FinancePayout> {
    const payoutNumber = `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [payout] = await db.insert(financePayouts)
      .values({ ...data, payoutNumber })
      .returning();
    return payout;
  }

  async getAllFinancePayouts(): Promise<any[]> {
    const payouts = await db.select({
      id: financePayouts.id,
      payoutNumber: financePayouts.payoutNumber,
      vendorId: financePayouts.vendorId,
      amount: financePayouts.amount,
      currency: financePayouts.currency,
      period: financePayouts.period,
      status: financePayouts.status,
      paymentMethod: financePayouts.paymentMethod,
      netAmount: financePayouts.netAmount,
      processedAt: financePayouts.processedAt,
      createdAt: financePayouts.createdAt,
      vendorName: users.name,
      vendorEmail: users.email
    })
      .from(financePayouts)
      .leftJoin(users, eq(financePayouts.vendorId, users.id))
      .orderBy(desc(financePayouts.createdAt));

    return payouts;
  }

  async getFinancePayoutById(id: number): Promise<FinancePayout | undefined> {
    const [payout] = await db.select()
      .from(financePayouts)
      .where(eq(financePayouts.id, id));
    return payout;
  }

  async updateFinancePayout(id: number, data: Partial<InsertFinancePayout>): Promise<void> {
    await db.update(financePayouts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financePayouts.id, id));
  }

  async getFinancePayoutStats() {
    const [pendingResult, completedResult, totalAmountResult] = await Promise.all([
      db.select({ count: count() }).from(financePayouts).where(eq(financePayouts.status, 'pending')),
      db.select({ count: count() }).from(financePayouts).where(eq(financePayouts.status, 'completed')),
      db.select({ total: sql<string>`COALESCE(SUM(CAST(${financePayouts.amount} AS DECIMAL)), 0)` })
        .from(financePayouts)
        .where(eq(financePayouts.status, 'completed'))
    ]);

    return {
      pending: pendingResult[0]?.count || 0,
      completed: completedResult[0]?.count || 0,
      totalAmount: Number(totalAmountResult[0]?.total || 0)
    };
  }

  // General Operations Stats
  async getOperationsOverview() {
    const [creditStats, fraudStats, returnStats, payoutStats] = await Promise.all([
      this.getCreditCollectionStats(),
      this.getFraudCaseStats(),
      this.getShippingReturnStats(),
      this.getFinancePayoutStats()
    ]);

    return {
      credit: creditStats,
      fraud: fraudStats,
      returns: returnStats,
      payouts: payoutStats
    };
  }
}

export const adminOperationsStorage = new AdminOperationsStorage();
