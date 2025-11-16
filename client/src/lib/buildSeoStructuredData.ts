/**
 * Structured Data Builders for Luxury E-commerce SEO
 * Generates schema.org JSON-LD for rich search results
 */

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  availability?: string;
  condition?: string;
  brand?: string;
  vendor?: {
    id: number;
    storeName: string;
    rating?: number;
  };
}

interface Vendor {
  id: number;
  storeName: string;
  description?: string;
  logo?: string;
  rating?: number;
  reviewCount?: number;
  totalProducts?: number;
  userId?: number;
}

/**
 * Build Product schema with offers and aggregated ratings
 */
export function buildProductSchema(product: Product, siteUrl: string = window.location.origin) {
  const price = product.discountPrice && product.discountPrice < product.price 
    ? product.discountPrice 
    : product.price;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `Buy ${product.name} on Dedw3n marketplace`,
    "image": absolutizeImageUrl(product.imageUrl, '/assets/og-image.png', siteUrl),
    "sku": `DEDW3N-${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || product.vendor?.storeName || "Dedw3n"
    },
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/product/${product.id}`,
      "priceCurrency": "GBP",
      "price": price.toFixed(2),
      "availability": product.availability || "https://schema.org/InStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "itemCondition": product.condition || "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": product.vendor?.storeName || "Dedw3n Ltd"
      }
    }
  } as any;

  // Add aggregate rating if available
  if (product.rating && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating.toFixed(1),
      "reviewCount": product.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  // Add category breadcrumb if available
  if (product.category) {
    schema.category = product.category;
  }

  return schema;
}

/**
 * Build BreadcrumbList schema for navigation
 */
export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>, siteUrl: string = window.location.origin) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${siteUrl}${item.url}`
    }))
  };
}

/**
 * Build Vendor/Organization schema with ratings
 */
export function buildVendorSchema(vendor: Vendor, topProducts?: Array<Product>, siteUrl: string = window.location.origin) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": vendor.storeName,
    "description": vendor.description || `${vendor.storeName} - Verified vendor on Dedw3n marketplace`,
    "image": absolutizeImageUrl(vendor.logo, '/assets/og-image.png', siteUrl),
    "url": `${siteUrl}/vendor/${vendor.id}`,
    "priceRange": "$$"
  } as any;

  // Add aggregate rating if available
  if (vendor.rating && vendor.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": vendor.rating.toFixed(1),
      "reviewCount": vendor.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  // Add product list if available
  if (topProducts && topProducts.length > 0) {
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      "name": `${vendor.storeName} Products`,
      "itemListElement": topProducts.slice(0, 5).map(product => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": product.name,
          "image": product.imageUrl ? absolutizeImageUrl(product.imageUrl, undefined, siteUrl) : undefined
        }
      }))
    };
  }

  return schema;
}

/**
 * Build ItemList schema for product listings
 */
export function buildItemListSchema(items: Array<Product>, listName: string, siteUrl: string = window.location.origin) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "numberOfItems": items.length,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${siteUrl}/product/${item.id}`,
      "item": {
        "@type": "Product",
        "name": item.name,
        "image": item.imageUrl ? absolutizeImageUrl(item.imageUrl, undefined, siteUrl) : undefined,
        "offers": {
          "@type": "Offer",
          "price": item.discountPrice || item.price,
          "priceCurrency": "GBP"
        }
      }
    }))
  };
}

/**
 * Build SearchAction schema for search pages
 */
export function buildSearchActionSchema(siteUrl: string = window.location.origin) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Normalize meta description - trim to 155 chars at word boundary
 */
export function normalizeDescription(text: string | undefined | null, fallback: string): string {
  if (!text || text.trim().length === 0) return fallback;
  
  const cleaned = text.trim();
  if (cleaned.length <= 155) return cleaned;
  
  // Find last word boundary before 155 chars
  const truncated = cleaned.substring(0, 155);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 100) { // Only use word boundary if it's reasonably far
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Normalize SEO title - ensure it's not too long
 */
export function normalizeTitle(text: string | undefined | null, fallback: string, suffix: string = ' - Dedw3n'): string {
  if (!text || text.trim().length === 0) return fallback;
  
  const cleaned = text.trim();
  const withSuffix = `${cleaned}${suffix}`;
  
  // Google typically shows 50-60 chars
  if (withSuffix.length <= 60) return withSuffix;
  
  // Truncate title if too long, keeping suffix
  const maxTitleLength = 60 - suffix.length - 3; // -3 for "..."
  return `${cleaned.substring(0, maxTitleLength)}...${suffix}`;
}

/**
 * Absolutize image URL if relative
 */
export function absolutizeImageUrl(url: string | undefined | null, fallback: string = '/assets/og-image.png', siteUrl: string = window.location.origin): string {
  if (!url) return `${siteUrl}${fallback}`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${siteUrl}${url}`;
}
