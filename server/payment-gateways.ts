import Stripe from 'stripe';
import { Client as PayPalClient, Environment, OrdersController, OAuthAuthorizationController } from '@paypal/paypal-server-sdk';

// Initialize payment gateways
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const paypalClient = new PayPalClient({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  },
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
});

const paypalOrdersController = new OrdersController(paypalClient);
const paypalAuthController = new OAuthAuthorizationController(paypalClient);

export interface PaymentGatewayInterface {
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>): Promise<any>;
  capturePayment(paymentId: string): Promise<any>;
  refundPayment(paymentId: string, amount?: number): Promise<any>;
  getPaymentStatus(paymentId: string): Promise<string>;
}

// Stripe Payment Gateway
export class StripeGateway implements PaymentGatewayInterface {
  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        gateway: 'stripe',
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount,
        currency,
      };
    } catch (error) {
      console.error('[Stripe] Error creating payment intent:', error);
      throw error;
    }
  }

  async capturePayment(paymentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentId);
      return {
        gateway: 'stripe',
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error('[Stripe] Error capturing payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        gateway: 'stripe',
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        currency: refund.currency,
      };
    } catch (error) {
      console.error('[Stripe] Error processing refund:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
      return paymentIntent.status;
    } catch (error) {
      console.error('[Stripe] Error getting payment status:', error);
      return 'unknown';
    }
  }
}

// PayPal Payment Gateway
export class PayPalGateway implements PaymentGatewayInterface {
  async getClientToken() {
    try {
      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
      ).toString('base64');

      const { result } = await paypalAuthController.requestToken(
        {
          authorization: `Basic ${auth}`,
        },
        { intent: 'sdk_init', response_type: 'client_token' },
      );

      return result.accessToken;
    } catch (error) {
      console.error('[PayPal] Error getting client token:', error);
      throw error;
    }
  }

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>) {
    try {
      const order = await paypalOrdersController.createOrder({
        body: {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency.toUpperCase(),
                value: amount.toFixed(2),
              },
              description: metadata.description || 'Commission Payment',
              custom_id: metadata.commission_period_id || '',
            },
          ],
          application_context: {
            return_url: `${process.env.BASE_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`}/payment/success`,
            cancel_url: `${process.env.BASE_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`}/payment/cancel`,
          },
        },
        prefer: 'return=representation',
      });

      const orderData = JSON.parse(String(order.body));
      const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

      return {
        gateway: 'paypal',
        paymentId: orderData.id,
        approvalUrl,
        status: orderData.status,
        amount,
        currency,
      };
    } catch (error) {
      console.error('[PayPal] Error creating order:', error);
      throw error;
    }
  }

  async capturePayment(paymentId: string) {
    try {
      const capture = await paypalOrdersController.captureOrder({
        id: paymentId,
        prefer: 'return=representation',
      });

      const captureData = JSON.parse(String(capture.body));
      
      return {
        gateway: 'paypal',
        paymentId: captureData.id,
        status: captureData.status,
        amount: parseFloat(captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0'),
        currency: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
      };
    } catch (error) {
      console.error('[PayPal] Error capturing payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    // PayPal refunds require capture ID, would need additional implementation
    throw new Error('PayPal refunds not implemented in this example');
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const order = await paypalOrdersController.getOrder({ id: paymentId });
      const orderData = JSON.parse(String(order.body));
      return orderData.status.toLowerCase();
    } catch (error) {
      console.error('[PayPal] Error getting payment status:', error);
      return 'unknown';
    }
  }
}

// Bank Transfer Gateway (Mock implementation)
export class BankTransferGateway implements PaymentGatewayInterface {
  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>) {
    // Generate a bank transfer reference
    const transferReference = `BT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      gateway: 'bank_transfer',
      paymentId: transferReference,
      bankDetails: {
        accountName: 'Dedw3n Ltd',
        accountNumber: '12345678',
        sortCode: '12-34-56',
        iban: 'GB29 NWBK 1234 5678 9012 34',
        bic: 'NWBKGB2L',
        reference: transferReference,
      },
      instructions: `Please transfer ${amount} ${currency.toUpperCase()} to the above account using reference: ${transferReference}`,
      status: 'pending_transfer',
      amount,
      currency,
    };
  }

  async capturePayment(paymentId: string) {
    // In a real implementation, this would check with the bank API
    return {
      gateway: 'bank_transfer',
      paymentId,
      status: 'completed',
      amount: 0,
      currency: 'GBP',
    };
  }

  async refundPayment(paymentId: string, amount?: number) {
    // Bank transfer refunds would require manual processing
    return {
      gateway: 'bank_transfer',
      refundId: `REF${paymentId}`,
      status: 'pending_manual_processing',
      amount: amount || 0,
      currency: 'GBP',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    // In a real implementation, this would check with the bank API
    return 'pending_transfer';
  }
}

// Mobile Money Gateway (Mock implementation for African markets)
export class MobileMoneyGateway implements PaymentGatewayInterface {
  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>) {
    const transactionId = `MM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      gateway: 'mobile_money',
      paymentId: transactionId,
      instructions: {
        provider: 'M-Pesa', // Could be M-Pesa, Airtel Money, etc.
        payBill: '400200',
        accountNumber: transactionId,
        amount,
        currency,
      },
      ussdCode: `*150*00#`,
      status: 'pending_payment',
      amount,
      currency,
    };
  }

  async capturePayment(paymentId: string) {
    return {
      gateway: 'mobile_money',
      paymentId,
      status: 'completed',
      amount: 0,
      currency: 'KES',
    };
  }

  async refundPayment(paymentId: string, amount?: number) {
    return {
      gateway: 'mobile_money',
      refundId: `REF${paymentId}`,
      status: 'completed',
      amount: amount || 0,
      currency: 'KES',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<string> {
    return 'pending_payment';
  }
}

// Payment Gateway Factory
export class PaymentGatewayFactory {
  private gateways: Map<string, PaymentGatewayInterface> = new Map();

  constructor() {
    this.gateways.set('stripe', new StripeGateway());
    this.gateways.set('paypal', new PayPalGateway());
    this.gateways.set('bank_transfer', new BankTransferGateway());
    this.gateways.set('mobile_money', new MobileMoneyGateway());
  }

  getGateway(gatewayType: string): PaymentGatewayInterface {
    const gateway = this.gateways.get(gatewayType);
    if (!gateway) {
      throw new Error(`Payment gateway ${gatewayType} not supported`);
    }
    return gateway;
  }

  getSupportedGateways(): string[] {
    return Array.from(this.gateways.keys());
  }

  async createPayment(
    gatewayType: string,
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ) {
    const gateway = this.getGateway(gatewayType);
    return gateway.createPaymentIntent(amount, currency, metadata);
  }

  async capturePayment(gatewayType: string, paymentId: string) {
    const gateway = this.getGateway(gatewayType);
    return gateway.capturePayment(paymentId);
  }

  async refundPayment(gatewayType: string, paymentId: string, amount?: number) {
    const gateway = this.getGateway(gatewayType);
    return gateway.refundPayment(paymentId, amount);
  }

  async getPaymentStatus(gatewayType: string, paymentId: string): Promise<string> {
    const gateway = this.getGateway(gatewayType);
    return gateway.getPaymentStatus(paymentId);
  }
}

// Export singleton instance
export const paymentGatewayFactory = new PaymentGatewayFactory();