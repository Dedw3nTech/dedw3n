/**
 * Rate Limiting Utilities
 * 
 * Manual inline rate limiting (NOT middleware).
 * Simple in-memory implementation with sliding window and automatic cleanup.
 * 
 * @requirements NO middleware - only manual inline rate limiting
 * 
 * @production_notes
 * - This implementation uses in-memory storage and is suitable for single-instance deployments
 * - For multi-instance/horizontal scaling, replace with distributed rate limiter (e.g., Redis)
 * - Rate limit state is lost on server restart
 * - For production high-availability setups, consider implementing persistent storage
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.limits = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Check if a request should be rate limited
   * 
   * @param identifier - Unique identifier (e.g., `upload:userId` or `api:ipAddress`)
   * @param maxRequests - Maximum number of requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns true if request is allowed, false if rate limited
   */
  check(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    // If no entry exists or window has expired, create new entry
    if (!entry || now >= entry.resetTime) {
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining attempts for an identifier
   */
  getRemaining(identifier: string, maxRequests: number): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() >= entry.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset for an identifier (in seconds)
   */
  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() >= entry.resetTime) {
      return 0;
    }
    return Math.ceil((entry.resetTime - Date.now()) / 1000);
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup() {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.limits.entries()) {
        if (now >= entry.resetTime) {
          this.limits.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Don't prevent Node.js from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop cleanup interval (for testing or shutdown)
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all rate limit entries (for testing)
   */
  clear() {
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Profile picture uploads: 10 per minute, 50 per hour
  PROFILE_UPLOAD_MINUTE: { maxRequests: 10, windowMs: 60 * 1000 },
  PROFILE_UPLOAD_HOUR: { maxRequests: 50, windowMs: 60 * 60 * 1000 },

  // API calls: 100 per minute
  API_CALLS: { maxRequests: 100, windowMs: 60 * 1000 },

  // Authentication attempts: 5 per minute, 20 per hour
  AUTH_ATTEMPT_MINUTE: { maxRequests: 5, windowMs: 60 * 1000 },
  AUTH_ATTEMPT_HOUR: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
} as const;
