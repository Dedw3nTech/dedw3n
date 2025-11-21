/**
 * Rate Limiter for Malformed JSON Requests
 * Prevents abuse from clients sending excessive malformed JSON
 * Following 2025 production best practices
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorBuilder } from '../errors/error-builder';
import { ErrorCode } from '../errors/error-codes';
import { logger } from '../logger';

interface RateLimitEntry {
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
}

/**
 * In-memory store for JSON error tracking
 * In production, use Redis or similar distributed cache
 */
class MalformedJsonRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly maxErrors: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;
  private readonly blockedIPs: Map<string, number> = new Map();
  
  constructor(config: {
    maxErrors?: number;
    windowMinutes?: number;
    blockDurationMinutes?: number;
  } = {}) {
    this.maxErrors = config.maxErrors || 10; // Max malformed requests in window
    this.windowMs = (config.windowMinutes || 10) * 60 * 1000; // 10 minutes default
    this.blockDurationMs = (config.blockDurationMinutes || 30) * 60 * 1000; // 30 minutes default
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  /**
   * Get client identifier (IP address or user ID)
   */
  private getClientId(req: Request): string {
    // Try to get user ID if authenticated
    if ((req as any).user?.id) {
      return `user:${(req as any).user.id}`;
    }
    
    // Fall back to IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim())
      : req.socket.remoteAddress || 'unknown';
    
    return `ip:${ip}`;
  }
  
  /**
   * Check if client is blocked
   */
  isBlocked(req: Request): boolean {
    const clientId = this.getClientId(req);
    const blockUntil = this.blockedIPs.get(clientId);
    
    if (!blockUntil) {
      return false;
    }
    
    // Check if block has expired
    if (Date.now() > blockUntil) {
      this.blockedIPs.delete(clientId);
      this.store.delete(clientId);
      return false;
    }
    
    return true;
  }
  
  /**
   * Record a JSON parsing error
   */
  recordError(req: Request): void {
    const clientId = this.getClientId(req);
    const now = Date.now();
    const entry = this.store.get(clientId);
    
    if (!entry) {
      // First error from this client
      this.store.set(clientId, {
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
      });
      return;
    }
    
    // Check if we're still in the rate limit window
    const isInWindow = (now - entry.firstOccurrence) < this.windowMs;
    
    if (isInWindow) {
      // Increment error count
      entry.count++;
      entry.lastOccurrence = now;
      
      // Check if threshold exceeded
      if (entry.count >= this.maxErrors) {
        // Block this client
        this.blockedIPs.set(clientId, now + this.blockDurationMs);
        
        logger.warn('Client blocked for excessive malformed JSON requests', {
          clientId,
          errorCount: entry.count,
          windowMs: this.windowMs,
          blockDurationMs: this.blockDurationMs,
          blockedUntil: new Date(now + this.blockDurationMs).toISOString(),
        }, 'json-rate-limiter');
      }
    } else {
      // Window expired, reset counter
      this.store.set(clientId, {
        count: 1,
        firstOccurrence: now,
        lastOccurrence: now,
      });
    }
  }
  
  /**
   * Get current stats for a client (for debugging)
   */
  getStats(req: Request): {
    errorCount: number;
    isBlocked: boolean;
    blockUntil?: Date;
  } {
    const clientId = this.getClientId(req);
    const entry = this.store.get(clientId);
    const blockUntil = this.blockedIPs.get(clientId);
    
    return {
      errorCount: entry?.count || 0,
      isBlocked: this.isBlocked(req),
      ...(blockUntil && { blockUntil: new Date(blockUntil) }),
    };
  }
  
  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Cleanup expired rate limit entries
    for (const [clientId, entry] of this.store.entries()) {
      if ((now - entry.lastOccurrence) > this.windowMs * 2) {
        this.store.delete(clientId);
      }
    }
    
    // Cleanup expired blocks
    for (const [clientId, blockUntil] of this.blockedIPs.entries()) {
      if (now > blockUntil) {
        this.blockedIPs.delete(clientId);
      }
    }
    
    logger.debug('JSON rate limiter cleanup completed', {
      activeClients: this.store.size,
      blockedClients: this.blockedIPs.size,
    }, 'json-rate-limiter');
  }
}

// Singleton instance
const rateLimiter = new MalformedJsonRateLimiter({
  maxErrors: parseInt(process.env.JSON_ERROR_MAX_COUNT || '10'),
  windowMinutes: parseInt(process.env.JSON_ERROR_WINDOW_MINUTES || '10'),
  blockDurationMinutes: parseInt(process.env.JSON_ERROR_BLOCK_MINUTES || '30'),
});

/**
 * Middleware to check if client is blocked for malformed JSON
 * Place this BEFORE express.json() middleware
 */
export function jsonRateLimitCheck(req: Request, res: Response, next: NextFunction) {
  // Only check for JSON content type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return next();
  }
  
  // Check if client is blocked
  if (rateLimiter.isBlocked(req)) {
    const { response, httpStatus } = ErrorBuilder.createError({
      code: ErrorCode.TOO_MANY_MALFORMED_REQUESTS,
      message: 'Too many malformed JSON requests. Please check your request format and try again later.',
      correlationId: req.correlationId,
      path: req.path,
      method: req.method,
      details: {
        retryAfter: '30 minutes',
      }
    });
    
    res.setHeader('Retry-After', '1800'); // 30 minutes in seconds
    return res.status(httpStatus).json(response);
  }
  
  next();
}

/**
 * Record JSON parsing error (call this from error handler)
 */
export function recordJsonError(req: Request): void {
  rateLimiter.recordError(req);
}

/**
 * Get rate limit stats for debugging
 */
export function getJsonErrorStats(req: Request) {
  return rateLimiter.getStats(req);
}

export { rateLimiter };
