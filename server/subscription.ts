import { Request, Response, Express, NextFunction } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./unified-auth";

/**
 * Check if the user has an active subscription or free trial
 */
export async function getSubscriptionStatus(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const subscription = await storage.getUserSubscription(req.user.id);
    
    // If no subscription exists, return none status
    if (!subscription) {
      return res.json({
        status: 'none',
        trialDaysLeft: null,
        expiresAt: null,
        isActive: false
      });
    }

    const now = new Date();
    
    // Check if subscription has expired
    // Access expiresAt as subscription.expiresAt
    if (subscription.expiresAt && new Date(subscription.expiresAt) < now) {
      return res.json({
        status: 'expired',
        trialDaysLeft: null,
        expiresAt: subscription.expiresAt,
        isActive: false
      });
    }

    // Check if it's a trial
    const isTrial = subscription.status === 'trial';
    let trialDaysLeft = null;
    
    if (isTrial && subscription.expiresAt) {
      const expiresAtDate = new Date(subscription.expiresAt);
      const diffTime = Math.abs(expiresAtDate.getTime() - now.getTime());
      trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return res.json({
      status: subscription.status,
      trialDaysLeft,
      expiresAt: subscription.expiresAt,
      isActive: true
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Activate a paid subscription
 */
export async function activateSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Create a subscription that lasts 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const subscription = await storage.createOrUpdateSubscription({
      userId: req.user.id,
      status: 'active',
      plan: 'premium',
      expiresAt,
      createdAt: new Date()
    });

    return res.status(201).json({
      status: 'active',
      expiresAt,
      isActive: true
    });
  } catch (error) {
    console.error("Error activating subscription:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Activate a free trial subscription
 */
export async function activateTrial(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    // Check if user already had a trial
    const existingSubscription = await storage.getUserSubscription(req.user.id);
    if (existingSubscription && existingSubscription.status === 'trial') {
      return res.status(400).json({ message: "Trial already activated" });
    }

    // Create a trial that lasts 14 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const subscription = await storage.createOrUpdateSubscription({
      userId: req.user.id,
      status: 'trial',
      plan: 'premium',
      expiresAt,
      createdAt: new Date()
    });

    return res.status(201).json({
      status: 'trial',
      trialDaysLeft: 14,
      expiresAt,
      isActive: true
    });
  } catch (error) {
    console.error("Error activating trial:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Cancel an active subscription
 */
export async function cancelSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const subscription = await storage.getUserSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Update subscription status to cancelled
    const updatedSubscription = await storage.createOrUpdateSubscription({
      ...subscription,
      status: 'cancelled',
      updatedAt: new Date()
    });

    return res.json({
      status: 'cancelled',
      isActive: false
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Authentication middleware for subscription-protected routes
 */
export const hasActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const subscription = await storage.getUserSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(403).json({ 
        message: "Subscription required",
        subscriptionStatus: 'none'
      });
    }

    const now = new Date();
    const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
    
    // Check if subscription has expired
    if (expiresAt && expiresAt < now) {
      return res.status(403).json({ 
        message: "Subscription expired",
        subscriptionStatus: 'expired'
      });
    }

    // User has an active subscription
    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Register subscription routes
 */
export function registerSubscriptionRoutes(app: Express) {
  // Get subscription status
  app.get('/api/subscription/status', getSubscriptionStatus);
  
  // Activate subscription (in a real app, this would integrate with a payment gateway)
  app.post('/api/subscription/activate', activateSubscription);
  
  // Activate free trial
  app.post('/api/subscription/activate-trial', activateTrial);
  
  // Cancel subscription
  app.post('/api/subscription/cancel', cancelSubscription);
}