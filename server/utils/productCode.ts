/**
 * Product Code Generator Utility
 * 
 * Generates sophisticated product codes in the format:
 * [2 chars vendor store][2 chars product name][2 chars marketplace][upload date YYYYMMDD]
 * 
 * Example: ACME Product in B2C marketplace created on 2025-01-15
 * Result: ACPRB220250115
 */

/**
 * Normalize a string for code generation:
 * - Convert to uppercase
 * - Remove non-alphanumeric characters
 * - Pad with 'X' if less than required length
 * - Take first N characters
 */
function normalizeForCode(input: string, length: number): string {
  if (!input || input.trim().length === 0) {
    return 'X'.repeat(length);
  }
  
  // Remove non-alphanumeric characters and convert to uppercase
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (cleaned.length === 0) {
    return 'X'.repeat(length);
  }
  
  if (cleaned.length < length) {
    // Pad with X if shorter than required
    return cleaned + 'X'.repeat(length - cleaned.length);
  }
  
  // Take first N characters
  return cleaned.substring(0, length);
}

/**
 * Format date as YYYYMMDD
 */
function formatDateForCode(date: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generate a random alphanumeric suffix for uniqueness
 * Default 8 characters provides 36^8 = ~2.8 trillion combinations
 */
function generateUniqueSuffix(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  
  // Use crypto for better randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback for Node.js environments
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate a unique product code with robust collision avoidance
 * 
 * @param vendorStoreName - Name of the vendor's store
 * @param productName - Name of the product
 * @param marketplace - Marketplace type (e.g., 'c2c', 'b2c', 'b2b', 'raw', 'rqst')
 * @param createdAt - Product creation date (optional, defaults to now)
 * @returns Product code in format: [VV][PP][MM][YYYYMMDD]-[XXXXXXXX] where XXXXXXXX is an 8-char unique suffix
 * 
 * Example: ADPRB220250922-A7K3M9P2
 */
export function generateProductCode(
  vendorStoreName: string,
  productName: string,
  marketplace: string,
  createdAt?: Date | string | null
): string {
  const vendorCode = normalizeForCode(vendorStoreName, 2);
  const productCode = normalizeForCode(productName, 2);
  const marketplaceCode = normalizeForCode(marketplace, 2);
  const dateCode = formatDateForCode(createdAt);
  const uniqueSuffix = generateUniqueSuffix(8); // 8 chars = 36^8 ~= 2.8 trillion combinations
  
  return `${vendorCode}${productCode}${marketplaceCode}${dateCode}-${uniqueSuffix}`;
}
