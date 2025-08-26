import { Request, Response } from 'express';

/**
 * reCAPTCHA Integration Service
 * Handles both v2 and v3 reCAPTCHA verification
 */

const RECAPTCHA_SITE_KEY = '6LcFQForAAAAAAN8Qb50X0uJxT4mcIKLzrM1cKTJ';
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token using Google's verification API
 */
export async function verifyRecaptchaToken(token: string, remoteip?: string): Promise<RecaptchaVerificationResult> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('[RECAPTCHA] Secret key not configured');
    return {
      success: false,
      'error-codes': ['missing-secret-key']
    };
  }

  try {
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
    });

    if (remoteip) {
      params.append('remoteip', remoteip);
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      console.error('[RECAPTCHA] API request failed:', response.status, response.statusText);
      return {
        success: false,
        'error-codes': ['api-request-failed']
      };
    }

    const result = await response.json() as RecaptchaVerificationResult;
    
    console.log('[RECAPTCHA] Verification result:', {
      success: result.success,
      score: result.score,
      action: result.action,
      errors: result['error-codes']
    });

    return result;
  } catch (error) {
    console.error('[RECAPTCHA] Verification error:', error);
    return {
      success: false,
      'error-codes': ['verification-failed']
    };
  }
}

/**
 * Express middleware for reCAPTCHA verification
 */
export function requireRecaptcha(minScore: number = 0.5) {
  return async (req: Request, res: Response, next: Function) => {
    const token = req.body['g-recaptcha-response'] || req.body.recaptchaToken;
    
    if (!token) {
      return res.status(400).json({
        error: 'reCAPTCHA token is required',
        code: 'RECAPTCHA_MISSING'
      });
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const result = await verifyRecaptchaToken(token, clientIP);

    if (!result.success) {
      return res.status(400).json({
        error: 'reCAPTCHA verification failed',
        code: 'RECAPTCHA_FAILED',
        details: result['error-codes']
      });
    }

    // For v3, check score if provided
    if (typeof result.score === 'number' && result.score < minScore) {
      return res.status(400).json({
        error: 'reCAPTCHA score too low',
        code: 'RECAPTCHA_LOW_SCORE',
        score: result.score,
        minScore
      });
    }

    // Attach verification result to request for further processing
    (req as any).recaptcha = result;
    next();
  };
}

/**
 * API endpoint for reCAPTCHA verification
 */
export async function handleRecaptchaVerification(req: Request, res: Response) {
  const { token, action } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'reCAPTCHA token is required'
    });
  }

  const clientIP = req.ip || req.connection.remoteAddress;
  const result = await verifyRecaptchaToken(token, clientIP);

  return res.json({
    success: result.success,
    score: result.score,
    action: result.action,
    timestamp: new Date().toISOString(),
    ...(result['error-codes'] && { errors: result['error-codes'] })
  });
}

/**
 * Get reCAPTCHA site configuration
 */
export function getRecaptchaConfig() {
  return {
    siteKey: RECAPTCHA_SITE_KEY,
    version: 'v3', // Can be v2 or v3
    enabled: !!RECAPTCHA_SECRET_KEY
  };
}

export default {
  verifyRecaptchaToken,
  requireRecaptcha,
  handleRecaptchaVerification,
  getRecaptchaConfig,
  RECAPTCHA_SITE_KEY
};