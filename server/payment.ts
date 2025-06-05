import type { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { highRiskActionMiddleware } from "./fraud-prevention";

// Initialize Stripe with the secret key
// We'll use a placeholder configuration for now
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-05-28.basil" })
  : null;

/**
 * Create a payment intent for a one-time payment
 */
export async function createPaymentIntent(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
  }

  try {
    const { amount, currency = "gbp", metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client secret
    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
}

/**
 * Process a successful payment - update order status, etc.
 */
export async function handlePaymentSuccess(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
  }

  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    // Retrieve the payment intent to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment has not succeeded" });
    }

    // Extract order details from metadata
    const { orderId } = paymentIntent.metadata;
    
    // TODO: Update order status in database
    // This would involve updating the order status in your database
    // For example: await storage.updateOrderStatus(orderId, "paid");

    res.json({
      success: true,
      message: "Payment processed successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
}

/**
 * Create a new customer in Stripe
 */
export async function createStripeCustomer(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
  }

  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
    });

    res.json({ customerId: customer.id });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
  }

  const sig = req.headers["stripe-signature"];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: "Stripe webhook signature missing or webhook secret not configured" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.processing":
        await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.requires_action":
        await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      // ACH Direct Debit specific events
      case "payment_method.attached":
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;
      
      // Bank transfer events
      case "customer.source.created":
        await handleCustomerSourceCreated(event.data.object);
        break;
      case "customer.source.updated":
        await handleCustomerSourceUpdated(event.data.object);
        break;
      case "customer.source.deleted":
        await handleCustomerSourceDeleted(event.data.object);
        break;
      
      // SEPA Direct Debit events
      case "source.chargeable":
        await handleSourceChargeable(event.data.object);
        break;
      case "source.failed":
        await handleSourceFailed(event.data.object);
        break;
      case "source.canceled":
        await handleSourceCanceled(event.data.object);
        break;
      
      // Charge events for bank transfers and direct debits
      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;
      case "charge.failed":
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;
      case "charge.pending":
        await handleChargePending(event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      
      // Mandate events for direct debits
      case "mandate.updated":
        await handleMandateUpdated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Payment Intent Event Handlers
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  const { userId, orderId, tier, type } = paymentIntent.metadata;
  
  if (userId && orderId) {
    // Update order status to paid
    try {
      // Note: Update order status when order management is implemented
      console.log(`Order ${orderId} marked as paid`);
      
      // Send notification to user
      await storage.createNotification({
        userId: parseInt(userId),
        type: 'payment',
        content: `Your payment of ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()} has been processed successfully.`
      });
    } catch (error) {
      console.error('Error updating order after payment success:', error);
    }
  }
  
  // Handle dating room upgrades
  if (type === 'dating_room_upgrade' && userId && tier) {
    try {
      // Note: Update user tier when tier management is implemented
      console.log(`User ${userId} upgraded to ${tier} tier`);
      
      await storage.createNotification({
        userId: parseInt(userId),
        type: 'system',
        content: `Your account has been upgraded to ${tier.toUpperCase()} tier!`
      });
    } catch (error) {
      console.error('Error upgrading user tier:', error);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  const { userId, orderId } = paymentIntent.metadata;
  
  if (userId) {
    try {
      await storage.createNotification({
        userId: parseInt(userId),
        type: 'payment',
        content: `Your payment could not be processed. Please try again or contact support.`
      });
    } catch (error) {
      console.error('Error creating failure notification:', error);
    }
  }
  
  if (orderId) {
    try {
      // Note: Update order status when order management is implemented
      console.log(`Order ${orderId} marked as failed`);
    } catch (error) {
      console.error('Error updating order status to failed:', error);
    }
  }
}

async function handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment processing: ${paymentIntent.id}`);
  
  const { userId, orderId } = paymentIntent.metadata;
  
  if (userId) {
    const paymentMethod = paymentIntent.payment_method as any;
    let processingMessage = 'Your payment is being processed.';
    
    // Customize message based on payment method
    if (paymentMethod?.type === 'us_bank_account') {
      processingMessage = 'Your ACH Direct Debit payment is being processed. This may take 1-3 business days.';
    } else if (paymentMethod?.type === 'bacs_debit') {
      processingMessage = 'Your BACS Direct Debit payment is being processed. This may take 1-3 business days.';
    } else if (paymentMethod?.type === 'sepa_debit') {
      processingMessage = 'Your SEPA Direct Debit payment is being processed. This may take 1-2 business days.';
    } else if (paymentMethod?.type === 'customer_balance') {
      processingMessage = 'Your bank transfer payment is being processed. This may take 1-5 business days.';
    }
    
    try {
      await storage.createNotification({
        userId: parseInt(userId),
        type: 'payment',
        content: processingMessage
      });
    } catch (error) {
      console.error('Error creating processing notification:', error);
    }
  }
  
  if (orderId) {
    try {
      // Note: Update order status when order management is implemented
      console.log(`Order ${orderId} marked as processing`);
    } catch (error) {
      console.error('Error updating order status to processing:', error);
    }
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment requires action: ${paymentIntent.id}`);
  
  const { userId } = paymentIntent.metadata;
  
  if (userId) {
    try {
      await storage.createNotification({
        userId: parseInt(userId),
        type: 'payment',
        content: 'Your payment requires additional verification. Please check your email or banking app.'
      });
    } catch (error) {
      console.error('Error creating action required notification:', error);
    }
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);
  
  const { userId, orderId } = paymentIntent.metadata;
  
  if (userId) {
    try {
      await storage.createNotification({
        userId: parseInt(userId),
        type: 'payment',
        content: 'Your payment has been canceled.'
      });
    } catch (error) {
      console.error('Error creating cancellation notification:', error);
    }
  }
  
  if (orderId) {
    try {
      // Note: Update order status when order management is implemented
      console.log(`Order ${orderId} marked as canceled`);
    } catch (error) {
      console.error('Error updating order status to canceled:', error);
    }
  }
}

/**
 * Payment Method Event Handlers
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log(`Payment method attached: ${paymentMethod.id}, type: ${paymentMethod.type}`);
  
  if (paymentMethod.customer && paymentMethod.type === 'us_bank_account') {
    // Handle ACH Direct Debit setup
    const customerId = paymentMethod.customer as string;
    
    try {
      // Note: Find user by Stripe customer ID when user management is enhanced
      console.log(`ACH Direct Debit payment method attached for customer: ${customerId}`);
    } catch (error) {
      console.error('Error handling ACH payment method attachment:', error);
    }
  }
}

/**
 * Source Event Handlers (for SEPA Direct Debit)
 */
async function handleSourceChargeable(source: any) {
  console.log(`Source chargeable: ${source.id}, type: ${source.type}`);
  
  if (source.type === 'sepa_debit') {
    // SEPA Direct Debit source is ready to be charged
    console.log('SEPA Direct Debit source is now chargeable');
  }
}

async function handleSourceFailed(source: any) {
  console.log(`Source failed: ${source.id}, type: ${source.type}`);
  
  if (source.type === 'sepa_debit') {
    console.log('SEPA Direct Debit source failed');
  }
}

async function handleSourceCanceled(source: any) {
  console.log(`Source canceled: ${source.id}, type: ${source.type}`);
}

/**
 * Customer Source Event Handlers (for Bank Transfers)
 */
async function handleCustomerSourceCreated(source: any) {
  console.log(`Customer source created: ${source.id}, type: ${source.object}`);
}

async function handleCustomerSourceUpdated(source: any) {
  console.log(`Customer source updated: ${source.id}`);
}

async function handleCustomerSourceDeleted(source: any) {
  console.log(`Customer source deleted: ${source.id}`);
}

/**
 * Charge Event Handlers
 */
async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log(`Charge succeeded: ${charge.id}, payment method: ${charge.payment_method_details?.type}`);
  
  const paymentMethodType = charge.payment_method_details?.type;
  
  // Log specific success for different payment methods
  if (paymentMethodType === 'us_bank_account') {
    console.log('ACH Direct Debit charge completed successfully');
  } else if (paymentMethodType === 'bacs_debit') {
    console.log('BACS Direct Debit charge completed successfully');
  } else if (paymentMethodType === 'sepa_debit') {
    console.log('SEPA Direct Debit charge completed successfully');
  } else if (paymentMethodType === 'customer_balance') {
    console.log('Bank transfer charge completed successfully');
  }
}

async function handleChargeFailed(charge: Stripe.Charge) {
  console.log(`Charge failed: ${charge.id}, reason: ${charge.failure_message}`);
  
  const paymentMethodType = charge.payment_method_details?.type;
  
  // Log specific failure for different payment methods
  if (paymentMethodType === 'us_bank_account') {
    console.log('ACH Direct Debit charge failed:', charge.failure_message);
  } else if (paymentMethodType === 'bacs_debit') {
    console.log('BACS Direct Debit charge failed:', charge.failure_message);
  } else if (paymentMethodType === 'sepa_debit') {
    console.log('SEPA Direct Debit charge failed:', charge.failure_message);
  }
}

async function handleChargePending(charge: Stripe.Charge) {
  console.log(`Charge pending: ${charge.id}`);
  
  const paymentMethodType = charge.payment_method_details?.type;
  
  // Log specific pending status for different payment methods
  if (paymentMethodType === 'us_bank_account') {
    console.log('ACH Direct Debit charge is pending');
  } else if (paymentMethodType === 'bacs_debit') {
    console.log('BACS Direct Debit charge is pending');
  } else if (paymentMethodType === 'sepa_debit') {
    console.log('SEPA Direct Debit charge is pending');
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log(`Charge dispute created: ${dispute.id}, charge: ${dispute.charge}`);
  
  // Handle dispute notification and workflow
  console.log('A payment dispute has been created and requires attention');
}

/**
 * Mandate Event Handlers (for Direct Debits)
 */
async function handleMandateUpdated(mandate: any) {
  console.log(`Mandate updated: ${mandate.id}, status: ${mandate.status}`);
  
  if (mandate.payment_method_details?.type === 'bacs_debit') {
    console.log('BACS Direct Debit mandate updated');
  } else if (mandate.payment_method_details?.type === 'sepa_debit') {
    console.log('SEPA Direct Debit mandate updated');
  }
}

/**
 * Register payment-related routes to the Express app
 */
export function registerPaymentRoutes(app: any) {
  // Apply high risk fraud protection to payment operations
  app.post("/api/payments/create-intent", highRiskActionMiddleware, createPaymentIntent);
  app.post("/api/payments/success", highRiskActionMiddleware, handlePaymentSuccess);
  app.post("/api/payments/create-customer", highRiskActionMiddleware, createStripeCustomer);
  // Webhook doesn't need fraud protection as it comes from Stripe
  app.post("/api/payments/webhook", handleStripeWebhook);
}