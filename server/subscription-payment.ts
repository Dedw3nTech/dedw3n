import type { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

// Initialize Stripe with the secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" })
  : null;

/**
 * Create a Stripe payment intent for a membership subscription
 */
export async function createMembershipPaymentIntent(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
  }

  try {
    const { tierId, communityId } = req.body;
    const userId = (req.user as any).id;

    if (!tierId || !communityId) {
      return res.status(400).json({ error: "Tier ID and Community ID are required" });
    }

    // Get the membership tier to determine price
    const tier = await storage.getMembershipTier(tierId);
    if (!tier) {
      return res.status(404).json({ error: "Membership tier not found" });
    }

    if (tier.communityId !== communityId) {
      return res.status(400).json({ error: "Tier does not belong to specified community" });
    }

    if (!tier.isActive) {
      return res.status(400).json({ error: "This membership tier is not currently available" });
    }

    if (tier.price <= 0) {
      return res.status(400).json({ error: "Free tiers don't require payment processing" });
    }

    // Get the community info for metadata
    const community = await storage.getCommunity(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Create a payment intent with metadata
    const amount = Math.round(tier.price * 100); // Convert to cents
    const currency = tier.currency.toLowerCase();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        userId: userId.toString(),
        tierId: tierId.toString(),
        communityId: communityId.toString(),
        tierName: tier.name,
        communityName: community.name
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return the client secret
    res.json({
      clientSecret: paymentIntent.client_secret,
      tier
    });
  } catch (error: any) {
    console.error("Error creating membership payment intent:", error);
    res.status(500).json({
      error: error.message || "Failed to create payment intent"
    });
  }
}

/**
 * Process a successful membership payment (Stripe webhook handler or direct confirmation)
 */
export async function processMembershipPayment(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.body;
    
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." });
    }

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    // Retrieve the payment intent to verify its status and get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment has not succeeded" });
    }

    // Extract membership details from metadata
    const { userId, tierId, communityId } = paymentIntent.metadata;
    
    if (!userId || !tierId || !communityId) {
      return res.status(400).json({ error: "Missing required metadata in payment intent" });
    }

    // Get the tier to determine duration
    const tier = await storage.getMembershipTier(parseInt(tierId));
    if (!tier) {
      return res.status(404).json({ error: "Membership tier not found" });
    }

    // Calculate end date based on tier duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + tier.durationDays);

    // Create the membership
    const membership = await storage.createMembership({
      userId: parseInt(userId),
      tierId: parseInt(tierId),
      communityId: parseInt(communityId),
      status: "active",
      paymentStatus: "paid",
      startDate,
      endDate,
      autoRenew: true
    });

    // Create a record of this payment in the creator earnings table
    await storage.createCreatorEarning({
      userId: parseInt(userId),
      communityId: parseInt(communityId),
      amount: tier.price,
      currency: tier.currency,
      source: "membership",
      sourceId: membership.id,
      status: "paid",
      platformFee: tier.price * 0.1, // 10% platform fee (adjust as needed)
      netAmount: tier.price * 0.9 // 90% goes to creator after platform fee
    });

    res.json({
      success: true,
      membership
    });
  } catch (error: any) {
    console.error("Error processing membership payment:", error);
    res.status(500).json({
      error: error.message || "Failed to process payment"
    });
  }
}

/**
 * Create a PayPal order for a membership subscription
 */
export async function createPaypalMembershipOrder(req: Request, res: Response) {
  try {
    const { tierId, communityId } = req.body;
    const userId = (req.user as any).id;

    if (!tierId || !communityId) {
      return res.status(400).json({ error: "Tier ID and Community ID are required" });
    }

    // Get the membership tier to determine price
    const tier = await storage.getMembershipTier(tierId);
    if (!tier) {
      return res.status(404).json({ error: "Membership tier not found" });
    }

    if (tier.communityId !== communityId) {
      return res.status(400).json({ error: "Tier does not belong to specified community" });
    }

    if (!tier.isActive) {
      return res.status(400).json({ error: "This membership tier is not currently available" });
    }

    if (tier.price <= 0) {
      return res.status(400).json({ error: "Free tiers don't require payment processing" });
    }

    // Get the community info for order details
    const community = await storage.getCommunity(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // For now, we'll use the simplified PayPal order creation from paypal.ts
    // In a production environment, this would be replaced with actual PayPal API calls
    const customId = JSON.stringify({
      userId,
      tierId,
      communityId,
      tierName: tier.name,
      communityName: community.name
    });

    const randomOrderId = `PAYPAL-${Math.random().toString(36).substring(2, 15)}`;
    
    return res.json({
      id: randomOrderId,
      customId,
      status: "CREATED",
      tier,
      links: [
        {
          href: `https://www.sandbox.paypal.com/checkoutnow?token=${randomOrderId}`,
          rel: "approve",
          method: "GET"
        }
      ]
    });
  } catch (error: any) {
    console.error("Error creating PayPal membership order:", error);
    res.status(500).json({
      error: error.message || "Failed to create PayPal order"
    });
  }
}

/**
 * Process a successful PayPal order capture for a membership
 */
export async function processPaypalMembership(req: Request, res: Response) {
  try {
    const { orderId, customId } = req.body;
    
    if (!orderId || !customId) {
      return res.status(400).json({ error: "Order ID and Custom ID are required" });
    }

    // Parse the custom ID to extract membership details
    let membershipData;
    try {
      membershipData = JSON.parse(customId);
    } catch (e) {
      return res.status(400).json({ error: "Invalid Custom ID format" });
    }

    const { userId, tierId, communityId } = membershipData;
    
    if (!userId || !tierId || !communityId) {
      return res.status(400).json({ error: "Missing required data in order" });
    }

    // Get the tier to determine duration
    const tier = await storage.getMembershipTier(tierId);
    if (!tier) {
      return res.status(404).json({ error: "Membership tier not found" });
    }

    // Calculate end date based on tier duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + tier.durationDays);

    // Create the membership
    const membership = await storage.createMembership({
      userId,
      tierId,
      communityId,
      status: "active",
      paymentStatus: "paid",
      startDate,
      endDate,
      autoRenew: true
    });

    // Create a record of this payment in the creator earnings table
    await storage.createCreatorEarning({
      userId,
      communityId,
      amount: tier.price,
      currency: tier.currency,
      source: "membership",
      sourceId: membership.id,
      status: "paid",
      platformFee: tier.price * 0.1, // 10% platform fee (adjust as needed)
      netAmount: tier.price * 0.9 // 90% goes to creator after platform fee
    });

    res.json({
      success: true,
      membership
    });
  } catch (error: any) {
    console.error("Error processing PayPal membership payment:", error);
    res.status(500).json({
      error: error.message || "Failed to process payment"
    });
  }
}

/**
 * Register subscription payment-related routes
 */
export function registerSubscriptionPaymentRoutes(app: any) {
  app.post("/api/membership/payment/stripe/create-intent", createMembershipPaymentIntent);
  app.post("/api/membership/payment/stripe/process", processMembershipPayment);
  app.post("/api/membership/payment/paypal/create-order", createPaypalMembershipOrder);
  app.post("/api/membership/payment/paypal/process", processPaypalMembership);
}