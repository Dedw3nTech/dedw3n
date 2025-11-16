import type { Request } from 'express';

interface TurnstileVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Cloudflare Turnstile token
 * @param token The turnstile token from the client
 * @param remoteip Optional IP address of the user
 * @returns Promise<boolean> indicating if verification was successful
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    if (!TURNSTILE_SECRET_KEY) {
      console.error('[TURNSTILE] Secret key not configured');
      return { success: false, error: 'Turnstile not configured' };
    }

    // In development, allow bypass with a special token
    if (process.env.NODE_ENV === 'development' && token === 'dev_bypass_token') {
      console.log('[TURNSTILE] Development bypass token used');
      return { success: true };
    }

    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error('[TURNSTILE] Verification request failed:', response.status, response.statusText);
      return { success: false, error: 'Verification request failed' };
    }

    const data: TurnstileVerificationResponse = await response.json();

    if (!data.success) {
      console.warn('[TURNSTILE] Verification failed:', data['error-codes']);
      return { 
        success: false, 
        error: data['error-codes']?.join(', ') || 'Verification failed' 
      };
    }

    console.log('[TURNSTILE] Verification successful');
    return { success: true };

  } catch (error) {
    console.error('[TURNSTILE] Error verifying token:', error);
    return { success: false, error: 'Verification error' };
  }
}

/**
 * Middleware to verify Turnstile token from request body
 */
export async function verifyTurnstileMiddleware(req: Request): Promise<{ success: boolean; error?: string }> {
  const token = req.body.turnstileToken;
  const remoteip = req.ip || req.connection.remoteAddress;
  
  return await verifyTurnstileToken(token, remoteip);
}
