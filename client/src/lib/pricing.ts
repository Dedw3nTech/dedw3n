// Centralized pricing calculation for the entire system
// This ensures consistent pricing across all components

interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    description: string;
  };
}

interface PricingBreakdown {
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

// Configuration constants
export const PRICING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 50,
  SHIPPING_COST: 5.99,
  TAX_RATE: 0.2, // 20% VAT
} as const;

/**
 * Calculate complete pricing breakdown for cart items
 * This is the single source of truth for all pricing calculations
 */
export function calculatePricing(cartItems: CartItem[]): PricingBreakdown {
  // Calculate subtotal from cart items
  const subtotal = Array.isArray(cartItems) 
    ? cartItems.reduce((sum: number, item: CartItem) => 
        sum + (item.product.price * item.quantity), 0
      ) 
    : 0;

  // Calculate shipping cost
  const shippingCost = subtotal >= PRICING_CONFIG.FREE_SHIPPING_THRESHOLD 
    ? 0 
    : PRICING_CONFIG.SHIPPING_COST;

  // Calculate tax (VAT on subtotal only)
  const tax = subtotal * PRICING_CONFIG.TAX_RATE;

  // Calculate total
  const total = subtotal + shippingCost + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Format pricing breakdown for display
 */
export function formatPricingDisplay(pricing: PricingBreakdown, formatPrice: (amount: number) => string) {
  return {
    subtotal: formatPrice(pricing.subtotal),
    shippingCost: pricing.shippingCost === 0 ? 'Free' : formatPrice(pricing.shippingCost),
    tax: formatPrice(pricing.tax),
    total: formatPrice(pricing.total),
  };
}

/**
 * Check if order qualifies for free shipping
 */
export function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= PRICING_CONFIG.FREE_SHIPPING_THRESHOLD;
}

/**
 * Calculate amount needed for free shipping
 */
export function amountNeededForFreeShipping(subtotal: number): number {
  if (qualifiesForFreeShipping(subtotal)) {
    return 0;
  }
  return PRICING_CONFIG.FREE_SHIPPING_THRESHOLD - subtotal;
}