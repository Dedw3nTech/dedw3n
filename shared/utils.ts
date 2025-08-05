/**
 * Convert a store name to a URL-friendly slug
 * @param storeName - The store name to convert
 * @returns URL-friendly slug
 */
export function createStoreSlug(storeName: string): string {
  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Keep spaces initially
    .replace(/\s+/g, '') // Remove all spaces
    .trim();
}

/**
 * Check if a string is a valid store slug format
 * @param slug - The slug to validate
 * @returns boolean indicating if slug is valid
 */
export function isValidStoreSlug(slug: string): boolean {
  return /^[a-z0-9]+$/.test(slug);
}

/**
 * Convert a product name to a URL-friendly slug
 * @param productName - The product name to convert
 * @returns URL-friendly slug
 */
export function createProductSlug(productName: string): string {
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Keep spaces and hyphens initially
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();
}

/**
 * Check if a string is a valid product slug format
 * @param slug - The slug to validate
 * @returns boolean indicating if slug is valid
 */
export function isValidProductSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
}