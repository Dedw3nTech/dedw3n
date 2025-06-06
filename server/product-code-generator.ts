/**
 * Generates unique product codes for published products
 * Format: 001{userId}{day}/{month}/{year}
 * Example: 00191023/06/2025 (User ID 9, published on 23/06/2025)
 */

export function generateProductCode(userId: number): string {
  const now = new Date();
  
  // Format date components
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  
  // Create the product code
  const productCode = `001${userId}${day}/${month}/${year}`;
  
  return productCode;
}

/**
 * Validates product code format
 */
export function isValidProductCode(code: string): boolean {
  // Pattern: 001{userId}{day}/{month}/{year}
  const pattern = /^001\d+\d{2}\/\d{2}\/\d{4}$/;
  return pattern.test(code);
}

/**
 * Extracts user ID from product code
 */
export function extractUserIdFromProductCode(code: string): number | null {
  if (!isValidProductCode(code)) {
    return null;
  }
  
  // Remove "001" prefix and extract the part before the date
  const withoutPrefix = code.substring(3);
  const dateStartIndex = withoutPrefix.indexOf('/') - 2; // Find date part (DD/MM/YYYY)
  
  if (dateStartIndex < 1) {
    return null;
  }
  
  const userIdPart = withoutPrefix.substring(0, dateStartIndex - 2);
  const userId = parseInt(userIdPart, 10);
  
  return isNaN(userId) ? null : userId;
}