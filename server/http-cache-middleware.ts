import { Request, Response, NextFunction } from 'express';
import { cacheService, CACHE_TTL } from './cache-service';
import crypto from 'crypto';
import { trackHttpCacheHit, trackHttpCacheMiss, trackNotModifiedResponse, incrementCachedRoutes } from './cache-monitor';

export interface CacheOptions {
  ttl: number;
  key?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  varyBy?: string[];
  private?: boolean;
  cacheControl?: string;
}

function generateCacheKey(req: Request, options: CacheOptions): string {
  if (options.key) {
    return options.key(req);
  }

  const parts: string[] = [req.method, req.path];

  if (options.varyBy) {
    for (const header of options.varyBy) {
      const value = req.get(header);
      if (value) {
        parts.push(`${header}:${value}`);
      }
    }
  }

  if (req.query && Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    parts.push(sortedQuery);
  }

  const userId = (req.user as any)?.id;
  if (userId) {
    parts.push(`user:${userId}`);
  }

  return parts.join('|');
}

function generateETag(data: any): string {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
}

export function httpCacheMiddleware(options: CacheOptions) {
  incrementCachedRoutes();
  
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (options.condition && !options.condition(req)) {
      return next();
    }

    const cacheKey = `http:${generateCacheKey(req, options)}`;
    const cached = cacheService.get<{ data: any; etag: string; timestamp: number }>(cacheKey);

    if (cached) {
      trackHttpCacheHit();
      
      const cacheControlValue = options.cacheControl || 
        (options.private ? `private, max-age=${Math.floor(options.ttl / 1000)}` 
                        : `public, max-age=${Math.floor(options.ttl / 1000)}`);

      const headers = {
        'Cache-Control': cacheControlValue,
        'ETag': cached.etag,
        'Last-Modified': new Date(cached.timestamp).toUTCString()
      };

      const ifNoneMatch = req.get('If-None-Match');
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        trackNotModifiedResponse();
        res.set({
          ...headers,
          'X-Cache': 'HIT-304'
        });
        return res.status(304).end();
      }

      res.set({
        ...headers,
        'X-Cache': 'HIT'
      });

      return res.json(cached.data);
    }

    trackHttpCacheMiss();
    
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const etag = generateETag(data);
      const timestamp = Date.now();

      cacheService.set(cacheKey, { data, etag, timestamp }, options.ttl);

      const cacheControlValue = options.cacheControl || 
        (options.private ? `private, max-age=${Math.floor(options.ttl / 1000)}` 
                        : `public, max-age=${Math.floor(options.ttl / 1000)}`);

      res.set({
        'Cache-Control': cacheControlValue,
        'ETag': etag,
        'X-Cache': 'MISS',
        'Last-Modified': new Date(timestamp).toUTCString()
      });

      return originalJson(data);
    };

    next();
  };
}

export const cachePresets = {
  products: {
    ttl: CACHE_TTL.PRODUCTS,
    varyBy: ['Accept-Language'],
    private: false
  },
  categories: {
    ttl: CACHE_TTL.CATEGORIES,
    varyBy: ['Accept-Language'],
    private: false
  },
  userProfile: {
    ttl: CACHE_TTL.USER_PROFILE,
    private: true,
    condition: (req: Request) => !!(req.user as any)?.id
  },
  cart: {
    ttl: CACHE_TTL.CART,
    private: true,
    condition: (req: Request) => !!(req.user as any)?.id
  },
  orders: {
    ttl: CACHE_TTL.ORDERS,
    private: true,
    condition: (req: Request) => !!(req.user as any)?.id
  },
  short: {
    ttl: CACHE_TTL.SHORT,
    private: false
  },
  medium: {
    ttl: CACHE_TTL.MEDIUM,
    private: false
  },
  long: {
    ttl: CACHE_TTL.LONG,
    private: false
  }
};

export function invalidateHttpCache(pattern: string | RegExp): number {
  const regex = typeof pattern === 'string' 
    ? new RegExp(`^http:.*${pattern}.*`) 
    : new RegExp(`^http:${pattern.source}`);
  
  return cacheService.deletePattern(regex);
}

export function setCacheHeaders(res: Response, options: {
  maxAge?: number;
  private?: boolean;
  immutable?: boolean;
  staleWhileRevalidate?: number;
  staleIfError?: number;
}) {
  const parts: string[] = [];
  
  if (options.private) {
    parts.push('private');
  } else {
    parts.push('public');
  }
  
  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`);
  }
  
  if (options.immutable) {
    parts.push('immutable');
  }
  
  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  
  if (options.staleIfError !== undefined) {
    parts.push(`stale-if-error=${options.staleIfError}`);
  }
  
  res.set('Cache-Control', parts.join(', '));
}
