/**
 * JWT Token Utilities
 * 
 * This file contains utilities for working with JWT tokens on the client side.
 * It includes functions for parsing, validating, and extracting information from JWT tokens.
 */

interface JwtHeader {
  alg: string;
  typ: string;
}

interface JwtPayload {
  userId: number;
  role: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
  [key: string]: any; // For any additional custom claims
}

interface ParsedJwt {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
  isValid: boolean;
  expiresIn?: number; // Seconds until expiration
}

/**
 * Parse a JWT token and extract its components (header, payload, signature)
 * @param token JWT token string
 * @returns Parsed JWT object with header, payload, and signature components
 */
export function parseJwt(token: string): ParsedJwt | null {
  if (!token || typeof token !== 'string') {
    console.error('Invalid token provided to parseJwt');
    return null;
  }
  
  try {
    // Split the token into its three parts
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('JWT token must have 3 parts (header, payload, signature)');
      return null;
    }
    
    // Decode header and payload (base64)
    const header = JSON.parse(atob(parts[0])) as JwtHeader;
    const payload = JSON.parse(atob(parts[1])) as JwtPayload;
    const signature = parts[2];
    
    // Calculate expiration time
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.expiresAt - now;
    const isValid = expiresIn > 0; // Token is valid if it hasn't expired
    
    return {
      header,
      payload,
      signature,
      isValid,
      expiresIn: isValid ? expiresIn : 0
    };
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * Check if a JWT token has the required structure
 * @param token JWT token string
 * @returns True if the token has a valid structure, false otherwise
 */
export function hasValidStructure(token: string): boolean {
  const parsed = parseJwt(token);
  
  if (!parsed) return false;
  
  // Check for required header fields
  if (!parsed.header.alg || !parsed.header.typ) {
    console.error('JWT header missing required fields (alg, typ)');
    return false;
  }
  
  // Check for required payload fields
  if (
    parsed.payload.userId === undefined || 
    !parsed.payload.role ||
    !parsed.payload.tokenId ||
    !parsed.payload.issuedAt ||
    !parsed.payload.expiresAt
  ) {
    console.error('JWT payload missing required fields');
    return false;
  }
  
  // Check for signature
  if (!parsed.signature) {
    console.error('JWT missing signature part');
    return false;
  }
  
  return true;
}

/**
 * Check if a JWT token is expired
 * @param token JWT token string
 * @returns True if token is expired, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  const parsed = parseJwt(token);
  
  if (!parsed) return true;
  
  return !parsed.isValid;
}

/**
 * Get user information from a JWT token
 * @param token JWT token string
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
 * @param token JWT token string
 * @returns Time in seconds until expiration, or 0 if already expired
 */
export function getTokenTimeRemaining(token: string): number {
  const parsed = parseJwt(token);
  
  if (!parsed || !parsed.isValid) return 0;
  
  return parsed.expiresIn || 0;
}