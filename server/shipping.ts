import type { Request, Response } from "express";

// Define shipping methods and rates
export const shippingMethods = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Delivery in 3-5 business days",
    basePrice: 4.99,
    freeShippingThreshold: 50,
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "Delivery in 1-2 business days",
    basePrice: 9.99,
    freeShippingThreshold: 100,
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    description: "Next day delivery",
    basePrice: 19.99,
    freeShippingThreshold: 150,
  },
];

/**
 * Calculate shipping cost based on order total and shipping method
 */
export function calculateShippingCost(orderTotal: number, shippingMethodId: string): number {
  const method = shippingMethods.find(m => m.id === shippingMethodId);
  if (!method) {
    throw new Error(`Shipping method '${shippingMethodId}' not found`);
  }

  // Free shipping if order total exceeds the threshold
  if (orderTotal >= method.freeShippingThreshold) {
    return 0;
  }

  return method.basePrice;
}

/**
 * Get available shipping methods
 */
export function getShippingMethods(req: Request, res: Response) {
  res.json(shippingMethods);
}

/**
 * Calculate shipping cost for an order
 */
export function calculateShipping(req: Request, res: Response) {
  try {
    const { orderTotal, shippingMethodId } = req.body;

    if (typeof orderTotal !== 'number' || orderTotal < 0) {
      return res.status(400).json({ error: "Valid order total is required" });
    }

    if (!shippingMethodId || typeof shippingMethodId !== 'string') {
      return res.status(400).json({ error: "Valid shipping method ID is required" });
    }

    const shippingCost = calculateShippingCost(orderTotal, shippingMethodId);
    
    res.json({
      shippingCost,
      total: orderTotal + shippingCost,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Validate shipping address
 */
export function validateAddress(req: Request, res: Response) {
  try {
    const { 
      name, 
      street, 
      city, 
      state, 
      postalCode, 
      country 
    } = req.body;

    // Basic validation
    if (!name || !street || !city || !state || !postalCode || !country) {
      return res.status(400).json({
        valid: false,
        error: "All address fields are required",
      });
    }

    // Additional validation could be added here in a real app
    // For example, checking postal code format, etc.

    res.json({
      valid: true,
      formattedAddress: {
        name,
        street,
        city,
        state,
        postalCode,
        country,
      }
    });
  } catch (error: any) {
    res.status(400).json({ 
      valid: false,
      error: error.message 
    });
  }
}

/**
 * Register shipping-related routes to the Express app
 */
export function registerShippingRoutes(app: any) {
  app.get("/api/shipping/methods", getShippingMethods);
  app.post("/api/shipping/calculate", calculateShipping);
  app.post("/api/shipping/validate-address", validateAddress);
}