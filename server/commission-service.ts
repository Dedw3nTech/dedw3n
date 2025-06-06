import { db } from './db';
import { 
  vendors, 
  vendorCommissionPeriods, 
  vendorCommissionPayments,
  vendorPaymentMethods,
  vendorAccountActions,
  orders,
  orderItems,
  products
} from '../shared/schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class CommissionService {
  // Calculate commission tier based on monthly sales volume
  calculateCommissionTier(totalSales: number): { tier: 'standard' | 'premium' | 'enterprise', rate: number } {
    // Commission tiers based on monthly sales volume
    if (totalSales >= 50000) { // £50,000+ per month
      return { tier: 'enterprise', rate: 0.125 }; // 12.5%
    } else if (totalSales >= 10000) { // £10,000+ per month
      return { tier: 'premium', rate: 0.10 }; // 10%
    } else {
      return { tier: 'standard', rate: 0.10 }; // 10%
    }
  }

  // Calculate commission for a specific vendor and month
  async calculateMonthlyCommission(vendorId: number, month: number, year: number) {
    console.log(`[Commission] Calculating commission for vendor ${vendorId}, ${month}/${year}`);
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // Get all completed orders for this vendor in the specified month
    const vendorOrders = await db
      .select({
        orderId: orders.id,
        orderDate: orders.createdAt,
        productPrice: products.price,
        quantity: orderItems.quantity,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(products.vendorId, vendorId),
          eq(orders.status, 'completed'),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    let totalSales = 0;
    let totalTransactions = 0;
    const uniqueOrders = new Set();

    // Calculate totals
    vendorOrders.forEach(order => {
      const orderValue = Number(order.productPrice) * Number(order.quantity);
      totalSales += orderValue;
      
      if (!uniqueOrders.has(order.orderId)) {
        uniqueOrders.add(order.orderId);
        totalTransactions++;
      }
    });

    // Determine commission tier and rate based on sales volume
    const { tier, rate } = this.calculateCommissionTier(totalSales);
    const commissionAmount = totalSales * rate;

    console.log(`[Commission] Vendor ${vendorId}: Sales=£${totalSales}, Transactions=${totalTransactions}, Tier=${tier}, Rate=${rate * 100}%, Commission=£${commissionAmount}`);

    return {
      totalSales,
      totalTransactions,
      commissionTier: tier,
      commissionRate: rate,
      commissionAmount,
      dueDate: new Date(year, month, 7) // Due on the 7th of the following month
    };
  }

  // Create or update commission period for vendor
  async createCommissionPeriod(vendorId: number, month: number, year: number) {
    const commissionData = await this.calculateMonthlyCommission(vendorId, month, year);
    
    // Check if commission period already exists
    const existingPeriod = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(
        and(
          eq(vendorCommissionPeriods.vendorId, vendorId),
          eq(vendorCommissionPeriods.month, month),
          eq(vendorCommissionPeriods.year, year)
        )
      )
      .limit(1);

    if (existingPeriod.length > 0) {
      // Update existing period
      await db
        .update(vendorCommissionPeriods)
        .set({
          totalSales: commissionData.totalSales.toString(),
          totalTransactions: commissionData.totalTransactions,
          commissionTier: commissionData.commissionTier,
          commissionRate: commissionData.commissionRate.toString(),
          commissionAmount: commissionData.commissionAmount.toString(),
          dueDate: commissionData.dueDate,
          updatedAt: new Date()
        })
        .where(eq(vendorCommissionPeriods.id, existingPeriod[0].id));
      
      return existingPeriod[0].id;
    } else {
      // Create new period
      const [newPeriod] = await db
        .insert(vendorCommissionPeriods)
        .values({
          vendorId,
          month,
          year,
          totalSales: commissionData.totalSales.toString(),
          totalTransactions: commissionData.totalTransactions,
          commissionTier: commissionData.commissionTier,
          commissionRate: commissionData.commissionRate.toString(),
          commissionAmount: commissionData.commissionAmount.toString(),
          dueDate: commissionData.dueDate
        })
        .returning();
      
      return newPeriod.id;
    }
  }

  // Process monthly commissions for all vendors
  async processMonthlyCommissions(month: number, year: number) {
    console.log(`[Commission] Processing monthly commissions for ${month}/${year}`);
    
    // Get all active vendors
    const activeVendors = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.isActive, true),
          eq(vendors.isApproved, true)
        )
      );

    const results = [];
    
    for (const vendor of activeVendors) {
      try {
        const periodId = await this.createCommissionPeriod(vendor.id, month, year);
        results.push({ vendorId: vendor.id, periodId, success: true });
        
        // Send notification to vendor about commission calculation
        await this.sendCommissionNotification(vendor.id, periodId, 'commission_calculated');
      } catch (error) {
        console.error(`[Commission] Error processing vendor ${vendor.id}:`, error);
        results.push({ vendorId: vendor.id, error: error.message, success: false });
      }
    }

    return results;
  }

  // Send payment reminder notifications
  async sendPaymentReminders() {
    console.log('[Commission] Sending payment reminders');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayOverdue = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const sevenDaysOverdue = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // First reminder - 3 days before due date
    const firstReminders = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(
        and(
          eq(vendorCommissionPeriods.status, 'pending'),
          lte(vendorCommissionPeriods.dueDate, threeDaysFromNow),
          sql`${vendorCommissionPeriods.firstNotificationSent} IS NULL`
        )
      );

    for (const period of firstReminders) {
      await this.sendCommissionNotification(period.vendorId, period.id, 'first_reminder');
      await db
        .update(vendorCommissionPeriods)
        .set({ firstNotificationSent: now })
        .where(eq(vendorCommissionPeriods.id, period.id));
    }

    // Second reminder - 1 day overdue
    const secondReminders = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(
        and(
          eq(vendorCommissionPeriods.status, 'pending'),
          lte(vendorCommissionPeriods.dueDate, oneDayOverdue),
          sql`${vendorCommissionPeriods.secondNotificationSent} IS NULL`
        )
      );

    for (const period of secondReminders) {
      await this.sendCommissionNotification(period.vendorId, period.id, 'second_reminder');
      await db
        .update(vendorCommissionPeriods)
        .set({ 
          secondNotificationSent: now,
          status: 'overdue'
        })
        .where(eq(vendorCommissionPeriods.id, period.id));
    }

    // Final warning - 7 days overdue (account suspension warning)
    const finalWarnings = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(
        and(
          eq(vendorCommissionPeriods.status, 'overdue'),
          lte(vendorCommissionPeriods.dueDate, sevenDaysOverdue),
          sql`${vendorCommissionPeriods.finalWarningNotificationSent} IS NULL`
        )
      );

    for (const period of finalWarnings) {
      await this.sendCommissionNotification(period.vendorId, period.id, 'final_warning');
      await db
        .update(vendorCommissionPeriods)
        .set({ finalWarningNotificationSent: now })
        .where(eq(vendorCommissionPeriods.id, period.id));
      
      // Increment payment failure count
      await db
        .update(vendors)
        .set({ 
          paymentFailureCount: sql`${vendors.paymentFailureCount} + 1`,
          paymentIssueNotifiedAt: now
        })
        .where(eq(vendors.id, period.vendorId));
    }

    return {
      firstReminders: firstReminders.length,
      secondReminders: secondReminders.length,
      finalWarnings: finalWarnings.length
    };
  }

  // Suspend vendor accounts for non-payment
  async suspendNonPayingVendors() {
    console.log('[Commission] Checking for vendors to suspend');
    
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    // Find vendors with overdue payments > 14 days
    const overdueVendors = await db
      .select({
        vendorId: vendorCommissionPeriods.vendorId,
        periodId: vendorCommissionPeriods.id,
        dueDate: vendorCommissionPeriods.dueDate,
        commissionAmount: vendorCommissionPeriods.commissionAmount
      })
      .from(vendorCommissionPeriods)
      .innerJoin(vendors, eq(vendorCommissionPeriods.vendorId, vendors.id))
      .where(
        and(
          eq(vendorCommissionPeriods.status, 'overdue'),
          lte(vendorCommissionPeriods.dueDate, fourteenDaysAgo),
          eq(vendors.accountStatus, 'active')
        )
      );

    const suspensions = [];
    
    for (const overdue of overdueVendors) {
      try {
        // Suspend vendor account
        await db
          .update(vendors)
          .set({
            accountStatus: 'suspended',
            accountSuspendedAt: new Date(),
            accountSuspensionReason: `Non-payment of commission fees. Overdue amount: £${overdue.commissionAmount}`
          })
          .where(eq(vendors.id, overdue.vendorId));

        // Log the action
        await db
          .insert(vendorAccountActions)
          .values({
            vendorId: overdue.vendorId,
            actionType: 'suspended',
            reason: 'Non-payment of commission fees',
            description: `Account suspended due to overdue commission payment of £${overdue.commissionAmount}`,
            commissionPeriodId: overdue.periodId,
            performedBy: 'system'
          });

        // Send suspension notification
        await this.sendCommissionNotification(overdue.vendorId, overdue.periodId, 'account_suspended');
        
        suspensions.push({ vendorId: overdue.vendorId, success: true });
      } catch (error) {
        console.error(`[Commission] Error suspending vendor ${overdue.vendorId}:`, error);
        suspensions.push({ vendorId: overdue.vendorId, error: error.message, success: false });
      }
    }

    return suspensions;
  }

  // Create payment link for commission
  async createPaymentLink(commissionPeriodId: number) {
    const period = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(eq(vendorCommissionPeriods.id, commissionPeriodId))
      .limit(1);

    if (!period.length) {
      throw new Error('Commission period not found');
    }

    const commissionPeriod = period[0];
    const amount = Math.round(Number(commissionPeriod.commissionAmount) * 100); // Convert to cents

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      metadata: {
        commissionPeriodId: commissionPeriodId.toString(),
        vendorId: commissionPeriod.vendorId.toString(),
        type: 'commission_payment'
      },
      description: `Commission payment for ${commissionPeriod.month}/${commissionPeriod.year}`
    });

    // Create payment record
    await db
      .insert(vendorCommissionPayments)
      .values({
        commissionPeriodId,
        vendorId: commissionPeriod.vendorId,
        amount: commissionPeriod.commissionAmount,
        currency: 'GBP',
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending'
      });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: commissionPeriod.commissionAmount
    };
  }

  // Handle successful payment webhook
  async handlePaymentSuccess(paymentIntentId: string) {
    const payment = await db
      .select()
      .from(vendorCommissionPayments)
      .where(eq(vendorCommissionPayments.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    if (!payment.length) {
      throw new Error('Payment record not found');
    }

    const paymentRecord = payment[0];

    // Update payment status
    await db
      .update(vendorCommissionPayments)
      .set({
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(vendorCommissionPayments.id, paymentRecord.id));

    // Update commission period status
    await db
      .update(vendorCommissionPeriods)
      .set({
        status: 'paid',
        paidDate: new Date(),
        paymentMethod: 'stripe',
        paymentReference: paymentIntentId
      })
      .where(eq(vendorCommissionPeriods.id, paymentRecord.commissionPeriodId));

    // Reset vendor failure count and reactivate if suspended
    await db
      .update(vendors)
      .set({
        paymentFailureCount: 0,
        accountStatus: 'active',
        accountSuspendedAt: null,
        accountSuspensionReason: null
      })
      .where(eq(vendors.id, paymentRecord.vendorId));

    // Log successful payment
    await db
      .insert(vendorAccountActions)
      .values({
        vendorId: paymentRecord.vendorId,
        actionType: 'payment_received',
        reason: 'Commission payment completed',
        description: `Payment of £${paymentRecord.amount} received successfully`,
        commissionPeriodId: paymentRecord.commissionPeriodId,
        performedBy: 'system'
      });

    return { success: true };
  }

  // Send commission-related notifications
  async sendCommissionNotification(vendorId: number, periodId: number, type: string) {
    // This would integrate with your notification system
    console.log(`[Commission] Sending ${type} notification to vendor ${vendorId} for period ${periodId}`);
    
    // TODO: Integrate with SendGrid or other email service
    // For now, just log the notification
  }

  // Get vendor commission dashboard data
  async getVendorCommissionDashboard(vendorId: number) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Get current vendor status with Sales Manager fields
    const vendor = await db
      .select({
        id: vendors.id,
        userId: vendors.userId,
        vendorType: vendors.vendorType,
        storeName: vendors.storeName,
        description: vendors.description,
        logo: vendors.logo,
        contactEmail: vendors.contactEmail,
        contactPhone: vendors.contactPhone,
        website: vendors.website,
        address: vendors.address,
        accountStatus: vendors.accountStatus,
        paymentFailureCount: vendors.paymentFailureCount,
        hasSalesManager: vendors.hasSalesManager,
        salesManagerName: vendors.salesManagerName,
        salesManagerId: vendors.salesManagerIdNumber,
        createdAt: vendors.createdAt,
        updatedAt: vendors.updatedAt
      })
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    if (!vendor.length) {
      throw new Error('Vendor not found');
    }

    // Get commission periods for the last 12 months
    const commissionPeriods = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(eq(vendorCommissionPeriods.vendorId, vendorId))
      .orderBy(desc(vendorCommissionPeriods.year), desc(vendorCommissionPeriods.month))
      .limit(12);

    // Get pending payments
    const pendingPayments = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(
        and(
          eq(vendorCommissionPeriods.vendorId, vendorId),
          sql`${vendorCommissionPeriods.status} IN ('pending', 'overdue')`
        )
      )
      .orderBy(asc(vendorCommissionPeriods.dueDate));

    // Get payment methods
    const paymentMethods = await db
      .select()
      .from(vendorPaymentMethods)
      .where(
        and(
          eq(vendorPaymentMethods.vendorId, vendorId),
          eq(vendorPaymentMethods.isActive, true)
        )
      );

    // Get recent account actions
    const recentActions = await db
      .select()
      .from(vendorAccountActions)
      .where(eq(vendorAccountActions.vendorId, vendorId))
      .orderBy(desc(vendorAccountActions.createdAt))
      .limit(10);

    return {
      vendor: vendor[0],
      commissionPeriods,
      pendingPayments,
      paymentMethods,
      recentActions,
      totals: {
        totalCommissionOwed: pendingPayments.reduce((sum, p) => sum + Number(p.commissionAmount), 0),
        totalCommissionPaid: commissionPeriods
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.commissionAmount), 0)
      }
    };
  }
}

export const commissionService = new CommissionService();