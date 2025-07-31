import { BaseService } from '../core/base.service';
import { OrderService } from './order.service';
import { VendorService } from './vendor.service';
import { BusinessError, ValidationError, NotFoundError } from '../core/errors';

export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'paypal' | 'bank_transfer' | 'wallet';
  provider: string;
  details: {
    cardLast4?: string;
    cardBrand?: string;
    email?: string;
    accountNumber?: string;
    bankName?: string;
  };
  isDefault: boolean;
  isActive: boolean;
}

export interface PaymentRequest {
  orderId: number;
  paymentMethodId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: object;
}

export interface PaymentResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transactionId?: string;
  providerResponse?: object;
  errorMessage?: string;
  createdAt: Date;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

export interface RefundResult {
  id: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
  createdAt: Date;
}

export class PaymentService extends BaseService {
  
  constructor(
    private orderService: OrderService,
    private vendorService: VendorService
  ) {
    super();
  }

  async processPayment(paymentRequest: PaymentRequest, userId: number): Promise<PaymentResult> {
    try {
      // Validate input
      await this.validatePaymentRequest(paymentRequest);

      // Verify order exists and user has access
      const order = await this.orderService.getOrderById(paymentRequest.orderId, userId);
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Verify payment amount matches order total
      if (paymentRequest.amount !== order.totalAmount) {
        throw new ValidationError('Payment amount does not match order total');
      }

      // Process payment based on method type
      const paymentResult = await this.executePayment(paymentRequest, order);

      // Update order payment status
      if (paymentResult.status === 'completed') {
        await this.orderService.updatePaymentStatus(order.id, 'completed', userId);
        await this.orderService.updateOrderStatus(order.id, { status: 'processing' }, order.vendor.userId);
      } else if (paymentResult.status === 'failed') {
        await this.orderService.updatePaymentStatus(order.id, 'failed', userId);
      }

      console.log(`[PAYMENT_SERVICE] Payment processed: ${paymentResult.id} for order ${order.id}`);

      return paymentResult;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PAYMENT_SERVICE] Payment processing error:', error);
      throw new BusinessError('Payment processing failed');
    }
  }

  async refundPayment(refundRequest: RefundRequest, userId: number): Promise<RefundResult> {
    try {
      // Validate input
      if (!refundRequest.paymentId) {
        throw new ValidationError('Payment ID is required');
      }

      if (refundRequest.amount !== undefined && !this.isPositiveNumber(refundRequest.amount)) {
        throw new ValidationError('Refund amount must be positive');
      }

      // TODO: Implement refund logic with payment providers
      // For now, return success placeholder
      const refundResult: RefundResult = {
        id: this.generateTransactionId(),
        paymentId: refundRequest.paymentId,
        amount: refundRequest.amount || 0,
        status: 'completed',
        reason: refundRequest.reason,
        createdAt: new Date()
      };

      console.log(`[PAYMENT_SERVICE] Refund processed: ${refundResult.id}`);

      return refundResult;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PAYMENT_SERVICE] Refund processing error:', error);
      throw new BusinessError('Refund processing failed');
    }
  }

  async getPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    try {
      // TODO: Implement payment method retrieval from providers
      // For now, return empty array placeholder
      return [];
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Payment methods retrieval error:', error);
      throw new BusinessError('Failed to retrieve payment methods');
    }
  }

  async addPaymentMethod(userId: number, paymentMethodData: any): Promise<PaymentMethod> {
    try {
      // TODO: Implement payment method addition with providers
      // For now, return placeholder
      const paymentMethod: PaymentMethod = {
        id: this.generateTransactionId(),
        type: paymentMethodData.type || 'stripe',
        provider: paymentMethodData.provider || 'Stripe',
        details: paymentMethodData.details || {},
        isDefault: false,
        isActive: true
      };

      console.log(`[PAYMENT_SERVICE] Payment method added: ${paymentMethod.id} for user ${userId}`);

      return paymentMethod;
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Payment method addition error:', error);
      throw new BusinessError('Failed to add payment method');
    }
  }

  async removePaymentMethod(paymentMethodId: string, userId: number): Promise<boolean> {
    try {
      if (!paymentMethodId) {
        throw new ValidationError('Payment method ID is required');
      }

      // TODO: Implement payment method removal with providers
      // For now, return success placeholder
      console.log(`[PAYMENT_SERVICE] Payment method removed: ${paymentMethodId} for user ${userId}`);

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PAYMENT_SERVICE] Payment method removal error:', error);
      throw new BusinessError('Failed to remove payment method');
    }
  }

  async calculateCommission(orderId: number): Promise<{ vendorAmount: number; platformCommission: number; commissionRate: number }> {
    try {
      if (!this.isPositiveNumber(orderId)) {
        throw new ValidationError('Invalid order ID');
      }

      // Get order details
      const order = await this.orderService.getOrderById(orderId, 0); // Use 0 as userId for internal access
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Calculate commission (15% platform rate)
      const commissionRate = 0.15;
      const platformCommission = order.totalAmount * commissionRate;
      const vendorAmount = order.totalAmount - platformCommission;

      return {
        vendorAmount,
        platformCommission,
        commissionRate
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PAYMENT_SERVICE] Commission calculation error:', error);
      throw new BusinessError('Failed to calculate commission');
    }
  }

  async processVendorPayout(vendorId: number, amount: number, adminUserId: number): Promise<any> {
    try {
      if (!this.isPositiveNumber(vendorId)) {
        throw new ValidationError('Invalid vendor ID');
      }

      if (!this.isPositiveNumber(amount)) {
        throw new ValidationError('Payout amount must be positive');
      }

      // Verify vendor exists
      const vendor = await this.vendorService.getVendorById(vendorId);
      if (!vendor) {
        throw new NotFoundError('Vendor not found');
      }

      // TODO: Implement vendor payout with payment providers
      // For now, return success placeholder
      const payoutResult = {
        id: this.generateTransactionId(),
        vendorId,
        amount,
        status: 'completed',
        processedBy: adminUserId,
        createdAt: new Date()
      };

      console.log(`[PAYMENT_SERVICE] Vendor payout processed: ${payoutResult.id} for vendor ${vendorId}`);

      return payoutResult;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('[PAYMENT_SERVICE] Vendor payout error:', error);
      throw new BusinessError('Failed to process vendor payout');
    }
  }

  async getPaymentHistory(userId: number, page: number = 1, limit: number = 20): Promise<{ payments: any[]; total: number; hasMore: boolean }> {
    try {
      // Validate pagination
      if (!this.isPositiveNumber(page) || page < 1) {
        throw new ValidationError('Page must be a positive number');
      }

      if (!this.isPositiveNumber(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      // TODO: Implement payment history retrieval
      // For now, return empty results
      return {
        payments: [],
        total: 0,
        hasMore: false
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PAYMENT_SERVICE] Payment history retrieval error:', error);
      throw new BusinessError('Failed to retrieve payment history');
    }
  }

  async validatePaymentStatus(paymentId: string): Promise<PaymentResult> {
    try {
      if (!paymentId) {
        throw new ValidationError('Payment ID is required');
      }

      // TODO: Implement payment status validation with providers
      // For now, return placeholder
      return {
        id: paymentId,
        status: 'completed',
        amount: 0,
        currency: 'GBP',
        createdAt: new Date()
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('[PAYMENT_SERVICE] Payment status validation error:', error);
      throw new BusinessError('Failed to validate payment status');
    }
  }

  private async executePayment(paymentRequest: PaymentRequest, order: any): Promise<PaymentResult> {
    // TODO: Implement actual payment processing with Stripe/PayPal
    // For now, simulate successful payment
    return {
      id: this.generateTransactionId(),
      status: 'completed',
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      transactionId: this.generateTransactionId(),
      createdAt: new Date()
    };
  }

  private async validatePaymentRequest(paymentRequest: PaymentRequest): Promise<void> {
    if (!this.isPositiveNumber(paymentRequest.orderId)) {
      throw new ValidationError('Valid order ID is required');
    }

    if (!paymentRequest.paymentMethodId) {
      throw new ValidationError('Payment method ID is required');
    }

    if (!this.isPositiveNumber(paymentRequest.amount)) {
      throw new ValidationError('Payment amount must be positive');
    }

    if (!paymentRequest.currency || paymentRequest.currency.length !== 3) {
      throw new ValidationError('Valid currency code is required');
    }
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }
}