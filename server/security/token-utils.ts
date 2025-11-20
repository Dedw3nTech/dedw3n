import { randomBytes, createHmac } from 'crypto';

// Default token expiration in seconds (24 hours)
const TOKEN_EXPIRES_IN = 86400;

// SECURITY: Require TOKEN_SECRET in production, fail fast if missing
if (!process.env.TOKEN_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[CRITICAL ERROR] TOKEN_SECRET environment variable is not set in production!');
  console.error('[CRITICAL ERROR] This is a critical security vulnerability - tokens cannot be securely issued.');
  console.error('[CRITICAL ERROR] Please set TOKEN_SECRET in your environment secrets immediately.');
  throw new Error('TOKEN_SECRET environment variable is required in production');
}

// Get the token secret from environment variable with secure fallback for development only
const TOKEN_SECRET = process.env.TOKEN_SECRET || 
  (process.env.NODE_ENV === 'development' 
    ? 'dedw3n-development-secret-key-for-jwt-authentication-do-not-use-in-production'
    : '');

// Validate secret is not empty (should never happen with above checks, but safety check)
if (!TOKEN_SECRET) {
  throw new Error('TOKEN_SECRET is required but not set');
}

// Log the token secret source for debugging (without exposing the actual secret)
console.log(`[AUTH] Using token secret from ${process.env.TOKEN_SECRET ? 'environment variable' : 'development fallback'}`);

export interface TokenPayload {
  userId: number;
  role: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Generates a secure token string using the crypto module
 * Pure function - no storage dependency
 */
export function generateSecureToken(payload: TokenPayload): string {
  // Convert payload to string
  const payloadStr = JSON.stringify(payload);
  
  // Create a signature using HMAC SHA-256
  const signature = createHmac('sha256', TOKEN_SECRET)
    .update(payloadStr)
    .digest('hex');
  
  // Combine payload and signature
  const base64Payload = Buffer.from(payloadStr).toString('base64');
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies token signature and expiration (synchronous, does NOT check database)
 * Pure function - no storage dependency
 * Use this for basic token validation. For full security, check revocation status separately.
 */
export function verifyTokenSignature(token: string): TokenPayload | null {
  try {
    // Split token into parts
    const [base64Payload, signature] = token.split('.');
    
    // Check if token format is valid
    if (!base64Payload || !signature) {
      return null;
    }
    
    // Decode the payload
    const payloadStr = Buffer.from(base64Payload, 'base64').toString();
    const payload = JSON.parse(payloadStr) as TokenPayload;
    
    // Verify signature
    const expectedSignature = createHmac('sha256', TOKEN_SECRET)
      .update(payloadStr)
      .digest('hex');
    
    // Check if signatures match
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Check if token has expired
    if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Creates a token payload with standard expiration
 * Pure function - no storage dependency
 */
export function createTokenPayload(userId: number, role: string): { payload: TokenPayload; expiresAt: Date } {
  // Generate a unique token identifier
  const tokenId = randomBytes(32).toString('hex');
  
  // Set expiration date
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN * 1000);
  
  // Create the token payload
  const payload: TokenPayload = {
    userId,
    role,
    tokenId,
    issuedAt,
    expiresAt: Math.floor(expiresAt.getTime() / 1000)
  };
  
  return { payload, expiresAt };
}

/**
 * Get the token expiration duration in seconds
 */
export function getTokenExpiresIn(): number {
  return TOKEN_EXPIRES_IN;
}
