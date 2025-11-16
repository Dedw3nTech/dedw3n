import type { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { logger } from "./logger";

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
    logger.error("Failed to create membership payment intent", { tierId: req.body.tierId, communityId: req.body.communityId }, error, 'api');
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
    await storage.addCreatorEarning({
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
    logger.error("Failed to process membership payment", { paymentIntentId: req.body.paymentIntentId }, error, 'api');
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
    logger.error("Failed to create PayPal membership order", { tierId: req.body.tierId, communityId: req.body.communityId }, error, 'api');
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
    await storage.addCreatorEarning({
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
    logger.error("Failed to process PayPal membership payment", { orderId: req.body.orderId }, error, 'api');
    res.status(500).json({
      error: error.message || "Failed to process payment"
    });
  }
}

/**
 * Process e-wallet payment for membership
 */
export async function processEWalletMembershipPayment(req: Request, res: Response) {
  try {
    const { walletId, tierId, communityId, amount, currency } = req.body;
    const userId = (req.user as any).id;

    if (!walletId || !tierId || !communityId || !amount || !currency) {
      return res.status(400).json({ 
        error: "Missing required parameters. Please provide walletId, tierId, communityId, amount, and currency." 
      });
    }

    // Get user's wallet
    const wallet = await storage.getWalletById(walletId);
    if (!wallet || wallet.userId !== userId) {
      return res.status(404).json({ error: "Wallet not found or does not belong to the current user" });
    }

    // Check if wallet has sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance in wallet" });
    }

    // Get tier information
    const tier = await storage.getMembershipTier(tierId);
    if (!tier) {
      return res.status(404).json({ error: "Membership tier not found" });
    }

    if (tier.communityId !== communityId) {
      return res.status(400).json({ error: "Tier does not belong to specified community" });
    }

    // Calculate end date based on tier duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + tier.durationDays);

    // Create transaction record in wallet
    const transaction = await storage.createWalletTransaction({
      walletId: wallet.id,
      type: "debit",
      amount,
      category: "membership",
      paymentMethod: "wallet",
      status: "completed",
      description: `Membership payment for ${tier.name}`,
      metadata: JSON.stringify({
        tierId,
        communityId,
        membershipType: tier.name
      })
    });

    // Update wallet balance
    await storage.updateWallet(wallet.id, {
      balance: wallet.balance - amount
    });

    // Create the membership
    const membership = await storage.createMembership({
      userId,
      tierId,
      communityId,
      status: "active",
      paymentStatus: "paid",
      startDate,
      endDate,
      autoRenew: false // E-wallet payments typically don't auto-renew
    });

    // Create a record of this payment in the creator earnings table
    await storage.addCreatorEarning({
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
      membership,
      transaction
    });
  } catch (error: any) {
    logger.error("Failed to process e-wallet membership payment", { walletId: req.body.walletId, tierId: req.body.tierId }, error, 'api');
    res.status(500).json({
      error: error.message || "Failed to process e-wallet payment"
    });
  }
}

/**
 * Initiate mobile money payment for membership
 */
export async function initiateMobileMoneyMembershipPayment(req: Request, res: Response) {
  try {
    const { phoneNumber, provider, tierId, communityId, amount, currency } = req.body;
    const userId = (req.user as any).id;

    if (!phoneNumber || !provider || !tierId || !communityId || !amount || !currency) {
      return res.status(400).json({ 
        error: "Missing required parameters. Please provide phoneNumber, provider, tierId, communityId, amount, and currency."
      });
    }

    // Get the tier information
    const tier = await storage.getMembershipTier(tierId);
    if (!tier) {
      return res.status(404).json({ error: "Membership tier not found" });
    }

    if (tier.communityId !== communityId) {
      return res.status(400).json({ error: "Tier does not belong to specified community" });
    }

    // Get the community info for metadata
    const community = await storage.getCommunity(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // In a real implementation, you would integrate with a mobile money provider API
    // For now, we'll simulate a successful initiation
    
    // Generate a reference number for this payment
    const referenceNumber = `MM-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Calculate end date based on tier duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + tier.durationDays);

    // Store payment information for later verification
    // This would typically be handled by the mobile money provider in a webhook
    const pendingPayment = {
      referenceNumber,
      userId,
      tierId,
      communityId,
      phoneNumber,
      provider,
      amount,
      currency,
      status: "pending"
    };

    // In a real implementation, you would:
    // 1. Call mobile money provider's API to initiate payment
    // 2. Store the payment details in your database
    // 3. Handle webhook callbacks from the provider to confirm payment

    // Return payment reference and instructions
    res.json({
      success: true,
      referenceNumber,
      instructions: `Please confirm the payment prompt on your mobile device with number ${phoneNumber}`,
      tier
    });
  } catch (error: any) {
    logger.error("Failed to initiate mobile money membership payment", { provider: req.body.provider, tierId: req.body.tierId }, error, 'api');
    res.status(500).json({
      error: error.message || "Failed to initiate mobile money payment"
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
  app.post("/api/membership/payment/ewallet/process", processEWalletMembershipPayment);
  app.post("/api/membership/payment/mobile-money/initiate", initiateMobileMoneyMembershipPayment);
}