import { BaseService } from '../core/base.service';
import { OrderRepository, OrderData, OrderItemData, OrderSearchFilters } from '../repositories/order.repository';
import { ProductService } from './product.service';
import { VendorService } from './vendor.service';
import { BusinessError, ValidationError, NotFoundError } from '../core/errors';

export interface CreateOrderRequest {
  vendorId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod?: string;
  shippingMethod?: string;
  notes?: string;
}

export interface OrderStatusUpdate {
  status: string;
  notes?: string;
}

export class OrderService extends BaseService {
  
  constructor(
    private orderRepository: OrderRepository,
    private productService: ProductService,
    private vendorService: VendorService
  ) {
    super();
  }

  async createOrder(orderData: CreateOrderRequest, userId: number): Promise<any> {
    try {
      // Validate input
      await this.validateOrderData(orderData);

      // Verify vendor exists
      const vendor = await this.vendorService.getVendorById(orderData.vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      // Get products and validate availability
      const productIds = orderData.items.map(item => item.productId);
      const products = await this.productService.getProductsByIds(productIds);

      if (products.length !== productIds.length) {
        throw new ValidationError('One or more products not found');
      }

      // Validate all products belong to the same vendor
      for (const product of products) {
        if (product.vendorId !== orderData.vendorId) {
          throw new ValidationError('All products must belong to the same vendor');
        }

        if (!product.isActive) {
          throw new ValidationError(`Product "${product.name}" is not available`);
        }
      }

      // Calculate order totals
      let totalAmount = 0;
      let taxAmount = 0;
      const orderItems: OrderItemData[] = [];

      for (const orderItem of orderData.items) {
        const product = products.find(p => p.id === orderItem.productId);
        if (!product) {
          throw new ValidationError(`Product with ID ${orderItem.productId} not found`);
        }

        // Check stock availability
        if (product.stockQuantity !== null && product.stockQuantity < orderItem.quantity) {
          throw new ValidationError(`Insufficient stock for product "${product.name}"`);
        }

        const unitPrice = product.price;
        const itemTotal = unitPrice * orderItem.quantity;
        
        // Calculate VAT if included
        let itemTax = 0;
        if (product.vatIncluded && product.vatRate) {
          itemTax = (itemTotal * product.vatRate) / 100;
          taxAmount += itemTax;
        }

        totalAmount += itemTotal;

        orderItems.push({
          orderId: 0, // Will be set after order creation
          productId: product.id,
          quantity: orderItem.quantity,
          unitPrice,
          totalPrice: itemTotal,
          productSnapshot: {
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            category: product.category,
            vatIncluded: product.vatIncluded,
            vatRate: product.vatRate
          }
        });
      }

      // Create order
      const order = await this.orderRepository.createOrder({
        userId,
        vendorId: orderData.vendorId,
        totalAmount,
        taxAmount,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: orderData.paymentMethod,
        shippingMethod: orderData.shippingMethod,
        shippingCost: 0, // TODO: Calculate shipping cost
        discountAmount: 0, // TODO: Apply discounts
        notes: orderData.notes
      });

      // Create order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        orderId: order.id
      }));

      await this.orderRepository.addOrderItems(orderItemsWithOrderId);

      // Update product stock
      for (const orderItem of orderData.items) {
        const product = products.find(p => p.id === orderItem.productId);
        if (product && product.stockQuantity !== null) {
          const newStock = product.stockQuantity - orderItem.quantity;
          await this.productService.updateProductStock(product.id, newStock, product.vendor.userId);
        }
      }

      console.log(`[ORDER_SERVICE] Order created: ${order.orderNumber} (ID: ${order.id})`);

      // Return complete order with items
      return await this.orderRepository.getOrderById(order.id);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[ORDER_SERVICE] Order creation error:', error);
      throw new BusinessError('Failed to create order');
    }
  }

  async getOrderById(id: number, userId: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid order ID');
      }

      const order = await this.orderRepository.getOrderById(id);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Verify access (user owns the order or is the vendor)
      if (order.userId !== userId && order.vendor?.userId !== userId) {
        throw new BusinessError('You do not have permission to view this order');
      }

      return order;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[ORDER_SERVICE] Order retrieval error:', error);
      throw new BusinessError('Failed to retrieve order');
    }
  }

  async getUserOrders(
    userId: number,
    filters?: OrderSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: any[]; total: number; hasMore: boolean; page: number; limit: number }> {
    try {
      // Validate pagination
      if (!this.isPositiveNumber(page) || page < 1) {
        throw new ValidationError('Page must be a positive number');
      }

      if (!this.isPositiveNumber(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      const result = await this.orderRepository.getUserOrders(userId, filters, page, limit);

      return {
        ...result,
        page,
        limit
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[ORDER_SERVICE] User orders retrieval error:', error);
      throw new BusinessError('Failed to retrieve user orders');
    }
  }

  async getVendorOrders(
    vendorId: number,
    userId: number,
    filters?: OrderSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: any[]; total: number; hasMore: boolean; page: number; limit: number }> {
    try {
      if (!this.isPositiveNumber(vendorId)) {
        throw new ValidationError('Invalid vendor ID');
      }

      // Verify vendor ownership
      const vendor = await this.vendorService.getVendorById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      if (vendor.userId !== userId) {
        throw new BusinessError('You can only view orders for your own vendor account');
      }

      // Validate pagination
      if (!this.isPositiveNumber(page) || page < 1) {
        throw new ValidationError('Page must be a positive number');
      }

      if (!this.isPositiveNumber(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      const result = await this.orderRepository.getVendorOrders(vendorId, filters, page, limit);

      return {
        ...result,
        page,
        limit
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[ORDER_SERVICE] Vendor orders retrieval error:', error);
      throw new BusinessError('Failed to retrieve vendor orders');
    }
  }

  async updateOrderStatus(id: number, statusUpdate: OrderStatusUpdate, userId: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid order ID');
      }

      // Get existing order
      const existingOrder = await this.orderRepository.getOrderById(id);
      if (!existingOrder) {
        throw new NotFoundError('Order not found');
      }

      // Verify vendor ownership (only vendors can update order status)
      if (existingOrder.vendor?.userId !== userId) {
        throw new BusinessError('You can only update orders for your own vendor account');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(existingOrder.status, statusUpdate.status)) {
        throw new ValidationError(`Invalid status transition from ${existingOrder.status} to ${statusUpdate.status}`);
      }

      // Update order status
      const updatedOrder = await this.orderRepository.updateOrderStatus(id, statusUpdate.status, statusUpdate.notes);

      console.log(`[ORDER_SERVICE] Order status updated: ${id} -> ${statusUpdate.status}`);

      return updatedOrder;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[ORDER_SERVICE] Order status update error:', error);
      throw new BusinessError('Failed to update order status');
    }
  }

  async updatePaymentStatus(id: number, paymentStatus: string, userId: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid order ID');
      }

      // Get existing order
      const existingOrder = await this.orderRepository.getOrderById(id);
      if (!existingOrder) {
        throw new NotFoundError('Order not found');
      }

      // Verify vendor ownership (only vendors can update payment status)
      if (existingOrder.vendor?.userId !== userId) {
        throw new BusinessError('You can only update orders for your own vendor account');
      }

      // Validate payment status
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(paymentStatus)) {
        throw new ValidationError('Invalid payment status');
      }

      // Update payment status
      const updatedOrder = await this.orderRepository.updatePaymentStatus(id, paymentStatus);

      console.log(`[ORDER_SERVICE] Payment status updated: ${id} -> ${paymentStatus}`);

      return updatedOrder;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[ORDER_SERVICE] Payment status update error:', error);
      throw new BusinessError('Failed to update payment status');
    }
  }

  async cancelOrder(id: number, userId: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(id)) {
        throw new ValidationError('Invalid order ID');
      }

      // Get existing order
      const existingOrder = await this.orderRepository.getOrderById(id);
      if (!existingOrder) {
        throw new NotFoundError('Order not found');
      }

      // Verify ownership (user owns the order)
      if (existingOrder.userId !== userId) {
        throw new BusinessError('You can only cancel your own orders');
      }

      // Check if order can be cancelled
      const cancellableStatuses = ['pending', 'processing'];
      if (!cancellableStatuses.includes(existingOrder.status)) {
        throw new BusinessError('Order cannot be cancelled in its current status');
      }

      // Update order status to cancelled
      const updatedOrder = await this.orderRepository.updateOrderStatus(id, 'cancelled', 'Cancelled by customer');

      // Restore product stock
      for (const item of existingOrder.items) {
        const product = await this.productService.getProductById(item.productId);
        if (product && product.stockQuantity !== null) {
          const newStock = product.stockQuantity + item.quantity;
          await this.productService.updateProductStock(product.id, newStock, product.vendor.userId);
        }
      }

      console.log(`[ORDER_SERVICE] Order cancelled: ${id}`);

      return updatedOrder;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[ORDER_SERVICE] Order cancellation error:', error);
      throw new BusinessError('Failed to cancel order');
    }
  }

  private async validateOrderData(orderData: CreateOrderRequest): Promise<void> {
    if (!this.isPositiveNumber(orderData.vendorId)) {
      throw new ValidationError('Valid vendor ID is required');
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }

    // Validate items
    for (const item of orderData.items) {
      if (!this.isPositiveNumber(item.productId)) {
        throw new ValidationError('Valid product ID is required for all items');
      }

      if (!this.isPositiveNumber(item.quantity) || item.quantity < 1) {
        throw new ValidationError('Item quantity must be at least 1');
      }
    }

    // Validate shipping address
    if (!orderData.shippingAddress) {
      throw new ValidationError('Shipping address is required');
    }

    const address = orderData.shippingAddress;
    if (!address.fullName || address.fullName.length < 1) {
      throw new ValidationError('Full name is required in shipping address');
    }

    if (!address.address || address.address.length < 1) {
      throw new ValidationError('Address is required in shipping address');
    }

    if (!address.city || address.city.length < 1) {
      throw new ValidationError('City is required in shipping address');
    }

    if (!address.country || address.country.length < 1) {
      throw new ValidationError('Country is required in shipping address');
    }
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'returned'],
      'delivered': ['returned'],
      'cancelled': [], // Cannot transition from cancelled
      'returned': [] // Cannot transition from returned
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}