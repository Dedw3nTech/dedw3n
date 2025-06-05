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

// Default pricing configuration - can be overridden per vendor/product
export const DEFAULT_PRICING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 50,
  SHIPPING_COST: 5.99,
  TAX_RATE: 0.2, // 20% VAT
} as const;

interface PricingConfig {
  freeShippingThreshold?: number;
  shippingCost?: number;
  taxRate?: number;
}

/**
 * Calculate complete pricing breakdown for cart items
 * This is the single source of truth for all pricing calculations
 * Supports vendor-specific pricing configurations
 */
export function calculatePricing(cartItems: CartItem[], config: PricingConfig = {}): PricingBreakdown {
  // Merge with default configuration
  const pricingConfig = {
    freeShippingThreshold: config.freeShippingThreshold ?? DEFAULT_PRICING_CONFIG.FREE_SHIPPING_THRESHOLD,
    shippingCost: config.shippingCost ?? DEFAULT_PRICING_CONFIG.SHIPPING_COST,
    taxRate: config.taxRate ?? DEFAULT_PRICING_CONFIG.TAX_RATE,
  };

  // Calculate subtotal from cart items
  const subtotal = Array.isArray(cartItems) 
    ? cartItems.reduce((sum: number, item: CartItem) => 
        sum + (item.product.price * item.quantity), 0
      ) 
    : 0;

  // Calculate shipping cost based on vendor/product rules
  const shippingCost = subtotal >= pricingConfig.freeShippingThreshold 
    ? 0 
    : pricingConfig.shippingCost;

  // Calculate tax based on vendor/product tax rate
  const tax = subtotal * pricingConfig.taxRate;

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
export function qualifiesForFreeShipping(subtotal: number, config: PricingConfig = {}): boolean {
  const threshold = config.freeShippingThreshold ?? DEFAULT_PRICING_CONFIG.FREE_SHIPPING_THRESHOLD;
  return subtotal >= threshold;
}

/**
 * Calculate amount needed for free shipping
 */
export function amountNeededForFreeShipping(subtotal: number, config: PricingConfig = {}): number {
  const threshold = config.freeShippingThreshold ?? DEFAULT_PRICING_CONFIG.FREE_SHIPPING_THRESHOLD;
  if (subtotal >= threshold) {
    return 0;
  }
  return threshold - subtotal;
}