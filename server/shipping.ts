import { Request, Response } from "express";
import { z } from "zod";

// Base shipping methods (default options without specific carrier)
export const baseShippingMethods = [
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

// Carriers available in our multi-shipping system
export const carriers = [
  {
    id: "fedex",
    name: "FedEx",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968244.png",
    methods: [
      {
        id: "fedex_ground",
        name: "FedEx Ground",
        description: "Delivery in 3-5 business days",
        basePrice: 8.99,
        freeShippingThreshold: 75,
        estimatedDeliveryDays: 5
      },
      {
        id: "fedex_express",
        name: "FedEx Express Saver",
        description: "Delivery in 2-3 business days",
        basePrice: 14.99,
        freeShippingThreshold: 120,
        estimatedDeliveryDays: 3
      },
      {
        id: "fedex_overnight",
        name: "FedEx Overnight",
        description: "Next business day delivery",
        basePrice: 29.99,
        freeShippingThreshold: 200,
        estimatedDeliveryDays: 1
      }
    ]
  },
  {
    id: "ups",
    name: "UPS",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968304.png",
    methods: [
      {
        id: "ups_ground",
        name: "UPS Ground",
        description: "Delivery in 4-6 business days",
        basePrice: 7.99,
        freeShippingThreshold: 60,
        estimatedDeliveryDays: 6
      },
      {
        id: "ups_3day",
        name: "UPS 3-Day Select",
        description: "Delivery in 3 business days",
        basePrice: 13.99,
        freeShippingThreshold: 110,
        estimatedDeliveryDays: 3
      },
      {
        id: "ups_2day",
        name: "UPS 2nd Day Air",
        description: "Delivery in 2 business days",
        basePrice: 19.99,
        freeShippingThreshold: 150,
        estimatedDeliveryDays: 2
      }
    ]
  },
  {
    id: "usps",
    name: "USPS",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968399.png",
    methods: [
      {
        id: "usps_first",
        name: "USPS First Class",
        description: "Delivery in 3-5 business days",
        basePrice: 5.99,
        freeShippingThreshold: 30,
        estimatedDeliveryDays: 5
      },
      {
        id: "usps_priority",
        name: "USPS Priority Mail",
        description: "Delivery in 1-3 business days",
        basePrice: 10.99,
        freeShippingThreshold: 90,
        estimatedDeliveryDays: 3
      },
      {
        id: "usps_express",
        name: "USPS Priority Mail Express",
        description: "Next business day delivery",
        basePrice: 25.99,
        freeShippingThreshold: 180,
        estimatedDeliveryDays: 1
      }
    ]
  },
  {
    id: "dhl",
    name: "DHL",
    logo: "https://cdn-icons-png.flaticon.com/512/5968/5968249.png",
    methods: [
      {
        id: "dhl_economy",
        name: "DHL Economy Select",
        description: "Delivery in 5-7 business days",
        basePrice: 9.99,
        freeShippingThreshold: 80,
        estimatedDeliveryDays: 7
      },
      {
        id: "dhl_express",
        name: "DHL Express",
        description: "Delivery in 2-3 business days",
        basePrice: 16.99,
        freeShippingThreshold: 130,
        estimatedDeliveryDays: 3
      },
      {
        id: "dhl_overnight",
        name: "DHL Express Overnight",
        description: "Next business day delivery",
        basePrice: 27.99,
        freeShippingThreshold: 190,
        estimatedDeliveryDays: 1
      }
    ]
  },
  {
    id: "others",
    name: "Other Carriers",
    logo: "https://cdn-icons-png.flaticon.com/512/8368/8368550.png",
    methods: [
      {
        id: "aramex_express",
        name: "Aramex Express",
        description: "International delivery in 3-5 business days",
        basePrice: 15.99,
        freeShippingThreshold: 120,
        estimatedDeliveryDays: 5
      },
      {
        id: "royal_mail",
        name: "Royal Mail Tracked",
        description: "UK delivery in 1-3 business days",
        basePrice: 6.99,
        freeShippingThreshold: 50,
        estimatedDeliveryDays: 3
      },
      {
        id: "australia_post",
        name: "Australia Post",
        description: "Australia delivery in 2-5 business days",
        basePrice: 12.99,
        freeShippingThreshold: 100,
        estimatedDeliveryDays: 5
      },
      {
        id: "dpd_classic",
        name: "DPD Classic",
        description: "European delivery in 2-4 business days",
        basePrice: 9.99,
        freeShippingThreshold: 80,
        estimatedDeliveryDays: 4
      }
    ]
  }
];

// Legacy support - returns all shipping methods from all carriers flattened
export const shippingMethods = [
  ...baseShippingMethods,
  ...carriers.flatMap(carrier => 
    carrier.methods.map(method => ({
      ...method,
      carrier: carrier.name,
      carrierLogo: carrier.logo
    }))
  )
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
 * Get available shipping methods (legacy)
 */
export function getShippingMethods(req: Request, res: Response) {
  res.json(shippingMethods);
}

/**
 * Get carrier-based shipping options
 */
export function getCarrierShippingOptions(req: Request, res: Response) {
  res.json(carriers);
}

/**
 * Get shipping rates for a specific carrier
 */
export function getCarrierRates(req: Request, res: Response) {
  const carrierId = req.params.carrierId;
  const carrier = carriers.find(c => c.id === carrierId);
  
  if (!carrier) {
    return res.status(404).json({ error: `Carrier with ID ${carrierId} not found` });
  }
  
  const schema = z.object({
    orderTotal: z.number().min(0),
    weight: z.number().min(0).optional(),
    destination: z.object({
      country: z.string(),
      postalCode: z.string(),
      state: z.string().optional(),
      city: z.string().optional()
    })
  });

  try {
    const { orderTotal, weight = 1, destination } = schema.parse(req.body);
    
    // In a real API integration, we would call the shipping carrier's API here
    // For demonstration purposes, we're using our predefined rates with some randomization
    // to simulate real-time rate calculation
    
    const shippingRates = carrier.methods.map(method => {
      // Calculate the base cost
      let cost = method.basePrice;
      
      // Adjust for order total (free shipping threshold)
      if (orderTotal >= method.freeShippingThreshold) {
        cost = 0;
      }
      
      // Adjust for weight (add a bit extra for heavier packages)
      if (weight > 2) {
        const weightFactor = Math.min(weight - 1, 20) / 10; // Cap at 3x for super heavy items
        cost = cost * (1 + weightFactor);
      }
      
      // Add a small random variation to simulate real rates (+/- 10%)
      const variationFactor = 0.9 + (Math.random() * 0.2);
      cost = cost * variationFactor;
      
      // Calculate delivery date
      const today = new Date();
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + method.estimatedDeliveryDays);
      
      return {
        id: method.id,
        name: method.name,
        description: method.description,
        cost: parseFloat(cost.toFixed(2)),
        estimatedDeliveryDays: method.estimatedDeliveryDays,
        estimatedDeliveryDate: deliveryDate.toISOString().split('T')[0], // YYYY-MM-DD
        guaranteedDelivery: method.id.includes('overnight'),
        carrier: carrier.name,
        carrierId: carrier.id,
        carrierLogo: carrier.logo
      };
    });
    
    res.json(shippingRates);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
}

/**
 * Calculate shipping cost for an order (legacy)
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
 * Get all available shipping rates from all carriers in one request
 */
export function getAllShippingRates(req: Request, res: Response) {
  const schema = z.object({
    orderTotal: z.number().min(0),
    weight: z.number().min(0).optional(),
    destination: z.object({
      country: z.string(),
      postalCode: z.string(),
      state: z.string().optional(),
      city: z.string().optional()
    })
  });

  try {
    const { orderTotal, weight = 1, destination } = schema.parse(req.body);
    
    // Get rates from all carriers
    const allRates = carriers.flatMap(carrier => {
      return carrier.methods.map(method => {
        // Calculate the base cost
        let cost = method.basePrice;
        
        // Adjust for order total (free shipping threshold)
        if (orderTotal >= method.freeShippingThreshold) {
          cost = 0;
        }
        
        // Adjust for weight
        if (weight > 2) {
          const weightFactor = Math.min(weight - 1, 20) / 10;
          cost = cost * (1 + weightFactor);
        }
        
        // Add a small random variation
        const variationFactor = 0.9 + (Math.random() * 0.2);
        cost = cost * variationFactor;
        
        // Calculate delivery date
        const today = new Date();
        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + method.estimatedDeliveryDays);
        
        return {
          id: method.id,
          name: method.name,
          description: method.description,
          cost: parseFloat(cost.toFixed(2)),
          estimatedDeliveryDays: method.estimatedDeliveryDays,
          estimatedDeliveryDate: deliveryDate.toISOString().split('T')[0],
          guaranteedDelivery: method.id.includes('overnight'),
          carrier: carrier.name,
          carrierId: carrier.id,
          carrierLogo: carrier.logo
        };
      });
    });
    
    // Sort by cost (cheapest first)
    allRates.sort((a, b) => a.cost - b.cost);
    
    res.json(allRates);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
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
  // Legacy routes
  app.get("/api/shipping/methods", getShippingMethods);
  app.post("/api/shipping/calculate", calculateShipping);
  app.post("/api/shipping/validate-address", validateAddress);
  
  // New multi-carrier shipping routes
  app.get("/api/shipping/carriers", getCarrierShippingOptions);
  app.post("/api/shipping/carriers/:carrierId/rates", getCarrierRates);
  app.post("/api/shipping/rates", getAllShippingRates);
}