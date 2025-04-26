import type { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

// Initialize Stripe with the secret key
// We'll use a placeholder configuration for now
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" })
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
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Process successful payment
        // Update order status, etc.
        break;
      case "payment_intent.payment_failed":
        // Handle failed payment
        break;
      // Add more event handlers as needed
    }

    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Register payment-related routes to the Express app
 */
export function registerPaymentRoutes(app: any) {
  app.post("/api/payments/create-intent", createPaymentIntent);
  app.post("/api/payments/success", handlePaymentSuccess);
  app.post("/api/payments/create-customer", createStripeCustomer);
  app.post("/api/payments/webhook", handleStripeWebhook);
}