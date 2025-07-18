/**
 * Generates unique product codes for published products
 * Format: {productCount}{userId}{day}{month}{year}
 * Example: 5917062025 (5th product, User ID 9, published on 17/06/2025)
 */

export async function generateProductCode(userId: number, vendorId: number): Promise<string> {
  const { db } = await import("./db");
  const { products } = await import("@shared/schema");
  const { eq, count } = await import("drizzle-orm");
  
  // Get count of published products for this vendor
  const [result] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.vendorId, vendorId));
  
  const productCount = (result?.count || 0) + 1; // Next product number
  
  const now = new Date();
  
  // Format date components
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  
  // Create the product code
  const productCode = `${productCount}${userId}${day}${month}${year}`;
  
  return productCode;
}

/**
 * Validates product code format
 */
export function isValidProductCode(code: string): boolean {
  // Pattern: {productCount}{userId}{day}{month}{year}
  const pattern = /^\d+\d+\d{2}\d{2}\d{4}$/;
  return pattern.test(code);
}

/**
 * Extracts user ID from product code
 */
export function extractUserIdFromProductCode(code: string): number | null {
  if (!isValidProductCode(code) || code.length < 9) {
    return null;
  }
  
  // Extract date part (last 8 digits: DDMMYYYY)
  const datePart = code.slice(-8);
  const codeWithoutDate = code.slice(0, -8);
  
  if (codeWithoutDate.length < 2) {
    return null;
  }
  
  // The remaining part contains productCount + userId
  // We need to find where userId starts (could be variable length)
  // For now, assume userId is at least 1 digit
  const userIdPart = codeWithoutDate.slice(1); // Skip first digit (productCount)
  const userId = parseInt(userIdPart, 10);
  
  return isNaN(userId) ? null : userId;
}