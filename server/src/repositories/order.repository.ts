import { eq, and, desc, inArray, gte, lte } from 'drizzle-orm';
import { BaseRepository } from '../core/base.repository';
import { db } from '../config/database.config';
import { orders, orderItems, products, users, vendors } from '../../../shared/schema';

export interface OrderData {
  userId: number;
  vendorId: number;
  totalAmount: number;
  status: string;
  shippingAddress: object;
  billingAddress?: object;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingMethod?: string;
  shippingCost?: number;
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
}

export interface OrderItemData {
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot?: object;
}

export interface OrderSearchFilters {
  status?: string;
  paymentStatus?: string;
  vendorId?: number;
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export class OrderRepository extends BaseRepository {

  async createOrder(orderData: OrderData): Promise<any> {
    try {
      const orderNumber = this.generateOrderNumber();
      
      const [order] = await db.insert(orders).values({
        ...orderData,
        orderNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return order;
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Order creation error:', error);
      throw new Error('Failed to create order');
    }
  }

  async addOrderItems(items: OrderItemData[]): Promise<any[]> {
    try {
      const createdItems = await db.insert(orderItems).values(
        items.map(item => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      ).returning();

      return createdItems;
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Order items creation error:', error);
      throw new Error('Failed to create order items');
    }
  }

  async getOrderById(id: number): Promise<any | null> {
    try {
      const result = await db.select({
        order: orders,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          avatar: users.avatar
        },
        vendor: {
          id: vendors.id,
          storeName: vendors.storeName,
          businessName: vendors.businessName,
          email: vendors.email
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .where(eq(orders.id, id))
      .limit(1);

      if (!result.length) {
        return null;
      }

      const { order, user, vendor } = result[0];

      // Get order items
      const items = await this.getOrderItems(id);

      return {
        ...order,
        user,
        vendor,
        items
      };
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Order retrieval error:', error);
      throw new Error('Failed to retrieve order');
    }
  }

  async getOrderItems(orderId: number): Promise<any[]> {
    try {
      const result = await db.select({
        item: orderItems,
        product: {
          id: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
          category: products.category
        }
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

      return result.map(({ item, product }) => ({
        ...item,
        product
      }));
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Order items retrieval error:', error);
      throw new Error('Failed to retrieve order items');
    }
  }

  async getUserOrders(
    userId: number,
    filters?: OrderSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: any[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      const conditions = [eq(orders.userId, userId)];

      // Apply filters
      if (filters?.status) {
        conditions.push(eq(orders.status, filters.status));
      }

      if (filters?.paymentStatus) {
        conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
      }

      if (filters?.dateFrom) {
        conditions.push(gte(orders.createdAt, filters.dateFrom));
      }

      if (filters?.dateTo) {
        conditions.push(lte(orders.createdAt, filters.dateTo));
      }

      const whereClause = and(...conditions);

      const [ordersList, totalCount] = await Promise.all([
        db.select({
          order: orders,
          vendor: {
            id: vendors.id,
            storeName: vendors.storeName,
            businessName: vendors.businessName
          }
        })
        .from(orders)
        .leftJoin(vendors, eq(orders.vendorId, vendors.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
        
        db.select({ count: orders.id })
          .from(orders)
          .where(whereClause)
      ]);

      const total = totalCount.length;
      const hasMore = offset + ordersList.length < total;

      const formattedOrders = ordersList.map(({ order, vendor }) => ({
        ...order,
        vendor
      }));

      return {
        orders: formattedOrders,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[ORDER_REPOSITORY] User orders retrieval error:', error);
      throw new Error('Failed to retrieve user orders');
    }
  }

  async getVendorOrders(
    vendorId: number,
    filters?: OrderSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: any[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      const conditions = [eq(orders.vendorId, vendorId)];

      // Apply filters
      if (filters?.status) {
        conditions.push(eq(orders.status, filters.status));
      }

      if (filters?.paymentStatus) {
        conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
      }

      if (filters?.dateFrom) {
        conditions.push(gte(orders.createdAt, filters.dateFrom));
      }

      if (filters?.dateTo) {
        conditions.push(lte(orders.createdAt, filters.dateTo));
      }

      const whereClause = and(...conditions);

      const [ordersList, totalCount] = await Promise.all([
        db.select({
          order: orders,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            email: users.email
          }
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
        
        db.select({ count: orders.id })
          .from(orders)
          .where(whereClause)
      ]);

      const total = totalCount.length;
      const hasMore = offset + ordersList.length < total;

      const formattedOrders = ordersList.map(({ order, user }) => ({
        ...order,
        user
      }));

      return {
        orders: formattedOrders,
        total,
        hasMore
      };
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Vendor orders retrieval error:', error);
      throw new Error('Failed to retrieve vendor orders');
    }
  }

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<any | null> {
    try {
      const [order] = await db.update(orders)
        .set({
          status,
          notes: notes || orders.notes,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Order status update error:', error);
      throw new Error('Failed to update order status');
    }
  }

  async updatePaymentStatus(id: number, paymentStatus: string): Promise<any | null> {
    try {
      const [order] = await db.update(orders)
        .set({
          paymentStatus,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Payment status update error:', error);
      throw new Error('Failed to update payment status');
    }
  }

  async getOrderStats(vendorId?: number, userId?: number): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    try {
      // TODO: Implement proper aggregation queries when Drizzle supports them
      // For now, return basic structure
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0
      };
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Order stats error:', error);
      throw new Error('Failed to retrieve order stats');
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // First delete order items
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      
      // Then delete the order
      const result = await db.delete(orders)
        .where(eq(orders.id, id))
        .returning({ id: orders.id });

      return result.length > 0;
    } catch (error) {
      console.error('[ORDER_REPOSITORY] Order deletion error:', error);
      throw new Error('Failed to delete order');
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}