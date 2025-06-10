/**
 * JWT Token Utilities
 * 
 * This file contains utilities for working with JWT tokens on the client side.
 * It includes functions for parsing, validating, and extracting information from JWT tokens.
 * 
 * Note: Dedw3n uses a custom JWT format: base64(payload).signature
 * This is different from the standard JWT format: header.payload.signature
 */

// The payload structure of our tokens
interface JwtPayload {
  userId: number;
  role: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
  [key: string]: any; // For any additional custom claims
}

interface ParsedJwt {
  payload: JwtPayload;
  signature: string;
  isValid: boolean;
  expiresIn?: number; // Seconds until expiration
}

/**
 * Parse a token and extract its components (payload, signature)
 * @param token Token string
 * @returns Parsed token object with payload and signature components
 */
export function parseJwt(token: string): ParsedJwt | null {
  if (!token || typeof token !== 'string') {
    console.error('Invalid token provided to parseJwt');
    return null;
  }
  
  try {
    // Split the token into its two parts (base64Payload.signature)
    const parts = token.split('.');
    
    if (parts.length !== 2) {
      console.error('Token must have 2 parts (payload, signature) in our custom format');
      return null;
    }
    
    // Decode payload (base64)
    const base64Payload = parts[0];
    const payloadStr = atob(base64Payload);
    const payload = JSON.parse(payloadStr) as JwtPayload;
    const signature = parts[1];
    
    // Calculate expiration time
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.expiresAt - now;
    const isValid = expiresIn > 0; // Token is valid if it hasn't expired
    
    return {
      payload,
      signature,
      isValid,
      expiresIn: isValid ? expiresIn : 0
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

/**
 * Check if a token has the required structure
 * @param token Token string
 * @returns True if the token has a valid structure, false otherwise
 */
export function hasValidStructure(token: string): boolean {
  const parsed = parseJwt(token);
  
  if (!parsed) return false;
  
  // Check for required payload fields
  if (
    parsed.payload.userId === undefined || 
    !parsed.payload.role ||
    !parsed.payload.tokenId ||
    !parsed.payload.issuedAt ||
    !parsed.payload.expiresAt
  ) {
    console.error('Token payload missing required fields');
    return false;
  }
  
  // Check for signature
  if (!parsed.signature) {
    console.error('Token missing signature part');
    return false;
  }
  
  return true;
}

/**
 * Check if a token is expired
 * @param token Token string
 * @returns True if token is expired, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  const parsed = parseJwt(token);
  
  if (!parsed) return true;
  
  return !parsed.isValid;
}

/**
 * Get user information from a token
 * @param token Token string
 * @returns User info object or null if token is invalid
 */
export function getUserFromToken(token: string): { 
  userId: number; 
  role: string;
  tokenId: string;
} | null {
  const parsed = parseJwt(token);
  
  if (!parsed || !parsed.isValid) return null;
  
  return {
    userId: parsed.payload.userId,
    role: parsed.payload.role,
    tokenId: parsed.payload.tokenId
  };
}

/**
 * Calculate how long until a token expires
 * @param token Token string
 * @returns Time in seconds until expiration, or 0 if already expired
 */
export function getTokenTimeRemaining(token: string): number {
  const parsed = parseJwt(token);
  
  if (!parsed || !parsed.isValid) return 0;
  
  return parsed.expiresIn || 0;
}