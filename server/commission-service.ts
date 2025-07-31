import { db } from './db';
import { 
  vendors, 
  vendorCommissionPeriods, 
  vendorCommissionPayments,
  vendorPaymentMethods,
  vendorAccountActions,
  orders,
  orderItems,
  products,
  users
} from '../shared/schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { paymentGatewayFactory } from './payment-gateways';

export class CommissionService {
  // Calculate commission tier based on monthly sales volume
  calculateCommissionTier(totalSales: number): { tier: 'standard', rate: number } {
    // Single commission tier for all vendors - 15%
    return { tier: 'standard', rate: 0.15 }; // 15%
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
    console.log(`[Commission] Sending ${type} notification to vendor ${vendorId} for period ${periodId}`);
    
    try {
      // Get vendor details for email
      const vendor = await db
        .select({
          userId: vendors.userId,
          storeName: vendors.storeName,
        })
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor.length) return;

      // Get user email
      const user = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, vendor[0].userId))
        .limit(1);

      if (!user.length) return;

      // Get commission period details
      const period = await db
        .select()
        .from(vendorCommissionPeriods)
        .where(eq(vendorCommissionPeriods.id, periodId))
        .limit(1);

      if (!period.length) return;

      const commission = period[0];
      
      // Update notification timestamps
      const updateData: any = {};
      if (type === 'first_notification') {
        updateData.firstNotificationSent = new Date();
      } else if (type === 'second_notification') {
        updateData.secondNotificationSent = new Date();
      } else if (type === 'final_warning') {
        updateData.finalWarningNotificationSent = new Date();
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(vendorCommissionPeriods)
          .set(updateData)
          .where(eq(vendorCommissionPeriods.id, periodId));
      }

      console.log(`[Commission] ${type} notification sent to ${user[0].email} for ${vendor[0].storeName}`);
    } catch (error) {
      console.error(`[Commission] Error sending notification:`, error);
    }
  }

  // Create payment intent for commission payment using multiple gateways
  async createCommissionPaymentIntent(commissionPeriodId: number, gatewayType: string = 'stripe') {
    const period = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(eq(vendorCommissionPeriods.id, commissionPeriodId))
      .limit(1);

    if (!period.length) {
      throw new Error('Commission period not found');
    }

    const commission = period[0];
    const amount = Number(commission.commissionAmount);

    try {
      const paymentData = await paymentGatewayFactory.createPayment(
        gatewayType,
        amount,
        'GBP',
        {
          type: 'commission_payment',
          commission_period_id: commissionPeriodId.toString(),
          vendor_id: commission.vendorId.toString(),
          month: commission.month.toString(),
          year: commission.year.toString(),
          description: `Commission payment for ${commission.month}/${commission.year}`,
        }
      );

      // Create payment record with gateway-specific data
      const paymentRecord: any = {
        commissionPeriodId,
        vendorId: commission.vendorId,
        amount: commission.commissionAmount,
        currency: 'GBP',
        paymentMethod: gatewayType,
        status: 'pending',
      };

      // Add gateway-specific fields
      if (gatewayType === 'stripe') {
        paymentRecord.stripePaymentIntentId = paymentData.paymentId;
      } else if (gatewayType === 'bank_transfer') {
        paymentRecord.bankTransferReference = paymentData.paymentId;
      } else if (gatewayType === 'mobile_money') {
        paymentRecord.mobileMoneyReference = paymentData.paymentId;
      }

      await db.insert(vendorCommissionPayments).values(paymentRecord);

      return {
        gateway: gatewayType,
        paymentData,
        amount: commission.commissionAmount,
      };
    } catch (error) {
      console.error(`[Commission] Error creating ${gatewayType} payment:`, error);
      throw error;
    }
  }

  // Get available payment methods for vendor
  async getAvailablePaymentMethods(vendorId: number) {
    // Get vendor's location/region to determine available payment methods
    const vendor = await db
      .select({
        id: vendors.id,
        userId: vendors.userId,
      })
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    if (!vendor.length) {
      throw new Error('Vendor not found');
    }

    // Get user's country/region
    const user = await db
      .select({ country: users.country, region: users.region })
      .from(users)
      .where(eq(users.id, vendor[0].userId))
      .limit(1);

    const userCountry = user.length > 0 ? user[0].country : null;
    const userRegion = user.length > 0 ? user[0].region : null;

    // Define available payment methods based on location
    const allMethods = [
      {
        id: 'stripe',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your card',
        icon: 'credit-card',
        processingTime: 'Instant',
        fees: '2.9% + 30p',
        supported: true, // Stripe is available globally
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'paypal',
        processingTime: 'Instant',
        fees: '3.4% + 20p',
        supported: true, // PayPal is available globally
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer (UK only)',
        icon: 'bank',
        processingTime: '1-3 business days',
        fees: 'Free',
        supported: userCountry === 'GB' || userRegion === 'Europe',
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        description: 'M-Pesa, Airtel Money (Africa only)',
        icon: 'smartphone',
        processingTime: 'Instant',
        fees: '1.5%',
        supported: userRegion === 'Africa',
      },
    ];

    return allMethods.filter(method => method.supported);
  }

  // Process monthly billing for all vendors (called on 1st of each month)
  async processMonthlyBilling() {
    const currentDate = new Date();
    const previousMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const year = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

    console.log(`[Commission] Processing monthly billing for ${previousMonth}/${year}`);

    try {
      // Get all active vendors
      const activeVendors = await db
        .select({ id: vendors.id })
        .from(vendors)
        .where(eq(vendors.accountStatus, 'active'));

      for (const vendor of activeVendors) {
        await this.createCommissionPeriod(vendor.id, previousMonth, year);
      }

      console.log(`[Commission] Monthly billing processed for ${activeVendors.length} vendors`);
    } catch (error) {
      console.error('[Commission] Error processing monthly billing:', error);
    }
  }

  // Check for overdue payments and block accounts
  async processOverduePayments() {
    const currentDate = new Date();
    const graceEndDate = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

    try {
      // Find overdue commission periods
      const overduePayments = await db
        .select({
          id: vendorCommissionPeriods.id,
          vendorId: vendorCommissionPeriods.vendorId,
          dueDate: vendorCommissionPeriods.dueDate,
          commissionAmount: vendorCommissionPeriods.commissionAmount,
        })
        .from(vendorCommissionPeriods)
        .where(
          and(
            eq(vendorCommissionPeriods.status, 'pending'),
            lte(vendorCommissionPeriods.dueDate, graceEndDate)
          )
        );

      for (const payment of overduePayments) {
        // Mark commission as overdue
        await db
          .update(vendorCommissionPeriods)
          .set({ status: 'overdue' })
          .where(eq(vendorCommissionPeriods.id, payment.id));

        // Block vendor account
        await db
          .update(vendors)
          .set({ 
            accountStatus: 'suspended',
            paymentFailureCount: sql`${vendors.paymentFailureCount} + 1`
          })
          .where(eq(vendors.id, payment.vendorId));

        console.log(`[Commission] Vendor ${payment.vendorId} account suspended due to overdue payment`);
      }

      return overduePayments.length;
    } catch (error) {
      console.error('[Commission] Error processing overdue payments:', error);
      return 0;
    }
  }

  // Check if vendor has pending payments requiring popup notification
  async checkPendingPaymentNotification(vendorId: number) {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    
    // Only show popup on 1st of the month
    if (currentDay !== 1) {
      return null;
    }

    try {
      const pendingPayments = await db
        .select({
          id: vendorCommissionPeriods.id,
          month: vendorCommissionPeriods.month,
          year: vendorCommissionPeriods.year,
          commissionAmount: vendorCommissionPeriods.commissionAmount,
          dueDate: vendorCommissionPeriods.dueDate,
        })
        .from(vendorCommissionPeriods)
        .where(
          and(
            eq(vendorCommissionPeriods.vendorId, vendorId),
            eq(vendorCommissionPeriods.status, 'pending')
          )
        )
        .orderBy(desc(vendorCommissionPeriods.dueDate));

      if (pendingPayments.length === 0) {
        return null;
      }

      const totalOwed = pendingPayments.reduce((sum, payment) => sum + Number(payment.commissionAmount), 0);

      return {
        totalAmount: totalOwed,
        paymentCount: pendingPayments.length,
        dueDate: pendingPayments[0].dueDate,
        payments: pendingPayments,
      };
    } catch (error) {
      console.error('[Commission] Error checking pending payments:', error);
      return null;
    }
  }

  // Capture commission payment
  async captureCommissionPayment(paymentId: string, gatewayType: string) {
    try {
      const result = await paymentGatewayFactory.capturePayment(gatewayType, paymentId);
      
      // Update payment record
      const updateData: any = {
        status: 'completed',
        completedAt: new Date(),
      };

      let whereCondition;
      if (gatewayType === 'stripe') {
        whereCondition = eq(vendorCommissionPayments.stripePaymentIntentId, paymentId);
      } else if (gatewayType === 'bank_transfer') {
        whereCondition = eq(vendorCommissionPayments.bankTransferReference, paymentId);
      } else if (gatewayType === 'mobile_money') {
        whereCondition = eq(vendorCommissionPayments.mobileMoneyReference, paymentId);
      }

      if (whereCondition) {
        await db
          .update(vendorCommissionPayments)
          .set(updateData)
          .where(whereCondition);

        // Update commission period status
        const payment = await db
          .select({ commissionPeriodId: vendorCommissionPayments.commissionPeriodId })
          .from(vendorCommissionPayments)
          .where(whereCondition)
          .limit(1);

        if (payment.length > 0) {
          await db
            .update(vendorCommissionPeriods)
            .set({ 
              status: 'paid',
              paidDate: new Date(),
              paymentMethod: gatewayType,
              paymentReference: paymentId,
            })
            .where(eq(vendorCommissionPeriods.id, payment[0].commissionPeriodId));
        }
      }

      return result;
    } catch (error) {
      console.error(`[Commission] Error capturing ${gatewayType} payment:`, error);
      throw error;
    }
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
        accountStatus: vendors.accountStatus,
        paymentFailureCount: vendors.paymentFailureCount,
        hasSalesManager: vendors.hasSalesManager,
        salesManagerName: vendors.salesManagerName,
        salesManagerId: vendors.salesManagerId,
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

  // Automatic commission charging system for month-end
  async processAutomaticCommissionCharging() {
    console.log('[Commission] Starting automatic commission charging process');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Get all active vendors with pending commission periods
    const vendorsWithPendingCommissions = await db
      .select({
        vendorId: vendorCommissionPeriods.vendorId,
        commissionAmount: vendorCommissionPeriods.commissionAmount,
        commissionPeriodId: vendorCommissionPeriods.id,
        vendor: {
          id: vendors.id,
          storeName: vendors.storeName,
          hasSalesManager: vendors.hasSalesManager,
          salesManagerName: vendors.salesManagerName,
          userId: vendors.userId
        }
      })
      .from(vendorCommissionPeriods)
      .innerJoin(vendors, eq(vendorCommissionPeriods.vendorId, vendors.id))
      .where(
        and(
          eq(vendorCommissionPeriods.status, 'pending'),
          lte(vendorCommissionPeriods.dueDate, currentDate),
          eq(vendors.accountStatus, 'active')
        )
      );

    const chargingResults = [];

    for (const vendorData of vendorsWithPendingCommissions) {
      try {
        // Create automatic payment intent for commission
        const paymentResult = await this.createAutomaticCommissionPayment(
          vendorData.commissionPeriodId,
          vendorData.commissionAmount,
          vendorData.vendor
        );
        
        chargingResults.push({
          vendorId: vendorData.vendorId,
          commissionPeriodId: vendorData.commissionPeriodId,
          amount: vendorData.commissionAmount,
          paymentIntentId: paymentResult.paymentIntentId,
          success: true
        });

        // Log the automatic charging action
        await db
          .insert(vendorAccountActions)
          .values({
            vendorId: vendorData.vendorId,
            actionType: 'automatic_commission_charge',
            description: `Automatic commission charge of £${vendorData.commissionAmount} initiated`,
            amount: vendorData.commissionAmount,
            metadata: JSON.stringify({
              paymentIntentId: paymentResult.paymentIntentId,
              commissionPeriodId: vendorData.commissionPeriodId,
              chargeType: 'automatic_monthly'
            })
          });

        // Send notification about automatic charging
        await this.sendCommissionNotification(
          vendorData.vendorId, 
          vendorData.commissionPeriodId, 
          'automatic_charge_initiated'
        );

      } catch (error) {
        console.error(`[Commission] Failed to charge vendor ${vendorData.vendorId}:`, error);
        chargingResults.push({
          vendorId: vendorData.vendorId,
          commissionPeriodId: vendorData.commissionPeriodId,
          error: error.message,
          success: false
        });
      }
    }

    console.log(`[Commission] Automatic charging completed. Processed ${chargingResults.length} vendors`);
    return chargingResults;
  }

  // Create automatic commission payment
  async createAutomaticCommissionPayment(commissionPeriodId: number, commissionAmount: string, vendor: any) {
    const amount = Math.round(Number(commissionAmount) * 100); // Convert to cents

    // Create Stripe payment intent for automatic charging
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        commissionPeriodId: commissionPeriodId.toString(),
        vendorId: vendor.id.toString(),
        type: 'automatic_commission_charge',
        tier: vendor.hasSalesManager ? 'sales_manager' : 'standard'
      },
      description: `Automatic commission charge - ${vendor.storeName}`,
      receipt_email: null // Will be set when vendor provides payment method
    });

    // Create payment record
    await db
      .insert(vendorCommissionPayments)
      .values({
        commissionPeriodId,
        vendorId: vendor.id,
        amount: commissionAmount,
        currency: 'GBP',
        paymentMethod: 'stripe_automatic',
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending'
      });

    // Update commission period status to charging
    await db
      .update(vendorCommissionPeriods)
      .set({ 
        status: 'charging',
        updatedAt: new Date()
      })
      .where(eq(vendorCommissionPeriods.id, commissionPeriodId));

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: commissionAmount,
      requiresRedirect: true
    };
  }

  // Generate payment redirect URL for vendor
  async generatePaymentRedirectUrl(vendorId: number, commissionPeriodId: number) {
    const period = await db
      .select()
      .from(vendorCommissionPeriods)
      .where(eq(vendorCommissionPeriods.id, commissionPeriodId))
      .limit(1);

    if (!period.length) {
      throw new Error('Commission period not found');
    }

    const payment = await db
      .select()
      .from(vendorCommissionPayments)
      .where(eq(vendorCommissionPayments.commissionPeriodId, commissionPeriodId))
      .orderBy(desc(vendorCommissionPayments.createdAt))
      .limit(1);

    if (!payment.length) {
      throw new Error('Payment record not found');
    }

    // Return frontend URL for commission payment
    return {
      redirectUrl: `/vendor-dashboard/commission/payment/${commissionPeriodId}`,
      paymentIntentId: payment[0].stripePaymentIntentId,
      amount: payment[0].amount,
      dueDate: period[0].dueDate,
      status: period[0].status
    };
  }

  // Check for overdue automatic charges and suspend accounts
  async processOverdueAutomaticCharges() {
    console.log('[Commission] Checking for overdue automatic charges');
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Find vendors with failed automatic charges over 7 days old
    const overdueCharges = await db
      .select()
      .from(vendorCommissionPeriods)
      .innerJoin(vendors, eq(vendorCommissionPeriods.vendorId, vendors.id))
      .where(
        and(
          eq(vendorCommissionPeriods.status, 'charging'),
          lte(vendorCommissionPeriods.dueDate, sevenDaysAgo),
          eq(vendors.accountStatus, 'active')
        )
      );

    const suspensions = [];

    for (const overdue of overdueCharges) {
      try {
        // Suspend vendor account
        await db
          .update(vendors)
          .set({
            accountStatus: 'suspended',
            paymentFailureCount: sql`${vendors.paymentFailureCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(vendors.id, overdue.vendors.id));

        // Update commission period status
        await db
          .update(vendorCommissionPeriods)
          .set({ status: 'failed_payment' })
          .where(eq(vendorCommissionPeriods.id, overdue.vendor_commission_periods.id));

        // Log suspension action
        await db
          .insert(vendorAccountActions)
          .values({
            vendorId: overdue.vendors.id,
            actionType: 'account_suspended',
            description: 'Account suspended due to failed automatic commission payment',
            amount: overdue.vendor_commission_periods.commissionAmount,
            metadata: JSON.stringify({
              reason: 'overdue_automatic_commission',
              daysPastDue: Math.floor((Date.now() - overdue.vendor_commission_periods.dueDate.getTime()) / (1000 * 60 * 60 * 24))
            })
          });

        // Send suspension notification
        await this.sendCommissionNotification(
          overdue.vendors.id,
          overdue.vendor_commission_periods.id,
          'account_suspended'
        );

        suspensions.push({
          vendorId: overdue.vendors.id,
          storeName: overdue.vendors.storeName,
          success: true
        });

      } catch (error) {
        console.error(`[Commission] Failed to suspend vendor ${overdue.vendors.id}:`, error);
        suspensions.push({
          vendorId: overdue.vendors.id,
          error: error.message,
          success: false
        });
      }
    }

    return suspensions;
  }
}

export const commissionService = new CommissionService();