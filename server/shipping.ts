import { Request, Response } from "express";
import { z } from "zod";

export const shippingMethods = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Delivery in 5-7 business days",
    basePrice: 4.99,
    freeShippingThreshold: 50
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "Delivery in 2-3 business days",
    basePrice: 12.99,
    freeShippingThreshold: 100
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    description: "Next day delivery (order before 2pm)",
    basePrice: 24.99,
    freeShippingThreshold: 150
  }
];

/**
 * Calculate shipping cost based on order total and shipping method
 */
export function calculateShippingCost(orderTotal: number, shippingMethodId: string): number {
  const method = shippingMethods.find(m => m.id === shippingMethodId);
  
  if (!method) {
    throw new Error(`Shipping method with ID ${shippingMethodId} not found`);
  }
  
  // Free shipping if order meets the threshold
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
  const schema = z.object({
    orderTotal: z.number().min(0),
    shippingMethodId: z.string().min(1)
  });

  try {
    const { orderTotal, shippingMethodId } = schema.parse(req.body);
    const cost = calculateShippingCost(orderTotal, shippingMethodId);
    
    res.json({
      shippingCost: cost,
      total: orderTotal + cost
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else if (error instanceof Error) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
}

/**
 * Validate shipping address
 */
export function validateAddress(req: Request, res: Response) {
  const addressSchema = z.object({
    fullName: z.string().min(3, { message: "Full name is required" }),
    addressLine1: z.string().min(5, { message: "Address line 1 is required" }),
    addressLine2: z.string().optional(),
    city: z.string().min(2, { message: "City is required" }),
    state: z.string().min(2, { message: "State is required" }),
    postalCode: z.string().min(5, { message: "Postal code is required" }),
    country: z.string().min(2, { message: "Country is required" }),
    phone: z.string().min(10, { message: "Valid phone number is required" }),
  });

  try {
    const address = addressSchema.parse(req.body);
    
    // In a real application, you would validate the address with a third-party API
    // For demonstration purposes, we'll just validate that the postal code is numeric
    // if the country is US
    let validationResult = { valid: true, message: "" };
    
    if (address.country === "US" || address.country === "United States") {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(address.postalCode)) {
        validationResult = {
          valid: false, 
          message: "Invalid US postal code. Format should be 12345 or 12345-6789"
        };
      }
    }
    
    res.json(validationResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ valid: false, errors: error.errors });
    } else {
      res.status(500).json({ valid: false, message: "An unexpected error occurred" });
    }
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