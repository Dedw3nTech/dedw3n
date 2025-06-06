import { db } from './db';
import { 
  vendors, 
  products, 
  orders, 
  orderItems, 
  users,
  productViews,
  conversionEvents,
  searchAnalytics,
  sessionAnalytics,
  competitorAnalytics,
  financialAnalytics,
  productAnalytics,
  marketTrends,
  productForecasts,
  demographicAnalytics
} from '@shared/schema';
import { eq, sql, desc, asc, and, gte, lte, count, sum, avg } from 'drizzle-orm';

export class VendorAnalyticsService {
  
  // Product Forecast Analytics
  async getProductForecasts(vendorId: number, period: 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
    try {
      const forecasts = await db
        .select({
          productId: productForecasts.productId,
          productName: products.name,
          predictedSales: productForecasts.predictedSales,
          predictedRevenue: productForecasts.predictedRevenue,
          confidenceLevel: productForecasts.confidenceLevel,
          recommendedInventory: productForecasts.recommendedInventory,
          recommendedPrice: productForecasts.recommendedPrice,
          forecastDate: productForecasts.forecastDate,
        })
        .from(productForecasts)
        .innerJoin(products, eq(productForecasts.productId, products.id))
        .where(and(
          eq(productForecasts.vendorId, vendorId),
          eq(productForecasts.forecastPeriod, period)
        ))
        .orderBy(desc(productForecasts.createdAt))
        .limit(20);

      return forecasts;
    } catch (error) {
      console.error('Error fetching product forecasts:', error);
      throw new Error('Failed to fetch product forecasts');
    }
  }

  // Market Trends Analytics
  async getMarketTrends(vendorId: number, period: 'weekly' | 'monthly' | 'quarterly' = 'monthly') {
    try {
      const trends = await db
        .select({
          category: marketTrends.category,
          trendDirection: marketTrends.trendDirection,
          growthRate: marketTrends.growthRate,
          marketDemand: marketTrends.marketDemand,
          competitorCount: marketTrends.competitorCount,
          averagePrice: marketTrends.averagePrice,
          searchVolume: marketTrends.searchVolume,
          recommendedActions: marketTrends.recommendedActions,
          period: marketTrends.period,
        })
        .from(marketTrends)
        .where(and(
          eq(marketTrends.vendorId, vendorId),
          eq(marketTrends.period, period)
        ))
        .orderBy(desc(marketTrends.createdAt))
        .limit(10);

      return trends;
    } catch (error) {
      console.error('Error fetching market trends:', error);
      throw new Error('Failed to fetch market trends');
    }
  }

  // Conversion Rate Analytics
  async getConversionRates(vendorId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conversionData = await db
        .select({
          date: sql<string>`DATE(${conversionEvents.createdAt})`,
          totalViews: count(sql`CASE WHEN ${conversionEvents.conversionType} = 'view' THEN 1 END`),
          cartAdds: count(sql`CASE WHEN ${conversionEvents.conversionType} = 'add_to_cart' THEN 1 END`),
          checkouts: count(sql`CASE WHEN ${conversionEvents.conversionType} = 'checkout' THEN 1 END`),
          purchases: count(sql`CASE WHEN ${conversionEvents.conversionType} = 'purchase' THEN 1 END`),
          totalValue: sum(conversionEvents.value),
        })
        .from(conversionEvents)
        .where(and(
          eq(conversionEvents.vendorId, vendorId),
          gte(conversionEvents.createdAt, startDate)
        ))
        .groupBy(sql`DATE(${conversionEvents.createdAt})`)
        .orderBy(sql`DATE(${conversionEvents.createdAt})`);

      return conversionData.map(item => ({
        ...item,
        conversionRate: item.totalViews > 0 ? (Number(item.purchases) / Number(item.totalViews)) * 100 : 0,
        checkoutRate: item.cartAdds > 0 ? (Number(item.checkouts) / Number(item.cartAdds)) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching conversion rates:', error);
      throw new Error('Failed to fetch conversion rates');
    }
  }

  // Search Conversion Analytics
  async getSearchConversions(vendorId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const searchData = await db
        .select({
          searchQuery: searchAnalytics.searchQuery,
          totalSearches: count(),
          conversions: count(sql`CASE WHEN ${searchAnalytics.converted} = true THEN 1 END`),
          totalValue: sum(searchAnalytics.conversionValue),
          avgPosition: avg(searchAnalytics.clickPosition),
        })
        .from(searchAnalytics)
        .where(and(
          eq(searchAnalytics.vendorId, vendorId),
          gte(searchAnalytics.createdAt, startDate)
        ))
        .groupBy(searchAnalytics.searchQuery)
        .orderBy(desc(count()))
        .limit(20);

      return searchData.map(item => ({
        ...item,
        conversionRate: Number(item.totalSearches) > 0 ? (Number(item.conversions) / Number(item.totalSearches)) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching search conversions:', error);
      throw new Error('Failed to fetch search conversions');
    }
  }

  // Session by Device Type
  async getSessionsByDevice(vendorId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deviceData = await db
        .select({
          deviceType: sessionAnalytics.deviceType,
          totalSessions: count(),
          avgDuration: avg(sessionAnalytics.sessionDuration),
          conversions: count(sql`CASE WHEN ${sessionAnalytics.converted} = true THEN 1 END`),
          totalValue: sum(sessionAnalytics.conversionValue),
          bounceRate: avg(sql`CASE WHEN ${sessionAnalytics.bounced} = true THEN 1.0 ELSE 0.0 END`),
        })
        .from(sessionAnalytics)
        .where(and(
          eq(sessionAnalytics.vendorId, vendorId),
          gte(sessionAnalytics.startedAt, startDate)
        ))
        .groupBy(sessionAnalytics.deviceType);

      return deviceData.map(item => ({
        ...item,
        conversionRate: Number(item.totalSessions) > 0 ? (Number(item.conversions) / Number(item.totalSessions)) * 100 : 0,
        bounceRate: Number(item.bounceRate) * 100,
        avgDurationMinutes: Number(item.avgDuration) / 60,
      }));
    } catch (error) {
      console.error('Error fetching sessions by device:', error);
      throw new Error('Failed to fetch sessions by device');
    }
  }

  // Demographics Analytics
  async getDemographics(vendorId: number, period: 'monthly' | 'quarterly' = 'monthly') {
    try {
      const demographics = await db
        .select({
          ageGroup: demographicAnalytics.ageGroup,
          gender: demographicAnalytics.gender,
          country: demographicAnalytics.country,
          totalUsers: demographicAnalytics.totalUsers,
          totalOrders: demographicAnalytics.totalOrders,
          totalRevenue: demographicAnalytics.totalRevenue,
          averageOrderValue: demographicAnalytics.averageOrderValue,
          conversionRate: demographicAnalytics.conversionRate,
          lifetimeValue: demographicAnalytics.lifetimeValue,
        })
        .from(demographicAnalytics)
        .where(and(
          eq(demographicAnalytics.vendorId, vendorId),
          eq(demographicAnalytics.period, period)
        ))
        .orderBy(desc(demographicAnalytics.totalRevenue));

      return demographics;
    } catch (error) {
      console.error('Error fetching demographics:', error);
      throw new Error('Failed to fetch demographics');
    }
  }

  // Competitor Analysis
  async getCompetitorAnalysis(vendorId: number) {
    try {
      const competitors = await db
        .select({
          competitorId: competitorAnalytics.competitorVendorId,
          competitorName: vendors.storeName,
          category: competitorAnalytics.category,
          averagePrice: competitorAnalytics.averagePrice,
          totalProducts: competitorAnalytics.totalProducts,
          monthlyRevenue: competitorAnalytics.monthlyRevenue,
          marketShare: competitorAnalytics.marketShare,
          rating: competitorAnalytics.rating,
          reviewCount: competitorAnalytics.reviewCount,
        })
        .from(competitorAnalytics)
        .innerJoin(vendors, eq(competitorAnalytics.competitorVendorId, vendors.id))
        .where(eq(competitorAnalytics.vendorId, vendorId))
        .orderBy(desc(competitorAnalytics.monthlyRevenue))
        .limit(10);

      return competitors;
    } catch (error) {
      console.error('Error fetching competitor analysis:', error);
      throw new Error('Failed to fetch competitor analysis');
    }
  }

  // Financial Summary
  async getFinancialSummary(vendorId: number, period: 'weekly' | 'monthly' = 'monthly') {
    try {
      const financial = await db
        .select({
          period: financialAnalytics.period,
          startDate: financialAnalytics.startDate,
          endDate: financialAnalytics.endDate,
          grossRevenue: financialAnalytics.grossRevenue,
          netRevenue: financialAnalytics.netRevenue,
          totalCosts: financialAnalytics.totalCosts,
          platformFees: financialAnalytics.platformFees,
          shippingCosts: financialAnalytics.shippingCosts,
          marketingCosts: financialAnalytics.marketingCosts,
          grossProfit: financialAnalytics.grossProfit,
          netProfit: financialAnalytics.netProfit,
          profitMargin: financialAnalytics.profitMargin,
          averageOrderValue: financialAnalytics.averageOrderValue,
          totalOrders: financialAnalytics.totalOrders,
          totalRefunds: financialAnalytics.totalRefunds,
          refundRate: financialAnalytics.refundRate,
        })
        .from(financialAnalytics)
        .where(and(
          eq(financialAnalytics.vendorId, vendorId),
          eq(financialAnalytics.period, period)
        ))
        .orderBy(desc(financialAnalytics.createdAt))
        .limit(12);

      return financial;
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      throw new Error('Failed to fetch financial summary');
    }
  }

  // Gross Profit Breakdown
  async getGrossProfitBreakdown(vendorId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const profitData = await db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          totalSales: sum(orderItems.quantity),
          grossRevenue: sum(orderItems.totalPrice),
          productCost: sql<number>`SUM(${orderItems.quantity} * ${products.cost})`,
          grossProfit: sql<number>`SUM(${orderItems.totalPrice}) - SUM(${orderItems.quantity} * ${products.cost})`,
          profitMargin: sql<number>`CASE WHEN SUM(${orderItems.totalPrice}) > 0 THEN ((SUM(${orderItems.totalPrice}) - SUM(${orderItems.quantity} * ${products.cost})) / SUM(${orderItems.totalPrice})) * 100 ELSE 0 END`,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(products.vendorId, vendorId),
          gte(orders.createdAt, startDate)
        ))
        .groupBy(orderItems.productId, products.name)
        .orderBy(desc(sql`SUM(${orderItems.totalPrice})`))
        .limit(20);

      return profitData;
    } catch (error) {
      console.error('Error fetching gross profit breakdown:', error);
      throw new Error('Failed to fetch gross profit breakdown');
    }
  }

  // Orders and Returns by Product
  async getOrdersAndReturns(vendorId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orderData = await db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          totalOrders: count(),
          totalQuantity: sum(orderItems.quantity),
          totalRevenue: sum(orderItems.totalPrice),
          deliveredOrders: count(sql`CASE WHEN ${orderItems.status} = 'delivered' THEN 1 END`),
          cancelledOrders: count(sql`CASE WHEN ${orderItems.status} = 'cancelled' THEN 1 END`),
          returnedOrders: count(sql`CASE WHEN ${orderItems.status} = 'returned' THEN 1 END`),
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(products.vendorId, vendorId),
          gte(orders.createdAt, startDate)
        ))
        .groupBy(orderItems.productId, products.name)
        .orderBy(desc(count()))
        .limit(20);

      return orderData.map(item => ({
        ...item,
        returnRate: Number(item.totalOrders) > 0 ? (Number(item.returnedOrders) / Number(item.totalOrders)) * 100 : 0,
        cancellationRate: Number(item.totalOrders) > 0 ? (Number(item.cancelledOrders) / Number(item.totalOrders)) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching orders and returns:', error);
      throw new Error('Failed to fetch orders and returns');
    }
  }

  // Items Bought Together (Cross-sell Analysis)
  async getItemsBoughtTogether(vendorId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Find products that are frequently bought together
      const crossSellData = await db.execute(sql`
        WITH order_products AS (
          SELECT 
            o.id as order_id,
            oi.product_id,
            p.name as product_name
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN products p ON oi.product_id = p.id
          WHERE p.vendor_id = ${vendorId}
            AND o.created_at >= ${startDate}
        ),
        product_pairs AS (
          SELECT 
            op1.product_id as product_a_id,
            op1.product_name as product_a_name,
            op2.product_id as product_b_id,
            op2.product_name as product_b_name,
            COUNT(*) as frequency
          FROM order_products op1
          JOIN order_products op2 ON op1.order_id = op2.order_id
          WHERE op1.product_id < op2.product_id
          GROUP BY op1.product_id, op1.product_name, op2.product_id, op2.product_name
          HAVING COUNT(*) > 1
        )
        SELECT * FROM product_pairs
        ORDER BY frequency DESC
        LIMIT 20
      `);

      return crossSellData.rows;
    } catch (error) {
      console.error('Error fetching items bought together:', error);
      throw new Error('Failed to fetch items bought together');
    }
  }

  // Daily Inventory Sold by Product
  async getDailyInventorySold(vendorId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const inventoryData = await db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          productId: orderItems.productId,
          productName: products.name,
          quantitySold: sum(orderItems.quantity),
          revenue: sum(orderItems.totalPrice),
          currentStock: products.stock,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(products.vendorId, vendorId),
          gte(orders.createdAt, startDate)
        ))
        .groupBy(
          sql`DATE(${orders.createdAt})`,
          orderItems.productId,
          products.name,
          products.stock
        )
        .orderBy(sql`DATE(${orders.createdAt})`, products.name);

      return inventoryData;
    } catch (error) {
      console.error('Error fetching daily inventory sold:', error);
      throw new Error('Failed to fetch daily inventory sold');
    }
  }

  // Generate sample analytics data for demonstration
  async generateSampleData(vendorId: number) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Sample market trends
      await db.insert(marketTrends).values([
        {
          vendorId,
          category: 'Electronics',
          period: 'monthly',
          startDate: new Date('2024-11-01'),
          endDate: new Date('2024-11-30'),
          trendDirection: 'up',
          growthRate: 15.5,
          marketDemand: 85.2,
          competitorCount: 25,
          averagePrice: 299.99,
          searchVolume: 12500,
          recommendedActions: ['Increase inventory', 'Optimize pricing', 'Expand marketing']
        }
      ]);

      // Sample product forecasts
      const vendorProducts = await db.select().from(products).where(eq(products.vendorId, vendorId)).limit(3);
      
      for (const product of vendorProducts) {
        await db.insert(productForecasts).values({
          vendorId,
          productId: product.id,
          forecastPeriod: 'monthly',
          forecastDate: new Date('2024-12-01'),
          predictedSales: Math.floor(Math.random() * 100) + 20,
          predictedRevenue: Math.random() * 5000 + 1000,
          confidenceLevel: Math.random() * 0.3 + 0.7,
          recommendedInventory: Math.floor(Math.random() * 200) + 50,
          recommendedPrice: product.price * (0.9 + Math.random() * 0.2)
        });
      }

      console.log('Sample analytics data generated successfully');
    } catch (error) {
      console.error('Error generating sample data:', error);
    }
  }
}

export const vendorAnalyticsService = new VendorAnalyticsService();